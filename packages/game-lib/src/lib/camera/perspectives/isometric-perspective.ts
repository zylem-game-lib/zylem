import { Quaternion, Vector3 } from 'three';
import type { CameraContext, CameraPerspective, CameraPose } from '../types';
import { Vec3Input, toThreeVector3 } from '../../core/vector';

/**
 * Configuration for the isometric perspective.
 * The offset is world-locked along (1, 1, 1): yaw 45°, elevation atan(√2).
 */
export interface IsometricOptions {
	/** Distance from the target along the isometric axis. Default 10. */
	distance?: number;
	/** Orthographic frustum size. Default 10. */
	zoom?: number;
	/** Key in CameraContext.targets to frame. Default 'primary'. */
	targetKey?: string;
	/** Fallback camera position when no target exists. */
	initialPosition?: Vec3Input;
	/** Fallback lookAt point when no target exists. */
	initialLookAt?: Vec3Input;
}

interface IsometricDefaults {
	distance: number;
	zoom: number;
	targetKey: string;
}

const DEFAULTS: IsometricDefaults = {
	distance: 10,
	zoom: 10,
	targetKey: 'primary',
};

/** Unit offset. Each component is 1/√3, so a distance of √3 lands on (1, 1, 1). */
const ISO_AXIS = new Vector3(1, 1, 1).normalize();

/**
 * Orthographic isometric perspective.
 *
 * The view direction stays locked in world space, so the target can move
 * without the camera orbiting around it. Player look input is not accepted.
 */
export class IsometricPerspective implements CameraPerspective {
	readonly id = 'isometric';
	readonly projection = 'orthographic' as const;
	readonly defaults = { damping: 1 };

	private opts: IsometricDefaults;
	private initialPosition?: Vector3;
	private initialLookAt?: Vector3;

	constructor(options?: IsometricOptions) {
		const { initialPosition, initialLookAt, ...rest } = options ?? {};
		this.opts = { ...DEFAULTS, ...rest };
		this.initialPosition = initialPosition ? toThreeVector3(initialPosition) : undefined;
		this.initialLookAt = initialLookAt ? toThreeVector3(initialLookAt) : undefined;
	}

	getBasePose(ctx: CameraContext): CameraPose {
		const target = ctx.targets[this.opts.targetKey];
		if (!target) return this.staticPose();

		const lookAt = target.position.clone();
		const position = lookAt.clone().addScaledVector(ISO_AXIS, this.opts.distance);
		return this.pose(position, lookAt);
	}

	private staticPose(): CameraPose {
		if (this.initialPosition) {
			return this.pose(
				this.initialPosition.clone(),
				this.initialLookAt?.clone() ?? new Vector3(0, 0, 0),
			);
		}
		return this.pose(
			ISO_AXIS.clone().multiplyScalar(this.opts.distance),
			new Vector3(0, 0, 0),
		);
	}

	private pose(position: Vector3, lookAt: Vector3): CameraPose {
		return {
			position,
			rotation: new Quaternion(),
			zoom: this.opts.zoom,
			near: 1,
			far: 1000,
			lookAt,
		};
	}
}
