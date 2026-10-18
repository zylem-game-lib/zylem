import { describe, expect, it } from 'vitest';

import { boxBrush } from '../../../src/lib/level/brush';
import { levelCollisionHulls } from '../../../src/lib/level/level-collision';
import {
	boxFromDrag,
	clipPlaneFromPoints,
	drawViewForCamera,
	rayHitAxisPlane,
} from '../../../src/lib/level/level-draw';

describe('draw views', () => {
	it('accepts the top and side cameras only', () => {
		expect(drawViewForCamera('editor:top')).toBe('top');
		expect(drawViewForCamera('editor:side')).toBe('side');
		expect(drawViewForCamera('editor:free')).toBeNull();
		expect(drawViewForCamera('game')).toBeNull();
		expect(drawViewForCamera(null)).toBeNull();
	});

	it('hits the ground plane and misses a ray that points away', () => {
		expect(
			rayHitAxisPlane(
				{ origin: { x: 1, y: 4, z: 2 }, direction: { x: 0, y: -1, z: 0 } },
				'y',
				0,
			),
		).toEqual({ x: 1, y: 0, z: 2 });
		expect(
			rayHitAxisPlane(
				{ origin: { x: 0, y: 1, z: 0 }, direction: { x: 0, y: 1, z: 0 } },
				'y',
				0,
			),
		).toBeNull();
	});
});

describe('boxFromDrag', () => {
	it('extrudes one grid step up from a top-view drag', () => {
		expect(
			boxFromDrag('top', { x: 0.1, y: 0, z: 0.2 }, { x: 2.1, y: 0, z: 1.2 }, 1),
		).toEqual({
			min: { x: 0, y: 0, z: 0 },
			max: { x: 2, y: 1, z: 1 },
		});
	});

	it('grows a short drag to one cell and extrudes along X in the side view', () => {
		expect(
			boxFromDrag('side', { x: 0, y: 0.1, z: 0.1 }, { x: 0, y: 0.2, z: 0.2 }, 1),
		).toEqual({
			min: { x: 0, y: 0, z: 0 },
			max: { x: 1, y: 1, z: 1 },
		});
	});
});

describe('clipPlaneFromPoints', () => {
	it('builds a vertical plane from a top-view line', () => {
		const plane = clipPlaneFromPoints(
			'top',
			{ x: 0, y: 0, z: 0 },
			{ x: 0, y: 0, z: 2 },
		);
		expect(plane).not.toBeNull();
		expect(plane!.normal.y).toBe(0);
		expect(Math.hypot(plane!.normal.x, plane!.normal.z)).toBeCloseTo(1, 5);
		expect(plane!.distance).toBeCloseTo(0, 5);
	});

	it('rejects a zero-length line', () => {
		expect(
			clipPlaneFromPoints('side', { x: 0, y: 1, z: 1 }, { x: 4, y: 1, z: 1 }),
		).toBeNull();
	});
});

describe('levelCollisionHulls', () => {
	it('packs a unit box into one hull that contains both corners', () => {
		const [hull] = levelCollisionHulls([
			{ id: 'floor', planes: boxBrush({ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }) },
		]);
		expect(hull).toBeInstanceOf(Float32Array);
		expect(hull!.length).toBe(24);
		const points: Array<[number, number, number]> = [];
		for (let i = 0; i < hull!.length; i += 3) {
			points.push([hull![i]!, hull![i + 1]!, hull![i + 2]!]);
		}
		expect(points).toContainEqual([0, 0, 0]);
		expect(points).toContainEqual([1, 1, 1]);
	});

	it('skips a brush that does not compile', () => {
		expect(
			levelCollisionHulls([
				{ id: 'open', planes: [{ normal: { x: 1, y: 0, z: 0 }, distance: 1 }] },
			]),
		).toEqual([]);
	});
});
