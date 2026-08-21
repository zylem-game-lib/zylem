/**
 * Absolute entity scale, and keeping physics colliders in step with it.
 *
 * Scale is the one transform the wasm runtime cannot mutate in place: collider
 * shapes are baked from their definitions at spawn and `stage_ffi` exposes no
 * resize (or even remove) entry point. So a scaled entity is respawned — its
 * collider definitions are recomputed from a pristine baseline and the body is
 * despawned and re-added to the world, preserving the entity instance, its
 * uuid, and its current pose.
 *
 * That respawn is deliberately kept off the drag path. During a gizmo drag only
 * the render object is scaled, which is instant and allocation-free; the
 * collider rebuild happens once on commit. Without it, picking (which raycasts
 * the *physics* world) and published `bounds` would drift away from what the
 * user sees.
 */

import type { SimulationColliderDefinition } from '@zylem/behaviors/core';
import type { Vec3 } from '../core/vector';

/**
 * The subset of `ZylemWorld` a collider rebuild needs. Structural so this
 * module stays free of a world import, which would be circular.
 */
export interface ColliderRespawnWorld {
	destroyEntity(entity: any): void;
	addEntity(entity: any): void;
}

/** The entity surface a collider rebuild touches. */
export interface ScalableEntity {
	uuid: string;
	bodyDesc: { position?: readonly [number, number, number]; rotation?: readonly [number, number, number, number] } | null;
	colliderDesc: SimulationColliderDefinition | undefined;
	colliderDescs: SimulationColliderDefinition[];
	physicsWorldRef: unknown;
	colliderScaleDirty: boolean;
	getScale(): Vec3;
	getPose(): { position: Vec3; rotation: { x: number; y: number; z: number; w: number } } | null;
	/** Pristine definitions captured before the first scale change. */
	colliderBaseline: SimulationColliderDefinition[] | null;
}

function scaleTriple(
	triple: readonly [number, number, number],
	scale: Vec3,
): [number, number, number] {
	return [triple[0] * scale.x, triple[1] * scale.y, triple[2] * scale.z];
}

function scaleVertices(vertices: Float32Array, scale: Vec3): Float32Array {
	const scaled = new Float32Array(vertices.length);
	for (let i = 0; i < vertices.length; i += 3) {
		scaled[i] = vertices[i] * scale.x;
		scaled[i + 1] = vertices[i + 1] * scale.y;
		scaled[i + 2] = vertices[i + 2] * scale.z;
	}
	return scaled;
}

/**
 * Scale one collider definition.
 *
 * Radial shapes carry a single radius, so a non-uniform scale cannot be
 * represented exactly. The radius takes the larger of the two cross-axis
 * factors, which keeps the collider enclosing the mesh rather than letting
 * geometry poke out of it.
 */
export function scaleColliderDefinition(
	definition: SimulationColliderDefinition,
	scale: Vec3,
): SimulationColliderDefinition {
	const { shape } = definition;
	const offset = definition.offset
		? scaleTriple(definition.offset, scale)
		: definition.offset;

	let scaledShape: SimulationColliderDefinition['shape'];
	switch (shape.type) {
		case 'box':
			scaledShape = { type: 'box', halfExtents: scaleTriple(shape.halfExtents, scale) };
			break;
		case 'sphere':
			scaledShape = {
				type: 'sphere',
				radius: shape.radius * Math.max(scale.x, scale.y, scale.z),
			};
			break;
		case 'capsule':
		case 'cylinder':
		case 'cone':
			scaledShape = {
				type: shape.type,
				halfHeight: shape.halfHeight * scale.y,
				radius: shape.radius * Math.max(scale.x, scale.z),
			};
			break;
		case 'convexHull':
			scaledShape = { type: 'convexHull', vertices: scaleVertices(shape.vertices, scale) };
			break;
		case 'trimesh':
			scaledShape = {
				type: 'trimesh',
				vertices: scaleVertices(shape.vertices, scale),
				indices: shape.indices,
			};
			break;
		case 'heightfield':
			scaledShape = { ...shape, scale: scaleTriple(shape.scale, scale) };
			break;
		default:
			scaledShape = shape;
			break;
	}

	return { ...definition, shape: scaledShape, offset };
}

/**
 * Snapshot the entity's collider definitions the first time it is scaled.
 *
 * Scaled shapes are always derived from this baseline rather than from the
 * current definitions, so scale stays absolute. Deriving from current values
 * would compound: scaling to 0.5 twice would land on 0.25.
 */
export function ensureColliderBaseline(entity: ScalableEntity): SimulationColliderDefinition[] {
	if (!entity.colliderBaseline) {
		const source = entity.colliderDescs.length
			? entity.colliderDescs
			: entity.colliderDesc
				? [entity.colliderDesc]
				: [];
		entity.colliderBaseline = source.map((definition) => ({ ...definition }));
	}
	return entity.colliderBaseline;
}

/**
 * Rebuild the entity's colliders at its current scale and respawn its body.
 *
 * The body is recreated, so its definition is first repointed at the entity's
 * live pose — otherwise it would reappear wherever it originally spawned. The
 * entity object, its uuid, and its scene graph node are untouched; only the
 * wasm handles are reassigned, exactly as an ordinary spawn does.
 *
 * @returns `true` when colliders were rebuilt.
 */
export function commitColliderScale(entity: ScalableEntity): boolean {
	if (!entity.colliderScaleDirty) return false;
	entity.colliderScaleDirty = false;

	const baseline = ensureColliderBaseline(entity);
	if (!baseline.length) return false;

	const scale = entity.getScale();
	const scaled = baseline.map((definition) => scaleColliderDefinition(definition, scale));
	entity.colliderDescs = scaled;
	entity.colliderDesc = scaled[0];

	const world = entity.physicsWorldRef as ColliderRespawnWorld | null;
	if (!world) {
		// Not in a world yet; the new definitions are picked up when it spawns.
		return true;
	}

	const pose = entity.getPose();
	world.destroyEntity(entity);
	if (pose && entity.bodyDesc) {
		entity.bodyDesc.position = [pose.position.x, pose.position.y, pose.position.z];
		entity.bodyDesc.rotation = [
			pose.rotation.x,
			pose.rotation.y,
			pose.rotation.z,
			pose.rotation.w,
		];
	}
	world.addEntity(entity);
	return true;
}
