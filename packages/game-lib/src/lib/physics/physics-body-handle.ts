import type { BodyCommand } from './physics-protocol';

/**
 * Lightweight read-only view of a physics body's state.
 *
 * These values are synced from the worker each frame and represent
 * the body's state after the latest physics step.
 */
export interface PhysicsSnapshot {
	position: { x: number; y: number; z: number };
	rotation: { x: number; y: number; z: number; w: number };
	linvel: { x: number; y: number; z: number };
	angvel: { x: number; y: number; z: number };
}

/**
 * Main-thread handle for a physics body that lives in a Web Worker.
 *
 * Provides the same read interface as a Rapier RigidBody (translation,
 * rotation, linvel, angvel) by returning cached values that are synced
 * from the worker each frame.
 *
 * Write operations (setLinvel, setTranslation, etc.) are queued as
 * {@link BodyCommand}s and sent to the worker on the next step.
 */
export class PhysicsBodyHandle {
	readonly uuid: string;

	/** Last-known physics state, updated from worker each frame. */
	private _snapshot: PhysicsSnapshot = {
		position: { x: 0, y: 0, z: 0 },
		rotation: { x: 0, y: 0, z: 0, w: 1 },
		linvel: { x: 0, y: 0, z: 0 },
		angvel: { x: 0, y: 0, z: 0 },
	};

	/** Queued commands to be sent to the worker on next step. */
	private _pendingCommands: BodyCommand[] = [];

	/** Optional reference to the proxy's shared command queue. */
	private _sharedQueue: BodyCommand[] | null = null;

	constructor(uuid: string, sharedQueue?: BodyCommand[]) {
		this.uuid = uuid;
		this._sharedQueue = sharedQueue ?? null;
	}

	// ─── Read API (returns cached values) ────────────────────────────────

	/** Cached position from last physics step. */
	translation(): { x: number; y: number; z: number } {
		return this._snapshot.position;
	}

	/** Cached rotation quaternion from last physics step. */
	rotation(): { x: number; y: number; z: number; w: number } {
		return this._snapshot.rotation;
	}

	/** Cached linear velocity from last physics step. */
	linvel(): { x: number; y: number; z: number } {
		return this._snapshot.linvel;
	}

	/** Cached angular velocity from last physics step. */
	angvel(): { x: number; y: number; z: number } {
		return this._snapshot.angvel;
	}

	// ─── Write API (queues commands) ─────────────────────────────────────

	setLinvel(v: { x: number; y: number; z: number }, _wakeUp?: boolean): void {
		this.enqueue({ kind: 'setLinvel', uuid: this.uuid, x: v.x, y: v.y, z: v.z });
		this._snapshot.linvel = { ...v };
	}

	setAngvel(v: { x: number; y: number; z: number }, _wakeUp?: boolean): void {
		this.enqueue({ kind: 'setAngvel', uuid: this.uuid, x: v.x, y: v.y, z: v.z });
		this._snapshot.angvel = { ...v };
	}

	setTranslation(v: { x: number; y: number; z: number }, _wakeUp?: boolean): void {
		this.enqueue({ kind: 'setTranslation', uuid: this.uuid, x: v.x, y: v.y, z: v.z });
		this._snapshot.position = { ...v };
	}

	setRotation(q: { x: number; y: number; z: number; w: number }, _wakeUp?: boolean): void {
		this.enqueue({ kind: 'setRotation', uuid: this.uuid, x: q.x, y: q.y, z: q.z, w: q.w });
		this._snapshot.rotation = { ...q };
	}

	applyImpulse(v: { x: number; y: number; z: number }, _wakeUp?: boolean): void {
		this.enqueue({ kind: 'applyImpulse', uuid: this.uuid, x: v.x, y: v.y, z: v.z });
	}

	applyTorqueImpulse(v: { x: number; y: number; z: number }, _wakeUp?: boolean): void {
		this.enqueue({ kind: 'applyTorqueImpulse', uuid: this.uuid, x: v.x, y: v.y, z: v.z });
	}

	lockTranslations(locked: boolean, _wakeUp?: boolean): void {
		this.enqueue({ kind: 'lockTranslations', uuid: this.uuid, locked });
	}

	lockRotations(locked: boolean, _wakeUp?: boolean): void {
		this.enqueue({ kind: 'lockRotations', uuid: this.uuid, locked });
	}

	setLinearDamping(damping: number): void {
		this.enqueue({ kind: 'setLinearDamping', uuid: this.uuid, damping });
	}

	setGravityScale(scale: number, _wakeUp?: boolean): void {
		this.enqueue({ kind: 'setGravityScale', uuid: this.uuid, scale });
	}

	// ─── Stubbed read-only methods for compatibility ─────────────────────

	/** Returns 'Dynamic' for compatibility; actual type is not synced. */
	bodyType(): number {
		return 0;
	}

	mass(): number {
		return 1;
	}

	isEnabled(): boolean {
		return true;
	}

	isSleeping(): boolean {
		return false;
	}

	/** Collider access is not available through the handle. Returns null. */
	collider(_index: number): null {
		return null;
	}

	// ─── Internal ────────────────────────────────────────────────────────

	/**
	 * Update the cached snapshot from worker data.
	 * Called by the PhysicsProxy after receiving a stepResult.
	 */
	_updateSnapshot(
		px: number, py: number, pz: number,
		rx: number, ry: number, rz: number, rw: number,
		lvx: number, lvy: number, lvz: number,
		avx: number, avy: number, avz: number,
	): void {
		this._snapshot.position.x = px;
		this._snapshot.position.y = py;
		this._snapshot.position.z = pz;
		this._snapshot.rotation.x = rx;
		this._snapshot.rotation.y = ry;
		this._snapshot.rotation.z = rz;
		this._snapshot.rotation.w = rw;
		this._snapshot.linvel.x = lvx;
		this._snapshot.linvel.y = lvy;
		this._snapshot.linvel.z = lvz;
		this._snapshot.angvel.x = avx;
		this._snapshot.angvel.y = avy;
		this._snapshot.angvel.z = avz;
	}

	/** Drain pending commands. */
	_drainCommands(): BodyCommand[] {
		const cmds = this._pendingCommands;
		this._pendingCommands = [];
		return cmds;
	}

	private enqueue(cmd: BodyCommand): void {
		if (this._sharedQueue) {
			this._sharedQueue.push(cmd);
		} else {
			this._pendingCommands.push(cmd);
		}
	}
}
