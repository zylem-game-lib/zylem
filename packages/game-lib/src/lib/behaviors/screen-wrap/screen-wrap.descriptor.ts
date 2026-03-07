/**
 * ScreenWrapBehavior
 * 
 * When an entity exits the defined 2D bounds, it wraps around to the opposite edge.
 * Asteroids-style screen wrapping with FSM for edge detection.
 */

import type { IWorld } from 'bitecs';
import { defineBehavior } from '../behavior-descriptor';
import type { BehaviorEntityLink, BehaviorSystem } from '../behavior-system';
import { ScreenWrapFSM } from './screen-wrap-fsm';
import { createBounds2DRect, wrapPoint2D } from '../shared/bounds-2d';

/**
 * Screen wrap options (typed for entity.use() autocomplete)
 */
export interface ScreenWrapOptions {
	/** Width of the wrapping area (default: 20) */
	width: number;
	/** Height of the wrapping area (default: 15) */
	height: number;
	/** Center X position (default: 0) */
	centerX: number;
	/** Center Y position (default: 0) */
	centerY: number;
	/** Distance from edge to trigger NearEdge state (default: 2) */
	edgeThreshold: number;
}

const defaultOptions: ScreenWrapOptions = {
	width: 20,
	height: 15,
	centerX: 0,
	centerY: 0,
	edgeThreshold: 2,
};

const SCREEN_WRAP_BEHAVIOR_KEY = Symbol.for('zylem:behavior:screen-wrap');

/**
 * ScreenWrapSystem - Wraps entities around 2D bounds
 */
class ScreenWrapSystem implements BehaviorSystem {
	constructor(
		private world: any,
		private getBehaviorLinks?: (key: symbol) => Iterable<BehaviorEntityLink>,
	) {}

	update(_ecs: IWorld, delta: number): void {
		const links = this.getBehaviorLinks?.(SCREEN_WRAP_BEHAVIOR_KEY);
		if (!links) return;

		for (const link of links) {
			const gameEntity = link.entity as any;
			const wrapRef = link.ref as any;
			if (!gameEntity.body) continue;

			const options = wrapRef.options as ScreenWrapOptions;

			// Create FSM lazily
			if (!wrapRef.fsm) {
				wrapRef.fsm = new ScreenWrapFSM();
			}

			const wrapped = this.wrapEntity(gameEntity, options);

			// Update FSM with position and wrap state
			const pos = gameEntity.body.translation();
			const { edgeThreshold } = options;
			const bounds = createBounds2DRect(options);

			wrapRef.fsm.update(
				{ x: pos.x, y: pos.y },
				{
					minX: bounds.minX,
					maxX: bounds.maxX,
					minY: bounds.minY,
					maxY: bounds.maxY,
					edgeThreshold,
				},
				wrapped
			);
		}
	}

	private wrapEntity(entity: any, options: ScreenWrapOptions): boolean {
		const body = entity.body;
		if (!body) return false;

		const pos = body.translation();
		const bounds = createBounds2DRect(options);
		const result = wrapPoint2D({ x: pos.x, y: pos.y }, bounds);

		if (result.wrapped) {
			body.setTranslation({ x: result.x, y: result.y, z: pos.z }, true);
		}

		return result.wrapped;
	}

	destroy(_ecs: IWorld): void {
		// Cleanup if needed
	}
}

/**
 * ScreenWrapBehavior - Wraps entities around 2D bounds
 * 
 * @example
 * ```typescript
 * import { ScreenWrapBehavior } from "@zylem/game-lib";
 * 
 * const ship = createSprite({ ... });
 * const wrapRef = ship.use(ScreenWrapBehavior, { width: 20, height: 15 });
 * 
 * // Access FSM to observe edge state
 * const fsm = wrapRef.getFSM();
 * console.log(fsm?.getState()); // 'center', 'near-edge-left', 'wrapped', etc.
 * ```
 */
export const ScreenWrapBehavior = defineBehavior({
	name: 'screen-wrap',
	defaultOptions,
	systemFactory: (ctx) =>
		new ScreenWrapSystem(ctx.world, ctx.getBehaviorLinks),
});
