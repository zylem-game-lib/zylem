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
 * Runtime link between a spawned entity and one of its behavior refs.
 * Systems can iterate these links to avoid scanning all world entities.
 */
export interface BehaviorEntityLink {
	entity: any;
	ref: any;
}

/**
 * Context provided to behavior-system factories.
 */
export interface BehaviorSystemContext {
	world: any;
	ecs: IWorld;
	scene: any;
	/**
	 * Returns live behavior links for a descriptor key.
	 * O(1) lookup into a pre-built stage index.
	 */
	getBehaviorLinks?: (key: symbol) => Iterable<BehaviorEntityLink>;
}

/**
 * Factory function that creates a BehaviorSystem.
 * Receives the stage for access to world, scene, etc.
 */
export type BehaviorSystemFactory<T extends BehaviorSystem = BehaviorSystem> = (
	stage: BehaviorSystemContext
) => T;
