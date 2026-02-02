/**
 * Platformer 3D ECS Components
 * 
 * Components for 3D platformer movement system including walking, running,
 * jumping with multi-jump support, and falling/landing states.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Platformer3DMovementComponent (capability / configuration)
// Defines the movement capabilities and physics parameters
// ─────────────────────────────────────────────────────────────────────────────

export interface Platformer3DMovementComponent {
	/** Base walking speed */
	walkSpeed: number;
	/** Sprint/run speed */
	runSpeed: number;
	/** Initial jump force/velocity */
	jumpForce: number;
	/** Maximum number of jumps (1 = single jump, 2 = double jump, etc.) */
	maxJumps: number;
	/** Gravity force (optional override) */
	gravity: number;
	/** Ray length for ground detection */
	groundRayLength: number;
	/** Coyote time in seconds (grace period after leaving ground) */
	coyoteTime: number;
	/** Jump buffer time in seconds (queue jump input before landing) */
	jumpBufferTime: number;
	/** Velocity multiplier when releasing jump button early (0-1) */
	jumpCutMultiplier: number;
}

export function createPlatformer3DMovementComponent(
	options: Partial<Platformer3DMovementComponent> = {}
): Platformer3DMovementComponent {
	return {
		walkSpeed: options.walkSpeed ?? 12,
		runSpeed: options.runSpeed ?? 24,
		jumpForce: options.jumpForce ?? 12,
		maxJumps: options.maxJumps ?? 1,
		gravity: options.gravity ?? 9.82,
		groundRayLength: options.groundRayLength ?? 1.0,
		coyoteTime: options.coyoteTime ?? 0.1,
		jumpBufferTime: options.jumpBufferTime ?? 0.1,
		jumpCutMultiplier: options.jumpCutMultiplier ?? 0.5,
	};
}

// ─────────────────────────────────────────────────────────────────────────────
// Platformer3DInputComponent (intent)
// Written by: Player controller, AI controller
// Read by: Platformer3DBehavior
// ─────────────────────────────────────────────────────────────────────────────

export interface Platformer3DInputComponent {
	/** Horizontal movement input (-1 to 1) */
	moveX: number;
	/** Forward/backward movement input (-1 to 1) */
	moveZ: number;
	/** Jump button pressed */
	jump: boolean;
	/** Run/sprint button held */
	run: boolean;
}

export function createPlatformer3DInputComponent(): Platformer3DInputComponent {
	return {
		moveX: 0,
		moveZ: 0,
		jump: false,
		run: false,
	};
}

// ─────────────────────────────────────────────────────────────────────────────
// Platformer3DStateComponent (runtime state)
// Tracks the current state of the platformer entity
// ─────────────────────────────────────────────────────────────────────────────

export interface Platformer3DStateComponent {
	/** Is the entity on the ground */
	grounded: boolean;
	/** Is currently in a jump arc */
	jumping: boolean;
	/** Is falling (not jumping) */
	falling: boolean;
	/** Current jump count (for multi-jump) */
	jumpCount: number;
	/** Y position when jump started */
	jumpStartHeight: number;
	/** Current movement speed being applied */
	currentSpeed: number;
	/** Last known ground Y position */
	lastGroundedY: number;
	/** Was jump button pressed last frame (for edge detection) */
	jumpPressedLastFrame: boolean;
	
	// -- New fields --
	/** Is currently colliding with ground (from physics collision callback) */
	collisionGrounded: boolean;
	/** Timestamp of last ground collision */
	groundedCollisionTime: number;
	/** Time in seconds since last grounded */
	timeSinceGrounded: number;
	/** Is a jump allowed due to buffer? */
	jumpBuffered: boolean;
	/** Time remaining in jump buffer */
	jumpBufferTimer: number;
	/** Is jump button currently held */
	jumpHeld: boolean;
	/** Has the jump cut been applied for this jump? */
	jumpCutApplied: boolean;
}

export function createPlatformer3DStateComponent(): Platformer3DStateComponent {
	return {
		grounded: false,
		jumping: false,
		falling: false,
		jumpCount: 0,
		jumpStartHeight: 0,
		currentSpeed: 0,
		lastGroundedY: 0,
		jumpPressedLastFrame: false,
		collisionGrounded: false,
		groundedCollisionTime: 0,
		timeSinceGrounded: 0,
		jumpBuffered: false,
		jumpBufferTimer: 0,
		jumpHeld: false,
		jumpCutApplied: false,
	};
}
