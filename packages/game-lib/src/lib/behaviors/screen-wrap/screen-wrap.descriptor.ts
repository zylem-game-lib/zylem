/**
 * ScreenWrapBehavior
 * 
 * When an entity exits the defined 2D bounds, it wraps around to the opposite edge.
 * Asteroids-style screen wrapping with FSM for edge detection.
 */

import type { IWorld } from 'bitecs';
import { defineBehavior } from '../behavior-descriptor';
import type { BehaviorSystem } from '../behavior-system';
import { ScreenWrapFSM } from './screen-wrap-fsm';

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

/**
 * ScreenWrapSystem - Wraps entities around 2D bounds
 */
class ScreenWrapSystem implements BehaviorSystem {
	constructor(private world: any) {}

	update(ecs: IWorld, delta: number): void {
		if (!this.world?.collisionMap) return;

		for (const [, entity] of this.world.collisionMap) {
			const gameEntity = entity as any;
			
			if (typeof gameEntity.getBehaviorRefs !== 'function') continue;
			
			const refs = gameEntity.getBehaviorRefs();
			const wrapRef = refs.find((r: any) => 
				r.descriptor.key === Symbol.for('zylem:behavior:screen-wrap')
			);
			
			if (!wrapRef || !gameEntity.body) continue;

			const options = wrapRef.options as ScreenWrapOptions;

			// Create FSM lazily
			if (!wrapRef.fsm) {
				wrapRef.fsm = new ScreenWrapFSM();
			}

			const wrapped = this.wrapEntity(gameEntity, options);

			// Update FSM with position and wrap state
			const pos = gameEntity.body.translation();
			const { width, height, centerX, centerY, edgeThreshold } = options;
			const halfWidth = width / 2;
			const halfHeight = height / 2;

			wrapRef.fsm.update(
				{ x: pos.x, y: pos.y },
				{
					minX: centerX - halfWidth,
					maxX: centerX + halfWidth,
					minY: centerY - halfHeight,
					maxY: centerY + halfHeight,
					edgeThreshold,
				},
				wrapped
			);
		}
	}

	private wrapEntity(entity: any, options: ScreenWrapOptions): boolean {
		const body = entity.body;
		if (!body) return false;

		const { width, height, centerX, centerY } = options;
		const halfWidth = width / 2;
		const halfHeight = height / 2;

		const minX = centerX - halfWidth;
		const maxX = centerX + halfWidth;
		const minY = centerY - halfHeight;
		const maxY = centerY + halfHeight;

		const pos = body.translation();
		let newX = pos.x;
		let newY = pos.y;
		let wrapped = false;

		// Wrap X
		if (pos.x < minX) {
			newX = maxX - (minX - pos.x);
			wrapped = true;
		} else if (pos.x > maxX) {
			newX = minX + (pos.x - maxX);
			wrapped = true;
		}

		// Wrap Y
		if (pos.y < minY) {
			newY = maxY - (minY - pos.y);
			wrapped = true;
		} else if (pos.y > maxY) {
			newY = minY + (pos.y - maxY);
			wrapped = true;
		}

		if (wrapped) {
			body.setTranslation({ x: newX, y: newY, z: pos.z }, true);
		}

		return wrapped;
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
	systemFactory: (ctx) => new ScreenWrapSystem(ctx.world),
});

