/**
 * Platformer 3D Behavior System
 *
 * Handles 3D platformer physics including:
 * - Contact-based ground detection (uses the actual capsule collider — no
 *   raycast/shapecast probe). The bottom of the body's collider is the
 *   single source of truth for "is grounded".
 * - Horizontal movement (walk/run)
 * - Jumping with multi-jump support
 * - Gravity application (Rapier's internal gravity is disabled per-body so
 *   `movement.gravity` is the only fall acceleration — previously the two
 *   stacked, doubling the airborne fall rate).
 * - State synchronization with FSM
 */

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
 * Core physics system for 3D platformer movement.
 *
 * Ground detection uses Rapier's narrow-phase contacts on the entity's
 * collider (`world.contactsWith` + `contactPair`). This eliminates the old
 * shape/ray probe and aligns "grounded" with the same surface the body
 * physically rests on, which removes the jitter that happened on heightmap
 * terrain (the probe and the contact resolver could disagree by a frame).
 */
export class Platformer3DBehavior {
	private world: any;
	private scene: any;
	/**
	 * Tracks entities whose Rapier `gravityScale` has been zeroed so that
	 * `applyGravity` is the sole writer of vertical velocity. We do this
	 * lazily on the first update because the body isn't always available at
	 * construction time.
	 */
	private gravityConfiguredUUIDs = new Set<string>();

	constructor(world: any, scene: any) {
		this.world = world;
		this.scene = scene;
	}

	/**
	 * Detect "grounded" using the actual capsule collider's contact pairs.
	 *
	 * A contact is treated as ground when its solver point lies below the
	 * body center (i.e., it sits on the bottom hemisphere/cylinder). We
	 * deliberately don't filter by normal direction: the contact point's
	 * position alone is robust against the various normal-flip conventions
	 * Rapier uses for `flipped` manifolds and against rolling-bottom edges
	 * on heightmap terrain.
	 */
	private detectGroundedFromContacts(entity: Platformer3DEntity): boolean {
		const collider = (entity as any).collider;
		const physicsWorld = this.world?.world;
		if (!collider || !physicsWorld?.contactsWith) {
			return false;
		}

		let grounded = false;

		physicsWorld.contactsWith(collider, (other: any) => {
			if (grounded) return;
			physicsWorld.contactPair(collider, other, (manifold: any, flipped: boolean) => {
				if (grounded) return;
				const num = manifold.numContacts();
				for (let i = 0; i < num; i++) {
					const local = flipped
						? manifold.localContactPoint2(i)
						: manifold.localContactPoint1(i);
					if (!local) continue;
					if (local.y < 0) {
						grounded = true;
						return;
					}
				}
			});
		});

		return grounded;
	}

	/**
	 * One-time per-entity physics setup: take over gravity from Rapier's
	 * world so that `applyGravity` controls the entire airborne fall curve.
	 * Without this, gravity was effectively doubled (Rapier's world gravity
	 * + this behavior's explicit gravity were both pulling the body down).
	 */
	private ensurePhysicsConfigured(entity: Platformer3DEntity): void {
		if (this.gravityConfiguredUUIDs.has(entity.uuid)) return;
		if (typeof entity.body?.setGravityScale === 'function') {
			entity.body.setGravityScale(0, true);
		}
		this.gravityConfiguredUUIDs.add(entity.uuid);
	}

	/**
	 * Apply horizontal movement based on input.
	 *
	 * Only writes X/Z axes — Y is left untouched so Rapier's contact resolution
	 * can damp vertical motion correctly while grounded. Jump and gravity are
	 * the sole writers of Y velocity (see handleJump / applyGravity).
	 */
	private applyMovement(entity: Platformer3DEntity): void {
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
	 * Update entity state based on physics.
	 *
	 * Grounded is determined purely by Rapier's contact pairs on the entity's
	 * collider. This removes a whole class of slope/heightmap jitter caused
	 * by the previous shape probe disagreeing with the contact resolver — the
	 * probe could report grounded while a contact impulse had just nudged the
	 * body off the ground, producing visible micro-bouncing.
	 *
	 * While grounded, vertical velocity is held at 0 each frame. This stops
	 * residual upward kicks from slope-contact resolution from accumulating
	 * across frames (which previously caused the character to "ride up"
	 * slopes and lose contact briefly, then fall back, then re-contact, in a
	 * tight oscillation).
	 */
	private updateState(entity: Platformer3DEntity, delta: number): void {
		const state = entity.platformerState;
		const wasGrounded = state.grounded;
		const velocity = entity.body.linvel();
		const hasContact = this.detectGroundedFromContacts(entity);

		const isAirborne = state.jumping || state.falling;
		let isGrounded: boolean;
		if (isAirborne) {
			// While in a jump arc the contact still exists for one frame after
			// liftoff; require the falling state before allowing a landing.
			const canLand = state.falling && !state.jumping;
			isGrounded = hasContact && canLand;
		} else {
			isGrounded = hasContact;
		}

		// Hysteresis: if the contact briefly drops over a heightmap seam,
		// stay grounded for a short grace window.
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
				state.groundedGraceTimer = 0;
			}
		}

		state.grounded = isGrounded;

		// Hold vy = 0 while grounded so slope-impulse residual doesn't drift
		// the body upward across frames. handleJump runs after this and will
		// overwrite velocity.y with jumpForce on a jump frame.
		if (state.grounded) {
			entity.transformStore.velocity.y = 0;
			entity.transformStore.dirty.velocityY = true;
		}

		if (state.grounded) {
			state.timeSinceGrounded = 0;
			state.lastGroundedY = entity.body.translation().y;
		} else {
			state.timeSinceGrounded += delta;
		}

		if (!wasGrounded && state.grounded) {
			state.jumpCount = 0;
			state.jumping = false;
			state.falling = false;
			state.jumpCutApplied = false;
			state.jumpCutRampTimer = 0;
		}

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
		this.ensurePhysicsConfigured(platformerEntity);
		this.updateState(platformerEntity, delta);
		this.applyMovement(platformerEntity);
		this.handleJump(platformerEntity, delta);
		this.applyGravity(platformerEntity, delta);
	}

	destroy(): void {
		this.gravityConfiguredUUIDs.clear();
	}
}
