import { GameEntity } from '../entities/entity';
/**
 * Configure an entity's collision groups to only collide with the specified types.
 * This uses Rapier's built-in collision group system for efficient filtering.
 *
 * @param entity - The entity to configure collision groups for
 * @param allowedTypes - Array of collision types this entity should collide with
 * @returns The entity for method chaining
 */
export declare function collisionGroup<T extends GameEntity<any>>(entity: T, allowedTypes: string[]): T;
//# sourceMappingURL=collision-group.d.ts.map