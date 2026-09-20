import { Vector3 } from 'three';
import type { CameraBehavior, CameraContext, CameraPose } from '../camera/types';
import type { EvaluatedPose } from './cutscene-math';

/** Pipeline key the cutscene player registers its behavior under. */
export const CUTSCENE_BEHAVIOR_KEY = 'cutscene';

/**
 * Camera behavior that hands the pipeline a fixed pose each frame while a
 * cutscene is playing. It runs after the game's own behaviors (high
 * priority) so shots override follow/look-at logic, and it disables itself
 * when the player has no pose (no active shot) so gameplay framing resumes.
 *
 * `damping` applies optional per-frame smoothing for follow cameras; the
 * player passes 0 for authored moves so keyframes land exactly.
 */
export class CutsceneCameraBehavior implements CameraBehavior {
	priority = 1000;
	enabled = false;

	private target: EvaluatedPose | null = null;
	private smoothed: { position: Vector3; lookAt: Vector3 } | null = null;
	private damping = 0;

	/** Sets the pose to show; `null` releases the camera back to gameplay. */
	setPose(pose: EvaluatedPose | null, damping = 0): void {
		this.target = pose;
		this.damping = damping;
		this.enabled = pose !== null;
		if (!pose) this.smoothed = null;
	}

	/** Snap smoothing state so the next frame lands exactly on the pose (seeks, cuts). */
	snap(): void {
		this.smoothed = null;
	}

	onDetach(): void {
		this.smoothed = null;
	}

	update(ctx: CameraContext, pose: CameraPose): CameraPose {
		const target = this.target;
		if (!target) return pose;
		const position = new Vector3(target.position.x, target.position.y, target.position.z);
		const lookAt = new Vector3(target.lookAt.x, target.lookAt.y, target.lookAt.z);
		if (this.damping > 0 && this.smoothed) {
			// Frame-rate independent exponential smoothing: `damping` is the
			// fraction of the remaining distance kept after one second-ish.
			const rate = 1 - Math.pow(this.damping, ctx.dt * 60);
			this.smoothed.position.lerp(position, rate);
			this.smoothed.lookAt.lerp(lookAt, rate);
		} else {
			this.smoothed = { position: position.clone(), lookAt: lookAt.clone() };
		}
		return {
			...pose,
			position: this.smoothed.position.clone(),
			lookAt: this.smoothed.lookAt.clone(),
			fov: target.fov,
		};
	}
}
