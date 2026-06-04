export interface JumpConfig2D {
	jumpHeight: number;
	gravity: number;
	maxFallSpeed?: number;
	maxJumps: number;
	resetJumpsOnGround: boolean;
	coyoteTimeMs: number;
	jumpBufferMs: number;
	minTimeBetweenJumpsMs?: number;
	variableJump?: {
		enabled: boolean;
		cutGravityMultiplier: number;
		maxHoldMs?: number;
	};
}

export function createJumpConfig2D(
	options: Partial<JumpConfig2D> = {},
): JumpConfig2D {
	return {
		jumpHeight: options.jumpHeight ?? 2.5,
		gravity: options.gravity ?? 20,
		maxFallSpeed: options.maxFallSpeed,
		maxJumps: options.maxJumps ?? 1,
		resetJumpsOnGround: options.resetJumpsOnGround ?? true,
		coyoteTimeMs: options.coyoteTimeMs ?? 100,
		jumpBufferMs: options.jumpBufferMs ?? 80,
		minTimeBetweenJumpsMs: options.minTimeBetweenJumpsMs,
		variableJump: options.variableJump,
	};
}

export interface JumpInput2D {
	jumpPressed: boolean;
	jumpHeld: boolean;
	jumpReleased: boolean;
	fastFall?: boolean;
}

export function createJumpInput2D(): JumpInput2D {
	return {
		jumpPressed: false,
		jumpHeld: false,
		jumpReleased: false,
		fastFall: false,
	};
}

export interface JumpContext2D {
	dt: number;
	velocityY: number;
	isGrounded: boolean;
	timeSinceGroundedMs: number;
	setVerticalVelocity(y: number): void;
}

export interface JumpState2D {
	jumpsUsed: number;
	lastJumpTimeMs: number;
	bufferedJumpMs: number;
	coyoteMs: number;
	isJumping: boolean;
	jumpHoldMs: number;
	jumpCutApplied: boolean;
}

export function createJumpState2D(): JumpState2D {
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
