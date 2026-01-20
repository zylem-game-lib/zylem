/**
 * MovementSequence2DFSM
 *
 * FSM + extended state to manage timed movement sequences.
 * Tracks current step, time remaining, and computes movement for consumer.
 */

import { StateMachine, t } from 'typescript-fsm';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface MovementSequence2DStep {
	/** Identifier for this step */
	name: string;
	/** X velocity for this step */
	moveX?: number;
	/** Y velocity for this step */
	moveY?: number;
	/** Duration in seconds */
	timeInSeconds: number;
}

export interface MovementSequence2DMovement {
	moveX: number;
	moveY: number;
}

export interface MovementSequence2DProgress {
	stepIndex: number;
	totalSteps: number;
	stepTimeRemaining: number;
	done: boolean;
}

export interface MovementSequence2DCurrentStep {
	name: string;
	index: number;
	moveX: number;
	moveY: number;
	timeRemaining: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// FSM State Model
// ─────────────────────────────────────────────────────────────────────────────

export enum MovementSequence2DState {
	Idle = 'idle',
	Running = 'running',
	Paused = 'paused',
	Completed = 'completed',
}

export enum MovementSequence2DEvent {
	Start = 'start',
	Pause = 'pause',
	Resume = 'resume',
	Complete = 'complete',
	Reset = 'reset',
}

// ─────────────────────────────────────────────────────────────────────────────
// FSM Implementation
// ─────────────────────────────────────────────────────────────────────────────

export class MovementSequence2DFSM {
	public readonly machine: StateMachine<MovementSequence2DState, MovementSequence2DEvent, never>;

	private sequence: MovementSequence2DStep[] = [];
	private loop: boolean = true;
	private currentIndex: number = 0;
	private timeRemaining: number = 0;

	constructor() {
		this.machine = new StateMachine<MovementSequence2DState, MovementSequence2DEvent, never>(
			MovementSequence2DState.Idle,
			[
				// From Idle
				t(MovementSequence2DState.Idle, MovementSequence2DEvent.Start, MovementSequence2DState.Running),

				// From Running
				t(MovementSequence2DState.Running, MovementSequence2DEvent.Pause, MovementSequence2DState.Paused),
				t(MovementSequence2DState.Running, MovementSequence2DEvent.Complete, MovementSequence2DState.Completed),
				t(MovementSequence2DState.Running, MovementSequence2DEvent.Reset, MovementSequence2DState.Idle),

				// From Paused
				t(MovementSequence2DState.Paused, MovementSequence2DEvent.Resume, MovementSequence2DState.Running),
				t(MovementSequence2DState.Paused, MovementSequence2DEvent.Reset, MovementSequence2DState.Idle),

				// From Completed
				t(MovementSequence2DState.Completed, MovementSequence2DEvent.Reset, MovementSequence2DState.Idle),
				t(MovementSequence2DState.Completed, MovementSequence2DEvent.Start, MovementSequence2DState.Running),

				// Self-transitions (no-ops)
				t(MovementSequence2DState.Idle, MovementSequence2DEvent.Pause, MovementSequence2DState.Idle),
				t(MovementSequence2DState.Idle, MovementSequence2DEvent.Resume, MovementSequence2DState.Idle),
				t(MovementSequence2DState.Running, MovementSequence2DEvent.Start, MovementSequence2DState.Running),
				t(MovementSequence2DState.Running, MovementSequence2DEvent.Resume, MovementSequence2DState.Running),
				t(MovementSequence2DState.Paused, MovementSequence2DEvent.Pause, MovementSequence2DState.Paused),
				t(MovementSequence2DState.Completed, MovementSequence2DEvent.Complete, MovementSequence2DState.Completed),
			]
		);
	}

	/**
	 * Initialize the sequence. Call this once with options.
	 */
	init(sequence: MovementSequence2DStep[], loop: boolean): void {
		this.sequence = sequence;
		this.loop = loop;
		this.currentIndex = 0;
		this.timeRemaining = sequence.length > 0 ? sequence[0].timeInSeconds : 0;
	}

