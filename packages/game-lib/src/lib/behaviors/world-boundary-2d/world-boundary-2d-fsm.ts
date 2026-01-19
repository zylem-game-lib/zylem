/**
 * WorldBoundary2DFSM
 *
 * Minimal FSM + extended state to track which world boundaries were hit.
 *
 * Notes:
 * - "Hit boundaries" is inherently a *set* (can hit left+bottom in one frame),
 *   so we store it as extended state (`lastHits`) rather than a single FSM state.
 * - The FSM state is still useful for coarse status like "inside" vs "touching".
 */

import { StateMachine, t } from 'typescript-fsm';

export type WorldBoundary2DHit = 'top' | 'bottom' | 'left' | 'right';
export type WorldBoundary2DHits = Record<WorldBoundary2DHit, boolean>;

export interface WorldBoundary2DPosition {
	x: number;
	y: number;
}

export interface WorldBoundary2DBounds {
	top: number;
	bottom: number;
	left: number;
	right: number;
}

export enum WorldBoundary2DState {
	Inside = 'inside',
	Touching = 'touching',
}

export enum WorldBoundary2DEvent {
	EnterInside = 'enter-inside',
	TouchBoundary = 'touch-boundary',
}

/**
 * Compute which boundaries are being hit for a position and bounds.
 * This matches the semantics of the legacy `boundary2d` behavior:
 * - left hit if x <= left
 * - right hit if x >= right
 * - bottom hit if y <= bottom
 * - top hit if y >= top
 */
export function computeWorldBoundary2DHits(
	position: WorldBoundary2DPosition,
	bounds: WorldBoundary2DBounds
): WorldBoundary2DHits {
	const hits: WorldBoundary2DHits = {
		top: false,
		bottom: false,
		left: false,
		right: false,
	};

	if (position.x <= bounds.left) hits.left = true;
	else if (position.x >= bounds.right) hits.right = true;

	if (position.y <= bounds.bottom) hits.bottom = true;
	else if (position.y >= bounds.top) hits.top = true;

	return hits;
}

export function hasAnyWorldBoundary2DHit(hits: WorldBoundary2DHits): boolean {
	return !!(hits.left || hits.right || hits.top || hits.bottom);
}

/**
 * FSM wrapper with "extended state" (lastHits / lastPosition).
 * Systems should call `update(...)` once per frame.
 */
export class WorldBoundary2DFSM {
	public readonly machine: StateMachine<WorldBoundary2DState, WorldBoundary2DEvent, never>;

	private lastHits: WorldBoundary2DHits = { top: false, bottom: false, left: false, right: false };
	private lastPosition: WorldBoundary2DPosition | null = null;
	private lastUpdatedAtMs: number | null = null;

	constructor() {
		this.machine = new StateMachine<WorldBoundary2DState, WorldBoundary2DEvent, never>(
			WorldBoundary2DState.Inside,
			[
				t(WorldBoundary2DState.Inside, WorldBoundary2DEvent.TouchBoundary, WorldBoundary2DState.Touching),
				t(WorldBoundary2DState.Touching, WorldBoundary2DEvent.EnterInside, WorldBoundary2DState.Inside),

				// Self transitions (no-ops)
				t(WorldBoundary2DState.Inside, WorldBoundary2DEvent.EnterInside, WorldBoundary2DState.Inside),
				t(WorldBoundary2DState.Touching, WorldBoundary2DEvent.TouchBoundary, WorldBoundary2DState.Touching),
			]
		);
	}

	getState(): WorldBoundary2DState {
		return this.machine.getState();
	}

	/**
	 * Returns the last computed hits (always available after first update call).
	 */
	getLastHits(): WorldBoundary2DHits {
		return this.lastHits;
	}

	/**
	 * Returns adjusted movement values based on boundary hits.
	 * If the entity is touching a boundary and trying to move further into it,
	 * that axis component is zeroed out.
	 *
	 * @param moveX - The desired X movement
	 * @param moveY - The desired Y movement
	 * @returns Adjusted { moveX, moveY } with boundary-blocked axes zeroed
	 */
	getMovement(moveX: number, moveY: number): { moveX: number; moveY: number } {
		const hits = this.lastHits;

		let adjustedX = moveX;
		let adjustedY = moveY;

		// If moving left and hitting left, or moving right and hitting right, zero X
		if ((hits.left && moveX < 0) || (hits.right && moveX > 0)) {
			adjustedX = 0;
		}

		// If moving down and hitting bottom, or moving up and hitting top, zero Y
		if ((hits.bottom && moveY < 0) || (hits.top && moveY > 0)) {
			adjustedY = 0;
		}

		return { moveX: adjustedX, moveY: adjustedY };
	}

	/**
	 * Returns the last position passed to `update`, if any.
	 */
	getLastPosition(): WorldBoundary2DPosition | null {
		return this.lastPosition;
	}

	/**
	 * Best-effort timestamp (ms) of the last `update(...)` call.
	 * This is optional metadata; systems can ignore it.
	 */
	getLastUpdatedAtMs(): number | null {
		return this.lastUpdatedAtMs;
	}

	/**
	 * Update FSM + extended state based on current position and bounds.
	 * Returns the computed hits for convenience.
	 */
	update(position: WorldBoundary2DPosition, bounds: WorldBoundary2DBounds): WorldBoundary2DHits {
		const hits = computeWorldBoundary2DHits(position, bounds);

		this.lastHits = hits;
		this.lastPosition = { x: position.x, y: position.y };
		this.lastUpdatedAtMs = Date.now();

		if (hasAnyWorldBoundary2DHit(hits)) {
			this.dispatch(WorldBoundary2DEvent.TouchBoundary);
		} else {
			this.dispatch(WorldBoundary2DEvent.EnterInside);
		}

		return hits;
	}

	private dispatch(event: WorldBoundary2DEvent): void {
		if (this.machine.can(event)) {
			this.machine.dispatch(event);
		}
	}
}
