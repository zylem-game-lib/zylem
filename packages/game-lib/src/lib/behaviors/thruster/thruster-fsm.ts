/**
 * ThrusterFSM
 * 
 * State machine controller for thruster behavior.
 * FSM does NOT touch physics or ThrusterMovementBehavior - it only writes ThrusterInputComponent.
 */

import { StateMachine, t, type ITransition } from 'typescript-fsm';
import type { ThrusterInputComponent } from './components';

// ─────────────────────────────────────────────────────────────────────────────
// FSM State Model
// ─────────────────────────────────────────────────────────────────────────────

export enum ThrusterState {
	Idle = 'idle',
	Active = 'active',
	Boosting = 'boosting',
	Disabled = 'disabled',
	Docked = 'docked',
}

// ─────────────────────────────────────────────────────────────────────────────
// FSM Events
// ─────────────────────────────────────────────────────────────────────────────

export enum ThrusterEvent {
	Activate = 'activate',
	Deactivate = 'deactivate',
	Boost = 'boost',
	EndBoost = 'endBoost',
	Disable = 'disable',
	Enable = 'enable',
	Dock = 'dock',
	Undock = 'undock',
}

// ─────────────────────────────────────────────────────────────────────────────
// FSM Context Object
// ─────────────────────────────────────────────────────────────────────────────

export interface ThrusterFSMContext {
	input: ThrusterInputComponent;
}

// ─────────────────────────────────────────────────────────────────────────────
// Player Input (raw input from controller/keyboard)
// ─────────────────────────────────────────────────────────────────────────────

export interface PlayerInput {
	thrust: number;
	rotate: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// ThrusterFSM Controller
// ─────────────────────────────────────────────────────────────────────────────

export class ThrusterFSM {
	machine: StateMachine<ThrusterState, ThrusterEvent, never>;

	constructor(private ctx: ThrusterFSMContext) {
		this.machine = new StateMachine<ThrusterState, ThrusterEvent, never>(
			ThrusterState.Idle,
			[
				// Core transitions
				t(ThrusterState.Idle, ThrusterEvent.Activate, ThrusterState.Active),
				t(ThrusterState.Active, ThrusterEvent.Deactivate, ThrusterState.Idle),
				t(ThrusterState.Active, ThrusterEvent.Boost, ThrusterState.Boosting),
				t(ThrusterState.Active, ThrusterEvent.Disable, ThrusterState.Disabled),
				t(ThrusterState.Active, ThrusterEvent.Dock, ThrusterState.Docked),
				t(ThrusterState.Boosting, ThrusterEvent.EndBoost, ThrusterState.Active),
				t(ThrusterState.Boosting, ThrusterEvent.Disable, ThrusterState.Disabled),
				t(ThrusterState.Disabled, ThrusterEvent.Enable, ThrusterState.Idle),
				t(ThrusterState.Docked, ThrusterEvent.Undock, ThrusterState.Idle),
				// Self-transitions (no-ops for redundant events)
				t(ThrusterState.Idle, ThrusterEvent.Deactivate, ThrusterState.Idle),
				t(ThrusterState.Active, ThrusterEvent.Activate, ThrusterState.Active),
			]
		);
	}

	/**
	 * Get current state
	 */
	getState(): ThrusterState {
		return this.machine.getState();
	}

	/**
	 * Dispatch an event to transition state
	 */
	dispatch(event: ThrusterEvent): void {
		if (this.machine.can(event)) {
			this.machine.dispatch(event);
		}
	}

	/**
	 * Update FSM state based on player input.
	 * Auto-transitions between Idle/Active to report current state.
	 * Does NOT modify input - just observes and reports.
	 */
	update(playerInput: PlayerInput): void {
		const state = this.machine.getState();
		const hasInput = Math.abs(playerInput.thrust) > 0.01 || Math.abs(playerInput.rotate) > 0.01;

		// Auto-transition to report state based on input
		if (hasInput && state === ThrusterState.Idle) {
			this.dispatch(ThrusterEvent.Activate);
		} else if (!hasInput && state === ThrusterState.Active) {
			this.dispatch(ThrusterEvent.Deactivate);
		}
	}
}
