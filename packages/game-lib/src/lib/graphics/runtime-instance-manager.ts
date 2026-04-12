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
		const sourceBaseColor = batch.material instanceof MeshStandardMaterial
			? batch.material.color
			: undefined;
		const baseColor = batch.baseColor?.clone() ?? sourceBaseColor?.clone() ?? new Color(0xffffff);
		const colorMode = batch.colorMode ?? 'base';
		const sourceIsStandard = batch.material instanceof MeshStandardMaterial;
		const material = configureRuntimeInstancedMaterial(
			batch.material.clone(),
			baseColor,
			colorMode,
		);
		const heatTintUsesInstanceHeatAttribute =
			colorMode === 'heatTint' && sourceIsStandard && material instanceof MeshStandardMaterial;
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

		const dummy = new Object3D();
		const rotation = new Quaternion();
		const color = new Color();
		const heatAttr = batch.heatTintUsesInstanceHeatAttribute
			? (batch.geometry.getAttribute(RUNTIME_INSTANCE_HEAT_ATTRIBUTE) as InstancedBufferAttribute | undefined)
			: undefined;
		const view = runtime.renderView;
		const stride = runtime.renderStride;
		const activeCount = runtime.exports.zylem_runtime_active_count();
		batch.instancedMesh.count = activeCount;

		for (let index = 0; index < activeCount; index++) {
			const base = index * stride;
			dummy.position.set(view[base]!, view[base + 1]!, view[base + 2]!);
			rotation.set(view[base + 3]!, view[base + 4]!, view[base + 5]!, view[base + 6]!).normalize();
			dummy.quaternion.copy(rotation);
			dummy.scale.setScalar(batch.colorMode === 'heatTint' ? view[base + 7]! : 1);
			dummy.updateMatrix();
			batch.instancedMesh.setMatrixAt(index, dummy.matrix);

			if (batch.colorMode === 'heatTint') {
				const heat = view[base + 9]!;
				const clampedHeat = Math.max(0, Math.min(1, heat));
				if (heatAttr) {
					heatAttr.array[index] = clampedHeat;
				} else {
					color.copy(batch.baseColor).lerp(new Color(RUNTIME_HEAT_TINT_HOT_HEX), clampedHeat);
					batch.instancedMesh.setColorAt(index, color);
				}
			}
		}

		batch.instancedMesh.instanceMatrix.needsUpdate = true;
		if (heatAttr) {
			heatAttr.needsUpdate = true;
		} else if (batch.colorMode === 'heatTint' && batch.instancedMesh.instanceColor) {
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

function configureRuntimeInstancedMaterial(
	material: Material,
	baseColor: Color,
	colorMode: RuntimeEntityColorMode,
): Material {
	if (material instanceof MeshStandardMaterial) {
		material.vertexColors = false;
		material.color.copy(baseColor);
		if (colorMode === 'heatTint') {
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
