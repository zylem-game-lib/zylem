import type { GameEntity } from '../entities/entity';
import type { Action } from './action';

// ─────────────────────────────────────────────────────────────────────────────
// Sequence -- runs actions one after another
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run actions in order, one after another.
 *
 * @example
 * ```ts
 * entity.runAction(sequence(
 *   moveBy({ x: 5, duration: 1000 }),
 *   delay(500),
 *   moveBy({ y: 3, duration: 1000 }),
 * ));
 * ```
 */
export function sequence(...actions: Action[]): Action {
	return new SequenceAction(actions);
}

class SequenceAction implements Action {
	public duration: number;
	public done: boolean = false;
	public persistent: boolean = false;
	private actions: Action[];
	private currentIndex: number = 0;

	constructor(actions: Action[]) {
		this.actions = actions;
		this.duration = actions.reduce((sum, a) => sum + a.duration, 0);
	}

	tick(entity: GameEntity<any>, delta: number): void {
		if (this.done || this.actions.length === 0) {
			this.done = true;
			return;
		}

		let remaining = delta;
		while (remaining > 0 && this.currentIndex < this.actions.length) {
			const current = this.actions[this.currentIndex];
			current.tick(entity, remaining);
			if (current.done) {
				// Calculate overflow time for the next action
				const actionDuration = current.duration;
				const actionElapsed = (current as any).elapsed ?? actionDuration;
				const overflow = Math.max(0, actionElapsed - actionDuration);
				remaining = overflow;
				this.currentIndex++;
			} else {
				remaining = 0;
			}
		}

		if (this.currentIndex >= this.actions.length) {
			this.done = true;
		}
	}

	reset(): void {
		this.currentIndex = 0;
		this.done = false;
		for (const action of this.actions) {
			action.reset();
		}
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Parallel -- runs all actions simultaneously
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run all actions simultaneously. Done when all children are done.
 *
 * @example
 * ```ts
 * entity.runAction(parallel(
 *   moveBy({ x: 5, duration: 1000 }),
 *   rotateBy({ y: 360, duration: 1000 }),
 * ));
 * ```
 */
export function parallel(...actions: Action[]): Action {
	return new ParallelAction(actions);
}

class ParallelAction implements Action {
	public duration: number;
	public done: boolean = false;
	public persistent: boolean = false;
	private actions: Action[];

	constructor(actions: Action[]) {
		this.actions = actions;
		this.duration = Math.max(0, ...actions.map(a => a.duration));
	}

	tick(entity: GameEntity<any>, delta: number): void {
		if (this.done) return;

		let allDone = true;
		for (const action of this.actions) {
			if (!action.done) {
				action.tick(entity, delta);
			}
			if (!action.done) {
				allDone = false;
			}
		}

		if (allDone) {
			this.done = true;
		}
	}

	reset(): void {
		this.done = false;
		for (const action of this.actions) {
			action.reset();
		}
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Repeat -- repeats an action N times
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Repeat an action a fixed number of times.
 *
 * @example
 * ```ts
 * entity.runAction(repeat(moveBy({ x: 2, duration: 500 }), 5));
 * ```
 */
export function repeat(action: Action, times: number): Action {
	return new RepeatAction(action, times);
}

class RepeatAction implements Action {
	public duration: number;
	public done: boolean = false;
	public persistent: boolean = false;
	private action: Action;
	private totalTimes: number;
	private currentCount: number = 0;

	constructor(action: Action, times: number) {
		this.action = action;
		this.totalTimes = times;
		this.duration = action.duration * times;
	}

	tick(entity: GameEntity<any>, delta: number): void {
		if (this.done) return;

		this.action.tick(entity, delta);
		if (this.action.done) {
			this.currentCount++;
			if (this.currentCount >= this.totalTimes) {
				this.done = true;
			} else {
				this.action.reset();
			}
		}
	}

	reset(): void {
		this.currentCount = 0;
		this.done = false;
		this.action.reset();
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// RepeatForever -- repeats an action indefinitely
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Repeat an action forever. Never completes.
 *
 * @example
 * ```ts
 * enemy.runAction(repeatForever(
 *   sequence(moveBy({ x: 3, duration: 2000 }), moveBy({ x: -3, duration: 2000 })),
 * ));
 * ```
 */
export function repeatForever(action: Action): Action {
	return new RepeatForeverAction(action);
}

class RepeatForeverAction implements Action {
	public readonly duration = Infinity;
	public done: boolean = false;
	public persistent: boolean = false;
	private action: Action;

	constructor(action: Action) {
		this.action = action;
	}

	tick(entity: GameEntity<any>, delta: number): void {
		this.action.tick(entity, delta);
		if (this.action.done) {
			this.action.reset();
		}
	}

	reset(): void {
		this.done = false;
		this.action.reset();
	}
}
