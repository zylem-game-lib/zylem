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

import { GroundProbe3D } from '../shared/ground-probe-3d';
import type {
	Platformer3DMovementComponent,
	Platformer3DInputComponent,
	Platformer3DStateComponent,
} from './components';

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
	 * Apply horizontal movement based on input
	 */
	private applyMovement(entity: Platformer3DEntity, delta: number): void {
		const input = entity.$platformer;
		const movement = entity.platformer;
		const state = entity.platformerState;

		// Determine current speed
		const speed = input.run ? movement.runSpeed : movement.walkSpeed;
		state.currentSpeed = speed;

		// Calculate horizontal movement
		const moveX = input.moveX * speed;
		const moveZ = input.moveZ * speed;

		// Get current Y velocity from physics body (preserve vertical momentum)
		const currentVel = entity.body.linvel();

		// Set complete velocity - horizontal from input, vertical preserved
		entity.transformStore.velocity.x = moveX;
		entity.transformStore.velocity.y = currentVel.y;
		entity.transformStore.velocity.z = moveZ;
		entity.transformStore.dirty.velocity = true;
	}

	/**
	 * Handle jump logic with multi-jump support
	 */
	/**
	 * Handle jump logic with multi-jump, coyote time, and buffering
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
		// Only apply jump cut if we've been jumping for a bit (prevents cutting multi-jump immediately)
		const minTimeBeforeCut = 0.1; // 100ms minimum before cut can apply
		const canApplyCut = state.timeSinceJump >= minTimeBeforeCut;
		if (!input.jump && state.jumping && !state.jumpCutApplied && canApplyCut) {
			const velocity = entity.body.linvel();
			entity.transformStore.velocity.y = velocity.y * movement.jumpCutMultiplier;
			entity.transformStore.dirty.velocity = true;
			state.jumpCutApplied = true;
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

			// Apply jump force via transform store
			entity.transformStore.velocity.y = movement.jumpForce;
			entity.transformStore.dirty.velocity = true;
		}
	}

	/**
	 * Apply gravity when not grounded
	 */
	private applyGravity(entity: Platformer3DEntity, delta: number): void {
		const movement = entity.platformer;
		const state = entity.platformerState;

		if (state.grounded) return;
		
		// Skip gravity on the same frame as a jump (prevents overwriting jump velocity)
		// timeSinceJump is reset to 0 when we jump, so if it's very small, we just jumped
		if (state.jumping && state.timeSinceJump < 0.01) {
			return;
		}

		// Get current velocity from physics body and add gravity
		const currentVel = entity.body.linvel();
		const newYVelocity = currentVel.y - movement.gravity * delta;

		// Update the Y velocity in transform store (applyMovement already set x/z and old y)
		entity.transformStore.velocity.y = newYVelocity;
		entity.transformStore.dirty.velocity = true;
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
			// Airborne: Must be FALLING (not jumping) with very low velocity to land
			// This prevents false grounding at jump apex or during descent
			const nearGround = this.groundProbe.detect(entity, {
				rayLength: entity.platformer.groundRayLength,
				mode: 'any',
				debug: entity.platformer.debugGroundProbe,
				scene: this.scene,
			});
			const canLand = state.falling && !state.jumping; // Only land when falling, not jumping
			const hasLanded = Math.abs(velocity.y) < 0.5; // Very strict threshold for landing
			isGrounded = nearGround && canLand && hasLanded;
		} else {
			// On ground (walking/idle): Normal raycast detection with lenient threshold
			const nearGround = this.groundProbe.detect(entity, {
				rayLength: entity.platformer.groundRayLength,
				mode: 'any',
				debug: entity.platformer.debugGroundProbe,
				scene: this.scene,
			});
			const notFallingFast = velocity.y > -2.0; // Lenient - don't ground while falling fast
			isGrounded = nearGround && notFallingFast;
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
	 * Update one platformer entity.
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

	/**
	 * Update all platformer entities.
	 */
	update(delta: number): void {
		if (!this.world?.collisionMap) return;
		for (const [, entity] of this.world.collisionMap) {
			this.updateEntity(entity, delta);
		}
	}

	/**
	 * Cleanup
	 */
	destroy(): void {
		this.groundProbe.destroy();
	}
}
