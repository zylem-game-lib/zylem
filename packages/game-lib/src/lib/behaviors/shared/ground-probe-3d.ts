import { Cuboid } from '@dimforge/rapier3d-compat';
import {
	BoxGeometry,
	Mesh,
	MeshBasicMaterial,
} from 'three';
import { serializeColliderDesc } from '../../physics/serialize-descriptors';

/**
 * @deprecated Kept for type compatibility with older callers; ignored at runtime.
 * The boxcast implementation does not use offset rays.
 */
export interface GroundProbeOffset {
	x: number;
	z: number;
}

/**
 * Probe sizing hint.
 *
 * - `center`: prefer a tiny box that behaves close to a single downward ray
 *   (used by `Jumper3D` for thin/single-point ground tests).
 * - `any`: prefer a box sized from the entity's collider footprint
 *   (used by `Platformer3D` so the character "feels" the ground under any
 *   foot, not just dead-center).
 *
 * The actual box dimensions are still configurable via `options.box`.
 */
export type GroundProbeMode = 'center' | 'any';

export interface GroundProbeEntity {
	uuid: string;
	body: any;
}

export interface GroundProbeOptions {
	/** Maximum cast distance in world units. */
	rayLength: number;
	/** @deprecated No longer used by the boxcast implementation. */
	offsets?: readonly GroundProbeOffset[];
	/** Selects the default box size when `box` is not explicitly provided. */
	mode?: GroundProbeMode;
	/** Render a wireframe of the cast box for debugging. Requires `scene`. */
	debug?: boolean;
	/** Three.js scene used to host the debug wireframe mesh. */
	scene?: any;
	/**
	 * Vertical offset added to the body translation when computing the cast
	 * origin. Allows callers to shift the probe to e.g. just above the
	 * capsule's bottom face.
	 */
	originYOffset?: number;
	/**
	 * Half-extents of the cast cuboid. When omitted the probe derives a
	 * sensible default from the entity's collider:
	 * - capsule: `(r * 0.7, 0.05, r * 0.7)` — a thin slab smaller than the
	 *   capsule footprint, so side walls don't register as ground.
	 * - cuboid: shrink the bottom face by 30% so the probe sits well inside
	 *   the collider footprint.
	 * - `mode: 'center'`: forces a tiny `(0.05, 0.05, 0.05)` box.
	 */
	box?: { x: number; y: number; z: number };
}

export interface GroundProbeSupportHit {
	toi: number;
	point: {
		x: number;
		y: number;
		z: number;
	};
	origin: {
		x: number;
		y: number;
		z: number;
	};
	/** Always 0 — kept for backward compatibility with the old multi-ray API. */
	rayIndex: number;
	colliderUuid?: string;
}

export const GROUND_SNAP_EPSILON = 0.001;

/**
 * Tiny box used when the caller selects `mode: 'center'` — close enough to a
 * point cast that it preserves the old single-ray behavior of `Jumper3D`.
 */
const CENTER_BOX_HALF = 0.05;

/**
 * Default vertical thickness of the cast cuboid. The box is intentionally thin
 * vertically so the impact distance closely matches a downward ray's TOI;
 * existing snap-to-ground math (which assumes `point.y ≈ origin.y - toi`)
 * keeps working with negligible drift.
 */
const DEFAULT_BOX_THICKNESS = 0.05;

/**
 * GroundProbe3D — single-cast cuboid probe used by 3D platformer and jumper
 * behaviors to detect the ground beneath an entity.
 *
 * Replaces the previous 5-ray probe: a single shape-cast handles edge cases
 * (corner of a platform, narrow gap) more robustly and produces a single,
 * intuitive debug visualization (a wireframe box).
 */
export class GroundProbe3D {
	private debugMeshes = new Map<string, Mesh>();

	constructor(private world: any) {}

	probeSupport(
		entity: GroundProbeEntity,
		options: GroundProbeOptions,
	): GroundProbeSupportHit | null {
		if (!this.world?.world || !entity.body) return null;

		const translation = entity.body.translation();
		const originYOffset = options.originYOffset ?? 0;
		const box = options.box ?? deriveDefaultBox(entity, options.mode ?? 'any');

		const shapePos = {
			x: translation.x,
			y: translation.y + originYOffset,
			z: translation.z,
		};
		const shapeRot = { x: 0, y: 0, z: 0, w: 1 };
		const shapeVel = { x: 0, y: -1, z: 0 };

		const shape = new Cuboid(box.x, box.y, box.z);
		const hit = this.world.world.castShape(
			shapePos,
			shapeRot,
			shapeVel,
			shape,
			options.rayLength,
			true,
			undefined,
			undefined,
			undefined,
			entity.body,
		);

		let support: GroundProbeSupportHit | null = null;
		if (hit) {
			support = {
				toi: hit.toi,
				point: {
					x: shapePos.x,
					y: shapePos.y - hit.toi - box.y,
					z: shapePos.z,
				},
				origin: { ...shapePos },
				rayIndex: 0,
				colliderUuid: hit.collider?._parent?.userData?.uuid,
			};
		}

		if (options.debug && options.scene) {
			this.updateDebugMesh(
				entity.uuid,
				shapePos,
				box,
				options.rayLength,
				Boolean(support),
				options.scene,
			);
		} else {
			this.disposeDebugMesh(entity.uuid);
		}

		return support;
	}

