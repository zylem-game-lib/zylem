import type { BodyCommand } from './physics-protocol';
import {
	createPhysicsPose,
	interpolatePhysicsPose,
	type PhysicsPose,
	type PhysicsPoseHistory,
	type PhysicsQuaternion,
	type PhysicsVector3,
} from './physics-pose';

/**
 * Lightweight read-only view of a physics body's state.
 *
 * These values are synced from the worker each frame and represent
 * the body's state after the latest physics step.
 */
export interface PhysicsSnapshot {
	previous: PhysicsPose;
	current: PhysicsPose;
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
		previous: createPhysicsPose(),
		current: createPhysicsPose(),
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
		return this._snapshot.current.position;
	}

	/** Cached rotation quaternion from last physics step. */
	rotation(): { x: number; y: number; z: number; w: number } {
		return this._snapshot.current.rotation;
	}

	/** Cached linear velocity from last physics step. */
	linvel(): { x: number; y: number; z: number } {
		return this._snapshot.linvel;
	}

	/** Cached angular velocity from last physics step. */
	angvel(): { x: number; y: number; z: number } {
		return this._snapshot.angvel;
	}

	getPoseHistory(): PhysicsPoseHistory {
		return this._snapshot;
	}

	getRenderPose(alpha: number): PhysicsPose {
		return interpolatePhysicsPose(
			this._snapshot.previous,
			this._snapshot.current,
			alpha,
		);
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
		this.setCollapsedTranslation(v);
	}

	setRotation(q: { x: number; y: number; z: number; w: number }, _wakeUp?: boolean): void {
		this.enqueue({ kind: 'setRotation', uuid: this.uuid, x: q.x, y: q.y, z: q.z, w: q.w });
		this.setCollapsedRotation(q);
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
	_seedSnapshot(
		px: number,
		py: number,
		pz: number,
		rx: number,
		ry: number,
		rz: number,
		rw: number,
		lvx: number,
		lvy: number,
		lvz: number,
		avx: number,
		avy: number,
		avz: number,
	): void {
		this.writePose(this._snapshot.previous, px, py, pz, rx, ry, rz, rw);
		this.writePose(this._snapshot.current, px, py, pz, rx, ry, rz, rw);
		this._snapshot.linvel.x = lvx;
		this._snapshot.linvel.y = lvy;
		this._snapshot.linvel.z = lvz;
		this._snapshot.angvel.x = avx;
		this._snapshot.angvel.y = avy;
		this._snapshot.angvel.z = avz;
	}

	_updateSnapshot(
		px: number, py: number, pz: number,
		rx: number, ry: number, rz: number, rw: number,
		lvx: number, lvy: number, lvz: number,
		avx: number, avy: number, avz: number,
	): void {
		this.copyPose(this._snapshot.current, this._snapshot.previous);
		this.writePose(this._snapshot.current, px, py, pz, rx, ry, rz, rw);
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

	private copyPose(source: PhysicsPose, target: PhysicsPose): void {
		target.position.x = source.position.x;
		target.position.y = source.position.y;
		target.position.z = source.position.z;
		target.rotation.x = source.rotation.x;
		target.rotation.y = source.rotation.y;
		target.rotation.z = source.rotation.z;
		target.rotation.w = source.rotation.w;
	}

	private writePose(
		target: PhysicsPose,
		px: number,
		py: number,
		pz: number,
		rx: number,
		ry: number,
		rz: number,
		rw: number,
	): void {
		target.position.x = px;
		target.position.y = py;
		target.position.z = pz;
		target.rotation.x = rx;
		target.rotation.y = ry;
		target.rotation.z = rz;
		target.rotation.w = rw;
	}

	private setCollapsedTranslation(translation: PhysicsVector3): void {
		this._snapshot.previous.position.x = translation.x;
		this._snapshot.previous.position.y = translation.y;
		this._snapshot.previous.position.z = translation.z;
		this._snapshot.current.position.x = translation.x;
		this._snapshot.current.position.y = translation.y;
		this._snapshot.current.position.z = translation.z;
	}

	private setCollapsedRotation(rotation: PhysicsQuaternion): void {
		this._snapshot.previous.rotation.x = rotation.x;
		this._snapshot.previous.rotation.y = rotation.y;
		this._snapshot.previous.rotation.z = rotation.z;
		this._snapshot.previous.rotation.w = rotation.w;
		this._snapshot.current.rotation.x = rotation.x;
		this._snapshot.current.rotation.y = rotation.y;
		this._snapshot.current.rotation.z = rotation.z;
		this._snapshot.current.rotation.w = rotation.w;
	}
}
