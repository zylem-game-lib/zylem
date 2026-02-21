import { describe, expect, it } from 'vitest';
import {
	createJumpConfig3D,
	createJumpInput3D,
	createJumpState3D,
	type JumpContext3D,
} from '../../../src/lib/behaviors/jumper-3d/components';
import { Jumper3DBehavior, JumperTickEvent } from '../../../src/lib/behaviors/jumper-3d/jumper-3d.behavior';

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
});
