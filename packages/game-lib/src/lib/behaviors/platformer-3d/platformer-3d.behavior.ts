/**
 * Platformer 3D Behavior System
 * 
 * Handles 3D platformer physics including:
 * - Ground detection via raycasting
 * - Horizontal movement (walk/run)
 * - Jumping with multi-jump support
 * - Gravity application
 * - State synchronization with FSM
 */

import { GroundProbe3D, getGroundAnchorOffsetY } from '../shared/ground-probe-3d';
import type {
	Platformer3DMovementComponent,
	Platformer3DInputComponent,
	Platformer3DStateComponent,
} from './components';

/**
 * Duration of the jump-cut velocity ramp in seconds.
 * Instead of halving velocity.y in a single frame (which produces a visible
 * camera pop), we lerp toward the cut velocity across roughly 3 physics steps
 * at 60 Hz. Short enough to still feel responsive, long enough to be smooth.
 */
const JUMP_CUT_RAMP_DURATION = 0.05;

/**
 * Hysteresis window for the grounded state (seconds).
 *
 * When the ground probe misses for a frame but we were grounded the previous
 * frame, remain grounded for this brief window before flipping to airborne.
 * Prevents rapid grounded/airborne toggling at platform edges where a single
 * corner ray may miss intermittently, and absorbs sub-step probe noise.
 */
const GROUNDED_GRACE_WINDOW = 0.06;

/**
 * Entity with platformer components
 */
export interface Platformer3DEntity {
	uuid: string;
	body: any; // RigidBody
	platformer: Platformer3DMovementComponent;
	$platformer: Platformer3DInputComponent;
	platformerState: Platformer3DStateComponent;
	transformStore?: any;
}

/**
 * Platformer 3D Movement Behavior
 * 
 * Core physics system for 3D platformer movement
 */
export class Platformer3DBehavior {
	private world: any;
	private scene: any;
	private groundProbe: GroundProbe3D;

	constructor(world: any, scene: any) {
		this.world = world;
		this.scene = scene;
		this.groundProbe = new GroundProbe3D(world);
	}

	/**
	 * Apply horizontal movement based on input.
	 *
	 * Only writes X/Z axes — Y is left untouched so Rapier's contact resolution
	 * can damp vertical motion correctly while grounded. Jump and gravity are
	 * the sole writers of Y velocity (see handleJump / applyGravity).
	 */
	private applyMovement(entity: Platformer3DEntity, delta: number): void {
		const input = entity.$platformer;
		const movement = entity.platformer;
		const state = entity.platformerState;

		const speed = input.run ? movement.runSpeed : movement.walkSpeed;
		state.currentSpeed = speed;

		const moveX = input.moveX * speed;
		const moveZ = input.moveZ * speed;

		entity.transformStore.velocity.x = moveX;
		entity.transformStore.velocity.z = moveZ;
		entity.transformStore.dirty.velocityX = true;
		entity.transformStore.dirty.velocityZ = true;
	}

