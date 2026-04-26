import { Vector3, Quaternion } from 'three';
import type { CameraPerspective, CameraContext, CameraPose } from '../types';
import { Vec3Input, VEC3_ZERO, toThreeVector3 } from '../../core/vector';

/**
 * Configuration for the third-person perspective.
 */
export interface ThirdPersonOptions {
	/** Distance behind the target. Default 8. */
	distance?: number;
	/** Height above the target. Default 5. */
	height?: number;
	/** Lateral offset from the target (shoulder cam). Default 0. */
	shoulderOffset?: number;
	/** Key in CameraContext.targets to follow. Default 'primary'. */
	targetKey?: string;
	/** Perspective field of view. Default 75. */
	fov?: number;
	/** Padding multiplier when framing multiple targets. Default 1.5. */
	paddingFactor?: number;
	/** Minimum camera distance when multi-framing. Default 5. */
	minDistance?: number;
	/** Fallback camera position when no targets exist (e.g. the user-specified initial position). */
	initialPosition?: Vec3Input;
	/** Fallback lookAt point when no targets exist. */
	initialLookAt?: Vec3Input;
	/**
	 * Seconds the camera lags behind the target's actual position. The camera
	 * samples target moves from `now - trailDelay` so brief, fast Y motion
	 * (jump apex / fall start) doesn't get tracked 1:1 — eliminates the
	 * shimmer-on-fall effect at high refresh rates. 0 disables the trail and
	 * restores instantaneous tracking. Default 0.1 (100 ms).
	 */
	trailDelay?: number;
	/**
	 * Maximum number of samples to keep in the trailing ring buffer.
	 * Sized to cover ~1 s at 120 Hz; larger only matters if `trailDelay` is
	 * raised significantly. Default 120.
	 */
	trailBufferSize?: number;
}

interface ThirdPersonBaseDefaults {
	distance: number;
	height: number;
	shoulderOffset: number;
	targetKey: string;
	fov: number;
	paddingFactor: number;
	minDistance: number;
	trailDelay: number;
	trailBufferSize: number;
}

const DEFAULTS: ThirdPersonBaseDefaults = {
	distance: 8,
	height: 5,
	shoulderOffset: 0,
	targetKey: 'primary',
	fov: 75,
	paddingFactor: 1.5,
	minDistance: 5,
	trailDelay: 0.1,
	trailBufferSize: 120,
};

interface TrailSample {
	time: number;
	pos: Vector3;
}

/**
 * Third-person 3D perspective.
 *
 * - 0 targets: returns a static pose behind the origin.
 * - 1 target: camera positioned behind and above the target, looking at it.
 * - 2+ targets: weighted-centroid framing with dynamic distance.
 */
export class ThirdPersonPerspective implements CameraPerspective {
	readonly id = 'third-person';
	/**
	 * Slightly looser than the previous 0.15 to compose better with the
	 * trailing-delay follow: the trail absorbs short, fast moves and the
	 * damping smooths the rest.
	 */
	readonly defaults = { damping: 0.12 };

	private opts: ThirdPersonBaseDefaults;
	private initialPosition?: Vector3;
	private initialLookAt?: Vector3;

	/** Per-target ring buffers for trailing-delay sampling, keyed by target key. */
	private _trailBuffers = new Map<string, TrailSample[]>();

	constructor(options?: ThirdPersonOptions) {
		const { initialPosition, initialLookAt, ...rest } = options ?? {};
		this.opts = { ...DEFAULTS, ...rest };
		this.initialPosition = initialPosition
			? toThreeVector3(initialPosition, VEC3_ZERO)
			: undefined;
		this.initialLookAt = initialLookAt
			? toThreeVector3(initialLookAt, VEC3_ZERO)
			: undefined;
	}

	getBasePose(ctx: CameraContext): CameraPose {
		const targetKeys = Object.keys(ctx.targets);
		const primary = ctx.targets[this.opts.targetKey];

		if (targetKeys.length === 0 || !primary) {
			return this.staticPose();
		}

		if (targetKeys.length === 1) {
			return this.singleTargetPose(primary.position, ctx, this.opts.targetKey);
		}

		return this.multiTargetPose(ctx);
	}

	/**
	 * No targets: use the user-specified initial position if available,
	 * otherwise fall back to a default pose behind the origin.
	 */
	private staticPose(): CameraPose {
		if (this.initialPosition) {
			return {
				position: this.initialPosition.clone(),
				rotation: new Quaternion(),
				fov: this.opts.fov,
				zoom: 1,
				near: 0.1,
				far: 1000,
				lookAt: this.initialLookAt?.clone() ?? new Vector3(0, 0, 0),
			};
		}

		const position = new Vector3(
			this.opts.shoulderOffset,
			this.opts.height,
			this.opts.distance
		);
		return {
			position,
			rotation: new Quaternion(),
			fov: this.opts.fov,
			zoom: 1,
			near: 0.1,
			far: 1000,
			lookAt: new Vector3(0, 0, 0),
		};
	}

