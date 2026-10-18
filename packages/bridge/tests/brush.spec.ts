import { describe, expect, it } from 'vitest';

import {
	boxBrush,
	clipBrush,
	compileBrush,
	setBrushVertex,
	translateBrush,
	type BrushPlane,
	type BrushVec3,
	type CompiledBrush,
} from '../src/level/brush';

const UNIT_MIN: BrushVec3 = { x: 0, y: 0, z: 0 };
const UNIT_MAX: BrushVec3 = { x: 1, y: 1, z: 1 };

function compiled(planes: readonly BrushPlane[]): CompiledBrush {
	const brush = compileBrush(planes);
	expect(brush).not.toBeNull();
	return brush as CompiledBrush;
}

function bounds(planes: readonly BrushPlane[]): { min: BrushVec3; max: BrushVec3 } {
	const { vertices } = compiled(planes);
	const min = { x: Infinity, y: Infinity, z: Infinity };
	const max = { x: -Infinity, y: -Infinity, z: -Infinity };
	for (const vertex of vertices) {
		min.x = Math.min(min.x, vertex.x);
		min.y = Math.min(min.y, vertex.y);
		min.z = Math.min(min.z, vertex.z);
		max.x = Math.max(max.x, vertex.x);
		max.y = Math.max(max.y, vertex.y);
		max.z = Math.max(max.z, vertex.z);
	}
	return { min, max };
}

function closeToVec(actual: BrushVec3, expected: BrushVec3): void {
	expect(actual.x).toBeCloseTo(expected.x, 4);
	expect(actual.y).toBeCloseTo(expected.y, 4);
	expect(actual.z).toBeCloseTo(expected.z, 4);
}

function hasPoint(planes: readonly BrushPlane[], point: BrushVec3): boolean {
	return compiled(planes).vertices.some(
		(vertex) =>
			Math.abs(vertex.x - point.x) < 1e-4 &&
			Math.abs(vertex.y - point.y) < 1e-4 &&
			Math.abs(vertex.z - point.z) < 1e-4,
	);
}

function volume(planes: readonly BrushPlane[]): number {
	const brush = compiled(planes);
	let sum = 0;
	for (const face of brush.faces) {
		const a = brush.vertices[face.indices[0]!]!;
		for (let i = 1; i < face.indices.length - 1; i += 1) {
			const b = brush.vertices[face.indices[i]!]!;
			const c = brush.vertices[face.indices[i + 1]!]!;
			sum +=
				a.x * (b.y * c.z - b.z * c.y) +
				a.y * (b.z * c.x - b.x * c.z) +
				a.z * (b.x * c.y - b.y * c.x);
		}
	}
	return sum / 6;
}

describe('boxBrush', () => {
	it('compiles a unit box to eight corners and six faces', () => {
		const brush = compiled(boxBrush(UNIT_MIN, UNIT_MAX));
		expect(brush.vertices).toHaveLength(8);
		expect(brush.faces).toHaveLength(6);
		expect(hasPoint(boxBrush(UNIT_MIN, UNIT_MAX), UNIT_MIN)).toBe(true);
		expect(hasPoint(boxBrush(UNIT_MIN, UNIT_MAX), UNIT_MAX)).toBe(true);
		expect(volume(boxBrush(UNIT_MIN, UNIT_MAX))).toBeCloseTo(1, 4);
	});

	it('swaps inverted corners and rejects a flat box', () => {
		closeToVec(bounds(boxBrush(UNIT_MAX, UNIT_MIN)).min, UNIT_MIN);
		closeToVec(bounds(boxBrush(UNIT_MAX, UNIT_MIN)).max, UNIT_MAX);
		expect(compileBrush(boxBrush(UNIT_MIN, { x: 1, y: 0, z: 1 }))).toBeNull();
		expect(compileBrush([{ normal: { x: 1, y: 0, z: 0 }, distance: 1 }])).toBeNull();
	});
});

describe('translateBrush', () => {
	it('shifts every corner by the delta', () => {
		const moved = translateBrush(boxBrush(UNIT_MIN, UNIT_MAX), { x: 2, y: -1, z: 0 });
		const box = bounds(moved);
		closeToVec(box.min, { x: 2, y: -1, z: 0 });
		closeToVec(box.max, { x: 3, y: 0, z: 1 });
	});
});

describe('clipBrush', () => {
	const box = boxBrush(UNIT_MIN, UNIT_MAX);
	const clip = { normal: { x: 1, y: 0, z: 0 }, distance: 0.5 };

	it('splits a box into the two sides of the plane', () => {
		const sides = clipBrush(box, clip);
		expect(sides).toHaveLength(2);
		const [keep, drop] = sides as [BrushPlane[], BrushPlane[]];
		closeToVec(bounds(keep).min, UNIT_MIN);
		closeToVec(bounds(keep).max, { x: 0.5, y: 1, z: 1 });
		closeToVec(bounds(drop).min, { x: 0.5, y: 0, z: 0 });
		closeToVec(bounds(drop).max, UNIT_MAX);
	});

	it('returns the original solid when the plane misses', () => {
		const sides = clipBrush(box, { normal: { x: 1, y: 0, z: 0 }, distance: 10 });
		expect(sides).toHaveLength(1);
		closeToVec(bounds(sides[0]!).min, UNIT_MIN);
		closeToVec(bounds(sides[0]!).max, UNIT_MAX);
	});
});

describe('setBrushVertex', () => {
	const box = boxBrush(UNIT_MIN, UNIT_MAX);

	function indexOf(point: BrushVec3): number {
		const index = compiled(box).vertices.findIndex(
			(vertex) =>
				Math.abs(vertex.x - point.x) < 1e-4 &&
				Math.abs(vertex.y - point.y) < 1e-4 &&
				Math.abs(vertex.z - point.z) < 1e-4,
		);
		expect(index).toBeGreaterThanOrEqual(0);
		return index;
	}

	it('keeps the same corners when a vertex is set back to itself', () => {
		const corner = indexOf(UNIT_MAX);
		const next = setBrushVertex(box, corner, UNIT_MAX);
		expect(next).not.toBeNull();
		expect(compiled(next!).vertices).toHaveLength(8);
		expect(hasPoint(next!, UNIT_MIN)).toBe(true);
		expect(hasPoint(next!, UNIT_MAX)).toBe(true);
	});

	it('accepts a corner pulled outward and rejects one pushed inside', () => {
		const corner = indexOf(UNIT_MAX);
		const outward = setBrushVertex(box, corner, { x: 2, y: 2, z: 2 });
		expect(outward).not.toBeNull();
		expect(hasPoint(outward!, { x: 2, y: 2, z: 2 })).toBe(true);
		expect(hasPoint(outward!, UNIT_MIN)).toBe(true);

		expect(setBrushVertex(box, corner, { x: 0.5, y: 0.5, z: 0.5 })).toBeNull();
		expect(setBrushVertex(box, 40, UNIT_MAX)).toBeNull();
	});
});
