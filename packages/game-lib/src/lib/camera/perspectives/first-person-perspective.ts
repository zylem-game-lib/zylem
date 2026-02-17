import { Vector3, Quaternion, Euler, MathUtils } from 'three';
import type { CameraPerspective, CameraContext, CameraPose } from '../types';

/**
 * Configuration for the first-person perspective.
 */
export interface FirstPersonOptions {
	/** Vertical offset above the target entity's position (eye height). @default 1.7 */
	eyeHeight?: number;
	/** Default field of view in degrees. @default 75 */
	defaultFov?: number;
	/** Maximum pitch angle in radians. @default Math.PI/2 - 0.01 */
	pitchLimit?: number;
	/** Lerp speed for smooth look-at transitions. @default 5 */
	lookAtLerpSpeed?: number;
	/** Lerp speed for FOV zoom transitions. @default 8 */
	fovLerpSpeed?: number;
	/** Key in CameraContext.targets to follow. @default 'primary' */
	targetKey?: string;
	/** Fallback position when no target entity is attached. */
	initialPosition?: Vector3;
	/** Fallback look-at point used to derive initial yaw/pitch when no target. */
	initialLookAt?: Vector3;
}

interface Defaults {
	eyeHeight: number;
	defaultFov: number;
	pitchLimit: number;
	lookAtLerpSpeed: number;
	fovLerpSpeed: number;
	targetKey: string;
}

const DEFAULTS: Defaults = {
	eyeHeight: 1.7,
	defaultFov: 75,
	pitchLimit: Math.PI / 2 - 0.01,
	lookAtLerpSpeed: 5,
	fovLerpSpeed: 8,
	targetKey: 'primary',
};

/**
 * First-person camera perspective.
 *
 * Position is derived from the attached target entity (+ eye height).
 * Rotation is driven via `look()` / `setLook()` methods called by game code
 * or a future FPS behavior. Supports smooth FOV zoom and lerp'd look-at.
 */
export class FirstPersonPerspective implements CameraPerspective {
	readonly id = 'first-person';
	readonly defaults = { damping: 1 };

	private opts: Defaults;
	/** Fallback position when no target entity is attached. Mutate directly for manual movement. */
	initialPosition?: Vector3;
	private initialLookAt?: Vector3;

	// --- Look state ---
	private _yaw = 0;
	private _pitch = 0;

	// --- FOV zoom state ---
	private _currentFov: number;
	private _targetFov: number;

	// --- Look-at target state ---
	private _lookAtTarget: Vector3 | null = null;
	private _lookAtLerpSpeed: number;
	private _currentRotation = new Quaternion();
	private _rotationInitialized = false;

	constructor(options?: FirstPersonOptions) {
		const { initialPosition, initialLookAt, ...rest } = options ?? {};
		this.opts = { ...DEFAULTS, ...rest };
		this.initialPosition = initialPosition;
		this.initialLookAt = initialLookAt;

		this._currentFov = this.opts.defaultFov;
		this._targetFov = this.opts.defaultFov;
		this._lookAtLerpSpeed = this.opts.lookAtLerpSpeed;

		if (initialPosition && initialLookAt) {
			this.deriveYawPitchFromLookAt(initialPosition, initialLookAt);
		}
	}

	// --- Public API (called by game code / FPS behavior) ---

	/** Accumulate yaw and pitch deltas. Pitch is clamped to the configured limit. */
	look(deltaYaw: number, deltaPitch: number): void {
		this._yaw += deltaYaw;
		this._pitch = MathUtils.clamp(
			this._pitch + deltaPitch,
			-this.opts.pitchLimit,
			this.opts.pitchLimit,
		);
	}

	/** Set absolute yaw and pitch. Pitch is clamped to the configured limit. */
	setLook(yaw: number, pitch: number): void {
		this._yaw = yaw;
		this._pitch = MathUtils.clamp(pitch, -this.opts.pitchLimit, this.opts.pitchLimit);
	}

	/** Current yaw in radians. */
	get yaw(): number { return this._yaw; }

	/** Current pitch in radians. */
	get pitch(): number { return this._pitch; }

