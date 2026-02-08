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

import { Vector3, BufferGeometry, LineBasicMaterial, Line } from 'three';
import { Ray } from '@dimforge/rapier3d-compat';
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
	private rays: Map<string, Ray[]> = new Map();
	private debugLines: Map<string, any[]> = new Map(); // Store Line objects for debug visualization

	constructor(world: any, scene: any) {
		this.world = world;
		this.scene = scene;
	}

	/**
	 * Detect if entity is on the ground using raycasting
	 */
	/**
	 * Detect if entity is on the ground using raycasting (multi-sample: center + 4 corners)
	 */
	private detectGround(entity: Platformer3DEntity): boolean {
		if (!this.world?.world || !entity.body) return false;

		const translation = entity.body.translation();
		const rayLength = entity.platformer.groundRayLength;
		const radius = 0.4; // Sample radius (approx 80% of typical character collider radius)

		// Define ray offsets (center + 4 corners)
		const offsets = [
			{ x: 0, z: 0 },
			{ x: radius, z: radius },
			{ x: -radius, z: radius },
			{ x: radius, z: -radius },
			{ x: -radius, z: -radius },
		];

		// Get or create rays for this entity
		let entityRays = this.rays.get(entity.uuid);
		if (!entityRays) {
			entityRays = offsets.map(() => new Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: -1, z: 0 }));
			this.rays.set(entity.uuid, entityRays);
		}

		let grounded = false;
		
		// Cast all rays
		offsets.forEach((offset, i) => {
			if (grounded) return; // Optimization: stop if already grounded (comment out for full debug viz)

			const ray = entityRays![i];
			ray.origin = { 
				x: translation.x + offset.x, 
				y: translation.y, 
				z: translation.z + offset.z 
			};
			ray.dir = { x: 0, y: -1, z: 0 };

			const hit = this.world.world.castRay(
				ray,
				rayLength,
				true,
				undefined,
				undefined,
				undefined,
				undefined,
				(collider: any) => {
					const ref = collider._parent?.userData?.uuid;
					if (ref === entity.uuid) return false;
					grounded = true;
					return true;
				}
			);
		});

		// Visualization logic omitted for brevity/performance (restore if needed)
		if (this.scene) {
			this.updateDebugLines(entity, entityRays, grounded, rayLength);
		}

		return grounded;
	}

	private updateDebugLines(entity: Platformer3DEntity, rays: Ray[], hasGround: boolean, length: number) {
		let lines = this.debugLines.get(entity.uuid);
		if (!lines) {
			lines = rays.map(() => {
				const geometry = new BufferGeometry().setFromPoints([new Vector3(), new Vector3()]);
				const material = new LineBasicMaterial({ color: 0xff0000 });
				const line = new Line(geometry, material);
				this.scene.add(line);
				return line;
			});
			this.debugLines.set(entity.uuid, lines);
		}

		rays.forEach((ray, i) => {
			const line = lines![i];
			const start = new Vector3(ray.origin.x, ray.origin.y, ray.origin.z);
			const end = new Vector3(
				ray.origin.x + ray.dir.x * length,
				ray.origin.y + ray.dir.y * length,
				ray.origin.z + ray.dir.z * length
			);
			line.geometry.setFromPoints([start, end]);
			line.material.color.setHex(hasGround ? 0x00ff00 : 0xff0000);
		});
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
		
		// DEBUG: Log jump attempt
		console.log('[JUMP DEBUG] Attempting jump:', {
			grounded: state.grounded,
			jumpCount: state.jumpCount,
			maxJumps: movement.maxJumps,
			isFirstJump,
			canMultiJump,
			'--- Multi-jump conditions ---': '',
			'!grounded': !state.grounded,
			hasJumpsRemaining,
			buttonReleased,
			inMultiJumpWindow,
			timeSinceJump: state.timeSinceJump.toFixed(3),
			multiJumpWindowTime: movement.multiJumpWindowTime,
		});
		
		if (isFirstJump || canMultiJump) {
			console.log('[JUMP DEBUG] ✅ EXECUTING JUMP #' + (state.jumpCount + 1));
			
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
		} else {
			console.log('[JUMP DEBUG] ❌ JUMP BLOCKED - conditions not met');
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
			const nearGround = this.detectGround(entity);
			const canLand = state.falling && !state.jumping; // Only land when falling, not jumping
			const hasLanded = Math.abs(velocity.y) < 0.5; // Very strict threshold for landing
			isGrounded = nearGround && canLand && hasLanded;
		} else {
			// On ground (walking/idle): Normal raycast detection with lenient threshold
			const nearGround = this.detectGround(entity);
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
	 * Update all platformer entities
	 */
	update(delta: number): void {
		if (!this.world?.collisionMap) return;

		for (const [, entity] of this.world.collisionMap) {
			const platformerEntity = entity as any;

			// Check if entity has platformer components
			if (!platformerEntity.platformer || !platformerEntity.$platformer || !platformerEntity.platformerState) {
				continue;
			}

			// Update state first
			this.updateState(platformerEntity, delta);

			// Apply movement
			this.applyMovement(platformerEntity, delta);

			// Handle jumping
			this.handleJump(platformerEntity, delta);

			// Apply gravity
			this.applyGravity(platformerEntity, delta);
		}
	}

	/**
	 * Cleanup
	 */
	destroy(): void {
		this.rays.clear();
	}
}
