import { describe, expect, it } from 'vitest';
import {
	createJumpConfig3D,
	createJumpInput3D,
	createJumpState3D,
	type JumpContext3D,
} from '../../../src/lib/behaviors/jumper-3d/components';
import { Jumper3DBehavior, JumperTickEvent } from '../../../src/lib/behaviors/jumper-3d/jumper-3d.behavior';
import { isJumper3DGrounded } from '../../../src/lib/behaviors/jumper-3d/jumper-3d.descriptor';

describe('Jumper3DBehavior', () => {
	it('does not clamp jump launch velocity to zero on grounded jump frame', () => {
		const behavior = new Jumper3DBehavior();
		const config = createJumpConfig3D({ jumpHeight: 2.5, gravity: 20 });
		const state = createJumpState3D();
		const input = createJumpInput3D();
		input.jumpPressed = true;
		input.jumpHeld = true;

		const ctx: JumpContext3D = {
			dt: 1 / 60,
			up: { x: 0, y: 1, z: 0 },
			velocityY: 0,
			horizontalVelocity: { x: 0, z: 0 },
			isGrounded: true,
			timeSinceGroundedMs: 0,
			setVerticalVelocity: (y: number) => {
				ctx.velocityY = y;
			},
			setHorizontalVelocity: (x: number, z: number) => {
				ctx.horizontalVelocity.x = x;
				ctx.horizontalVelocity.z = z;
			},
		};

		const result = behavior.tick(config, input, ctx, state);

		expect(result.event).toBe(JumperTickEvent.Jump);
		expect(ctx.velocityY).toBeGreaterThan(0);
	});

	it('allows a buffered jump to fire on landing', () => {
		const behavior = new Jumper3DBehavior();
		const config = createJumpConfig3D({ jumpHeight: 2.5, gravity: 20, jumpBufferMs: 120 });
		const state = createJumpState3D();
		const input = createJumpInput3D();
		input.jumpPressed = true;
		input.jumpHeld = true;

		const ctx: JumpContext3D = {
			dt: 1 / 60,
			up: { x: 0, y: 1, z: 0 },
			velocityY: -1,
			horizontalVelocity: { x: 0, z: 0 },
			isGrounded: false,
			timeSinceGroundedMs: 400,
			setVerticalVelocity: (y: number) => {
				ctx.velocityY = y;
			},
			setHorizontalVelocity: () => {},
		};

		const first = behavior.tick(config, input, ctx, state);
		expect(first.event).toBe(JumperTickEvent.Fall);

		input.jumpPressed = false;
		ctx.isGrounded = true;
		ctx.velocityY = 0;

		const second = behavior.tick(config, input, ctx, state);
		expect(second.event).toBe(JumperTickEvent.Jump);
		expect(ctx.velocityY).toBeGreaterThan(0);
	});

	it('supports coyote-time jumps after leaving the ground', () => {
		const behavior = new Jumper3DBehavior();
		const config = createJumpConfig3D({ jumpHeight: 2.5, gravity: 20, coyoteTimeMs: 120 });
		const state = createJumpState3D();
		const input = createJumpInput3D();

		const ctx: JumpContext3D = {
			dt: 1 / 60,
			up: { x: 0, y: 1, z: 0 },
			velocityY: 0,
			horizontalVelocity: { x: 0, z: 0 },
			isGrounded: true,
			timeSinceGroundedMs: 0,
			setVerticalVelocity: (y: number) => {
				ctx.velocityY = y;
			},
			setHorizontalVelocity: () => {},
		};

		behavior.tick(config, input, ctx, state);

		ctx.isGrounded = false;
		input.jumpPressed = true;
		input.jumpHeld = true;
		const result = behavior.tick(config, input, ctx, state);

		expect(result.event).toBe(JumperTickEvent.Jump);
		expect(ctx.velocityY).toBeGreaterThan(0);
	});

	it('cuts jump height when the button is released early', () => {
		const behavior = new Jumper3DBehavior();
		const config = createJumpConfig3D({
			jumpHeight: 3,
			gravity: 20,
			variableJump: { enabled: true, cutGravityMultiplier: 3 },
		});
		const state = createJumpState3D();
		const input = createJumpInput3D();
		input.jumpPressed = true;
		input.jumpHeld = true;

		const ctx: JumpContext3D = {
			dt: 1 / 60,
			up: { x: 0, y: 1, z: 0 },
			velocityY: 0,
			horizontalVelocity: { x: 0, z: 0 },
			isGrounded: true,
			timeSinceGroundedMs: 0,
			setVerticalVelocity: (y: number) => {
				ctx.velocityY = y;
			},
			setHorizontalVelocity: () => {},
		};

		behavior.tick(config, input, ctx, state);
		const launchVelocity = ctx.velocityY;

		input.jumpPressed = false;
		input.jumpHeld = false;
		ctx.isGrounded = false;
		ctx.velocityY = launchVelocity;
		state.jumpHoldMs = 120;

		behavior.tick(config, input, ctx, state);
		expect(ctx.velocityY).toBeLessThan(launchVelocity);
		expect(state.jumpCutApplied).toBe(true);
	});

	it('does not allow jumps beyond maxJumps', () => {
		const behavior = new Jumper3DBehavior();
		const config = createJumpConfig3D({ jumpHeight: 2.5, gravity: 20, maxJumps: 2 });
		const state = createJumpState3D();
		const input = createJumpInput3D();
		input.jumpPressed = true;
		input.jumpHeld = true;

		const ctx: JumpContext3D = {
			dt: 1 / 60,
			up: { x: 0, y: 1, z: 0 },
			velocityY: 0,
			horizontalVelocity: { x: 0, z: 0 },
			isGrounded: true,
			timeSinceGroundedMs: 0,
			setVerticalVelocity: (y: number) => {
				ctx.velocityY = y;
			},
			setHorizontalVelocity: () => {},
		};

		const first = behavior.tick(config, input, ctx, state);
		expect(first.event).toBe(JumperTickEvent.Jump);

		ctx.isGrounded = false;
		input.jumpPressed = false;
		input.jumpHeld = false;
		behavior.tick(config, input, ctx, state);

		input.jumpPressed = true;
		input.jumpHeld = true;
		const second = behavior.tick(config, input, ctx, state);
		expect(second.event).toBe(JumperTickEvent.Jump);

		input.jumpPressed = false;
		input.jumpHeld = false;
		behavior.tick(config, input, ctx, state);

		const beforeThirdAttempt = ctx.velocityY;
		input.jumpPressed = true;
		input.jumpHeld = true;
		const third = behavior.tick(config, input, ctx, state);

		expect(third.event).not.toBe(JumperTickEvent.Jump);
		expect(state.jumpsUsed).toBe(2);
		expect(ctx.velocityY).toBeLessThanOrEqual(beforeThirdAttempt);
	});

	it('does not ground when support is farther than snap distance', () => {
		expect(
			isJumper3DGrounded({
				supportToi: 0.3,
				velocityY: 0,
				snapToGroundDistance: 0.15,
			}),
		).toBe(false);
	});

	it('grounds when descending onto nearby support within snap distance', () => {
		expect(
			isJumper3DGrounded({
				supportToi: 0.08,
				velocityY: -1.5,
				snapToGroundDistance: 0.15,
			}),
		).toBe(true);
	});
});
