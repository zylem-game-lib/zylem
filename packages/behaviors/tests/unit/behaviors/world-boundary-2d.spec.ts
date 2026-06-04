import { describe, expect, it } from 'vitest';

import {
	WorldBoundary2DFSM,
	computeWorldBoundary2DHits,
} from '../../../src/lib/behaviors/world-boundary-2d/world-boundary-2d-fsm';

describe('WorldBoundary2DBehavior', () => {
	const bounds = { left: -10, right: 10, bottom: -7.5, top: 7.5 };

	it('detects left and right boundary hits', () => {
		expect(computeWorldBoundary2DHits({ x: -10, y: 0 }, bounds).left).toBe(true);
		expect(computeWorldBoundary2DHits({ x: 10, y: 0 }, bounds).right).toBe(true);
	});

	it('detects top and bottom boundary hits', () => {
		expect(computeWorldBoundary2DHits({ x: 0, y: 7.5 }, bounds).top).toBe(true);
		expect(computeWorldBoundary2DHits({ x: 0, y: -7.5 }, bounds).bottom).toBe(true);
	});

	it('constrains movement against touched boundaries', () => {
		const fsm = new WorldBoundary2DFSM();
		fsm.update({ x: -10, y: 7.5 }, bounds);

		expect(fsm.getMovement(-2, 3)).toEqual({ moveX: 0, moveY: 0 });
		expect(fsm.getMovement(2, -3)).toEqual({ moveX: 2, moveY: -3 });
	});
});
