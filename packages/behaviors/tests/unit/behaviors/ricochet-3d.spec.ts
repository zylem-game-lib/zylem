import { describe, expect, it } from 'vitest';

import { Ricochet3DFSM } from '../../../src/lib/behaviors/ricochet-3d/ricochet-3d-fsm';

describe('Ricochet3DFSM', () => {
	it('reflects off a planar surface using an explicit normal', () => {
		const fsm = new Ricochet3DFSM();
		const result = fsm.computeRicochet(
			{
				selfVelocity: { x: 4, y: 1, z: -2 },
				contact: { normal: { x: -1, y: 0, z: 0 } },
			},
			{ reflectionMode: 'simple', speedMultiplier: 1 },
		);

		expect(result).toBeDefined();
		expect(result?.velocity.x).toBeLessThan(0);
		expect(result?.velocity.y).toBe(1);
		expect(result?.velocity.z).toBe(-2);
	});

	it('can infer a collision normal from entity positions', () => {
		const fsm = new Ricochet3DFSM();
		const result = fsm.computeRicochet(
			{
				selfVelocity: { x: 0, y: -3, z: 0 },
				selfPosition: { x: 0, y: 4, z: 0 },
				otherPosition: { x: 0, y: 0, z: 0 },
				contact: {},
			},
			{ reflectionMode: 'simple', speedMultiplier: 1 },
		);

		expect(result).toBeDefined();
		expect(result?.normal).toEqual({ x: 0, y: 1, z: 0 });
		expect(result?.velocity.y).toBeGreaterThan(0);
	});
});
