import type { GameEntity } from '../entities/entity';
import type { Action } from './action';

// ─────────────────────────────────────────────────────────────────────────────
// Throttle -- auto-resetting timer
// ─────────────────────────────────────────────────────────────────────────────

export interface ThrottleOptions {
	/** Interval in milliseconds between ready cycles */
	duration: number;
}

/**
 * A repeating timer that becomes ready every N milliseconds.
 * Register with `entity.action(throttle(...))`.
 *
 * @example
 * ```ts
 * const t = entity.action(throttle({ duration: 500 }));
 * entity.onUpdate(() => {
 *   if (t.ready) { t.consume(); // do something every 500ms }
 * });
 * ```
 */
export function throttle(opts: ThrottleOptions): ThrottleAction {
	return new ThrottleAction(opts.duration);
}

export class ThrottleAction implements Action {
	public readonly duration: number;
	public done: boolean = false;
	public persistent: boolean = true;
	public ready: boolean = false;
	private elapsed: number = 0;

	/** @param durationMs Duration in milliseconds */
	constructor(durationMs: number) {
		this.duration = durationMs / 1000;
	}

	tick(_entity: GameEntity<any>, delta: number): void {
		this.elapsed += delta;
		if (this.elapsed >= this.duration) {
			this.ready = true;
		}
	}

	/** Consume the ready state and reset the timer */
	consume(): void {
		this.ready = false;
		this.elapsed = 0;
	}

	reset(): void {
		this.elapsed = 0;
		this.ready = false;
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// OnPress -- edge-detection for button press
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detects the rising edge of a boolean signal (press).
 * Call `.check(isPressed)` each frame in your onUpdate; `.triggered` is
 * true for one frame on press.
 *
 * @example
 * ```ts
 * const press = entity.action(onPress());
 * entity.onUpdate(({ inputs }) => {
 *   press.check(inputs.p1.buttons.A.pressed);
 *   if (press.triggered) { // do something once on press }
 * });
 * ```
 */
export function onPress(): OnPressAction {
	return new OnPressAction();
}

export class OnPressAction implements Action {
	public readonly duration = Infinity;
	public done: boolean = false;
	public persistent: boolean = true;
	public triggered: boolean = false;
	private wasPressed: boolean = false;

	tick(): void {
		// Reset triggered each frame; .check() sets it
		this.triggered = false;
	}

	/**
	 * Feed the current pressed state. Sets `.triggered = true` on the
	 * frame where `isPressed` transitions from false to true.
	 */
	check(isPressed: boolean): void {
		if (isPressed && !this.wasPressed) {
			this.triggered = true;
		}
		this.wasPressed = isPressed;
	}

	reset(): void {
		this.triggered = false;
		this.wasPressed = false;
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// OnRelease -- edge-detection for button release
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detects the falling edge of a boolean signal (release).
 * Call `.check(isPressed)` each frame; `.triggered` is true for one frame
 * on release.
 *
 * @example
 * ```ts
 * const release = entity.action(onRelease());
 * entity.onUpdate(({ inputs }) => {
 *   release.check(inputs.p1.buttons.A.pressed);
 *   if (release.triggered) { // do something once on release }
 * });
 * ```
 */
export function onRelease(): OnReleaseAction {
	return new OnReleaseAction();
}

export class OnReleaseAction implements Action {
	public readonly duration = Infinity;
	public done: boolean = false;
	public persistent: boolean = true;
	public triggered: boolean = false;
	private wasPressed: boolean = false;

	tick(): void {
		this.triggered = false;
	}

	/**
	 * Feed the current pressed state. Sets `.triggered = true` on the
	 * frame where `isPressed` transitions from true to false.
	 */
	check(isPressed: boolean): void {
		if (!isPressed && this.wasPressed) {
			this.triggered = true;
		}
		this.wasPressed = isPressed;
	}

	reset(): void {
		this.triggered = false;
		this.wasPressed = false;
	}
}