	/**
	 * Single target: position = trailedTarget + offset, lookAt = trailedTarget.
	 *
	 * The trailed position lags `targetPos` by `trailDelay` seconds (default
	 * 100 ms), so transient spikes in target Y (the start of a fall, jump apex)
	 * don't propagate into the camera every frame. Both `position` and
	 * `lookAt` are derived from the same trailed point so the relative offset
	 * is preserved exactly.
	 */
	private singleTargetPose(targetPos: Vector3, ctx: CameraContext, targetKey: string): CameraPose {
		const trailed = this.getTrailedPosition(targetKey, targetPos, ctx.time);
		const position = new Vector3(
			trailed.x + this.opts.shoulderOffset,
			trailed.y + this.opts.height,
			trailed.z + this.opts.distance
		);
		return {
			position,
			rotation: new Quaternion(),
			fov: this.opts.fov,
			zoom: 1,
			near: 0.1,
			far: 1000,
			lookAt: trailed.clone(),
		};
	}

	/**
	 * Multi-target: compute centroid (using trailed positions) and adjust
	 * distance to frame all targets.
	 */
	private multiTargetPose(ctx: CameraContext): CameraPose {
		const entries = Object.entries(ctx.targets);
		const trailedPositions = entries.map(
			([key, t]) => this.getTrailedPosition(key, t.position, ctx.time),
		);

		// Centroid
		const centroid = new Vector3();
		for (const pos of trailedPositions) {
			centroid.add(pos);
		}
		centroid.divideScalar(trailedPositions.length);

		// Max distance from centroid to any target
		let maxDist = 0;
		for (const pos of trailedPositions) {
			const d = centroid.distanceTo(pos);
			if (d > maxDist) maxDist = d;
		}

		const dynamicDistance = Math.max(
			maxDist * this.opts.paddingFactor,
			this.opts.minDistance
		);

		// Offset direction from the base offset
		const baseOffset = new Vector3(
			this.opts.shoulderOffset,
			this.opts.height,
			this.opts.distance
		);
		const baseLen = baseOffset.length();
		const dir = baseLen > 0 ? baseOffset.clone().normalize() : new Vector3(0, 0.5, 1).normalize();

		const position = centroid.clone().add(dir.multiplyScalar(dynamicDistance));

		// Preserve vertical ratio
		if (baseLen > 0) {
			const heightRatio = this.opts.height / baseLen;
			position.y = centroid.y + dynamicDistance * heightRatio;
		}

		return {
			position,
			rotation: new Quaternion(),
			fov: this.opts.fov,
			zoom: 1,
			near: 0.1,
			far: 1000,
			lookAt: centroid.clone(),
		};
	}

	/**
	 * Push the current target position into the per-target ring buffer and
	 * return a position interpolated at `now - trailDelay`.
	 *
	 * - When `trailDelay` is 0 the call short-circuits and returns `targetPos`
	 *   unchanged (no allocation, no buffer growth).
	 * - During the warmup window (the first `trailDelay` seconds of life)
	 *   the oldest sample is returned so the camera starts from rest rather
	 *   than snapping to the live target.
	 */
	private getTrailedPosition(
		targetKey: string,
		targetPos: Vector3,
		now: number,
	): Vector3 {
		const delay = this.opts.trailDelay;
		if (delay <= 0) {
			return targetPos;
		}

		let buffer = this._trailBuffers.get(targetKey);
		if (!buffer) {
			buffer = [];
			this._trailBuffers.set(targetKey, buffer);
		}

		buffer.push({ time: now, pos: targetPos.clone() });

		const trimBefore = now - delay - 0.05;
		while (buffer.length > 1 && buffer[0].time < trimBefore) {
			buffer.shift();
		}
		if (buffer.length > this.opts.trailBufferSize) {
			buffer.splice(0, buffer.length - this.opts.trailBufferSize);
		}

		const sampleTime = now - delay;

		// Warmup: sampleTime is older than every entry → return the oldest.
		if (buffer[0].time >= sampleTime) {
			return buffer[0].pos.clone();
		}

		// Find the two adjacent entries straddling sampleTime and lerp by time.
		for (let i = 1; i < buffer.length; i++) {
			const a = buffer[i - 1];
			const b = buffer[i];
			if (a.time <= sampleTime && sampleTime <= b.time) {
				const span = b.time - a.time;
				const t = span > 1e-6 ? (sampleTime - a.time) / span : 0;
				return new Vector3().lerpVectors(a.pos, b.pos, t);
			}
		}

		// Fallback: sampleTime is newer than every sample (shouldn't happen
		// after the push above, but be defensive).
		return buffer[buffer.length - 1].pos.clone();
	}
}
