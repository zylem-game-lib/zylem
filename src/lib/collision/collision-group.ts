import { v4 as uuidv4 } from 'uuid';
import { GameEntity } from '../entities/entity';
import { CollisionContext } from '../entities/entity';
import { getOrCreateCollisionGroupId, createCollisionFilter } from './collision-builder';

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
		entity.collisionType = `unique_${uuidv4()}`;
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

/**
 * Legacy type definitions for backward compatibility
 * @deprecated Use the new collisionGroup function instead
 */
export type CollisionCallback = (ctx: CollisionContext<any, any>) => void;
export type CollisionGroupWrapper = (...actions: CollisionCallback[]) => CollisionCallback;

/**
 * @deprecated This function is deprecated. Use the new collisionGroup function instead.
 */
export function legacyCollisionGroup(...args: (string | GameEntity<any> | { includeSameType?: boolean })[]): CollisionGroupWrapper {
	console.warn('legacyCollisionGroup is deprecated. Use the new collisionGroup function instead.');

	let options = { includeSameType: false };
	if (args.length > 0 && typeof args[args.length - 1] === 'object' && args[args.length - 1] !== null) {
		options = { ...options, ...(args.pop() as { includeSameType?: boolean }) };
	}
	const types = new Set<string>();
	args.forEach((arg) => {
		if (typeof arg === 'string') {
			types.add(arg);
		} else if (arg instanceof GameEntity) {
			const type = arg.collisionType ?? (arg.collisionType = `unique_${uuidv4()}`);
			types.add(type);
		} else {
			throw new Error('Invalid argument');
		}
	});
	return (...actions: CollisionCallback[]) => (ctx: CollisionContext<any, any>) => {
		const otherType = ctx.other.collisionType;
		if (otherType && types.has(otherType)) {
			if (options.includeSameType || otherType !== ctx.entity.collisionType) {
				actions.forEach((a) => a(ctx));
			}
		}
	};
}

/**
 * @deprecated This function is deprecated.
 */
export function combineCollisionGroups(...wrappers: CollisionGroupWrapper[]): CollisionGroupWrapper {
	console.warn('combineCollisionGroups is deprecated.');
	return (...actions: CollisionCallback[]) => (ctx: CollisionContext<any, any>) => {
		for (const wrapper of wrappers) {
			wrapper(...actions)(ctx);
		}
	};
} 