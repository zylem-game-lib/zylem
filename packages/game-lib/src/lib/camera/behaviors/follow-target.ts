import { Vector3 } from 'three';
import type { CameraBehavior, CameraContext, CameraPose } from '../types';
import { clonePose } from '../smoothing';

/**
 * Options for the followTarget behavior.
 */
export interface FollowTargetOptions {
	/** Key in CameraContext.targets to follow. Default 'primary'. */
	targetKey?: string;
	/** Position offset from the target. Default (0, 0, 0). */
	offset?: Vector3;
	/**
	 * Per-frame interpolation factor (0-1). Controls how quickly the
	 * pose converges on the target each frame.
	 * 1 = instant snap, lower = smoother follow.
	 * Default 0.1.
	 */
	lerpFactor?: number;
}

const DEFAULTS: Required<FollowTargetOptions> = {
	targetKey: 'primary',
	offset: new Vector3(0, 0, 0),
	lerpFactor: 0.1,
};

/**
 * A simple follow behavior that moves the camera pose toward a target's position + offset.
 *
 * This behavior modifies only the position (and lookAt) of the incoming pose,
 * leaving rotation/fov/zoom to the perspective or other behaviors.
 *
 * @example
 * ```ts
 * camera.addBehavior('follow', createFollowTarget({ targetKey: 'player', offset: new Vector3(0, 3, 8) }));
 * ```
 */
export function createFollowTarget(options?: FollowTargetOptions): CameraBehavior {
	const opts = { ...DEFAULTS, ...options };

	// Internal state for smooth interpolation
	let currentPos: Vector3 | null = null;

	return {
		priority: 0,
		enabled: true,

		onAttach() {
			currentPos = null;
		},

		update(ctx: CameraContext, pose: CameraPose): CameraPose {
			const target = ctx.targets[opts.targetKey];
			if (!target) return pose;

			const desiredPos = target.position.clone().add(opts.offset);
			const result = clonePose(pose);

			if (!currentPos) {
				currentPos = desiredPos.clone();
			} else {
				currentPos.lerp(desiredPos, opts.lerpFactor);
			}

			result.position.copy(currentPos);
			result.lookAt = target.position.clone();

			return result;
		},

		onDetach() {
			currentPos = null;
		},
	};
}
