import { describe, expect, it, vi } from 'vitest';

import { MultidirectionalSpaceShooterCoordinator } from '../../../src/lib/coordinators/multidirectional-space-shooter.coordinator';

describe('MultidirectionalSpaceShooterCoordinator', () => {
	it('writes vector thrust and rotates from aim before firing', () => {
		const entity: any = {
			body: {
				translation: () => ({ x: 4, y: -2, z: 0 }),
				rotation: () => ({ x: 0, y: 0, z: 0, w: 1 }),
			},
			setRotationZ: vi.fn(),
		};
		const shooter = {
			fire: vi.fn().mockResolvedValue(null),
		};
		const stage = { add() {} };
		const coordinator = new MultidirectionalSpaceShooterCoordinator(
			entity,
			shooter as any,
			stage,
		);

		coordinator.update({
			moveX: 1,
			moveY: -0.5,
			aimX: 1,
			aimY: 0,
			shootPressed: true,
			shootHeld: false,
		});

		expect(entity.$thruster).toMatchObject({
			thrustX: 1,
			thrustY: -0.5,
			thrust: 0,
			rotate: 0,
		});
		expect(entity.setRotationZ).toHaveBeenCalledWith(-Math.PI / 2);
		expect(shooter.fire).toHaveBeenCalledWith({
			source: entity,
			stage,
			target: { x: 5, y: -2 },
		});
	});
});
