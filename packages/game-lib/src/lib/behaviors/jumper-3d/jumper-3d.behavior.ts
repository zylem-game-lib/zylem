/**
 * Jumper 3D Behavior — Pure Jump Physics
 *
 * A stateless tick function that receives configuration, input, context, and
 * state, then applies jump physics through the context's velocity helpers.
 *
 * Vertical velocity (Y) is owned exclusively by this behavior.
 * Horizontal velocity (X/Z) is only touched when airborne planar control
 * is configured; otherwise the movement controller owns X/Z.
 */

import type {
	JumpConfig3D,
	JumpInput3D,
	JumpContext3D,
	JumpState3D,
} from './components';

/** v = sqrt(2 * g * h) */
function jumpVelocityFromHeight(gravity: number, height: number): number {
	return Math.sqrt(2 * gravity * height);
}

function planarSpeed(x: number, z: number): number {
	return Math.sqrt(x * x + z * z);
}

function normalizeMut(v: { x: number; y: number; z: number }): number {
	const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
	if (len > 1e-6) {
		v.x /= len;
		v.y /= len;
		v.z /= len;
	}
	return len;
}

export class Jumper3DBehavior {
	/**
	 * Advance the jump system by one frame.
	 *
	 * Call order within a frame:
	 *   1. Movement controller writes X/Z via transformStore.dirty.velocityX/Z.
	 *   2. `tick()` writes Y via ctx.setVerticalVelocity().
	 *      (Optionally writes X/Z when airborne planar control is active.)
	 */
	tick(
		config: JumpConfig3D,
		input: JumpInput3D,
		ctx: JumpContext3D,
		state: JumpState3D,
	): JumperTickResult {
		const dtMs = ctx.dt * 1000;
		const now = performance.now();
		let event: JumperTickEvent = JumperTickEvent.None;
		let jumpedThisFrame = false;

		// ── 1. Ground-contact bookkeeping ──────────────────────────────────
		if (ctx.isGrounded) {
			state.coyoteMs = config.coyoteTimeMs;
			if (config.resetJumpsOnGround) {
				state.jumpsUsed = 0;
			}
			if (state.isJumping) {
				state.isJumping = false;
				state.jumpCutApplied = false;
				event = JumperTickEvent.Land;
			}
		} else {
			state.coyoteMs = Math.max(0, state.coyoteMs - dtMs);
		}

		// ── 2. Jump buffer ─────────────────────────────────────────────────
		if (input.jumpPressed) {
			state.bufferedJumpMs = config.jumpBufferMs;
		} else {
			state.bufferedJumpMs = Math.max(0, state.bufferedJumpMs - dtMs);
		}

		// ── 3. Variable-jump hold tracking ─────────────────────────────────
		if (state.isJumping && input.jumpHeld) {
			state.jumpHoldMs += dtMs;
		}

		// ── 4. Jump eligibility & execution ────────────────────────────────
		const wantsJump = state.bufferedJumpMs > 0;

		const isFirstJump =
			ctx.isGrounded || (state.coyoteMs > 0 && state.jumpsUsed === 0);
		const hasAirJumps = state.jumpsUsed > 0 && state.jumpsUsed < config.maxJumps;
		const canJump = isFirstJump || hasAirJumps;

		const cooldownOk =
			config.minTimeBetweenJumpsMs == null ||
			now - state.lastJumpTimeMs >= config.minTimeBetweenJumpsMs;

		if (wantsJump && canJump && cooldownOk) {
			const vy = jumpVelocityFromHeight(config.gravity, config.jumpHeight);
			console.log('[JUMPER3D] JUMP vy =', vy.toFixed(3));

			ctx.setVerticalVelocity(vy);
			jumpedThisFrame = true;

			if (config.planar?.launchPlanarSpeed != null && !config.planar.preservePlanarSpeed) {
				const dir = input.moveDirWorld;
				if (dir && (Math.abs(dir.x) > 1e-6 || Math.abs(dir.z) > 1e-6)) {
					const d = { x: dir.x, y: 0, z: dir.z };
					normalizeMut(d);
					ctx.setHorizontalVelocity(
						d.x * config.planar.launchPlanarSpeed,
						d.z * config.planar.launchPlanarSpeed,
					);
				}
			}

			state.jumpsUsed++;
			state.lastJumpTimeMs = now;
			state.bufferedJumpMs = 0;
			state.coyoteMs = 0;
			state.isJumping = true;
			state.jumpHoldMs = 0;
			state.jumpCutApplied = false;

			event = JumperTickEvent.Jump;
		}

		// ── 5. Gravity (with variable-jump and fall multipliers) ───────────
		// Treat a jump-launch frame as airborne so we don't immediately clamp
		// the freshly applied jump velocity back to zero.
		if (!ctx.isGrounded || jumpedThisFrame) {
			let gravityMul = 1;
			const vy = ctx.velocityY;
			const isFalling = vy < 0;

			if (isFalling) {
				gravityMul = config.fall?.fallGravityMultiplier ?? 1;
				if (input.fastFall && config.fall?.fastFallMultiplier != null) {
					gravityMul *= config.fall.fastFallMultiplier;
				}
				if (event !== JumperTickEvent.Land) {
					event = JumperTickEvent.Fall;
				}
			} else if (state.isJumping) {
				const vj = config.variableJump;
				if (vj?.enabled && !state.jumpCutApplied) {
					const holdExpired =
						vj.maxHoldMs != null && state.jumpHoldMs >= vj.maxHoldMs;
					if (!input.jumpHeld || holdExpired) {
						gravityMul = vj.cutGravityMultiplier;
						state.jumpCutApplied = true;
					}
				}
			}

			let newVy = ctx.velocityY - config.gravity * gravityMul * ctx.dt;

			if (config.maxFallSpeed != null) {
				newVy = Math.max(-config.maxFallSpeed, newVy);
			}

			ctx.setVerticalVelocity(newVy);
		} else {
			// Grounded: clamp Y to 0 so the entity doesn't drift
			ctx.setVerticalVelocity(0);
		}

		// ── 6. Airborne planar control ─────────────────────────────────────
		const airCtrl = config.planar?.airControl;
		if (airCtrl && !ctx.isGrounded) {
			const dir = input.moveDirWorld;
			const hasDir = dir && (Math.abs(dir.x) > 1e-6 || Math.abs(dir.z) > 1e-6);

			let vx = ctx.horizontalVelocity.x;
			let vz = ctx.horizontalVelocity.z;

			if (hasDir) {
				const d = { x: dir!.x, y: 0, z: dir!.z };
				normalizeMut(d);

				vx += d.x * airCtrl.acceleration * ctx.dt;
				vz += d.z * airCtrl.acceleration * ctx.dt;

				const speed = Math.sqrt(vx * vx + vz * vz);
				if (speed > airCtrl.maxPlanarSpeed) {
					const scale = airCtrl.maxPlanarSpeed / speed;
					vx *= scale;
					vz *= scale;
				}
			} else {
				const speed = planarSpeed(vx, vz);
				if (speed > 1e-6) {
					const decel = Math.min(airCtrl.deceleration * ctx.dt, speed);
					const scale = (speed - decel) / speed;
					vx *= scale;
					vz *= scale;
				}
			}

			ctx.setHorizontalVelocity(vx, vz);
		}

		return { event };
	}
}

/** Events emitted by a single tick (used by FSM). */
export enum JumperTickEvent {
	None = 'none',
	Jump = 'jump',
	Fall = 'fall',
	Land = 'land',
}

export interface JumperTickResult {
	event: JumperTickEvent;
}
