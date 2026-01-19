/**
 * ScreenWrapFSM
 * 
 * State machine for screen wrap behavior.
 * Reports position relative to bounds edges.
 */

import { StateMachine, t } from 'typescript-fsm';

// ─────────────────────────────────────────────────────────────────────────────
// FSM State Model
// ─────────────────────────────────────────────────────────────────────────────

export enum ScreenWrapState {
	Center = 'center',
	NearEdgeLeft = 'near-edge-left',
	NearEdgeRight = 'near-edge-right',
	NearEdgeTop = 'near-edge-top',
	NearEdgeBottom = 'near-edge-bottom',
	Wrapped = 'wrapped',
}

// ─────────────────────────────────────────────────────────────────────────────
// FSM Events
// ─────────────────────────────────────────────────────────────────────────────

export enum ScreenWrapEvent {
	EnterCenter = 'enter-center',
	ApproachLeft = 'approach-left',
	ApproachRight = 'approach-right',
	ApproachTop = 'approach-top',
	ApproachBottom = 'approach-bottom',
	Wrap = 'wrap',
}

// ─────────────────────────────────────────────────────────────────────────────
// ScreenWrapFSM
// ─────────────────────────────────────────────────────────────────────────────

export class ScreenWrapFSM {
	machine: StateMachine<ScreenWrapState, ScreenWrapEvent, never>;

	constructor() {
		this.machine = new StateMachine<ScreenWrapState, ScreenWrapEvent, never>(
			ScreenWrapState.Center,
			[
				// From Center
				t(ScreenWrapState.Center, ScreenWrapEvent.ApproachLeft, ScreenWrapState.NearEdgeLeft),
				t(ScreenWrapState.Center, ScreenWrapEvent.ApproachRight, ScreenWrapState.NearEdgeRight),
				t(ScreenWrapState.Center, ScreenWrapEvent.ApproachTop, ScreenWrapState.NearEdgeTop),
				t(ScreenWrapState.Center, ScreenWrapEvent.ApproachBottom, ScreenWrapState.NearEdgeBottom),
				
				// From NearEdge to Wrapped
				t(ScreenWrapState.NearEdgeLeft, ScreenWrapEvent.Wrap, ScreenWrapState.Wrapped),
				t(ScreenWrapState.NearEdgeRight, ScreenWrapEvent.Wrap, ScreenWrapState.Wrapped),
				t(ScreenWrapState.NearEdgeTop, ScreenWrapEvent.Wrap, ScreenWrapState.Wrapped),
				t(ScreenWrapState.NearEdgeBottom, ScreenWrapEvent.Wrap, ScreenWrapState.Wrapped),

				// From NearEdge back to Center
				t(ScreenWrapState.NearEdgeLeft, ScreenWrapEvent.EnterCenter, ScreenWrapState.Center),
				t(ScreenWrapState.NearEdgeRight, ScreenWrapEvent.EnterCenter, ScreenWrapState.Center),
				t(ScreenWrapState.NearEdgeTop, ScreenWrapEvent.EnterCenter, ScreenWrapState.Center),
				t(ScreenWrapState.NearEdgeBottom, ScreenWrapEvent.EnterCenter, ScreenWrapState.Center),

				// From Wrapped back to Center
				t(ScreenWrapState.Wrapped, ScreenWrapEvent.EnterCenter, ScreenWrapState.Center),

				// From Wrapped to NearEdge (landed near opposite edge)
				t(ScreenWrapState.Wrapped, ScreenWrapEvent.ApproachLeft, ScreenWrapState.NearEdgeLeft),
				t(ScreenWrapState.Wrapped, ScreenWrapEvent.ApproachRight, ScreenWrapState.NearEdgeRight),
				t(ScreenWrapState.Wrapped, ScreenWrapEvent.ApproachTop, ScreenWrapState.NearEdgeTop),
				t(ScreenWrapState.Wrapped, ScreenWrapEvent.ApproachBottom, ScreenWrapState.NearEdgeBottom),

				// Self-transitions (no-ops for redundant events)
				t(ScreenWrapState.Center, ScreenWrapEvent.EnterCenter, ScreenWrapState.Center),
				t(ScreenWrapState.NearEdgeLeft, ScreenWrapEvent.ApproachLeft, ScreenWrapState.NearEdgeLeft),
				t(ScreenWrapState.NearEdgeRight, ScreenWrapEvent.ApproachRight, ScreenWrapState.NearEdgeRight),
				t(ScreenWrapState.NearEdgeTop, ScreenWrapEvent.ApproachTop, ScreenWrapState.NearEdgeTop),
				t(ScreenWrapState.NearEdgeBottom, ScreenWrapEvent.ApproachBottom, ScreenWrapState.NearEdgeBottom),
			]
		);
	}

	getState(): ScreenWrapState {
		return this.machine.getState();
	}

	dispatch(event: ScreenWrapEvent): void {
		if (this.machine.can(event)) {
			this.machine.dispatch(event);
		}
	}

	/**
	 * Update FSM based on entity position relative to bounds
	 */
	update(position: { x: number; y: number }, bounds: {
		minX: number; maxX: number; minY: number; maxY: number;
		edgeThreshold: number;
	}, wrapped: boolean): void {
		const { x, y } = position;
		const { minX, maxX, minY, maxY, edgeThreshold } = bounds;

		if (wrapped) {
			this.dispatch(ScreenWrapEvent.Wrap);
			return;
		}

		// Check if near edges
		const nearLeft = x < minX + edgeThreshold;
		const nearRight = x > maxX - edgeThreshold;
		const nearBottom = y < minY + edgeThreshold;
		const nearTop = y > maxY - edgeThreshold;

		if (nearLeft) {
			this.dispatch(ScreenWrapEvent.ApproachLeft);
		} else if (nearRight) {
			this.dispatch(ScreenWrapEvent.ApproachRight);
		} else if (nearTop) {
			this.dispatch(ScreenWrapEvent.ApproachTop);
		} else if (nearBottom) {
			this.dispatch(ScreenWrapEvent.ApproachBottom);
		} else {
			this.dispatch(ScreenWrapEvent.EnterCenter);
		}
	}
}