	detect(entity: GroundProbeEntity, options: GroundProbeOptions): boolean {
		return this.probeSupport(entity, options) != null;
	}

	destroyEntity(uuid: string): void {
		this.disposeDebugMesh(uuid);
	}

	destroy(): void {
		for (const uuid of this.debugMeshes.keys()) {
			this.disposeDebugMesh(uuid);
		}
		this.debugMeshes.clear();
	}

	private updateDebugMesh(
		uuid: string,
		shapePos: { x: number; y: number; z: number },
		box: { x: number; y: number; z: number },
		rayLength: number,
		hasGround: boolean,
		scene: any,
	): void {
		let mesh = this.debugMeshes.get(uuid);
		if (!mesh) {
			const geometry = new BoxGeometry(2 * box.x, 2 * box.y, 2 * box.z);
			const material = new MeshBasicMaterial({
				wireframe: true,
				color: 0xff0000,
			});
			mesh = new Mesh(geometry, material);
			scene.add(mesh);
			this.debugMeshes.set(uuid, mesh);
		}

		// Position the box at the cast midpoint so users can see the swept volume.
		mesh.position.set(
			shapePos.x,
			shapePos.y - rayLength * 0.5,
			shapePos.z,
		);
		mesh.scale.set(1, Math.max(rayLength / Math.max(2 * box.y, 1e-6), 1), 1);
		(mesh.material as MeshBasicMaterial).color.setHex(
			hasGround ? 0x00ff00 : 0xff0000,
		);
	}

	private disposeDebugMesh(uuid: string): void {
		const mesh = this.debugMeshes.get(uuid);
		if (!mesh) return;

		mesh.removeFromParent();
		mesh.geometry.dispose();
		(mesh.material as MeshBasicMaterial).dispose();

		this.debugMeshes.delete(uuid);
	}
}

function deriveDefaultBox(
	entity: GroundProbeEntity,
	mode: GroundProbeMode,
): { x: number; y: number; z: number } {
	if (mode === 'center') {
		return { x: CENTER_BOX_HALF, y: CENTER_BOX_HALF, z: CENTER_BOX_HALF };
	}

	const runtimeColliderDesc = (entity as any)?.colliderDesc;
	if (runtimeColliderDesc) {
		const serialized = serializeColliderDesc(runtimeColliderDesc);
		if (serialized.shape === 'capsule' && serialized.dimensions.length >= 2) {
			const radius = serialized.dimensions[1] ?? 0.5;
			const half = Math.max(radius * 0.7, CENTER_BOX_HALF);
			return { x: half, y: DEFAULT_BOX_THICKNESS, z: half };
		}
		if (serialized.shape === 'cuboid' && serialized.dimensions.length >= 3) {
			const halfX = (serialized.dimensions[0] ?? 0.5) * 0.7;
			const halfZ = (serialized.dimensions[2] ?? 0.5) * 0.7;
			return {
				x: Math.max(halfX, CENTER_BOX_HALF),
				y: DEFAULT_BOX_THICKNESS,
				z: Math.max(halfZ, CENTER_BOX_HALF),
			};
		}
	}

	const collisionSize =
		(entity as any)?.options?.collision?.size ??
		(entity as any)?.options?.collisionSize ??
		(entity as any)?.options?.size;
	if (collisionSize) {
		const halfX = ((collisionSize.x ?? 1) / 2) * 0.7;
		const halfZ = ((collisionSize.z ?? collisionSize.x ?? 1) / 2) * 0.7;
		return {
			x: Math.max(halfX, CENTER_BOX_HALF),
			y: DEFAULT_BOX_THICKNESS,
			z: Math.max(halfZ, CENTER_BOX_HALF),
		};
	}

	return { x: 0.35, y: DEFAULT_BOX_THICKNESS, z: 0.35 };
}

export function getGroundAnchorOffsetY(entity: any): number {
	const runtimeColliderDesc = entity?.colliderDesc;
	if (runtimeColliderDesc) {
		const serialized = serializeColliderDesc(runtimeColliderDesc);
		const centerY = serialized.translation?.[1] ?? 0;
		if (serialized.shape === 'capsule' && serialized.dimensions.length >= 2) {
			const halfCylinder = serialized.dimensions[0] ?? 0;
			const radius = serialized.dimensions[1] ?? 0;
			return halfCylinder + radius - centerY;
		}
		if (serialized.shape === 'cuboid' && serialized.dimensions.length >= 2) {
			const halfHeight = serialized.dimensions[1] ?? 0;
			return halfHeight - centerY;
		}
	}

	const collisionSize =
		entity?.options?.collision?.size ??
		entity?.options?.collisionSize ??
		entity?.options?.size;
	const height = collisionSize?.y ?? 0;
	if (height <= 0) {
		return 0;
	}

	const collisionPosition =
		entity?.options?.collision?.position ??
		entity?.options?.collisionPosition;
	const centerY = collisionPosition?.y ?? height / 2;
	return (height / 2) - centerY;
}

export function getGroundSnapTargetY(
	entity: any,
	support: GroundProbeSupportHit,
	epsilon: number = GROUND_SNAP_EPSILON,
): number {
	return support.point.y + getGroundAnchorOffsetY(entity) + epsilon;
}
