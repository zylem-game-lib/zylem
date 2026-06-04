/**
 * WorldBoundary2DBehavior
 *
 * Tracks which 2D world boundaries an entity is touching.
 * Use `getMovement()` on the behavior handle to adjust movement based on hits.
 *
 * Source of truth: `entity.body` (Rapier rigid body), consistent with other new behaviors.
 */

import { defineBehavior, type BehaviorRef } from '../behavior-descriptor';
import type { BehaviorEntityLink, BehaviorSystem } from '../behavior-system';
import {
	WorldBoundary2DFSM,
	type WorldBoundary2DBounds,
	type WorldBoundary2DHits,
} from './world-boundary-2d-fsm';
import {
	StageBoundaryDim,
	type WasmStageRuntime,
} from '../../runtime/wasm-stage-runtime';

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
 *
 * When a {@link WasmStageRuntime} is present in `BehaviorSystemContext` and the
 * entity has been registered with the unified Stage (`runtimeHandle >= 0`), the
 * system uses the Rust `world_boundary` behavior as the source of truth and
 * mirrors its query into the local FSM so handle methods (`getLastHits`,
 * `getMovement`) return the same shape as the legacy code path.
 */
class WorldBoundary2DSystem implements BehaviorSystem {
	private attachedRuntimeSlots = new Set<number>();

	constructor(
		private world: any,
		private wasmStage: WasmStageRuntime | null,
		private getBehaviorLinks?: (key: symbol) => Iterable<BehaviorEntityLink>,
	) {}

	update(_ecs: unknown, _delta: number): void {
		const links = this.getBehaviorLinks?.(WORLD_BOUNDARY_BEHAVIOR_KEY);
		if (!links) return;

		for (const link of links) {
			const gameEntity = link.entity as any;
			const boundaryRef = link.ref as any;
			const options = boundaryRef.options as WorldBoundary2DOptions;

			if (!boundaryRef.fsm) {
				boundaryRef.fsm = new WorldBoundary2DFSM();
			}

			const handle = (gameEntity.runtimeHandle ?? -1) as number;
			if (this.wasmStage && handle >= 0) {
				this.ensureWasmAttached(handle, options.boundaries);
				const query = this.wasmStage.queryWorldBoundary(handle);
				if (query) {
					boundaryRef.fsm.update(
						{ x: query.clamped[0], y: query.clamped[1] },
						options.boundaries,
					);
					continue;
				}
			}

			if (!gameEntity.body) continue;
			const body = gameEntity.body;
			const pos = body.translation();
			boundaryRef.fsm.update({ x: pos.x, y: pos.y }, options.boundaries);
		}
	}

	private ensureWasmAttached(handle: number, bounds: WorldBoundary2DBounds): void {
		if (!this.wasmStage || this.attachedRuntimeSlots.has(handle)) return;
		this.wasmStage.attachWorldBoundary(handle, StageBoundaryDim.Two, {
			top: bounds.top,
			bottom: bounds.bottom,
			left: bounds.left,
			right: bounds.right,
			front: 0,
			back: 0,
		});
		this.attachedRuntimeSlots.add(handle);
	}

	destroy(_ecs: unknown): void {
		this.attachedRuntimeSlots.clear();
	}
}

/**
 * WorldBoundary2DBehavior
 *
 * @example
 * ```ts
 * import { WorldBoundary2DBehavior } from "@zylem/game-lib/behavior";
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
		new WorldBoundary2DSystem(ctx.world, ctx.wasmStage ?? null, ctx.getBehaviorLinks),
	createHandle: createWorldBoundary2DHandle,
});
