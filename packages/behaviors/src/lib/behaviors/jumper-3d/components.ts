/**
 * Jumper 3D ECS Components
 *
 * Type definitions and factory functions for the 3D jump behavior system.
 *
 * - JumpConfig3D:  tunable parameters (stored as the capability component)
 * - JumpInput3D:   per-tick intent written by the player/AI controller
 * - JumpContext3D:  per-tick snapshot provided by the system adapter
 * - JumpState3D:   internal runtime state owned by the behavior
 */

import type { Vector3 } from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// Vec3-like interface for cross-library compatibility
// ─────────────────────────────────────────────────────────────────────────────

export interface Vec3Like {
	x: number;
	y: number;
	z: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// JumpConfig3D (capability / configuration)
// ─────────────────────────────────────────────────────────────────────────────

export interface JumpConfig3D {
	/** Desired peak height in world units */
	jumpHeight: number;
	/** Gravity magnitude (positive, e.g. 20) */
	gravity: number;
	/** Terminal fall speed magnitude (optional) */
	maxFallSpeed?: number;

	/** 1 = single jump, 2 = double, etc. */
	maxJumps: number;
	/** Reset jump counter when grounded (usually true) */
	resetJumpsOnGround: boolean;
	/** Reset jump counter on wall contact (future wall-jump support) */
	resetJumpsOnWall?: boolean;

	/** Grace period after leaving ground where first jump is still allowed (ms) */
	coyoteTimeMs: number;
	/** Queue a jump press this many ms before landing (ms) */
	jumpBufferMs: number;
	/** Optional cooldown between consecutive jumps (ms) */
	minTimeBetweenJumpsMs?: number;

	/** Variable jump height via early release */
	variableJump?: {
		enabled: boolean;
		/** Gravity multiplier applied when jump is released early while ascending */
		cutGravityMultiplier: number;
		/** Max hold duration before the cut triggers automatically (ms, optional) */
		maxHoldMs?: number;
	};

	/** Optional planar (XZ) launch / air-control overrides */
	planar?: {
		/** One-time planar speed applied at takeoff */
		launchPlanarSpeed?: number;
		/** If true, preserve current planar speed instead of replacing it */
		preservePlanarSpeed?: boolean;
		airControl?: {
			maxPlanarSpeed: number;
			/** Acceleration per second while airborne */
			acceleration: number;
			/** Deceleration per second when no input */
			deceleration: number;
		};
	};

	/** Snappier descent tuning */
	fall?: {
		/** Gravity multiplier while falling (e.g. 1.5-2.5) */
		fallGravityMultiplier: number;
		/** Additional multiplier when fast-fall input is held */
		fastFallMultiplier?: number;
	};
}

export function createJumpConfig3D(
	options: Partial<JumpConfig3D> = {},
): JumpConfig3D {
	return {
		jumpHeight: options.jumpHeight ?? 2.5,
		gravity: options.gravity ?? 20,
		maxFallSpeed: options.maxFallSpeed,
		maxJumps: options.maxJumps ?? 1,
		resetJumpsOnGround: options.resetJumpsOnGround ?? true,
		resetJumpsOnWall: options.resetJumpsOnWall,
		coyoteTimeMs: options.coyoteTimeMs ?? 100,
		jumpBufferMs: options.jumpBufferMs ?? 80,
		minTimeBetweenJumpsMs: options.minTimeBetweenJumpsMs,
		variableJump: options.variableJump,
		planar: options.planar,
		fall: options.fall,
	};
}

// ─────────────────────────────────────────────────────────────────────────────
// JumpInput3D (intent)
// Written by: Player controller, AI controller
// Read by: Jumper3DBehavior
// ─────────────────────────────────────────────────────────────────────────────

export interface JumpInput3D {
	/** True on the frame the jump button is first pressed (rising edge) */
	jumpPressed: boolean;
	/** True while the jump button is held down */
	jumpHeld: boolean;
	/** True on the frame the jump button is released (falling edge) */
	jumpReleased: boolean;
	/** Desired planar direction in world space (camera-relative), optional */
	moveDirWorld?: Vec3Like;
	/** Hold to drop faster (e.g. crouch / down input) */
	fastFall?: boolean;
}

export function createJumpInput3D(): JumpInput3D {
	return {
		jumpPressed: false,
		jumpHeld: false,
		jumpReleased: false,
		moveDirWorld: undefined,
		fastFall: false,
	};
}

// ─────────────────────────────────────────────────────────────────────────────
// JumpContext3D (per-tick snapshot from entity / controller)
// Built by the system adapter — never written to by user code.
// ─────────────────────────────────────────────────────────────────────────────

export interface JumpContext3D {
	/** Frame delta in seconds */
	dt: number;
	/** World up direction (usually 0,1,0) */
	up: Vec3Like;
	/** Current vertical (Y) velocity of the entity */
	velocityY: number;
	/** Current horizontal velocity of the entity (read from body) */
	horizontalVelocity: { x: number; z: number };
	/** Whether the entity is on the ground */
	isGrounded: boolean;
	/** Surface normal at ground contact (optional) */
	groundNormal?: Vec3Like;
	/** Time since entity was last grounded (ms) */
	timeSinceGroundedMs: number;

	/** Set only the vertical (Y) component of velocity */
	setVerticalVelocity(y: number): void;
	/** Set only the horizontal (X/Z) components of velocity */
	setHorizontalVelocity(x: number, z: number): void;
}

// ─────────────────────────────────────────────────────────────────────────────
// JumpState3D (internal runtime state)
// Owned and mutated exclusively by Jumper3DBehavior.tick()
// ─────────────────────────────────────────────────────────────────────────────

export interface JumpState3D {
	/** Number of jumps consumed since last reset */
	jumpsUsed: number;
	/** Timestamp (ms) of the most recent jump execution */
	lastJumpTimeMs: number;
	/** Remaining ms in the jump-buffer window (counts down) */
	bufferedJumpMs: number;
	/** Remaining ms in the coyote-time window (counts down) */
	coyoteMs: number;
	/** True while the entity is in a jump arc (ascending phase) */
	isJumping: boolean;
	/** Elapsed ms since jump button was first held (for variable jump) */
	jumpHoldMs: number;
	/** Whether the variable-jump cut has already been applied this jump */
	jumpCutApplied: boolean;
}

export function createJumpState3D(): JumpState3D {
	return {
		jumpsUsed: 0,
		lastJumpTimeMs: 0,
		bufferedJumpMs: 0,
		coyoteMs: 0,
		isJumping: false,
		jumpHoldMs: 0,
		jumpCutApplied: false,
	};
}
