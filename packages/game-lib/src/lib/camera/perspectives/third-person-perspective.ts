import { Vector3, Quaternion } from 'three';
import type { CameraPerspective, CameraContext, CameraPose } from '../types';

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
	initialPosition?: Vector3;
	/** Fallback lookAt point when no targets exist. */
	initialLookAt?: Vector3;
}

interface ThirdPersonBaseDefaults {
	distance: number;
	height: number;
	shoulderOffset: number;
	targetKey: string;
	fov: number;
	paddingFactor: number;
	minDistance: number;
}

const DEFAULTS: ThirdPersonBaseDefaults = {
	distance: 8,
	height: 5,
	shoulderOffset: 0,
	targetKey: 'primary',
	fov: 75,
	paddingFactor: 1.5,
	minDistance: 5,
};

/**
 * Third-person 3D perspective.
 *
 * - 0 targets: returns a static pose behind the origin.
 * - 1 target: camera positioned behind and above the target, looking at it.
 * - 2+ targets: weighted-centroid framing with dynamic distance.
 */
export class ThirdPersonPerspective implements CameraPerspective {
	readonly id = 'third-person';
	readonly defaults = { damping: 0.15 };

	private opts: ThirdPersonBaseDefaults;
	private initialPosition?: Vector3;
	private initialLookAt?: Vector3;

	constructor(options?: ThirdPersonOptions) {
		const { initialPosition, initialLookAt, ...rest } = options ?? {};
		this.opts = { ...DEFAULTS, ...rest };
		this.initialPosition = initialPosition;
		this.initialLookAt = initialLookAt;
	}

	getBasePose(ctx: CameraContext): CameraPose {
		const targetKeys = Object.keys(ctx.targets);
		const primary = ctx.targets[this.opts.targetKey];

		if (targetKeys.length === 0 || !primary) {
			return this.staticPose();
		}

		if (targetKeys.length === 1) {
			return this.singleTargetPose(primary.position);
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
	 * Single target: position = target + offset, lookAt = target.
	 */
	private singleTargetPose(targetPos: Vector3): CameraPose {
		const position = new Vector3(
			targetPos.x + this.opts.shoulderOffset,
			targetPos.y + this.opts.height,
			targetPos.z + this.opts.distance
		);
		return {
			position,
			rotation: new Quaternion(),
			fov: this.opts.fov,
			zoom: 1,
			near: 0.1,
			far: 1000,
			lookAt: targetPos.clone(),
		};
	}

	/**
	 * Multi-target: compute centroid and adjust distance to frame all targets.
	 */
	private multiTargetPose(ctx: CameraContext): CameraPose {
		const targets = Object.values(ctx.targets);

		// Centroid
		const centroid = new Vector3();
		for (const t of targets) {
			centroid.add(t.position);
		}
		centroid.divideScalar(targets.length);

		// Max distance from centroid to any target
		let maxDist = 0;
		for (const t of targets) {
			const d = centroid.distanceTo(t.position);
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
}
