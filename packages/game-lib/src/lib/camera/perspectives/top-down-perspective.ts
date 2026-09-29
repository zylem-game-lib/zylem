import { Quaternion, Vector3 } from 'three';
import type { CameraContext, CameraPerspective, CameraPose } from '../types';
import { Vec3Input, toThreeVector3 } from '../../core/vector';

/**
 * Configuration for the top-down perspective.
 * The camera sits above the target and looks straight down at the XZ plane.
 */
export interface TopDownOptions {
	/** Height above the target, in world units. Default 10. */
	height?: number;
	/** Orthographic frustum size. Default 10. */
	zoom?: number;
	/** Key in CameraContext.targets to frame. Default 'primary'. */
	targetKey?: string;
	/** Fallback camera position when no target exists. */
	initialPosition?: Vec3Input;
	/** Fallback lookAt point when no target exists. */
	initialLookAt?: Vec3Input;
}

interface TopDownDefaults {
	height: number;
	zoom: number;
	targetKey: string;
}

const DEFAULTS: TopDownDefaults = {
	height: 10,
	zoom: 10,
	targetKey: 'primary',
};

/**
 * Orthographic top-down perspective.
 *
 * Rotation is locked to world -Y. The camera follows the target's XZ and
 * stays `height` above it. Player look input is not accepted.
 */
export class TopDownPerspective implements CameraPerspective {
	readonly id = 'top-down';
	readonly projection = 'orthographic' as const;
	readonly defaults = { damping: 1 };

	private opts: TopDownDefaults;
	private initialPosition?: Vector3;
	private initialLookAt?: Vector3;

	constructor(options?: TopDownOptions) {
		const { initialPosition, initialLookAt, ...rest } = options ?? {};
		this.opts = { ...DEFAULTS, ...rest };
		this.initialPosition = initialPosition ? toThreeVector3(initialPosition) : undefined;
		this.initialLookAt = initialLookAt ? toThreeVector3(initialLookAt) : undefined;
	}

	getBasePose(ctx: CameraContext): CameraPose {
		const target = ctx.targets[this.opts.targetKey];
		if (!target) return this.staticPose();

		const lookAt = target.position.clone();
		return this.pose(
			new Vector3(lookAt.x, lookAt.y + this.opts.height, lookAt.z),
			lookAt,
		);
	}

	private staticPose(): CameraPose {
		if (this.initialPosition) {
			const lookAt = this.initialLookAt?.clone() ?? new Vector3(
				this.initialPosition.x,
				this.initialPosition.y - this.opts.height,
				this.initialPosition.z,
			);
			return this.pose(this.initialPosition.clone(), lookAt);
		}
		return this.pose(
			new Vector3(0, this.opts.height, 0),
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
