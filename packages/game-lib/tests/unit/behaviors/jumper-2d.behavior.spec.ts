import { describe, expect, it } from 'vitest';

import {
	createJumpConfig2D,
	createJumpInput2D,
	createJumpState2D,
	type JumpContext2D,
} from '../../../src/lib/behaviors/jumper-2d/components';
import {
	Jumper2DBehavior,
	Jumper2DTickEvent,
} from '../../../src/lib/behaviors/jumper-2d/jumper-2d.behavior';
import { isJumper2DGrounded } from '../../../src/lib/behaviors/jumper-2d/jumper-2d.descriptor';

describe('Jumper2DBehavior', () => {
	it('launches upward on a grounded jump', () => {
		const behavior = new Jumper2DBehavior();
		const config = createJumpConfig2D({ jumpHeight: 3, gravity: 18 });
		const state = createJumpState2D();
		const input = createJumpInput2D();
		input.jumpPressed = true;
		input.jumpHeld = true;

		const ctx: JumpContext2D = {
			dt: 1 / 60,
			velocityY: 0,
			isGrounded: true,
			timeSinceGroundedMs: 0,
			setVerticalVelocity: (y: number) => {
				ctx.velocityY = y;
			},
		};

		const result = behavior.tick(config, input, ctx, state);

		expect(result.event).toBe(Jumper2DTickEvent.Jump);
		expect(ctx.velocityY).toBeGreaterThan(0);
	});

	it('consumes buffered jump input on landing', () => {
		const behavior = new Jumper2DBehavior();
		const config = createJumpConfig2D({ jumpBufferMs: 120, gravity: 18 });
		const state = createJumpState2D();
		const input = createJumpInput2D();
		input.jumpPressed = true;
		input.jumpHeld = true;

		const ctx: JumpContext2D = {
			dt: 1 / 60,
			velocityY: -1,
			isGrounded: false,
			timeSinceGroundedMs: 300,
			setVerticalVelocity: (y: number) => {
				ctx.velocityY = y;
			},
		};

		const first = behavior.tick(config, input, ctx, state);
		expect(first.event).toBe(Jumper2DTickEvent.Fall);

		input.jumpPressed = false;
		ctx.isGrounded = true;
		ctx.velocityY = 0;

		const second = behavior.tick(config, input, ctx, state);
		expect(second.event).toBe(Jumper2DTickEvent.Jump);
		expect(ctx.velocityY).toBeGreaterThan(0);
	});

	it('treats a falling sprite as grounded when it reaches the floor after a jump arc', () => {
		expect(isJumper2DGrounded({ nearGround: true, velocityY: -6 })).toBe(true);
		expect(isJumper2DGrounded({ nearGround: true, velocityY: 0 })).toBe(true);
	});

	it('treats a raised platform as support while descending or resting on it', () => {
		expect(isJumper2DGrounded({ nearGround: true, velocityY: -1.25 })).toBe(true);
		expect(isJumper2DGrounded({ nearGround: true, velocityY: 0 })).toBe(true);
	});

	it('does not ground a rising sprite near support or reset jumps early', () => {
		const behavior = new Jumper2DBehavior();
		const config = createJumpConfig2D({ gravity: 18, maxJumps: 2 });
		const state = createJumpState2D();
		const input = createJumpInput2D();

		state.jumpsUsed = 1;
		state.isJumping = true;

		const ctx: JumpContext2D = {
			dt: 1 / 60,
			velocityY: 2.5,
			isGrounded: isJumper2DGrounded({ nearGround: true, velocityY: 2.5 }),
			timeSinceGroundedMs: 120,
			setVerticalVelocity: (y: number) => {
				ctx.velocityY = y;
			},
		};

		behavior.tick(config, input, ctx, state);

		expect(ctx.isGrounded).toBe(false);
		expect(state.jumpsUsed).toBe(1);
	});
});
