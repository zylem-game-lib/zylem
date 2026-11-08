import { describe, expect, it } from 'vitest';

import { DEFAULT_DRAW_SHAPE, boxBrush, brushBounds, primitiveBrushes } from '@zylem/bridge';
import { levelCollisionHulls } from '../../../src/lib/level/level-collision';
import {
	boxFromDrag,
	clipPlaneFromPoints,
	drawViewForCamera,
	drawViewForDirection,
	primitiveFromBox,
	rayHitAxisPlane,
} from '../../../src/lib/level/level-draw';

describe('primitiveFromBox', () => {
	it('bakes back to the same box through the ground frame', () => {
		const box = { min: { x: -1, y: 2, z: 3 }, max: { x: 4, y: 5, z: 6 } };
		const gesture = primitiveFromBox(box, DEFAULT_DRAW_SHAPE);
		const brushes = primitiveBrushes('box', gesture.frame, gesture.footprint, gesture.height);
		expect(brushes).toHaveLength(1);
		const bounds = brushBounds(brushes![0]!)!;
		expect(bounds.min.x).toBeCloseTo(-1, 6);
		expect(bounds.min.y).toBeCloseTo(2, 6);
		expect(bounds.min.z).toBeCloseTo(3, 6);
		expect(bounds.max.x).toBeCloseTo(4, 6);
		expect(bounds.max.y).toBeCloseTo(5, 6);
		expect(bounds.max.z).toBeCloseTo(6, 6);
	});
});

describe('draw views', () => {
	it('locks the top, bottom, left, and side cameras and leaves every other camera to its facing', () => {
		expect(drawViewForCamera('editor:top')).toBe('top');
		expect(drawViewForCamera('editor:bottom')).toBe('top');
		expect(drawViewForCamera('editor:side')).toBe('side');
		expect(drawViewForCamera('editor:left')).toBe('side');
		expect(drawViewForCamera('editor:free')).toBeNull();
		expect(drawViewForCamera('editor:perspective')).toBeNull();
		expect(drawViewForCamera('editor:iso-left-top')).toBeNull();
		expect(drawViewForCamera('game')).toBeNull();
		expect(drawViewForCamera(null)).toBeNull();
	});

	it('picks the axis a camera faces, preferring top on a tie', () => {
		expect(drawViewForDirection({ x: 0, y: -1, z: 0.2 })).toBe('top');
		expect(drawViewForDirection({ x: 1, y: 0.2, z: 0 })).toBe('side');
		expect(drawViewForDirection({ x: 0.1, y: 0, z: -1 })).toBe('front');
		expect(drawViewForDirection({ x: 1, y: 1, z: 1 })).toBe('top');
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

	it('extrudes one grid step along Z from a front-view drag', () => {
		expect(
			boxFromDrag('front', { x: 0.2, y: 0.2, z: 3 }, { x: 1.2, y: 2.2, z: 3 }, 1),
		).toEqual({
			min: { x: 0, y: 0, z: 3 },
			max: { x: 1, y: 2, z: 4 },
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

	it('builds a plane containing Z from a front-view line', () => {
		const plane = clipPlaneFromPoints(
			'front',
			{ x: 0, y: 0, z: 4 },
			{ x: 2, y: 0, z: 4 },
		);
		expect(plane).not.toBeNull();
		expect(plane!.normal.z).toBe(0);
		expect(Math.hypot(plane!.normal.x, plane!.normal.y)).toBeCloseTo(1, 5);
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
