import { describe, expect, it } from 'vitest';

import {
	screenCenterLookDeltas,
	screenCenterLookTargets,
	shortestAngleDelta,
} from '../../../src/lib/input/screen-center-look';

describe('shortestAngleDelta', () => {
	it('returns small positive delta near +π/-π wrap', () => {
		const delta = shortestAngleDelta(3.0, -3.0);
		expect(delta).toBeGreaterThan(0);
		expect(delta).toBeLessThan(0.5);
	});
});

describe('screenCenterLookTargets', () => {
	it('maps center to zero look', () => {
		const { targetYaw, targetPitch } = screenCenterLookTargets(0, 0, 45);
		expect(targetYaw).toBeCloseTo(0);
		expect(targetPitch).toBeCloseTo(0);
	});

	it('maps top-left to max left and max up', () => {
		const max = (45 * Math.PI) / 180;
		const { targetYaw, targetPitch } = screenCenterLookTargets(-1, -1, 45);
		expect(targetYaw).toBeCloseTo(max);
		expect(targetPitch).toBeCloseTo(max);
	});

	it('maps bottom-right to max right and max down', () => {
		const max = (45 * Math.PI) / 180;
		const { targetYaw, targetPitch } = screenCenterLookTargets(1, 1, 45);
		expect(targetYaw).toBeCloseTo(-max);
		expect(targetPitch).toBeCloseTo(-max);
	});

	it('maps left edge to +π when maxLookDegrees is 180', () => {
		const { targetYaw } = screenCenterLookTargets(-1, 0, 180);
		expect(targetYaw).toBeCloseTo(Math.PI);
	});
});

describe('screenCenterLookDeltas', () => {
	it('returns zero deltas when already at target', () => {
		const max = (45 * Math.PI) / 180;
		const { lookX, lookY } = screenCenterLookDeltas(-1, -1, max, max, {
			maxLookDegrees: 45,
			lookSensitivity: 2,
		});
		expect(lookX).toBeCloseTo(0);
		expect(lookY).toBeCloseTo(0);
	});

	it('uses shortest path near yaw wrap', () => {
		const target = -Math.PI;
		const { lookX } = screenCenterLookDeltas(1, 0, 3.0, 0, {
			maxLookDegrees: 180,
			lookSensitivity: 2,
		});
		expect(lookX).toBeGreaterThan(0);
		expect(lookX).toBeLessThan(0.5);
		expect(shortestAngleDelta(3.0, target) / 2).toBeCloseTo(lookX);
	});

	it('scales delta magnitude by sensitivity', () => {
		const fast = screenCenterLookDeltas(1, 0, 0, 0, {
			maxLookDegrees: 180,
			lookSensitivity: 1,
		});
		const slow = screenCenterLookDeltas(1, 0, 0, 0, {
			maxLookDegrees: 180,
			lookSensitivity: 4,
		});
		expect(Math.abs(fast.lookX)).toBeGreaterThan(Math.abs(slow.lookX));
	});
});
