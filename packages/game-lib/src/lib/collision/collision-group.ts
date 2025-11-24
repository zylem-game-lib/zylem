import { GameEntity } from '../entities/entity';
import { getOrCreateCollisionGroupId, createCollisionFilter } from './collision-builder';
import { nanoid } from 'nanoid';
/**
 * Configure an entity's collision groups to only collide with the specified types.
 * This uses Rapier's built-in collision group system for efficient filtering.
 * 
 * @param entity - The entity to configure collision groups for
 * @param allowedTypes - Array of collision types this entity should collide with
 * @returns The entity for method chaining
 */
export function collisionGroup<T extends GameEntity<any>>(
	entity: T,
	allowedTypes: string[]
): T {
	if (!entity.collisionType) {
		entity.collisionType = `unique_${nanoid()}`;
	}

	const groupId = getOrCreateCollisionGroupId(entity.collisionType);
	const filter = createCollisionFilter(allowedTypes);

	if (entity.collider) {
		entity.collider.setCollisionGroups((groupId << 16) | filter);
	}

	if (entity.colliderDesc) {
		entity.colliderDesc.setCollisionGroups((groupId << 16) | filter);
	}

	return entity;
}
