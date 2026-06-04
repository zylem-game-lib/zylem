import { describe, expect, it } from 'vitest';

import { Ricochet2DFSM } from '../../../src/lib/behaviors/ricochet-2d/ricochet-2d-fsm';

describe('Ricochet2DBehavior', () => {
	it('reflects horizontally when hitting a vertical wall', () => {
		const fsm = new Ricochet2DFSM();
		const result = fsm.computeRicochet(
			{
				selfVelocity: { x: 5, y: 3 },
				contact: { normal: { x: 1, y: 0 } },
			},
			{ reflectionMode: 'simple', speedMultiplier: 1 },
		);

		expect(result).toBeDefined();
		expect(result?.velocity.x).toBeLessThan(0);
		expect(result?.velocity.y).toBe(3);
	});

	it('reflects vertically when hitting a horizontal surface', () => {
		const fsm = new Ricochet2DFSM();
		const result = fsm.computeRicochet(
			{
				selfVelocity: { x: 3, y: 5 },
				contact: { normal: { x: 0, y: 1 } },
			},
			{ reflectionMode: 'simple', speedMultiplier: 1 },
		);

		expect(result).toBeDefined();
		expect(result?.velocity.x).toBe(3);
		expect(result?.velocity.y).toBeLessThan(0);
	});

	it('supports angled reflections and speed clamping', () => {
		const fsm = new Ricochet2DFSM();
		const result = fsm.computeRicochet(
			{
				selfVelocity: { x: 5, y: -5 },
				selfPosition: { x: 0.5, y: 0 },
				otherPosition: { x: 0, y: 0 },
				otherSize: { x: 4, y: 1, z: 1 },
				contact: { normal: { x: 0, y: 1 } },
			},
			{
				reflectionMode: 'angled',
				speedMultiplier: 1.05,
				minSpeed: 2,
				maxSpeed: 20,
			},
		);

		expect(result).toBeDefined();
		expect(result?.velocity.y).toBeGreaterThan(0);
		expect(result?.speed).toBeGreaterThan(7);
		expect(result?.speed).toBeLessThanOrEqual(20);
	});
});
