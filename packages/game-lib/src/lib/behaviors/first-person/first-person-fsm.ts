/**
 * First Person Controller Finite State Machine
 *
 * Manages state transitions for first-person movement:
 * - Idle: Standing still
 * - Walking: Moving at walk speed
 * - Running: Moving at run/sprint speed
 */

import { StateMachine, t } from 'typescript-fsm';
import type { FirstPersonInputComponent, FirstPersonStateComponent } from './components';

/**
 * First-person movement states
 */
export enum FirstPersonState {
	Idle = 'idle',
	Walking = 'walking',
	Running = 'running',
}

/**
 * Events that trigger state transitions
 */
export enum FirstPersonEvent {
	Walk = 'walk',
	Run = 'run',
	Stop = 'stop',
}

/**
 * Context for the FSM
 */
export interface FirstPersonContext {
	input: FirstPersonInputComponent;
	state: FirstPersonStateComponent;
}

/**
 * First Person Controller FSM
 */
export class FirstPersonFSM {
	machine: StateMachine<FirstPersonState, FirstPersonEvent, never>;

	constructor(private ctx: FirstPersonContext) {
		this.machine = new StateMachine<FirstPersonState, FirstPersonEvent, never>(
			FirstPersonState.Idle,
			[
				// Idle transitions
				t(FirstPersonState.Idle, FirstPersonEvent.Walk, FirstPersonState.Walking),
				t(FirstPersonState.Idle, FirstPersonEvent.Run, FirstPersonState.Running),
				t(FirstPersonState.Idle, FirstPersonEvent.Stop, FirstPersonState.Idle),

				// Walking transitions
				t(FirstPersonState.Walking, FirstPersonEvent.Run, FirstPersonState.Running),
				t(FirstPersonState.Walking, FirstPersonEvent.Stop, FirstPersonState.Idle),
				t(FirstPersonState.Walking, FirstPersonEvent.Walk, FirstPersonState.Walking),

				// Running transitions
				t(FirstPersonState.Running, FirstPersonEvent.Walk, FirstPersonState.Walking),
				t(FirstPersonState.Running, FirstPersonEvent.Stop, FirstPersonState.Idle),
				t(FirstPersonState.Running, FirstPersonEvent.Run, FirstPersonState.Running),
			],
		);
	}

	/** Get the current state */
	getState(): FirstPersonState {
		return this.machine.getState();
	}

	/** Dispatch an event to the FSM */
	dispatch(event: FirstPersonEvent): void {
		if (this.machine.can(event)) {
			this.machine.dispatch(event);
		}
	}

	/** Get the current yaw from context */
	getYaw(): number {
		return this.ctx.state.yaw;
	}

	/** Get the current pitch from context */
	getPitch(): number {
		return this.ctx.state.pitch;
	}

	/**
	 * Update FSM based on current input and state.
	 */
	update(input: FirstPersonInputComponent, state: FirstPersonStateComponent): void {
		this.ctx.input = input;
		this.ctx.state = state;

		const hasMovement = Math.abs(input.moveX) > 0.1 || Math.abs(input.moveZ) > 0.1;

		if (hasMovement) {
			if (input.sprint) {
				this.dispatch(FirstPersonEvent.Run);
			} else {
				this.dispatch(FirstPersonEvent.Walk);
			}
		} else {
			this.dispatch(FirstPersonEvent.Stop);
		}
	}
}
