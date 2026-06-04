import { SyncStateMachine, t } from '../../core/utility/sync-state-machine';
import type { JumpState2D } from './components';

export enum Jumper2DState {
	Grounded = 'grounded',
	Jumping = 'jumping',
	Falling = 'falling',
}

export enum Jumper2DEvent {
	Jump = 'jump',
	Fall = 'fall',
	Land = 'land',
}

export interface Jumper2DFSMContext {
	state: JumpState2D;
}

export class Jumper2DFSM {
	machine: SyncStateMachine<Jumper2DState, Jumper2DEvent, never>;

	constructor(private ctx: Jumper2DFSMContext) {
		this.machine = new SyncStateMachine<Jumper2DState, Jumper2DEvent, never>(
			Jumper2DState.Grounded,
			[
				t(Jumper2DState.Grounded, Jumper2DEvent.Jump, Jumper2DState.Jumping),
				t(Jumper2DState.Grounded, Jumper2DEvent.Fall, Jumper2DState.Falling),
				t(Jumper2DState.Grounded, Jumper2DEvent.Land, Jumper2DState.Grounded),
				t(Jumper2DState.Jumping, Jumper2DEvent.Fall, Jumper2DState.Falling),
				t(Jumper2DState.Jumping, Jumper2DEvent.Land, Jumper2DState.Grounded),
				t(Jumper2DState.Jumping, Jumper2DEvent.Jump, Jumper2DState.Jumping),
				t(Jumper2DState.Falling, Jumper2DEvent.Land, Jumper2DState.Grounded),
				t(Jumper2DState.Falling, Jumper2DEvent.Jump, Jumper2DState.Jumping),
				t(Jumper2DState.Falling, Jumper2DEvent.Fall, Jumper2DState.Falling),
			],
		);
	}

	getState(): Jumper2DState {
		return this.machine.getState();
	}

	dispatch(event: Jumper2DEvent): void {
		if (this.machine.can(event)) {
			this.machine.syncDispatch(event);
		}
	}

	isJumping(): boolean {
		return this.getState() === Jumper2DState.Jumping;
	}

	isGrounded(): boolean {
		return this.getState() === Jumper2DState.Grounded;
	}

	getJumpsUsed(): number {
		return this.ctx.state.jumpsUsed;
	}

	applyTickEvent(tickEvent: string, isGrounded: boolean): void {
		switch (tickEvent) {
			case 'jump':
				this.dispatch(Jumper2DEvent.Jump);
				break;
			case 'fall':
				this.dispatch(Jumper2DEvent.Fall);
				break;
			case 'land':
				this.dispatch(Jumper2DEvent.Land);
				break;
			default:
				if (!isGrounded && this.getState() === Jumper2DState.Grounded) {
					this.dispatch(Jumper2DEvent.Fall);
				}
				if (isGrounded && this.getState() !== Jumper2DState.Grounded) {
					this.dispatch(Jumper2DEvent.Land);
				}
				break;
		}
	}
}