	/** Set the target FOV for a smooth zoom transition (e.g. sniper scope). */
	zoom(fov: number): void {
		this._targetFov = fov;
	}

	/** Return to the default FOV. */
	resetZoom(): void {
		this._targetFov = this.opts.defaultFov;
	}

	/** Current field of view. */
	get currentFov(): number { return this._currentFov; }

	/**
	 * Enable smooth look-at toward a world position.
	 * The camera will slerp from the current rotation toward the look-at direction.
	 */
	lookAt(target: Vector3, lerpSpeed?: number): void {
		this._lookAtTarget = target;
		if (lerpSpeed != null) {
			this._lookAtLerpSpeed = lerpSpeed;
		}
	}

	/** Disable look-at and return to manual yaw/pitch control. */
	clearLookAt(): void {
		if (this._lookAtTarget) {
			this.deriveYawPitchFromQuaternion(this._currentRotation);
		}
		this._lookAtTarget = null;
	}

	// --- CameraPerspective interface ---

	getBasePose(ctx: CameraContext): CameraPose {
		const position = this.computePosition(ctx);
		const rotation = this.computeRotation(position, ctx.dt);
		this._currentFov = this.lerpFov(ctx.dt);

		return {
			position,
			rotation,
			fov: this._currentFov,
			near: 0.1,
			far: 1000,
		};
	}

	// --- Private helpers ---

	private computePosition(ctx: CameraContext): Vector3 {
		const target = ctx.targets[this.opts.targetKey];
		if (target) {
			return new Vector3(
				target.position.x,
				target.position.y + this.opts.eyeHeight,
				target.position.z,
			);
		}
		if (this.initialPosition) {
			return this.initialPosition.clone();
		}
		return new Vector3(0, this.opts.eyeHeight, 0);
	}

	private computeRotation(eyePosition: Vector3, dt: number): Quaternion {
		const yawPitchQuat = new Quaternion().setFromEuler(
			new Euler(this._pitch, this._yaw, 0, 'YXZ'),
		);

		if (!this._rotationInitialized) {
			this._currentRotation.copy(yawPitchQuat);
			this._rotationInitialized = true;
		}

		if (this._lookAtTarget) {
			const dir = _vec3.copy(this._lookAtTarget).sub(eyePosition);
			if (dir.lengthSq() > 0.0001) {
				dir.normalize();
				const desiredYaw = Math.atan2(-dir.x, -dir.z);
				const desiredPitch = Math.asin(MathUtils.clamp(dir.y, -1, 1));
				const desiredQuat = _quat.setFromEuler(
					_euler.set(desiredPitch, desiredYaw, 0, 'YXZ'),
				);

				const t = 1 - Math.pow(1 - Math.min(this._lookAtLerpSpeed * dt, 1), 1);
				this._currentRotation.slerp(desiredQuat, MathUtils.clamp(t, 0, 1));
				return this._currentRotation.clone();
			}
		}

		this._currentRotation.copy(yawPitchQuat);
		return yawPitchQuat;
	}

	private lerpFov(dt: number): number {
		if (Math.abs(this._currentFov - this._targetFov) < 0.01) {
			return this._targetFov;
		}
		const t = 1 - Math.pow(1 - Math.min(this.opts.fovLerpSpeed * dt, 1), 1);
		return MathUtils.lerp(this._currentFov, this._targetFov, MathUtils.clamp(t, 0, 1));
	}

	private deriveYawPitchFromLookAt(from: Vector3, to: Vector3): void {
		const dir = _vec3.copy(to).sub(from).normalize();
		this._yaw = Math.atan2(-dir.x, -dir.z);
		this._pitch = Math.asin(MathUtils.clamp(dir.y, -1, 1));
	}

	private deriveYawPitchFromQuaternion(q: Quaternion): void {
		const euler = _euler.setFromQuaternion(q, 'YXZ');
		this._yaw = euler.y;
		this._pitch = MathUtils.clamp(euler.x, -this.opts.pitchLimit, this.opts.pitchLimit);
	}
}

// Reusable temporaries (avoid per-frame allocations)
const _vec3 = new Vector3();
const _quat = new Quaternion();
const _euler = new Euler();
