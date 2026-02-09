import type { GameEntity, GameEntityOptions } from '../entities/entity';

/**
 * Action interface -- the base contract for all actions.
 *
 * Actions are entity-scoped, self-contained objects that modify entity state
 * over time. They are ticked automatically by the entity update loop.
 */
export interface Action {
	/** Internal duration in seconds (0 = instant, Infinity = persistent) */
	readonly duration: number;
	/** Whether this action has completed */
	readonly done: boolean;
	/** Whether this action auto-removes when done (set by entity.action()) */
	persistent: boolean;
	/** Advance the action by delta seconds */
	tick(entity: GameEntity<any>, delta: number): void;
	/** Reset the action to its initial state */
	reset(): void;
}

/**
 * Base class for interval actions that run over a fixed duration.
 * Accepts duration in **milliseconds**; converts to seconds internally
 * since the game loop delta is in seconds.
 */
export abstract class BaseAction implements Action {
	public readonly duration: number;
	public done: boolean = false;
	public persistent: boolean = false;
	protected elapsed: number = 0;

	/** @param durationMs Duration in milliseconds */
	constructor(durationMs: number) {
		this.duration = durationMs / 1000;
	}

	tick(entity: GameEntity<any>, delta: number): void {
		if (this.done) return;
		this.elapsed += delta;
		const progress = this.duration > 0 ? Math.min(this.elapsed / this.duration, 1) : 1;
		this.onTick(entity, delta, progress);
		if (this.elapsed >= this.duration) {
			this.done = true;
		}
	}

	reset(): void {
		this.elapsed = 0;
		this.done = false;
	}

	/**
	 * Subclasses implement this to apply their effect each frame.
	 * @param entity The entity this action is running on
	 * @param delta Frame delta in seconds
	 * @param progress 0..1 normalized progress through the duration
	 */
	protected abstract onTick(
		entity: GameEntity<any>,
		delta: number,
		progress: number,
	): void;
}
