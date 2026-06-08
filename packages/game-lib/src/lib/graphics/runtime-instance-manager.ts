import {
	BufferGeometry,
	Color,
	InstancedBufferAttribute,
	InstancedMesh,
	Material,
	Matrix4,
	MeshStandardMaterial,
	Object3D,
	Quaternion,
	Vector3,
} from 'three';
import { MeshStandardNodeMaterial } from 'three/webgpu';

import type { ZylemRuntimeBufferViews } from '../runtime/zylem-wasm-runtime';
import type { RuntimeEntityColorMode } from '../entities/entity';
import {
	applyMeshStandardRuntimeHeatTint,
	RUNTIME_HEAT_TINT_HOT_HEX,
	RUNTIME_INSTANCE_HEAT_ATTRIBUTE,
} from './runtime-instanced-heat-material';

export interface RuntimeBatchRegistration {
	key: string;
	geometry: BufferGeometry;
	material: Material;
	count: number;
	baseColor?: Color;
	colorMode?: RuntimeEntityColorMode;
}

interface RuntimeBatchState {
	key: string;
	instancedMesh: InstancedMesh;
	geometry: BufferGeometry;
	material: Material;
	baseColor: Color;
	colorMode: RuntimeEntityColorMode;
	/** When true, heat is written to {@link RUNTIME_INSTANCE_HEAT_ATTRIBUTE} and tinted in the shader. */
	heatTintUsesInstanceHeatAttribute: boolean;
	/** Reusable scratch objects, hoisted out of the per-frame update to avoid allocation churn. */
	dummy: Object3D;
	rotation: Quaternion;
	colorScratch: Color;
	hotColor: Color;
	/**
	 * Cached per-instance transform from the previous frame (8 floats each:
	 * position xyz, quaternion xyzw, scale) used to skip rewriting instance
	 * matrices that have not moved (e.g. bodies that have gone to sleep).
	 */
	prevTransforms: Float32Array | null;
	prevCount: number;
}

/**
 * Runtime-owned batching companion to InstanceManager.
 * Consumes render buffers from wasm instead of reading transforms from GameEntity bodies/meshes.
 */
export class RuntimeInstanceManager {
	private readonly batches = new Map<string, RuntimeBatchState>();
	private scene: Object3D | null = null;

	setScene(scene: Object3D): void {
		this.scene = scene;
	}

	registerBatch(batch: RuntimeBatchRegistration): InstancedMesh {
		const existing = this.batches.get(batch.key);
		if (existing) {
			return existing.instancedMesh;
		}

		const geometry = batch.geometry.clone();
		const sourceBaseColor = isStandardLikeMaterial(batch.material)
			? batch.material.color
			: undefined;
		const baseColor = batch.baseColor?.clone() ?? sourceBaseColor?.clone() ?? new Color(0xffffff);
		const colorMode = batch.colorMode ?? 'base';
		const sourceIsStandard = isStandardLikeMaterial(batch.material);
		const material = configureRuntimeInstancedMaterial(
			batch.material.clone(),
			baseColor,
			colorMode,
		);
		// The TSL heat-tint path reads a per-instance `instanceHeat` attribute and
		// requires a node material (WebGPU). Plain materials fall back to per-instance
		// `setColorAt` below.
		const heatTintUsesInstanceHeatAttribute =
			colorMode === 'heatTint'
			&& sourceIsStandard
			&& material instanceof MeshStandardNodeMaterial;
		if (heatTintUsesInstanceHeatAttribute) {
			geometry.setAttribute(
				RUNTIME_INSTANCE_HEAT_ATTRIBUTE,
				new InstancedBufferAttribute(new Float32Array(batch.count), 1),
			);
		}
		const instancedMesh = new InstancedMesh(geometry, material, batch.count);
		instancedMesh.count = batch.count;
		instancedMesh.frustumCulled = false;
		instancedMesh.castShadow = true;
		instancedMesh.receiveShadow = true;

		const hiddenMatrix = new Matrix4().makeScale(0, 0, 0);
		for (let index = 0; index < batch.count; index++) {
			instancedMesh.setMatrixAt(index, hiddenMatrix);
		}
		instancedMesh.instanceMatrix.needsUpdate = true;

		const state: RuntimeBatchState = {
			key: batch.key,
			instancedMesh,
			geometry,
			material,
			baseColor,
			colorMode,
			heatTintUsesInstanceHeatAttribute,
			dummy: new Object3D(),
			rotation: new Quaternion(),
			colorScratch: new Color(),
			hotColor: new Color(RUNTIME_HEAT_TINT_HOT_HEX),
			prevTransforms: null,
			prevCount: 0,
		};
		this.batches.set(batch.key, state);
		this.scene?.add(instancedMesh);
		return instancedMesh;
	}

