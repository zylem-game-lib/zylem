import { GameEntity } from '../entities/entity';
import { CollisionContext } from '../entities/entity';
/**
 * Configure an entity's collision groups to only collide with the specified types.
 * This uses Rapier's built-in collision group system for efficient filtering.
 *
 * @param entity - The entity to configure collision groups for
 * @param allowedTypes - Array of collision types this entity should collide with
 * @returns The entity for method chaining
 */
export declare function collisionGroup<T extends GameEntity<any>>(entity: T, allowedTypes: string[]): T;
/**
 * Legacy type definitions for backward compatibility
 * @deprecated Use the new collisionGroup function instead
 */
export type CollisionCallback = (ctx: CollisionContext<any, any>) => void;
export type CollisionGroupWrapper = (...actions: CollisionCallback[]) => CollisionCallback;
/**
 * @deprecated This function is deprecated. Use the new collisionGroup function instead.
 */
export declare function legacyCollisionGroup(...args: (string | GameEntity<any> | {
    includeSameType?: boolean;
})[]): CollisionGroupWrapper;
/**
 * @deprecated This function is deprecated.
 */
export declare function combineCollisionGroups(...wrappers: CollisionGroupWrapper[]): CollisionGroupWrapper;