	/**
	 * Handle jump logic with multi-jump, coyote time, buffering, and jump-cut ramp.
	 */
	private handleJump(entity: Platformer3DEntity, delta: number): void {
		const input = entity.$platformer;
		const movement = entity.platformer;
		const state = entity.platformerState;

		// Track time since last jump (for multi-jump window)
		if (state.jumping || state.falling) {
			state.timeSinceJump += delta;
		}

		// Track jump button release (required for multi-jump)
		if (!input.jump && state.jumpHeld) {
			state.jumpReleasedSinceLastJump = true;
		}

		// 1. Jump Buffering - queue on new press
		if (input.jump && !state.jumpPressedLastFrame) {
			state.jumpBuffered = true;
			state.jumpBufferTimer = movement.jumpBufferTime;
		}
		
		state.jumpPressedLastFrame = input.jump;
		state.jumpHeld = input.jump;

		// Decrement buffer timer
		if (state.jumpBuffered) {
			state.jumpBufferTimer -= delta;
			if (state.jumpBufferTimer <= 0) {
				state.jumpBuffered = false;
			}
		}

		// 2. Variable Jump Height (Jump Cut)
		// Only trigger a cut if we've been jumping for a bit (prevents cutting multi-jump immediately).
		const minTimeBeforeCut = 0.1;
		const canApplyCut = state.timeSinceJump >= minTimeBeforeCut;
		if (!input.jump && state.jumping && !state.jumpCutApplied && canApplyCut) {
			state.jumpCutApplied = true;
			state.jumpCutRampTimer = JUMP_CUT_RAMP_DURATION;
		}

		// 2a. Ramp velocity.y toward velocity.y * jumpCutMultiplier across the
		// ramp window so the change isn't a single-frame discontinuity.
		if (state.jumpCutRampTimer > 0) {
			const velocity = entity.body.linvel();
			if (velocity.y > 0) {
				const stepT = Math.min(delta / state.jumpCutRampTimer, 1);
				const targetY = velocity.y * movement.jumpCutMultiplier;
				entity.transformStore.velocity.y = velocity.y + (targetY - velocity.y) * stepT;
				entity.transformStore.dirty.velocityY = true;
			}
			state.jumpCutRampTimer = Math.max(0, state.jumpCutRampTimer - delta);
		}

		// Execute Jump (if buffered input exists)
		if (!state.jumpBuffered) return;

		// 3. Jump eligibility check
		const inCoyoteWindow = !state.grounded && state.timeSinceGrounded <= movement.coyoteTime;
		const isFirstJump = state.grounded || (inCoyoteWindow && state.jumpCount === 0);
		
		// Multi-jump requirements:
		// 1. Not grounded
		// 2. Have jumps remaining
		// 3. Button was released since last jump (no holding for double jump)
		// 4. Within the jump window (after multiJumpWindowTime has passed)
		const hasJumpsRemaining = state.jumpCount < movement.maxJumps;
		const buttonReleased = state.jumpReleasedSinceLastJump;
		const inMultiJumpWindow = state.timeSinceJump >= movement.multiJumpWindowTime;
		const canMultiJump = !state.grounded && hasJumpsRemaining && buttonReleased && inMultiJumpWindow;

		if (isFirstJump || canMultiJump) {
			// Consume buffered input
			state.jumpBuffered = false;

			// Increment jump count and reset tracking
			state.jumpCount++;
			state.jumpReleasedSinceLastJump = false; // Must release again for next jump
			state.timeSinceJump = 0; // Reset window timer

			// Record jump start height
			state.jumpStartHeight = entity.body.translation().y;

			// Apply jump force
			state.jumping = true;
			state.falling = false;
			state.jumpCutApplied = false;
			state.jumpCutRampTimer = 0;
			state.groundedGraceTimer = 0;

			// Apply jump force via transform store (Y-axis only)
			entity.transformStore.velocity.y = movement.jumpForce;
			entity.transformStore.dirty.velocityY = true;

			// Flag this frame so applyGravity skips exactly one gravity step
			// (the jump impulse we just wrote is the authoritative Y velocity).
			state.jumpedThisFrame = true;
		}
	}

	/**
	 * Apply gravity when not grounded.
	 *
	 * Skipped on the single frame immediately after a jump impulse is applied
	 * (tracked via `state.jumpedThisFrame`) so gravity never overwrites a
	 * just-applied jump velocity. The flag is cleared here regardless, so it
	 * only suppresses exactly one gravity step — independent of frame rate.
	 */
	private applyGravity(entity: Platformer3DEntity, delta: number): void {
		const movement = entity.platformer;
		const state = entity.platformerState;

		if (state.jumpedThisFrame) {
			state.jumpedThisFrame = false;
			return;
		}

		if (state.grounded) return;

		const currentVel = entity.body.linvel();
		const newYVelocity = currentVel.y - movement.gravity * delta;

		entity.transformStore.velocity.y = newYVelocity;
		entity.transformStore.dirty.velocityY = true;
	}

