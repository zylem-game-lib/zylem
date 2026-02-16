import { Vector3, Quaternion } from 'three';

/**
 * Represents a full camera pose: position, rotation, projection params, and optional lookAt.
 * This is the canonical data structure that flows through the camera pipeline.
 */
export interface CameraPose {
	position: Vector3;
	rotation: Quaternion;
	fov?: number;
	zoom?: number;
	near?: number;
	far?: number;
	/** When set, the camera orients to look at this point (takes priority over rotation). */
	lookAt?: Vector3;
}

/**
 * An additive delta applied on top of a CameraPose.
 * Used by CameraActions to apply transient offsets (shake, recoil, etc.).
 */
export interface PoseDelta {
	position?: Vector3;
	rotation?: Quaternion;
	fov?: number;
	zoom?: number;
}

/**
 * Minimal transform representation for pipeline targets.
 */
export interface TransformLike {
	position: Vector3;
	rotation?: Quaternion;
}

/**
 * Per-frame context passed to every pipeline module (perspectives, behaviors, actions).
 */
export interface CameraContext {
	/** Frame delta time in seconds. */
	dt: number;
	/** Elapsed time in seconds since camera started updating. */
	time: number;
	/** Current viewport dimensions and aspect ratio. */
	viewport: { width: number; height: number; aspect: number };
	/** Named targets the camera can track. 'primary' is targets[0] by convention. */
	targets: Record<string, TransformLike>;
}

/**
 * A perspective produces the base camera pose each frame.
 * Exactly one perspective is active per camera at a time.
 */
export interface CameraPerspective {
	id: string;
	/** Compute the raw desired pose for this frame given the current context. */
	getBasePose(ctx: CameraContext): CameraPose;
	/** Optional defaults for smoothing and other pipeline settings. */
	defaults?: { damping?: number };
}

/**
 * Behaviors modify the desired pose each frame.
 * They are keyed by name (idempotent add) and sorted by priority.
 */
export interface CameraBehavior {
	/** Receive current context and pose, return a modified pose. */
	update(ctx: CameraContext, pose: CameraPose): CameraPose;
	/** Called when the behavior is attached to the pipeline. */
	onAttach?(ctx: CameraContext): void;
	/** Called when the behavior is removed from the pipeline. */
	onDetach?(ctx: CameraContext): void;
	/** Sort order: lower runs first. Default 0. */
	priority?: number;
	/** When false, the behavior is skipped during the pipeline run. */
	enabled?: boolean;
}

/**
 * Actions are transient effects that apply additive deltas (screenshake, recoil, etc.).
 * They self-expire when isDone() returns true and are automatically removed.
 */
export interface CameraAction {
	/** Return the additive delta for this frame. */
	update(ctx: CameraContext): PoseDelta;
	/** Return true when the action has completed and should be removed. */
	isDone(ctx: CameraContext): boolean;
	/** Sort order for action application. Default 0. */
	priority?: number;
}

/**
 * Debug snapshot returned by pipeline.getState().
 */
export interface CameraPipelineState {
	perspectiveId: string | null;
	desiredPose: CameraPose | null;
	finalPose: CameraPose | null;
	activeBehaviors: string[];
	activeActionCount: number;
}
