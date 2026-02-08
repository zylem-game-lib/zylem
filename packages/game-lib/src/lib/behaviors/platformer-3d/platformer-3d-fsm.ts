/**
 * Platformer 3D Finite State Machine
 * 
 * Manages state transitions for 3D platformer movement:
 * - Idle: Standing still on ground
 * - Walking: Moving on ground (slow)
 * - Running: Moving on ground (fast)
 * - Jumping: Ascending from jump
 * - Falling: Descending (gravity)
 * - Landing: Just touched ground
 */

import { StateMachine, t } from 'typescript-fsm';
import type { Platformer3DInputComponent, Platformer3DStateComponent } from './components';

/**
 * Simplified Collision Context interface
 */
export interface PlatformerCollisionContext {
	contact: {
		normal: { x: number; y: number; z?: number };
	};
}

/**
 * Platformer states
 */
export enum Platformer3DState {
	Idle = 'idle',
	Walking = 'walking',
	Running = 'running',
	Jumping = 'jumping',
	Falling = 'falling',
	Landing = 'landing',
}

/**
 * Events that trigger state transitions
 */
export enum Platformer3DEvent {
	Walk = 'walk',
	Run = 'run',
	Jump = 'jump',
	Fall = 'fall',
	Land = 'land',
	Stop = 'stop',
}

/**
 * Context for the FSM
 */
export interface Platformer3DContext {
	input: Platformer3DInputComponent;
	state: Platformer3DStateComponent;
}

/**
 * Platformer 3D FSM
 */
export class Platformer3DFSM {
	machine: StateMachine<Platformer3DState, Platformer3DEvent, never>;

	constructor(private ctx: Platformer3DContext) {
		this.machine = new StateMachine<Platformer3DState, Platformer3DEvent, never>(
			Platformer3DState.Idle,
			[
				// Idle transitions
				t(Platformer3DState.Idle, Platformer3DEvent.Walk, Platformer3DState.Walking),
				t(Platformer3DState.Idle, Platformer3DEvent.Run, Platformer3DState.Running),
				t(Platformer3DState.Idle, Platformer3DEvent.Jump, Platformer3DState.Jumping),
				t(Platformer3DState.Idle, Platformer3DEvent.Fall, Platformer3DState.Falling),
				
				// Walking transitions
				t(Platformer3DState.Walking, Platformer3DEvent.Run, Platformer3DState.Running),
				t(Platformer3DState.Walking, Platformer3DEvent.Jump, Platformer3DState.Jumping),
				t(Platformer3DState.Walking, Platformer3DEvent.Stop, Platformer3DState.Idle),
				t(Platformer3DState.Walking, Platformer3DEvent.Fall, Platformer3DState.Falling),
				
				// Running transitions
				t(Platformer3DState.Running, Platformer3DEvent.Walk, Platformer3DState.Walking),
				t(Platformer3DState.Running, Platformer3DEvent.Jump, Platformer3DState.Jumping),
				t(Platformer3DState.Running, Platformer3DEvent.Stop, Platformer3DState.Idle),
				t(Platformer3DState.Running, Platformer3DEvent.Fall, Platformer3DState.Falling),
				
				// Jumping transitions
				t(Platformer3DState.Jumping, Platformer3DEvent.Fall, Platformer3DState.Falling),
				t(Platformer3DState.Jumping, Platformer3DEvent.Land, Platformer3DState.Landing),
				t(Platformer3DState.Jumping, Platformer3DEvent.Jump, Platformer3DState.Jumping), // Multi-jump
				
				// Falling transitions
				t(Platformer3DState.Falling, Platformer3DEvent.Land, Platformer3DState.Landing),
				
				// Landing transitions
				t(Platformer3DState.Landing, Platformer3DEvent.Walk, Platformer3DState.Walking),
				t(Platformer3DState.Landing, Platformer3DEvent.Run, Platformer3DState.Running),
				t(Platformer3DState.Landing, Platformer3DEvent.Stop, Platformer3DState.Idle),
				
				// Self-transitions (no-ops)
				t(Platformer3DState.Idle, Platformer3DEvent.Stop, Platformer3DState.Idle),
			]
		);
	}

	/**
	 * Get the current state
	 */
	getState(): Platformer3DState {
		return this.machine.getState();
	}

	/**
	 * Dispatch an event to the FSM
	 */
	dispatch(event: Platformer3DEvent): void {
		if (this.machine.can(event)) {
			this.machine.dispatch(event);
		}
	}

	/**
	 * Check if grounded
	 */
	isGrounded(): boolean {
		const state = this.getState();
		return state === Platformer3DState.Idle || 
		       state === Platformer3DState.Walking || 
		       state === Platformer3DState.Running || 
		       state === Platformer3DState.Landing;
	}

	/**
	 * Get current jump count from context
	 */
	getJumpCount(): number {
		return this.ctx.state.jumpCount;
	}

	/**
	 * Handle collision event to update ground state
	 */
	handleCollision(ctx: PlatformerCollisionContext): void {
		// Check if collision is ground (normal pointing up)
		// Y normal > 0.5 means roughly within 60 degrees of up
		if (ctx.contact.normal.y > 0.5) {
			this.ctx.state.collisionGrounded = true;
			this.ctx.state.groundedCollisionTime = performance.now();
		}
	}

	/**
	 * Update FSM based on current state
	 */
	update(input: Platformer3DInputComponent, state: Platformer3DStateComponent): void {
		// Update context
		this.ctx.input = input;
		this.ctx.state = state;

		// Get current FSM state
		const currentState = this.getState();

		// Determine movement state
		const hasInput = Math.abs(input.moveX) > 0.1 || Math.abs(input.moveZ) > 0.1;
		const isRunning = input.run;

		// Handle landing: if we're in falling state and now grounded, land
		if (currentState === Platformer3DState.Falling && state.grounded) {
			this.dispatch(Platformer3DEvent.Land);
			// Don't return - allow immediate transition to movement state
		}

		// Send appropriate events based on state
		if (state.grounded) {
			if (hasInput) {
				if (isRunning) {
					this.dispatch(Platformer3DEvent.Run);
				} else {
					this.dispatch(Platformer3DEvent.Walk);
				}
			} else {
				this.dispatch(Platformer3DEvent.Stop);
			}
		} else {
			// Not grounded - check if we should be falling
			// Transition to falling if: We're in jumping state and now falling, 
			// OR we walked off a ledge (idle/walking/running and now falling)
			if (state.falling) {
				this.dispatch(Platformer3DEvent.Fall);
			}
		}

		// Handle jump input (edge detection handled in behavior)
		if (input.jump && !state.jumpPressedLastFrame) {
			this.dispatch(Platformer3DEvent.Jump);
		}
	}
}
