import { describe, expect, it } from 'vitest';

import {
	WorldBoundary3DFSM,
	computeWorldBoundary3DHits,
} from '../../../src/lib/behaviors/world-boundary-3d/world-boundary-3d-fsm';
import { getBounds3DNormalFromHits } from '../../../src/lib/behaviors/shared/bounds-3d';

describe('WorldBoundary3DBehavior', () => {
	const bounds = {
		left: -6,
		right: 6,
		bottom: -6,
		top: 6,
		back: -6,
		front: 6,
	};

	it('detects X/Y/Z boundary hits', () => {
		expect(computeWorldBoundary3DHits({ x: -6, y: 0, z: 0 }, bounds).left).toBe(true);
		expect(computeWorldBoundary3DHits({ x: 6, y: 0, z: 0 }, bounds).right).toBe(true);
		expect(computeWorldBoundary3DHits({ x: 0, y: -6, z: 0 }, bounds).bottom).toBe(true);
		expect(computeWorldBoundary3DHits({ x: 0, y: 6, z: 0 }, bounds).top).toBe(true);
		expect(computeWorldBoundary3DHits({ x: 0, y: 0, z: -6 }, bounds).back).toBe(true);
		expect(computeWorldBoundary3DHits({ x: 0, y: 0, z: 6 }, bounds).front).toBe(true);
	});

	it('constrains movement and clamps positions inside padded bounds', () => {
		const fsm = new WorldBoundary3DFSM();
		fsm.update({ x: 5.8, y: 0, z: 0 }, bounds, 0.45);

		expect(fsm.getMovement(2, -1, 0.5)).toEqual({
			moveX: 0,
			moveY: -1,
			moveZ: 0.5,
		});
		expect(fsm.getLastClampedPosition()).toEqual({
			x: 5.55,
			y: 0,
			z: 0,
		});
	});

	it('builds ricochet normals from touched faces', () => {
		const normal = getBounds3DNormalFromHits({
			left: false,
			right: true,
			top: true,
			bottom: false,
			back: false,
			front: false,
		});

		expect(normal).toEqual({ x: -1, y: -1, z: 0 });
	});
});
