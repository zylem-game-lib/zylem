import { describe, expect, it } from 'vitest';

import {
	compileBrush,
	type BrushPlane,
	type BrushVec3,
	type CompiledBrush,
} from '../src/level/brush';
import {
	frameForPlane,
	framePoint,
	pointInFrame,
	primitiveBrushes,
	type BrushFrame,
} from '../src/level/brush-shapes';

const GROUND: BrushFrame = frameForPlane({ x: 0, y: 1, z: 0 }, 0);

function compiled(planes: readonly BrushPlane[]): CompiledBrush {
	const brush = compileBrush(planes);
	expect(brush).not.toBeNull();
	return brush as CompiledBrush;
}

function bounds(brushes: ReadonlyArray<readonly BrushPlane[]>): { min: BrushVec3; max: BrushVec3 } {
	const min = { x: Infinity, y: Infinity, z: Infinity };
	const max = { x: -Infinity, y: -Infinity, z: -Infinity };
	for (const planes of brushes) {
		for (const vertex of compiled(planes).vertices) {
			min.x = Math.min(min.x, vertex.x);
			min.y = Math.min(min.y, vertex.y);
			min.z = Math.min(min.z, vertex.z);
			max.x = Math.max(max.x, vertex.x);
			max.y = Math.max(max.y, vertex.y);
			max.z = Math.max(max.z, vertex.z);
		}
	}
	return { min, max };
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

function closeToVec(actual: BrushVec3, expected: BrushVec3): void {
	expect(actual.x).toBeCloseTo(expected.x, 4);
	expect(actual.y).toBeCloseTo(expected.y, 4);
	expect(actual.z).toBeCloseTo(expected.z, 4);
}

function dot(a: BrushVec3, b: BrushVec3): number {
	return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(a: BrushVec3, b: BrushVec3): BrushVec3 {
	return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}

describe('frameForPlane', () => {
	it('lays the ground frame on world axes so grid snapping lines up', () => {
		closeToVec(GROUND.origin, { x: 0, y: 0, z: 0 });
		closeToVec(GROUND.normal, { x: 0, y: 1, z: 0 });
		closeToVec(GROUND.u, { x: 1, y: 0, z: 0 });
		closeToVec(cross(GROUND.u, GROUND.v), GROUND.normal);
	});

	it('puts the origin on the plane and keeps the frame right-handed when tilted', () => {
		const normal = { x: 0, y: Math.SQRT1_2, z: Math.SQRT1_2 };
		const frame = frameForPlane(normal, 2);
		expect(dot(frame.origin, frame.normal)).toBeCloseTo(2, 6);
		expect(dot(frame.u, frame.normal)).toBeCloseTo(0, 6);
		expect(dot(frame.v, frame.normal)).toBeCloseTo(0, 6);
		expect(Math.hypot(frame.u.x, frame.u.y, frame.u.z)).toBeCloseTo(1, 6);
		closeToVec(cross(frame.u, frame.v), frame.normal);
	});

	it('round-trips a point through frame coordinates', () => {
		const frame = frameForPlane({ x: 1, y: 0, z: 0 }, 3);
		const point = { x: 5, y: -2, z: 7 };
		const local = pointInFrame(frame, point);
		expect(local.h).toBeCloseTo(2, 6);
		closeToVec(framePoint(frame, local.u, local.v, local.h), point);
	});
});

describe('primitiveBrushes', () => {
	const footprint = { u0: 0, v0: 0, u1: 4, v1: 2 };

	it('draws a box over the footprint, up the frame normal', () => {
		const brushes = primitiveBrushes('box', GROUND, footprint, 3);
		expect(brushes).toHaveLength(1);
		expect(compiled(brushes![0]!).vertices).toHaveLength(8);
		expect(volume(brushes![0]!)).toBeCloseTo(24, 4);
		const box = bounds(brushes!);
		expect(box.min.y).toBeCloseTo(0, 6);
		expect(box.max.y).toBeCloseTo(3, 6);
		expect(box.max.x - box.min.x).toBeCloseTo(4, 6);
		expect(box.max.z - box.min.z).toBeCloseTo(2, 6);
	});

	it('draws below the plane for a negative height and rejects a flat one', () => {
		const box = bounds(primitiveBrushes('box', GROUND, footprint, -2)!);
		expect(box.min.y).toBeCloseTo(-2, 6);
		expect(box.max.y).toBeCloseTo(0, 6);
		expect(primitiveBrushes('box', GROUND, footprint, 0)).toBeNull();
		expect(primitiveBrushes('box', GROUND, { u0: 1, v0: 0, u1: 1, v1: 2 }, 1)).toBeNull();
	});

	it('draws on a tilted face', () => {
		const frame = frameForPlane({ x: 0, y: Math.SQRT1_2, z: Math.SQRT1_2 }, 1);
		const brushes = primitiveBrushes('box', frame, footprint, 1);
		expect(brushes).not.toBeNull();
		expect(volume(brushes![0]!)).toBeCloseTo(8, 4);
	});

	it('draws a wedge whose slope rises the way the turn says', () => {
		const rises: Array<{ turn: number; high: (vertex: BrushVec3) => boolean }> = [
			{ turn: 0, high: (vertex) => vertex.x > 3.9 },
			{ turn: 2, high: (vertex) => vertex.x < 0.1 },
		];
		for (const { turn, high } of rises) {
			const brushes = primitiveBrushes('wedge', GROUND, footprint, 3, { turn });
			const brush = compiled(brushes![0]!);
			expect(brush.faces).toHaveLength(5);
			expect(brush.vertices).toHaveLength(6);
			expect(volume(brushes![0]!)).toBeCloseTo(12, 4);
			const top = brush.vertices.filter((vertex) => vertex.y > 2.9);
			expect(top).toHaveLength(2);
			expect(top.every(high)).toBe(true);
		}
	});

	it('turns a wedge onto the other footprint axis on odd turns', () => {
		const frameV = (vertex: BrushVec3) => pointInFrame(GROUND, vertex).v;
		const up = compiled(primitiveBrushes('wedge', GROUND, footprint, 3, { turn: 1 })![0]!);
		expect(
			up.vertices.filter((vertex) => vertex.y > 2.9).every((vertex) => frameV(vertex) > 1.9)
		).toBe(true);
		const down = compiled(primitiveBrushes('wedge', GROUND, footprint, 3, { turn: 3 })![0]!);
		expect(
			down.vertices.filter((vertex) => vertex.y > 2.9).every((vertex) => frameV(vertex) < 0.1)
		).toBe(true);
	});

	it('draws a cylinder as a prism that fills the footprint', () => {
		const brushes = primitiveBrushes('cylinder', GROUND, { u0: 0, v0: 0, u1: 4, v1: 4 }, 2, {
			sides: 12,
		});
		const brush = compiled(brushes![0]!);
		expect(brush.faces).toHaveLength(14);
		expect(brush.vertices).toHaveLength(24);
		const box = bounds(brushes!);
		expect(box.max.x - box.min.x).toBeCloseTo(4, 4);
		expect(box.max.z - box.min.z).toBeCloseTo(4, 4);
		// A circumscribed 12-gon holds slightly more than the inscribed circle.
		expect(volume(brushes![0]!)).toBeGreaterThan(Math.PI * 4 * 2);
		expect(volume(brushes![0]!)).toBeLessThan(32);
	});

	it('clamps the cylinder side count', () => {
		const triangle = compiled(
			primitiveBrushes('cylinder', GROUND, footprint, 1, { sides: 1 })![0]!
		);
		expect(triangle.faces).toHaveLength(5);
	});

	it('draws an arch as one convex brush per segment', () => {
		const brushes = primitiveBrushes('arch', GROUND, { u0: 0, v0: 0, u1: 8, v1: 1 }, 4, {
			segments: 8,
			thickness: 1,
		});
		expect(brushes).toHaveLength(8);
		for (const planes of brushes!) compiled(planes);
		const box = bounds(brushes!);
		expect(box.min.y).toBeCloseTo(0, 4);
		expect(box.max.y).toBeCloseTo(4, 2);
		expect(box.min.x).toBeCloseTo(0, 4);
		expect(box.max.x).toBeCloseTo(8, 4);
		// Ground `v` runs along -z, so the wall spans z from -1 to 0.
		const contains = (point: BrushVec3) =>
			brushes!.some((planes) =>
				planes.every((plane) => dot(plane.normal, point) - plane.distance <= 1e-6)
			);
		expect(contains({ x: 4, y: 1.5, z: -0.5 })).toBe(false);
		expect(contains({ x: 0.5, y: 0.2, z: -0.5 })).toBe(true);
	});

	it('spans an arch across the other axis on odd turns', () => {
		const brushes = primitiveBrushes('arch', GROUND, { u0: 0, v0: 0, u1: 1, v1: 8 }, 4, {
			segments: 6,
			thickness: 1,
			turn: 1,
		});
		expect(brushes).toHaveLength(6);
		const box = bounds(brushes!);
		expect(box.max.x - box.min.x).toBeCloseTo(1, 4);
		expect(box.max.z - box.min.z).toBeCloseTo(8, 4);
	});

	it('fills a thick arch with solid wedges instead of failing', () => {
		const brushes = primitiveBrushes('arch', GROUND, { u0: 0, v0: 0, u1: 4, v1: 1 }, 2, {
			segments: 4,
			thickness: 10,
		});
		expect(brushes).toHaveLength(4);
		for (const planes of brushes!) compiled(planes);
	});
});