	updateBatch(batchKey: string, runtime: ZylemRuntimeBufferViews): void {
		const batch = this.batches.get(batchKey);
		if (!batch) {
			return;
		}

		const dummy = batch.dummy;
		const rotation = batch.rotation;
		const color = batch.colorScratch;
		const heatAttr = batch.heatTintUsesInstanceHeatAttribute
			? (batch.geometry.getAttribute(RUNTIME_INSTANCE_HEAT_ATTRIBUTE) as InstancedBufferAttribute | undefined)
			: undefined;
		const view = runtime.renderView;
		const stride = runtime.renderStride;
		const activeCount = runtime.exports.zylem_runtime_active_count();
		batch.instancedMesh.count = activeCount;

		const isHeatTint = batch.colorMode === 'heatTint';

		// Change-detection cache: when the active instance count changes we must
		// rewrite everything; otherwise we only touch instances that actually moved.
		const countChanged = batch.prevCount !== activeCount;
		let prev = batch.prevTransforms;
		if (!prev || prev.length < activeCount * 8) {
			prev = new Float32Array(activeCount * 8);
			batch.prevTransforms = prev;
		}

		let transformsChanged = false;
		let colorsChanged = false;

		for (let index = 0; index < activeCount; index++) {
			const base = index * stride;
			const px = view[base]!;
			const py = view[base + 1]!;
			const pz = view[base + 2]!;
			const qx = view[base + 3]!;
			const qy = view[base + 4]!;
			const qz = view[base + 5]!;
			const qw = view[base + 6]!;
			const scale = isHeatTint ? view[base + 7]! : 1;

			const pbase = index * 8;
			const moved =
				countChanged ||
				prev[pbase] !== px ||
				prev[pbase + 1] !== py ||
				prev[pbase + 2] !== pz ||
				prev[pbase + 3] !== qx ||
				prev[pbase + 4] !== qy ||
				prev[pbase + 5] !== qz ||
				prev[pbase + 6] !== qw ||
				prev[pbase + 7] !== scale;

			if (moved) {
				dummy.position.set(px, py, pz);
				rotation.set(qx, qy, qz, qw).normalize();
				dummy.quaternion.copy(rotation);
				dummy.scale.setScalar(scale);
				dummy.updateMatrix();
				batch.instancedMesh.setMatrixAt(index, dummy.matrix);

				prev[pbase] = px;
				prev[pbase + 1] = py;
				prev[pbase + 2] = pz;
				prev[pbase + 3] = qx;
				prev[pbase + 4] = qy;
				prev[pbase + 5] = qz;
				prev[pbase + 6] = qw;
				prev[pbase + 7] = scale;
				transformsChanged = true;
			}

			if (isHeatTint) {
				const heat = view[base + 9]!;
				const clampedHeat = Math.max(0, Math.min(1, heat));
				if (heatAttr) {
					if (heatAttr.array[index] !== clampedHeat) {
						heatAttr.array[index] = clampedHeat;
						colorsChanged = true;
					}
				} else {
					color.copy(batch.baseColor).lerp(batch.hotColor, clampedHeat);
					batch.instancedMesh.setColorAt(index, color);
					colorsChanged = true;
				}
			}
		}

		batch.prevCount = activeCount;

		// Only flag GPU re-uploads when something actually changed; once the
		// simulation settles this skips the per-frame instance buffer upload.
		if (transformsChanged) {
			batch.instancedMesh.instanceMatrix.needsUpdate = true;
		}
		if (heatAttr) {
			if (colorsChanged) {
				heatAttr.needsUpdate = true;
			}
		} else if (isHeatTint && colorsChanged && batch.instancedMesh.instanceColor) {
			batch.instancedMesh.instanceColor.needsUpdate = true;
		}
	}

	removeBatch(batchKey: string): void {
		const batch = this.batches.get(batchKey);
		if (!batch) {
			return;
		}
		this.scene?.remove(batch.instancedMesh);
		batch.geometry.dispose();
		batch.material.dispose();
		batch.instancedMesh.dispose();
		this.batches.delete(batchKey);
	}

	clear(): void {
		for (const key of [...this.batches.keys()]) {
			this.removeBatch(key);
		}
	}

	dispose(): void {
		this.clear();
		this.scene = null;
	}
}

/** Standard PBR material in either WebGL (`MeshStandardMaterial`) or WebGPU (`MeshStandardNodeMaterial`) form. */
type StandardLikeMaterial = MeshStandardMaterial | MeshStandardNodeMaterial;

function isStandardLikeMaterial(material: Material): material is StandardLikeMaterial {
	return (
		material instanceof MeshStandardMaterial
		|| material instanceof MeshStandardNodeMaterial
	);
}

function configureRuntimeInstancedMaterial(
	material: Material,
	baseColor: Color,
	colorMode: RuntimeEntityColorMode,
): Material {
	if (isStandardLikeMaterial(material)) {
		material.vertexColors = false;
		material.color.copy(baseColor);
		if (colorMode === 'heatTint' && material instanceof MeshStandardNodeMaterial) {
			applyMeshStandardRuntimeHeatTint(material, new Color(RUNTIME_HEAT_TINT_HOT_HEX));
		}
		material.needsUpdate = true;
		return material;
	}

	if ('vertexColors' in material) {
		(material as Material & { vertexColors: boolean }).vertexColors = colorMode === 'heatTint';
	}
	if ('color' in material) {
		const m = material as Material & { color: Color };
		if (colorMode === 'base') {
			m.color.copy(baseColor);
		} else {
			m.color.copy(new Color(0xffffff));
		}
	}
	if ('needsUpdate' in material) {
		(material as Material & { needsUpdate: boolean }).needsUpdate = true;
	}
	return material;
}
