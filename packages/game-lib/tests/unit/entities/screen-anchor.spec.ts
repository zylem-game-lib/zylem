import { OrthographicCamera, PerspectiveCamera, Vector2 } from 'three';
import { describe, expect, it } from 'vitest';

import {
	anchoredPoint,
	placeOnViewport,
	viewportSize,
	type ScreenAnchor,
} from '../../../src/lib/entities/screen-anchor';

// An 8 × 6 view plane over an 800 × 600 viewport: 0.01 units per pixel.
const viewport = { width: 800, height: 600 };
const orthographic = () => new OrthographicCamera(-4, 4, 3, -3, 0.1, 100);

describe('anchoredPoint', () => {
	it.each<[ScreenAnchor, number, number]>([
		['top-left', 0, 0],
		['top-center', 400, 0],
		['top-right', 800, 0],
		['center-left', 0, 300],
		['center', 400, 300],
		['center-right', 800, 300],
		['bottom-left', 0, 600],
		['bottom-center', 400, 600],
		['bottom-right', 800, 600],
	])('places %s at (%d, %d)', (anchor, x, y) => {
		expect(anchoredPoint(anchor, { x: 0, y: 0 }, viewport)).toEqual({ x, y });
	});

	it('adds the pixel offset, with +y pointing down', () => {
		expect(anchoredPoint('bottom-right', { x: -10, y: -20 }, viewport)).toEqual({
			x: 790,
			y: 580,
		});
	});

	it('falls back to top-left for unknown anchors', () => {
		expect(
			anchoredPoint('middle' as ScreenAnchor, { x: 5, y: 5 }, viewport),
		).toEqual({ x: 5, y: 5 });
	});
});

describe('viewportSize', () => {
	it('reads the camera screen resolution', () => {
		expect(viewportSize({ screenResolution: new Vector2(320, 240) })).toEqual({
			width: 320,
			height: 240,
		});
	});

	it('never returns a zero size', () => {
		expect(viewportSize(null)).toEqual({ width: 1, height: 1 });
		expect(viewportSize({ screenResolution: new Vector2(0, 0) })).toEqual({
			width: 1,
			height: 1,
		});
	});
});

describe('placeOnViewport', () => {
	it('scales a sprite to its pixel size on the view plane', () => {
		const placement = placeOnViewport({
			camera: orthographic(),
			viewport,
			point: { x: 400, y: 300 },
			pivot: { x: 0.5, y: 0.5 },
			size: { width: 100, height: 40 },
			zDistance: 1,
		});

		expect(placement.position.x).toBeCloseTo(0);
		expect(placement.position.y).toBeCloseTo(0);
		expect(placement.position.z).toBe(-1);
		expect(placement.scale.x).toBeCloseTo(1);
		expect(placement.scale.y).toBeCloseTo(0.4);
	});

	it('puts the pivot on the point', () => {
		// Top-left pivot on the viewport's top-left corner: the box hangs down
		// and to the right of it.
		const topLeft = placeOnViewport({
			camera: orthographic(),
			viewport,
			point: { x: 0, y: 0 },
			pivot: { x: 0, y: 0 },
			size: { width: 100, height: 40 },
			zDistance: 1,
		});
		expect(topLeft.position.x - topLeft.scale.x / 2).toBeCloseTo(-4);
		expect(topLeft.position.y + topLeft.scale.y / 2).toBeCloseTo(3);

		// Bottom-right pivot on the bottom-right corner: the box stays on screen.
		const bottomRight = placeOnViewport({
			camera: orthographic(),
			viewport,
			point: { x: 800, y: 600 },
			pivot: { x: 1, y: 1 },
			size: { width: 100, height: 40 },
			zDistance: 1,
		});
		expect(bottomRight.position.x + bottomRight.scale.x / 2).toBeCloseTo(4);
		expect(bottomRight.position.y - bottomRight.scale.y / 2).toBeCloseTo(-3);
	});

	it('uses the perspective frustum at the z distance', () => {
		// fov 90 at z = 2 gives a half height of 2; aspect 2 gives a half width of 4.
		const camera = new PerspectiveCamera(90, 2, 0.1, 100);
		const placement = placeOnViewport({
			camera,
			viewport: { width: 800, height: 400 },
			point: { x: 800, y: 0 },
			pivot: { x: 1, y: 0 },
			size: { width: 100, height: 50 },
			zDistance: 2,
		});

		expect(placement.scale.x).toBeCloseTo(1);
		expect(placement.scale.y).toBeCloseTo(0.5);
		expect(placement.position.x + placement.scale.x / 2).toBeCloseTo(4);
		expect(placement.position.y + placement.scale.y / 2).toBeCloseTo(2);
		expect(placement.position.z).toBe(-2);
	});

	it('accounts for camera zoom', () => {
		const camera = orthographic();
		camera.zoom = 2;
		const placement = placeOnViewport({
			camera,
			viewport,
			point: { x: 800, y: 600 },
			pivot: { x: 1, y: 1 },
			size: { width: 100, height: 40 },
			zDistance: 1,
		});

		expect(placement.scale.x).toBeCloseTo(0.5);
		expect(placement.scale.y).toBeCloseTo(0.2);
		expect(placement.position.x + placement.scale.x / 2).toBeCloseTo(2);
		expect(placement.position.y - placement.scale.y / 2).toBeCloseTo(-1.5);
	});
});
