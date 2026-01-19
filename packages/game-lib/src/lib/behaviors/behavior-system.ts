/**
 * BehaviorSystem Interface
 * 
 * Base interface for ECS-based behavior systems that run at the stage level.
 * Systems query entities with matching components and process them each frame.
 */

import type { IWorld } from 'bitecs';

/**
 * A behavior system that processes entities with specific components.
 * 
 * @example
 * ```typescript
 * class ThrusterMovementSystem implements BehaviorSystem {
 *   update(ecs: IWorld, delta: number): void {
 *     // Query and process entities with thruster components
 *   }
 * }
 * ```
 */
export interface BehaviorSystem {
	/** Called once per frame with ECS world and delta time */
	update(ecs: IWorld, delta: number): void;
	/** Optional cleanup when stage is destroyed */
	destroy?(ecs: IWorld): void;
}

/**
 * Factory function that creates a BehaviorSystem.
 * Receives the stage for access to world, scene, etc.
 */
export type BehaviorSystemFactory<T extends BehaviorSystem = BehaviorSystem> = (
	stage: { world: any; ecs: IWorld }
) => T;
