import { RigidBody } from '@dimforge/rapier3d-compat';
import { TransformState } from './transform-store';

/**
 * Entity that can have transformations applied from a store
 */
export interface TransformableEntity {
	body: RigidBody | null;
	transformStore?: TransformState;
}

/**
 * Apply accumulated transformations from the store to the physics body.
 * 
 * This is called automatically after onUpdate() callbacks complete,
 * flushing all pending transformations to the physics engine in a single batch.
 * 
 * Flow:
 * 1. Check dirty flags to see what changed
 * 2. Apply changes to RigidBody
 * 3. Reset store for next frame
 * 
 * @param entity Entity with physics body and transform store
 * @param store Transform store containing pending changes
 */
export function applyTransformChanges(
	entity: TransformableEntity,
	store: TransformState
): void {
	if (!entity.body) return;

	// Apply velocity if dirty
	if (store.dirty.velocity) {
		entity.body.setLinvel(store.velocity, true);
	}

	// Apply rotation if dirty
	if (store.dirty.rotation) {
		entity.body.setRotation(store.rotation, true);
	}

	// Apply angular velocity if dirty
	if (store.dirty.angularVelocity) {
		entity.body.setAngvel(store.angularVelocity, true);
	}

	// Apply position deltas if dirty
	if (store.dirty.position) {
		const current = entity.body.translation();
		entity.body.setTranslation(
			{
				x: current.x + store.position.x,
				y: current.y + store.position.y,
				z: current.z + store.position.z,
			},
			true
		);
	}
}