	getState(): MovementSequence2DState {
		return this.machine.getState();
	}

	/**
	 * Start the sequence (from Idle or Completed).
	 */
	start(): void {
		if (this.machine.getState() === MovementSequence2DState.Idle ||
		    this.machine.getState() === MovementSequence2DState.Completed) {
			this.currentIndex = 0;
			this.timeRemaining = this.sequence.length > 0 ? this.sequence[0].timeInSeconds : 0;
		}
		this.dispatch(MovementSequence2DEvent.Start);
	}

	/**
	 * Pause the sequence.
	 */
	pause(): void {
		this.dispatch(MovementSequence2DEvent.Pause);
	}

	/**
	 * Resume a paused sequence.
	 */
	resume(): void {
		this.dispatch(MovementSequence2DEvent.Resume);
	}

	/**
	 * Reset to Idle state.
	 */
	reset(): void {
		this.dispatch(MovementSequence2DEvent.Reset);
		this.currentIndex = 0;
		this.timeRemaining = this.sequence.length > 0 ? this.sequence[0].timeInSeconds : 0;
	}

	/**
	 * Update the sequence with delta time.
	 * Returns the current movement to apply.
	 * Automatically starts if in Idle state.
	 */
	update(delta: number): MovementSequence2DMovement {
		if (this.sequence.length === 0) {
			return { moveX: 0, moveY: 0 };
		}

		// Auto-start if idle
		if (this.machine.getState() === MovementSequence2DState.Idle) {
			this.start();
		}

		// Don't advance if paused or completed
		if (this.machine.getState() !== MovementSequence2DState.Running) {
			if (this.machine.getState() === MovementSequence2DState.Completed) {
				return { moveX: 0, moveY: 0 };
			}
			// Paused - return current step's movement (but don't advance time)
			const step = this.sequence[this.currentIndex];
			return { moveX: step?.moveX ?? 0, moveY: step?.moveY ?? 0 };
		}

		// Advance time
		let timeLeft = this.timeRemaining - delta;

		// Handle step transitions
		while (timeLeft <= 0) {
			const overflow = -timeLeft;
			this.currentIndex += 1;

			if (this.currentIndex >= this.sequence.length) {
				if (!this.loop) {
					this.dispatch(MovementSequence2DEvent.Complete);
					return { moveX: 0, moveY: 0 };
				}
				this.currentIndex = 0;
			}

			timeLeft = this.sequence[this.currentIndex].timeInSeconds - overflow;
		}

		this.timeRemaining = timeLeft;

		const step = this.sequence[this.currentIndex];
		return { moveX: step?.moveX ?? 0, moveY: step?.moveY ?? 0 };
	}

	/**
	 * Get the current movement without advancing time.
	 */
	getMovement(): MovementSequence2DMovement {
		if (this.sequence.length === 0 ||
		    this.machine.getState() === MovementSequence2DState.Completed) {
			return { moveX: 0, moveY: 0 };
		}
		const step = this.sequence[this.currentIndex];
		return { moveX: step?.moveX ?? 0, moveY: step?.moveY ?? 0 };
	}

	/**
	 * Get current step info.
	 */
	getCurrentStep(): MovementSequence2DCurrentStep | null {
		if (this.sequence.length === 0) return null;
		const step = this.sequence[this.currentIndex];
		if (!step) return null;
		return {
			name: step.name,
			index: this.currentIndex,
			moveX: step.moveX ?? 0,
			moveY: step.moveY ?? 0,
			timeRemaining: this.timeRemaining,
		};
	}

	/**
	 * Get sequence progress.
	 */
	getProgress(): MovementSequence2DProgress {
		return {
			stepIndex: this.currentIndex,
			totalSteps: this.sequence.length,
			stepTimeRemaining: this.timeRemaining,
			done: this.machine.getState() === MovementSequence2DState.Completed,
		};
	}

	private dispatch(event: MovementSequence2DEvent): void {
		if (this.machine.can(event)) {
			this.machine.dispatch(event);
		}
	}
}
