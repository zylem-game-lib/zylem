import { describe, expect, it } from 'vitest';

import { FirstPersonShooterCoordinator } from '../../../src/lib/coordinators/first-person-shooter.coordinator';

describe('FirstPersonShooterCoordinator', () => {
	it('writes shared input into both FPS and jumper channels', () => {
		const entity: any = {};
		const coordinator = new FirstPersonShooterCoordinator(
			entity,
			{ getYaw: () => 0 },
			{ getState: () => 'grounded' },
		);

		coordinator.update({
			moveX: 0.5,
			moveZ: -1,
			lookX: 0.25,
			lookY: -0.75,
			sprint: true,
			jumpPressed: true,
			jumpHeld: true,
			jumpReleased: false,
			fastFall: false,
		});

		expect(entity.$fps).toMatchObject({
			moveX: 0.5,
			moveZ: -1,
			lookX: 0.25,
			lookY: -0.75,
			sprint: true,
		});
		expect(entity.$jumper).toMatchObject({
			jumpPressed: true,
			jumpHeld: true,
			jumpReleased: false,
			fastFall: false,
		});
		expect(entity.$jumper.moveDirWorld).toEqual({ x: 0.4472135954999579, y: 0, z: -0.8944271909999159 });
	});

	it('rotates moveDirWorld with current yaw and seeds missing inputs lazily', () => {
		const entity: any = {};
		const coordinator = new FirstPersonShooterCoordinator(
			entity,
			{ getYaw: () => Math.PI / 2 },
			{ getState: () => 'falling' },
		);

		coordinator.update({
			moveX: 0,
			moveZ: 1,
			lookX: 0,
			lookY: 0,
			sprint: false,
			jumpPressed: false,
			jumpHeld: false,
			jumpReleased: false,
		});

		expect(entity.$fps).toBeDefined();
		expect(entity.$jumper).toBeDefined();
		expect(entity.$jumper.moveDirWorld?.x).toBeCloseTo(1);
		expect(entity.$jumper.moveDirWorld?.z).toBeCloseTo(0);
	});
});
