import { describe, expect, it } from 'vitest';

import {
	computeBounds2DHits,
	createBounds2DRect,
	getBounds2DNormalFromHits,
	wrapPoint2D,
} from '../../../src/lib/behaviors/shared/bounds-2d';

describe('bounds-2d helpers', () => {
	it('creates a centered rectangle from size', () => {
		expect(createBounds2DRect({ width: 10, height: 6, centerX: 2, centerY: -1 })).toEqual({
			minX: -3,
			maxX: 7,
			minY: -4,
			maxY: 2,
		});
	});

	it('classifies boundary hits and normals consistently', () => {
		const hits = computeBounds2DHits(
			{ x: -5, y: 3 },
			{ minX: -5, maxX: 5, minY: -3, maxY: 3 },
		);

		expect(hits).toEqual({
			left: true,
			right: false,
			top: true,
			bottom: false,
		});
		expect(getBounds2DNormalFromHits(hits)).toEqual({ x: 1, y: -1 });
	});

	it('wraps points across both axes', () => {
		expect(
			wrapPoint2D(
				{ x: 7, y: -6 },
				{ minX: -5, maxX: 5, minY: -4, maxY: 4 },
			),
		).toEqual({
			x: -3,
			y: 2,
			wrapped: true,
		});
	});
});
