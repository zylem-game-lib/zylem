/**
 * The `rotation` and `scale` entity options, applied as an entity spawns.
 *
 * `position` reaches the body through the builders. Rotation and scale have no
 * builder, so the stage applies them here, before the body is added to the
 * world: rotation goes into the body definition the simulation spawns from,
 * and scale goes through `setScale` and the collider definitions, which is
 * what the editor's scale gizmo commits.
 */

import type { Object3D } from 'three';
import { eulerToQuaternion, type Quat } from '../core/transform-math';
import { VEC3_ONE, VEC3_ZERO, normalizeVec3, type Vec3Input } from '../core/vector';
import { rescaleColliderDefinitions, type ScalableEntity } from './entity-scale';

/** The entity surface the spawn transform touches. */
export interface SpawnTransformEntity extends ScalableEntity {
	options: { rotation?: Vec3Input; scale?: Vec3Input };
	group?: Object3D | null;
	mesh?: Object3D | null;
	physicsAttached?: boolean;
	setScale(x: number, y: number, z: number): void;
}

export interface SpawnTransformSettings {
	/**
	 * Leave the `scale` option alone. For entities that read it themselves:
	 * an actor sizes its model and its collision bounds from it.
	 */
	skipScale?: boolean;
}

/**
 * Entities whose `rotation` has not reached a render object yet, because they
 * had none when they spawned. An actor builds its group once its model loads.
 */
const awaitingRenderRotation = new WeakSet<object>();

/**
 * Apply the entity's `rotation` and `scale` options.
 *
 * Call before the body is added to the world. An option that was not passed
 * leaves the entity as it is, so an entity reused across stages keeps a scale
 * it was given at runtime.
 */
export function applySpawnTransformOptions(
	entity: SpawnTransformEntity,
	settings: SpawnTransformSettings = {},
): void {
	const rotation = spawnRotation(entity);
	if (rotation) {
		writeBodyRotation(entity, rotation);
		// `rotateZ` accumulates from this angle; see `rotatable.ts`.
		(entity as { _rotation2DAngle?: number })._rotation2DAngle = normalizeVec3(
			entity.options.rotation,
			VEC3_ZERO,
		).z;
		if (!writeRenderRotation(entity, rotation)) {
			awaitingRenderRotation.add(entity);
		}
	} else {
		awaitingRenderRotation.delete(entity);
	}

	if (!settings.skipScale) applySpawnScale(entity);
}

/**
 * Finish {@link applySpawnTransformOptions} for an entity whose model arrived
 * after it spawned.
 *
 * The body definition is written again while the body is still unspawned, and
 * the render object is rotated once, the first time there is one. A render
 * object that was already rotated at spawn is left alone, so it keeps whatever
 * the entity's setup did to it since.
 */
export function applyLateSpawnTransform(entity: SpawnTransformEntity): void {
	const rotation = spawnRotation(entity);
	if (!rotation) return;

	if (!entity.physicsAttached) writeBodyRotation(entity, rotation);
	if (awaitingRenderRotation.has(entity) && writeRenderRotation(entity, rotation)) {
		awaitingRenderRotation.delete(entity);
	}
}

function spawnRotation(entity: SpawnTransformEntity): Quat | null {
	const option = entity.options.rotation;
	return option ? eulerToQuaternion(normalizeVec3(option, VEC3_ZERO)) : null;
}

function writeBodyRotation(entity: SpawnTransformEntity, rotation: Quat): void {
	if (!entity.bodyDesc) return;
	entity.bodyDesc.rotation = [rotation.x, rotation.y, rotation.z, rotation.w];
}

/**
 * The render object follows the body each frame. Writing it here shows the
 * rotation before the first step, and is all an entity with no body, or one
 * that steers its own facing, ever gets.
 *
 * @returns `false` when the entity has no render object yet.
 */
function writeRenderRotation(entity: SpawnTransformEntity, rotation: Quat): boolean {
	const target = entity.group ?? entity.mesh;
	if (!target) return false;
	target.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
	return true;
}

function applySpawnScale(entity: SpawnTransformEntity): void {
	const option = entity.options.scale;
	if (!option) return;

	const scale = normalizeVec3(option, VEC3_ONE);
	entity.setScale(scale.x, scale.y, scale.z);
	// Definitions only. The body is not in a world yet, and the spawn that
	// follows builds its colliders from these.
	rescaleColliderDefinitions(entity);
}
