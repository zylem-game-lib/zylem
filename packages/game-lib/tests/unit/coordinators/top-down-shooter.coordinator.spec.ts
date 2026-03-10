import { describe, expect, it, vi } from 'vitest';

import { TopDownShooterCoordinator } from '../../../src/lib/coordinators/top-down-shooter.coordinator';

describe('TopDownShooterCoordinator', () => {
	it('writes movement and aim into the top-down input channel', () => {
		const entity: any = {
			body: {
				translation: () => ({ x: 2, y: 3, z: 0 }),
			},
			topDownMovementState: {
				facingAngle: 0,
			},
		};
		const shooter = {
			fire: vi.fn().mockResolvedValue(null),
		};
		const coordinator = new TopDownShooterCoordinator(entity, shooter as any, {
			add() {},
		});

		coordinator.update({
			moveX: -0.25,
			moveY: 1,
			aimX: 1,
			aimY: 0,
			shootPressed: false,
			shootHeld: false,
		});

		expect(entity.$topDownMovement).toMatchObject({
			moveX: -0.25,
			moveY: 1,
			faceX: 1,
			faceY: 0,
		});
		expect(shooter.fire).not.toHaveBeenCalled();
	});

	it('fires toward the current aim or last facing direction', () => {
		const entity: any = {
			body: {
				translation: () => ({ x: 0, y: 0, z: 0 }),
			},
			topDownMovementState: {
				facingAngle: 0,
			},
		};
		const shooter = {
			fire: vi.fn().mockResolvedValue(null),
		};
		const stage = { add() {} };
		const coordinator = new TopDownShooterCoordinator(entity, shooter as any, stage);

		coordinator.update({
			moveX: 0,
			moveY: 0,
			aimX: 0,
			aimY: 0,
			shootPressed: true,
			shootHeld: false,
		});

		expect(shooter.fire).toHaveBeenCalledWith({
			source: entity,
			stage,
			target: { x: 0, y: 1 },
		});
	});
});