	/**
	 * Update entity state based on physics
	 */
	private updateState(entity: Platformer3DEntity, delta: number): void {
		const state = entity.platformerState;

		// 1. Reset grounded state before detection
		const wasGrounded = state.grounded;
		
		// Read ACTUAL velocity from physics body
		const velocity = entity.body.linvel();
		
		let isGrounded = false;
		
		// Separate ground detection for airborne vs walking
		const isAirborne = state.jumping || state.falling;
		
		if (isAirborne) {
			// Airborne: Must be FALLING (not jumping) to land.
			// The velocity threshold must be loose enough to capture the frame
			// after Rapier's contact resolution has partially damped the fall
			// (|velocity.y| can sit between 0.5 and 2.0 for a frame or two); too
			// strict a threshold caused the character to hover for 1–2 frames
			// post-impact, producing a visible camera hitch.
			const probeOriginYOffset = 0.05 - getGroundAnchorOffsetY(entity);
			const nearGround = this.groundProbe.detect(entity, {
				rayLength: entity.platformer.groundRayLength,
				mode: 'any',
				debug: entity.platformer.debugGroundProbe,
				scene: this.scene,
				originYOffset: probeOriginYOffset,
			});
			const canLand = state.falling && !state.jumping;
			const hasLanded = velocity.y > -3.0;
			isGrounded = nearGround && canLand && hasLanded;

			// On the landing frame, snap residual Y velocity to 0 so the character
			// doesn't keep drifting downward into the ground on the next step.
			if (isGrounded && velocity.y < 0) {
				entity.transformStore.velocity.y = 0;
				entity.transformStore.dirty.velocityY = true;
			}
		} else {
			// On ground (walking/idle): Normal raycast detection with lenient threshold
			const probeOriginYOffset = 0.05 - getGroundAnchorOffsetY(entity);
			const nearGround = this.groundProbe.detect(entity, {
				rayLength: entity.platformer.groundRayLength,
				mode: 'any',
				debug: entity.platformer.debugGroundProbe,
				scene: this.scene,
				originYOffset: probeOriginYOffset,
			});
			const notFallingFast = velocity.y > -2.0; // Lenient - don't ground while falling fast
			isGrounded = nearGround && notFallingFast;
		}

		// Hysteresis: if the probe just missed but we were grounded last frame,
		// stay grounded for a short grace window (absorbs edge/ray flicker).
		if (!isGrounded && wasGrounded) {
			if (state.groundedGraceTimer <= 0) {
				state.groundedGraceTimer = GROUNDED_GRACE_WINDOW;
			}
		}
		if (state.groundedGraceTimer > 0) {
			if (!isGrounded && wasGrounded && !isAirborne) {
				isGrounded = true;
				state.groundedGraceTimer = Math.max(0, state.groundedGraceTimer - delta);
			} else {
				// Real ground regained, or we truly left (airborne state active):
				// end grace immediately.
				state.groundedGraceTimer = 0;
			}
		}

		state.grounded = isGrounded;

		// 2. Update Coyote Timer
		if (state.grounded) {
			state.timeSinceGrounded = 0;
			state.lastGroundedY = entity.body.translation().y;
		} else {
			state.timeSinceGrounded += delta;
		}

		// 3. Landing Logic
		if (!wasGrounded && state.grounded) {
			state.jumpCount = 0;
			state.jumping = false;
			state.falling = false;
			state.jumpCutApplied = false;
			state.jumpCutRampTimer = 0;
		}

		// 4. Falling Logic (negative Y velocity and not grounded)
		if (velocity.y < -0.1 && !state.grounded) {
			if (state.jumping && velocity.y < 0) {
				state.jumping = false;
				state.falling = true;
			} else if (!state.jumping) {
				state.falling = true;
			}
		}
	}

	/**
	 * Update one platformer entity. Invoked per linked entity by the
	 * Platformer3DBehaviorSystem adapter.
	 */
	updateEntity(entity: any, delta: number): void {
		if (!entity.platformer || !entity.$platformer || !entity.platformerState) {
			return;
		}

		const platformerEntity = entity as Platformer3DEntity;
		this.updateState(platformerEntity, delta);
		this.applyMovement(platformerEntity, delta);
		this.handleJump(platformerEntity, delta);
		this.applyGravity(platformerEntity, delta);
	}

	destroy(): void {
		this.groundProbe.destroy();
	}
}
