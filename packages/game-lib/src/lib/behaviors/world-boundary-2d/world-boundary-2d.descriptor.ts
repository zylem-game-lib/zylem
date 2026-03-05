/**
 * WorldBoundary2DBehavior
 *
 * Tracks which 2D world boundaries an entity is touching.
 * Use `getMovement()` on the behavior handle to adjust movement based on hits.
 *
 * Source of truth: `entity.body` (Rapier rigid body), consistent with other new behaviors.
 */

import type { IWorld } from 'bitecs';
import { defineBehavior, type BehaviorRef } from '../behavior-descriptor';
import type { BehaviorEntityLink, BehaviorSystem } from '../behavior-system';
import {
	WorldBoundary2DFSM,
	type WorldBoundary2DBounds,
	type WorldBoundary2DHits,
} from './world-boundary-2d-fsm';

export interface WorldBoundary2DOptions {
	/**
	 * World boundaries (in world units).
	 * - left hit if x <= left
	 * - right hit if x >= right
	 * - bottom hit if y <= bottom
	 * - top hit if y >= top
	 */
	boundaries: WorldBoundary2DBounds;
}

/**
 * Handle methods provided by WorldBoundary2DBehavior
 */
export interface WorldBoundary2DHandle {
	/**
	 * Get the last computed boundary hits.
	 * Returns null until entity is spawned and FSM is initialized.
	 */
	getLastHits(): WorldBoundary2DHits | null;

	/**
	 * Get adjusted movement values based on boundary hits.
	 * Zeros out movement into boundaries the entity is touching.
	 */
	getMovement(moveX: number, moveY: number): { moveX: number; moveY: number };
}

const defaultOptions: WorldBoundary2DOptions = {
	boundaries: { top: 0, bottom: 0, left: 0, right: 0 },
};

const WORLD_BOUNDARY_BEHAVIOR_KEY = Symbol.for(
	'zylem:behavior:world-boundary-2d',
);

/**
 * Creates behavior-specific handle methods for WorldBoundary2DBehavior.
 */
function createWorldBoundary2DHandle(
	ref: BehaviorRef<WorldBoundary2DOptions>
): WorldBoundary2DHandle {
	return {
		getLastHits: () => {
			const fsm = ref.fsm as WorldBoundary2DFSM | undefined;
			return fsm?.getLastHits() ?? null;
		},
		getMovement: (moveX: number, moveY: number) => {
			const fsm = ref.fsm as WorldBoundary2DFSM | undefined;
			return fsm?.getMovement(moveX, moveY) ?? { moveX, moveY };
		},
	};
}

/**
 * WorldBoundary2DSystem
 *
 * Stage-level system that:
 * - finds entities with this behavior attached
 * - computes and tracks boundary hits using the FSM
 */
class WorldBoundary2DSystem implements BehaviorSystem {
	constructor(
		private world: any,
		private getBehaviorLinks?: (key: symbol) => Iterable<BehaviorEntityLink>,
	) {}

	update(_ecs: IWorld, _delta: number): void {
		const links = this.getBehaviorLinks?.(WORLD_BOUNDARY_BEHAVIOR_KEY);
		if (!links) return;

		for (const link of links) {
			const gameEntity = link.entity as any;
			const boundaryRef = link.ref as any;
			if (!gameEntity.body) continue;

			const options = boundaryRef.options as WorldBoundary2DOptions;

			// Create FSM lazily on first update after spawn
			if (!boundaryRef.fsm) {
				boundaryRef.fsm = new WorldBoundary2DFSM();
			}

			const body = gameEntity.body;
			const pos = body.translation();

			// Update FSM with current position - consumers use getMovement() to act on hits
			boundaryRef.fsm.update(
				{ x: pos.x, y: pos.y },
				options.boundaries
			);
		}
	}

	destroy(_ecs: IWorld): void {
		// No explicit cleanup required (FSMs are stored on behavior refs)
	}
}

/**
 * WorldBoundary2DBehavior
 *
 * @example
 * ```ts
 * import { WorldBoundary2DBehavior } from "@zylem/game-lib";
 *
 * const ship = createSprite({ ... });
 * const boundary = ship.use(WorldBoundary2DBehavior, {
 *   boundaries: { left: -10, right: 10, bottom: -7.5, top: 7.5 },
 * });
 *
 * ship.onUpdate(({ me }) => {
 *   let moveX = ..., moveY = ...;
 *   const hits = boundary.getLastHits(); // Fully typed!
 *   ({ moveX, moveY } = boundary.getMovement(moveX, moveY));
 *   me.moveXY(moveX, moveY);
 * });
 * ```
 */
export const WorldBoundary2DBehavior = defineBehavior({
	name: 'world-boundary-2d',
	defaultOptions,
	systemFactory: (ctx) =>
		new WorldBoundary2DSystem(ctx.world, ctx.getBehaviorLinks),
	createHandle: createWorldBoundary2DHandle,
});
