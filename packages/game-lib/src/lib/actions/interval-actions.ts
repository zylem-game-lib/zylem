import type { GameEntity } from '../entities/entity';
import { BaseAction, type Action } from './action';
import { setVelocityIntent } from './capabilities/velocity-intents';

// ─────────────────────────────────────────────────────────────────────────────
// MoveBy -- accumulate position delta over duration via velocity
// ─────────────────────────────────────────────────────────────────────────────

export interface MoveByOptions {
	/** X displacement (default: 0) */
	x?: number;
	/** Y displacement (default: 0) */
	y?: number;
	/** Z displacement (default: 0) */
	z?: number;
	/** Duration in milliseconds */
	duration: number;
}

/**
 * Move an entity by a displacement over a duration.
 * Distributes the movement as velocity each frame so physics stays in sync.
 *
 * @example
 * ```ts
 * entity.runAction(moveBy({ x: 10, duration: 500 }));
 * ```
 */
export function moveBy(opts: MoveByOptions): Action {
	return new MoveByAction(opts);
}

class MoveByAction extends BaseAction {
	private dx: number;
	private dy: number;
	private dz: number;

	constructor(opts: MoveByOptions) {
		super(opts.duration);
		this.dx = opts.x ?? 0;
		this.dy = opts.y ?? 0;
		this.dz = opts.z ?? 0;
	}

	protected onTick(entity: GameEntity<any>, delta: number, _progress: number): void {
		if (this.duration <= 0) return;
		// Distribute displacement as velocity: displacement/duration per second
		const vx = this.dx / this.duration;
		const vy = this.dy / this.duration;
		const vz = this.dz / this.duration;
		const store = entity.transformStore;
		if (!store) return;
		setVelocityIntent(store, 'actions', { x: vx, y: vy, z: vz }, { mode: 'add' });
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// MoveTo -- move to an absolute position over duration
// ─────────────────────────────────────────────────────────────────────────────

export interface MoveToOptions {
	/** Target X position */
	x: number;
	/** Target Y position */
	y: number;
	/** Target Z position */
	z: number;
	/** Duration in milliseconds */
	duration: number;
}

/**
 * Move an entity to an absolute position over a duration.
 * Calculates displacement from the entity's position on the first tick.
 *
 * @example
 * ```ts
 * entity.runAction(moveTo({ x: 0, y: 10, z: 0, duration: 2000 }));
 * ```
 */
export function moveTo(opts: MoveToOptions): Action {
	return new MoveToAction(opts);
}

class MoveToAction extends BaseAction {
	private targetX: number;
	private targetY: number;
	private targetZ: number;
	private dx = 0;
	private dy = 0;
	private dz = 0;
	private initialized = false;

	constructor(opts: MoveToOptions) {
		super(opts.duration);
		this.targetX = opts.x;
		this.targetY = opts.y;
		this.targetZ = opts.z;
	}

	protected onTick(entity: GameEntity<any>, delta: number, _progress: number): void {
		if (this.duration <= 0) return;
		if (!this.initialized) {
			const pos = entity.getPosition?.();
			const cx = pos?.x ?? 0;
			const cy = pos?.y ?? 0;
			const cz = pos?.z ?? 0;
			this.dx = this.targetX - cx;
			this.dy = this.targetY - cy;
			this.dz = this.targetZ - cz;
			this.initialized = true;
		}
		const vx = this.dx / this.duration;
		const vy = this.dy / this.duration;
		const vz = this.dz / this.duration;
		const store = entity.transformStore;
		if (!store) return;
		setVelocityIntent(store, 'actions', { x: vx, y: vy, z: vz }, { mode: 'add' });
	}

	reset(): void {
		super.reset();
		this.initialized = false;
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// RotateBy -- rotate by euler angles (degrees) over duration
// ─────────────────────────────────────────────────────────────────────────────

export interface RotateByOptions {
	/** X rotation in degrees (default: 0) */
	x?: number;
	/** Y rotation in degrees (default: 0) */
	y?: number;
	/** Z rotation in degrees (default: 0) */
	z?: number;
	/** Duration in milliseconds */
	duration: number;
}

/**
 * Rotate an entity by euler angles (degrees) over a duration.
 *
 * @example
 * ```ts
 * entity.runAction(rotateBy({ y: 360, duration: 2000 }));
 * ```
 */
export function rotateBy(opts: RotateByOptions): Action {
	return new RotateByAction(opts);
}

class RotateByAction extends BaseAction {
	private rx: number;
	private ry: number;
	private rz: number;

	constructor(opts: RotateByOptions) {
		super(opts.duration);
		const toRad = Math.PI / 180;
		this.rx = (opts.x ?? 0) * toRad;
		this.ry = (opts.y ?? 0) * toRad;
		this.rz = (opts.z ?? 0) * toRad;
	}

	protected onTick(entity: GameEntity<any>, delta: number, _progress: number): void {
		if (this.duration <= 0) return;
		// Distribute angular velocity in radians/sec
		const wx = this.rx / this.duration;
		const wy = this.ry / this.duration;
		const wz = this.rz / this.duration;
		const store = entity.transformStore;
		store.angularVelocity.x += wx;
		store.angularVelocity.y += wy;
		store.angularVelocity.z += wz;
		store.dirty.angularVelocity = true;
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Delay -- no-op for a duration (used in sequences)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wait for a duration. Useful inside `sequence()`.
 *
 * @param ms Duration in milliseconds
 * @example
 * ```ts
 * entity.runAction(sequence(moveBy({ x: 5, duration: 1000 }), delay(500), moveBy({ y: 3, duration: 1000 })));
 * ```
 */
export function delay(ms: number): Action {
	return new DelayAction(ms);
}

class DelayAction extends BaseAction {
	constructor(ms: number) {
		super(ms);
	}

	protected onTick(): void {
		// no-op -- just waits
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// CallFunc -- instant action that calls a function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Call a function immediately. Completes in one frame.
 * Useful inside `sequence()` for side effects.
 *
 * @example
 * ```ts
 * entity.runAction(sequence(moveBy({ x: 5, duration: 1000 }), callFunc(() => console.log('done'))));
 * ```
 */
export function callFunc(fn: () => void): Action {
	return new CallFuncAction(fn);
}

class CallFuncAction extends BaseAction {
	private fn: () => void;
	private called = false;

	constructor(fn: () => void) {
		super(0);
		this.fn = fn;
	}

	protected onTick(): void {
		if (!this.called) {
			this.fn();
			this.called = true;
		}
	}

	reset(): void {
		super.reset();
		this.called = false;
	}
}
