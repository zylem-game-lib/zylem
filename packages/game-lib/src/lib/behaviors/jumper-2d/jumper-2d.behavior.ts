import type {
	JumpConfig2D,
	JumpContext2D,
	JumpInput2D,
	JumpState2D,
} from './components';

function jumpVelocityFromHeight(gravity: number, height: number): number {
	return Math.sqrt(2 * gravity * height);
}

export enum Jumper2DTickEvent {
	None = 'none',
	Jump = 'jump',
	Fall = 'fall',
	Land = 'land',
}

export interface Jumper2DTickResult {
	event: Jumper2DTickEvent;
}

export class Jumper2DBehavior {
	tick(
		config: JumpConfig2D,
		input: JumpInput2D,
		ctx: JumpContext2D,
		state: JumpState2D,
	): Jumper2DTickResult {
		const dtMs = ctx.dt * 1000;
		const now = performance.now();
		let event = Jumper2DTickEvent.None;
		let jumpedThisFrame = false;

		if (ctx.isGrounded) {
			state.coyoteMs = config.coyoteTimeMs;
			if (config.resetJumpsOnGround) {
				state.jumpsUsed = 0;
			}
			if (state.isJumping) {
				state.isJumping = false;
				state.jumpCutApplied = false;
				event = Jumper2DTickEvent.Land;
			}
		} else {
			state.coyoteMs = Math.max(0, state.coyoteMs - dtMs);
		}

		if (input.jumpPressed) {
			state.bufferedJumpMs = config.jumpBufferMs;
		} else {
			state.bufferedJumpMs = Math.max(0, state.bufferedJumpMs - dtMs);
		}

		if (state.isJumping && input.jumpHeld) {
			state.jumpHoldMs += dtMs;
		}

		const wantsJump = state.bufferedJumpMs > 0;
		const isFirstJump =
			ctx.isGrounded || (state.coyoteMs > 0 && state.jumpsUsed === 0);
		const hasAirJumps = state.jumpsUsed > 0 && state.jumpsUsed < config.maxJumps;
		const canJump = isFirstJump || hasAirJumps;
		const cooldownOk =
			config.minTimeBetweenJumpsMs == null ||
			now - state.lastJumpTimeMs >= config.minTimeBetweenJumpsMs;

		if (wantsJump && canJump && cooldownOk) {
			ctx.setVerticalVelocity(jumpVelocityFromHeight(config.gravity, config.jumpHeight));
			jumpedThisFrame = true;
			state.jumpsUsed++;
			state.lastJumpTimeMs = now;
			state.bufferedJumpMs = 0;
			state.coyoteMs = 0;
			state.isJumping = true;
			state.jumpHoldMs = 0;
			state.jumpCutApplied = false;
			event = Jumper2DTickEvent.Jump;
		}

		if (!ctx.isGrounded || jumpedThisFrame) {
			let gravityMul = 1;
			const isFalling = ctx.velocityY < 0;

			if (isFalling) {
				gravityMul = input.fastFall ? 1.75 : 1;
				if (event !== Jumper2DTickEvent.Land) {
					event = Jumper2DTickEvent.Fall;
				}
			} else if (state.isJumping) {
				const variableJump = config.variableJump;
				if (variableJump?.enabled && !state.jumpCutApplied) {
					const holdExpired =
						variableJump.maxHoldMs != null &&
						state.jumpHoldMs >= variableJump.maxHoldMs;
					if (!input.jumpHeld || holdExpired) {
						gravityMul = variableJump.cutGravityMultiplier;
						state.jumpCutApplied = true;
					}
				}
			}

			let newVelocityY = ctx.velocityY - config.gravity * gravityMul * ctx.dt;
			if (config.maxFallSpeed != null) {
				newVelocityY = Math.max(-config.maxFallSpeed, newVelocityY);
			}
			ctx.setVerticalVelocity(newVelocityY);
		} else {
			ctx.setVerticalVelocity(0);
		}

		return { event };
	}
}
