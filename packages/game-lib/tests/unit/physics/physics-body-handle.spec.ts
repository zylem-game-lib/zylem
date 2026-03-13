import { describe, expect, it } from 'vitest';

import { PhysicsBodyHandle } from '../../../src/lib/physics/physics-body-handle';

describe('PhysicsBodyHandle', () => {
	it('retains previous and current worker snapshots for render interpolation', () => {
		const handle = new PhysicsBodyHandle('ball');

		handle._seedSnapshot(
			1, 0, 0,
			0, 0, 0, 1,
			0, 0, 0,
			0, 0, 0,
		);
		handle._updateSnapshot(
			3, 0, 0,
			0, 1, 0, 0,
			0, 0, 0,
			0, 0, 0,
		);

		const history = handle.getPoseHistory();
		const renderPose = handle.getRenderPose(0.5);

		expect(history.previous.position.x).toBe(1);
		expect(history.current.position.x).toBe(3);
		expect(renderPose.position.x).toBe(2);
		expect(renderPose.rotation.y).toBeCloseTo(Math.SQRT1_2, 5);
		expect(renderPose.rotation.w).toBeCloseTo(Math.SQRT1_2, 5);
	});

	it('collapses pose history for direct translation and rotation writes', () => {
		const handle = new PhysicsBodyHandle('ball');

		handle._seedSnapshot(
			0, 0, 0,
			0, 0, 0, 1,
			0, 0, 0,
			0, 0, 0,
		);
		handle.setTranslation({ x: 9, y: -1, z: 2 }, true);
		handle.setRotation(
			{ x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
			true,
		);

		const history = handle.getPoseHistory();

		expect(history.previous.position).toEqual({ x: 9, y: -1, z: 2 });
		expect(history.current.position).toEqual({ x: 9, y: -1, z: 2 });
		expect(history.previous.rotation).toEqual({
			x: 0,
			y: Math.SQRT1_2,
			z: 0,
			w: Math.SQRT1_2,
		});
		expect(history.current.rotation).toEqual({
			x: 0,
			y: Math.SQRT1_2,
			z: 0,
			w: Math.SQRT1_2,
		});
	});
});
