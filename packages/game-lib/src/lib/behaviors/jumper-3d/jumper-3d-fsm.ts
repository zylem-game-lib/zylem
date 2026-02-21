/**
 * Jumper 3D Finite State Machine
 *
 * Three high-level states driven by events emitted from the behavior tick:
 *   Grounded  ──Jump──▶  Jumping
 *   Grounded  ──Fall──▶  Falling   (walked off a ledge)
 *   Jumping   ──Fall──▶  Falling   (apex / descending)
 *   Jumping   ──Jump──▶  Jumping   (multi-jump)
 *   Jumping   ──Land──▶  Grounded  (rare — very short hop)
 *   Falling   ──Land──▶  Grounded
 *   Falling   ──Jump──▶  Jumping   (air-jump while falling)
 */

import { StateMachine, t } from 'typescript-fsm';
import type { JumpState3D } from './components';

export enum Jumper3DState {
	Grounded = 'grounded',
	Jumping = 'jumping',
	Falling = 'falling',
}

export enum Jumper3DEvent {
	Jump = 'jump',
	Fall = 'fall',
	Land = 'land',
}

export interface Jumper3DFSMContext {
	state: JumpState3D;
}

export class Jumper3DFSM {
	machine: StateMachine<Jumper3DState, Jumper3DEvent, never>;

	constructor(private ctx: Jumper3DFSMContext) {
		this.machine = new StateMachine<Jumper3DState, Jumper3DEvent, never>(
			Jumper3DState.Grounded,
			[
				// Grounded
				t(Jumper3DState.Grounded, Jumper3DEvent.Jump, Jumper3DState.Jumping),
				t(Jumper3DState.Grounded, Jumper3DEvent.Fall, Jumper3DState.Falling),
				t(Jumper3DState.Grounded, Jumper3DEvent.Land, Jumper3DState.Grounded),

				// Jumping
				t(Jumper3DState.Jumping, Jumper3DEvent.Fall, Jumper3DState.Falling),
				t(Jumper3DState.Jumping, Jumper3DEvent.Land, Jumper3DState.Grounded),
				t(Jumper3DState.Jumping, Jumper3DEvent.Jump, Jumper3DState.Jumping),

				// Falling
				t(Jumper3DState.Falling, Jumper3DEvent.Land, Jumper3DState.Grounded),
				t(Jumper3DState.Falling, Jumper3DEvent.Jump, Jumper3DState.Jumping),
				t(Jumper3DState.Falling, Jumper3DEvent.Fall, Jumper3DState.Falling),
			],
		);
	}

	getState(): Jumper3DState {
		return this.machine.getState();
	}

	dispatch(event: Jumper3DEvent): void {
		if (this.machine.can(event)) {
			this.machine.dispatch(event);
		}
	}

	isJumping(): boolean {
		return this.getState() === Jumper3DState.Jumping;
	}

	isFalling(): boolean {
		return this.getState() === Jumper3DState.Falling;
	}

	isGrounded(): boolean {
		return this.getState() === Jumper3DState.Grounded;
	}

	getJumpsUsed(): number {
		return this.ctx.state.jumpsUsed;
	}

	/**
	 * Translate a tick event into an FSM dispatch.
	 * Also handles the implicit Grounded→Falling transition when the entity
	 * is no longer grounded but no explicit event was emitted (e.g. walked
	 * off a ledge without jumping).
	 */
	applyTickEvent(tickEvent: string, isGrounded: boolean): void {
		switch (tickEvent) {
			case 'jump':
				this.dispatch(Jumper3DEvent.Jump);
				break;
			case 'fall':
				this.dispatch(Jumper3DEvent.Fall);
				break;
			case 'land':
				this.dispatch(Jumper3DEvent.Land);
				break;
			default:
				// No explicit event — detect implicit fall
				if (!isGrounded && this.getState() === Jumper3DState.Grounded) {
					this.dispatch(Jumper3DEvent.Fall);
				}
				if (isGrounded && this.getState() !== Jumper3DState.Grounded) {
					this.dispatch(Jumper3DEvent.Land);
				}
				break;
		}
	}
}
