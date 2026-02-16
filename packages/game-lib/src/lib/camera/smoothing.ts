import { Vector3, Quaternion, MathUtils } from 'three';
import type { CameraPose, PoseDelta } from './types';

/**
 * Create a default camera pose at the origin facing forward.
 */
export function defaultPose(): CameraPose {
	return {
		position: new Vector3(0, 0, 10),
		rotation: new Quaternion(),
		fov: 75,
		zoom: 1,
		near: 0.1,
		far: 1000,
	};
}

/**
 * Deep-clone a CameraPose so mutations don't leak between pipeline stages.
 */
export function clonePose(pose: CameraPose): CameraPose {
	return {
		position: pose.position.clone(),
		rotation: pose.rotation.clone(),
		fov: pose.fov,
		zoom: pose.zoom,
		near: pose.near,
		far: pose.far,
		lookAt: pose.lookAt?.clone(),
	};
}

/**
 * Apply an additive PoseDelta on top of a CameraPose.
 * - Position: vector addition
 * - Rotation: quaternion multiplication (compose)
 * - FOV/Zoom: scalar addition
 *
 * Returns a new CameraPose (does not mutate the input).
 */
export function applyDelta(pose: CameraPose, delta: PoseDelta): CameraPose {
	const result = clonePose(pose);

	if (delta.position) {
		result.position.add(delta.position);
	}
	if (delta.rotation) {
		result.rotation.multiply(delta.rotation);
	}
	if (delta.fov != null && result.fov != null) {
		result.fov += delta.fov;
	}
	if (delta.zoom != null && result.zoom != null) {
		result.zoom += delta.zoom;
	}

	return result;
}

/**
 * Interpolate from `current` pose toward `target` pose using frame-rate-independent damping.
 *
 * @param current  The current (smoothed) pose from the previous frame.
 * @param target   The desired pose for this frame.
 * @param damping  Smoothing factor in 0-1 range. 1 = instant snap, 0 = no movement.
 * @param dt       Frame delta time in seconds.
 * @returns A new CameraPose interpolated between current and target.
 */
export function smoothPose(current: CameraPose, target: CameraPose, damping: number, dt: number): CameraPose {
	const t = 1 - Math.pow(1 - MathUtils.clamp(damping, 0, 1), dt * 60);

	const result = clonePose(current);

	result.position.lerp(target.position, t);
	result.rotation.slerp(target.rotation, t);

	if (target.fov != null && result.fov != null) {
		result.fov = MathUtils.lerp(result.fov, target.fov, t);
	}
	if (target.zoom != null && result.zoom != null) {
		result.zoom = MathUtils.lerp(result.zoom, target.zoom, t);
	}
	if (target.near != null) {
		result.near = target.near;
	}
	if (target.far != null) {
		result.far = target.far;
	}

	// Preserve lookAt from target (smoothing is on position/rotation, not lookAt)
	result.lookAt = target.lookAt?.clone();

	return result;
}
