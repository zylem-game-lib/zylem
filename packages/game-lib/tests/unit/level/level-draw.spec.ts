import { describe, expect, it } from 'vitest';

import { boxBrush, frameForPlane } from '@zylem/bridge';
import { levelCollisionHulls } from '../../../src/lib/level/level-collision';
import {
	AxisDrag,
	MIN_PLANE_INCIDENCE,
	drawViewForCamera,
	drawViewForDirection,
	facingAxisPlane,
	fallbackDrawFrame,
	rayHitAxisPlane,
	rayHitPlane,
	snapInFrame,
	snapOntoPlane,
	snapValue,
} from '../../../src/lib/level/level-draw';

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

	it('keeps every isometric camera on the ground when rounding tips the tie', () => {
		const third = 1 / Math.sqrt(3);
		for (const sx of [-1, 1]) {
			for (const sy of [-1, 1]) {
				for (const sz of [-1, 1]) {
					const direction = { x: sx * (third + 1e-7), y: sy * (third - 1e-7), z: sz * third };
					expect(drawViewForDirection(direction)).toBe('top');
				}
			}
		}
		expect(drawViewForDirection({ x: 0.5773503, y: -0.5773502, z: 0.5773503 })).toBe('top');
		expect(drawViewForDirection({ x: 0.7, y: 0.5, z: 0.5 })).toBe('side');
	});
});

describe('plane hits', () => {
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

	it('refuses a ray that grazes the plane', () => {
		const ray = (drop: number) => ({
			origin: { x: 0, y: 1, z: 0 },
			direction: { x: Math.sqrt(1 - drop * drop), y: -drop, z: 0 },
		});
		const up = { x: 0, y: 1, z: 0 };
		expect(MIN_PLANE_INCIDENCE).toBeCloseTo(0.05);
		expect(rayHitPlane(ray(0.03), up, 0)).toBeNull();
		const hit = rayHitPlane(ray(0.06), up, 0);
		expect(hit?.y).toBeCloseTo(0, 9);
		expect(hit?.x).toBeCloseTo(Math.sqrt(1 - 0.06 * 0.06) / 0.06, 9);
	});
});

describe('draw frames', () => {
	it('falls back to the ground in every unlocked camera', () => {
		const iso = fallbackDrawFrame('editor:isometric', { x: -1, y: -1, z: -1 });
		expect(iso).toEqual(frameForPlane({ x: 0, y: 1, z: 0 }, 0));
		expect(fallbackDrawFrame('editor:free', { x: 0, y: -0.2, z: -1 }).normal).toEqual({ x: 0, y: 1, z: 0 });
	});

	it('falls back to the view plane, facing the camera, in top, bottom, left, and side', () => {
		expect(fallbackDrawFrame('editor:top', { x: 0, y: -1, z: 0 }).normal).toEqual({ x: 0, y: 1, z: 0 });
		expect(fallbackDrawFrame('editor:bottom', { x: 0, y: 1, z: 0 }).normal).toEqual({ x: 0, y: -1, z: 0 });
		expect(fallbackDrawFrame('editor:side', { x: -1, y: 0, z: 0 }).normal).toEqual({ x: 1, y: 0, z: 0 });
		expect(fallbackDrawFrame('editor:left', { x: 1, y: 0, z: 0 }).normal).toEqual({ x: -1, y: 0, z: 0 });
	});

	it('moves elements on the axis plane the camera faces', () => {
		const point = { x: 1, y: 2, z: 3 };
		const iso = { x: -0.5773503, y: -0.5773502, z: -0.5773503 };
		expect(facingAxisPlane('editor:isometric', iso, point)).toEqual({ normal: { x: 0, y: 1, z: 0 }, distance: 2 });
		expect(facingAxisPlane('editor:side', { x: -1, y: 0, z: 0 }, point)).toEqual({ normal: { x: 1, y: 0, z: 0 }, distance: 1 });
		expect(facingAxisPlane('editor:free', { x: 0.1, y: -0.2, z: -0.97 }, point)).toEqual({ normal: { x: 0, y: 0, z: 1 }, distance: 3 });
	});
});

describe('grid snapping', () => {
	it('snaps in world space, then reads the point in frame coordinates', () => {
		const ground = frameForPlane({ x: 0, y: 1, z: 0 }, 0);
		expect(snapInFrame(ground, { x: 0.6, y: 0, z: -1.4 }, 0.5)).toEqual({ u: 0.5, v: 1.5 });
		// A wall facing +X: u runs along -Z and v up.
		const wall = frameForPlane({ x: 1, y: 0, z: 0 }, 2);
		expect(snapInFrame(wall, { x: 2, y: 1.2, z: 0.9 }, 0.5)).toEqual({ u: -1, v: 1 });
	});

	it('leaves the point alone with snapping off', () => {
		const ground = frameForPlane({ x: 0, y: 1, z: 0 }, 0);
		expect(snapInFrame(ground, { x: 0.6, y: 0, z: -1.4 }, 0)).toEqual({ u: 0.6, v: 1.4 });
	});

	it('puts a snapped point back on a slanted plane', () => {
		const normal = { x: Math.SQRT1_2, y: Math.SQRT1_2, z: 0 };
		const point = snapOntoPlane({ x: 0.3, y: 1.2, z: 0.4 }, { normal, distance: 1 }, 0.5);
		expect(normal.x * point.x + normal.y * point.y).toBeCloseTo(1, 9);
		expect(point.z).toBe(0.5);
	});

	it('rounds to the step and drops negative zero', () => {
		expect(snapValue(0.74, 0.25)).toBe(0.75);
		expect(Object.is(snapValue(-0.1, 0.5), 0)).toBe(true);
		expect(snapValue(0.33, 0)).toBe(0.33);
	});
});

describe('AxisDrag', () => {
	it('follows the closest point on the axis while the view crosses it', () => {
		const view = { direction: { x: 0, y: 0, z: -1 }, up: { x: 0, y: 1, z: 0 } };
		const start = { origin: { x: 0, y: 0, z: 10 }, direction: { x: 0, y: 0, z: -1 } };
		const drag = new AxisDrag({ x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, start, view);
		expect(drag.onScreen).toBe(false);
		expect(drag.measure({ origin: { x: 0, y: 2.5, z: 10 }, direction: { x: 0, y: 0, z: -1 } })).toBeCloseTo(2.5, 9);
	});

	it('reads travel up the screen when the axis points at the viewer', () => {
		// The top view: looking down the axis, with -Z up the screen.
		const view = { direction: { x: 0, y: -1, z: 0 }, up: { x: 0, y: 0, z: -1 } };
		const start = { origin: { x: 1, y: 50, z: 1 }, direction: { x: 0, y: -1, z: 0 } };
		const moved = { origin: { x: 1, y: 50, z: -1 }, direction: { x: 0, y: -1, z: 0 } };
		const toward = new AxisDrag({ x: 1, y: 0, z: 1 }, { x: 0, y: 1, z: 0 }, start, view);
		expect(toward.onScreen).toBe(true);
		expect(toward.measure(moved)).toBeCloseTo(2, 9);
		const away = new AxisDrag({ x: 1, y: 0, z: 1 }, { x: 0, y: -1, z: 0 }, start, view);
		expect(away.measure(moved)).toBeCloseTo(-2, 9);
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
