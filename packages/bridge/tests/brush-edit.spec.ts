import { describe, expect, it } from 'vitest';

import {
	boxBrush,
	brushBounds,
	brushCenter,
	compileBrush,
	type BrushPlane,
	type BrushVec3,
	type CompiledBrush,
} from '../src/level/brush';
import {
	brushEdges,
	brushTopology,
	elementPositions,
	extrudeFace,
	findElementAt,
	moveElements,
	moveFace,
	moveFaces,
	rotateBrush,
	scaleBrush,
	shearFaces,
	subdivideBrush,
	type BrushElementKey,
} from '../src/level/brush-edit';

const UNIT = boxBrush({ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 });

function compiled(planes: readonly BrushPlane[]): CompiledBrush {
	const brush = compileBrush(planes);
	expect(brush).not.toBeNull();
	return brush as CompiledBrush;
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
			Math.abs(vertex.z - point.z) < 1e-4
	);
}

function planeIndex(planes: readonly BrushPlane[], normal: BrushVec3): number {
	const index = planes.findIndex(
		(plane) =>
			Math.abs(plane.normal.x - normal.x) < 1e-6 &&
			Math.abs(plane.normal.y - normal.y) < 1e-6 &&
			Math.abs(plane.normal.z - normal.z) < 1e-6
	);
	expect(index).toBeGreaterThanOrEqual(0);
	return index;
}

const TOP = planeIndex(UNIT, { x: 0, y: 1, z: 0 });
const BOTTOM = planeIndex(UNIT, { x: 0, y: -1, z: 0 });
const RIGHT = planeIndex(UNIT, { x: 1, y: 0, z: 0 });
const TOP_RIGHT: BrushElementKey = { kind: 'edge', planes: [TOP, RIGHT].sort((a, b) => a - b) };

describe('brushBounds and brushCenter', () => {
	it('measure the compiled corners', () => {
		const box = boxBrush({ x: -1, y: 0, z: 2 }, { x: 3, y: 2, z: 4 });
		const bounds = brushBounds(box);
		closeToVec(bounds!.min, { x: -1, y: 0, z: 2 });
		closeToVec(bounds!.max, { x: 3, y: 2, z: 4 });
		closeToVec(brushCenter(box)!, { x: 1, y: 1, z: 3 });
		expect(brushBounds([])).toBeNull();
	});
});

describe('brushTopology', () => {
	it('names every corner by three planes and every edge by two', () => {
		const topology = brushTopology(UNIT)!;
		expect(topology.vertices).toHaveLength(8);
		expect(topology.vertexPlanes.every((planes) => planes.length === 3)).toBe(true);
		expect(topology.edges).toHaveLength(12);
		for (const edge of topology.edges) {
			expect(edge.planes[0]).toBeLessThan(edge.planes[1]);
		}
		expect(brushEdges(UNIT)).toEqual(topology.edges);
	});

	it('locates face, edge, and vertex positions', () => {
		const face = elementPositions(UNIT, { kind: 'face', planes: [TOP] })!;
		expect(face).toHaveLength(4);
		expect(face.every((point) => Math.abs(point.y - 1) < 1e-6)).toBe(true);

		const edge = elementPositions(UNIT, TOP_RIGHT)!;
		expect(edge).toHaveLength(2);
		expect(
			edge.every((point) => Math.abs(point.y - 1) < 1e-6 && Math.abs(point.x - 1) < 1e-6)
		).toBe(true);

		const corner = findElementAt(UNIT, 'vertex', [{ x: 1, y: 1, z: 1 }])!;
		expect(corner.planes).toHaveLength(3);
		closeToVec(elementPositions(UNIT, corner)![0]!, { x: 1, y: 1, z: 1 });

		expect(findElementAt(UNIT, 'face', face)).toEqual({ kind: 'face', planes: [TOP] });
		expect(findElementAt(UNIT, 'edge', [...edge].reverse())).toEqual(TOP_RIGHT);
		expect(elementPositions(UNIT, { kind: 'edge', planes: [TOP, BOTTOM] })).toBeNull();
	});
});

describe('moveFace', () => {
	it('pushes a face out along its normal and keeps the plane list', () => {
		const taller = moveFace(UNIT, TOP, 1);
		expect(taller).not.toBeNull();
		expect(brushBounds(taller!)!.max.y).toBeCloseTo(2, 6);
		expect(taller).toHaveLength(UNIT.length);
	});

	it('moves several faces of one brush along their own normals', () => {
		const grown = moveFaces(UNIT, [TOP, BOTTOM], 1);
		const bounds = brushBounds(grown!)!;
		expect(bounds.min.y).toBeCloseTo(-1, 6);
		expect(bounds.max.y).toBeCloseTo(2, 6);
	});

	it('rejects a pull that collapses the brush', () => {
		expect(moveFace(UNIT, TOP, -1)).toBeNull();
		expect(moveFace(UNIT, TOP, -2)).toBeNull();
		expect(moveFace(UNIT, 40, 1)).toBeNull();
	});

	it('rejects a push that leaves the moved face with no area', () => {
		// A square pyramid frustum: pushing the top past the apex removes it.
		const frustum: BrushPlane[] = [
			{ normal: { x: 0, y: -1, z: 0 }, distance: 0 },
			{ normal: { x: 0, y: 1, z: 0 }, distance: 1 },
			...[
				{ x: 1, z: 0 },
				{ x: -1, z: 0 },
				{ x: 0, z: 1 },
				{ x: 0, z: -1 },
			].map(({ x, z }) => ({
				normal: { x: x * Math.SQRT1_2, y: Math.SQRT1_2, z: z * Math.SQRT1_2 },
				distance: 2 * Math.SQRT1_2,
			})),
		];
		expect(compileBrush(frustum)).not.toBeNull();
		expect(moveFace(frustum, 1, 0.5)).not.toBeNull();
		expect(moveFace(frustum, 1, 2)).toBeNull();
	});
});

describe('extrudeFace', () => {
	it('sweeps a face into a new brush whose first plane faces the same way', () => {
		const step = extrudeFace(UNIT, TOP, 2)!;
		const bounds = brushBounds(step)!;
		closeToVec(bounds.min, { x: 0, y: 1, z: 0 });
		closeToVec(bounds.max, { x: 1, y: 3, z: 1 });
		closeToVec(step[0]!.normal, { x: 0, y: 1, z: 0 });
	});

	it('sweeps inward for a negative distance and rejects zero', () => {
		const inner = brushBounds(extrudeFace(UNIT, TOP, -0.5)!)!;
		expect(inner.min.y).toBeCloseTo(0.5, 6);
		expect(inner.max.y).toBeCloseTo(1, 6);
		expect(extrudeFace(UNIT, TOP, 0)).toBeNull();
		expect(extrudeFace(UNIT, 40, 1)).toBeNull();
	});
});

describe('moveElements', () => {
	it('slides a face sideways into a parallelepiped and keeps it selected', () => {
		const result = moveElements(UNIT, [{ kind: 'face', planes: [TOP] }], { x: 1, y: 0, z: 0 });
		expect(result).not.toBeNull();
		expect(compiled(result!.planes).vertices).toHaveLength(8);
		expect(hasPoint(result!.planes, { x: 2, y: 1, z: 1 })).toBe(true);
		expect(hasPoint(result!.planes, { x: 0, y: 0, z: 0 })).toBe(true);
		expect(result!.keys).toHaveLength(1);
		const moved = elementPositions(result!.planes, result!.keys[0]!)!;
		expect(moved.every((point) => Math.abs(point.y - 1) < 1e-6)).toBe(true);
		expect(Math.min(...moved.map((point) => point.x))).toBeCloseTo(1, 6);
	});

	it('lifts an edge into a ramp', () => {
		const result = moveElements(UNIT, [TOP_RIGHT], { x: 0, y: 1, z: 0 });
		expect(result).not.toBeNull();
		expect(hasPoint(result!.planes, { x: 1, y: 2, z: 0 })).toBe(true);
		const positions = elementPositions(result!.planes, result!.keys[0]!)!;
		expect(positions.every((point) => Math.abs(point.y - 2) < 1e-6)).toBe(true);
	});

	it('pulls one corner up and splits the top into two triangles', () => {
		const corner = findElementAt(UNIT, 'vertex', [{ x: 1, y: 1, z: 1 }])!;
		const result = moveElements(UNIT, [corner], { x: 0, y: 1, z: 0 })!;
		expect(compiled(result.planes).faces).toHaveLength(7);
		closeToVec(elementPositions(result.planes, result.keys[0]!)![0]!, { x: 1, y: 2, z: 1 });
	});

	it('rejects a corner pushed inside the solid', () => {
		const corner = findElementAt(UNIT, 'vertex', [{ x: 1, y: 1, z: 1 }])!;
		expect(moveElements(UNIT, [corner], { x: -0.5, y: -0.5, z: -0.5 })).toBeNull();
	});

	it('rejects a key the brush does not have', () => {
		expect(moveElements(UNIT, [{ kind: 'face', planes: [40] }], { x: 0, y: 1, z: 0 })).toBeNull();
	});

	it('leaves the brush as it was for a zero delta', () => {
		const result = moveElements(UNIT, [{ kind: 'face', planes: [TOP] }], { x: 0, y: 0, z: 0 });
		expect(result!.planes).toEqual(UNIT);
		expect(result!.keys).toEqual([{ kind: 'face', planes: [TOP] }]);
	});
});

describe('shearFaces', () => {
	it('drops the part of the delta along each face normal', () => {
		const result = shearFaces(UNIT, [TOP], { x: 1, y: 5, z: 0 });
		expect(result).not.toBeNull();
		expect(brushBounds(result!.planes)!.max.y).toBeCloseTo(1, 6);
		expect(hasPoint(result!.planes, { x: 2, y: 1, z: 0 })).toBe(true);
		expect(result!.keys).toHaveLength(1);
	});
});

describe('rotateBrush', () => {
	it('turns a brush a quarter turn about a vertical axis through a pivot', () => {
		const slab = boxBrush({ x: 0, y: 0, z: 0 }, { x: 4, y: 1, z: 2 });
		const turned = rotateBrush(slab, { x: 0, y: 1, z: 0 }, Math.PI / 2, { x: 0, y: 0, z: 0 });
		const bounds = brushBounds(turned!)!;
		closeToVec(bounds.min, { x: 0, y: 0, z: -4 });
		closeToVec(bounds.max, { x: 2, y: 1, z: 0 });
		expect(turned).toHaveLength(slab.length);
	});

	it('keeps the pivot fixed', () => {
		const turned = rotateBrush(UNIT, { x: 0, y: 0, z: 1 }, Math.PI, { x: 0.5, y: 0.5, z: 0.5 });
		closeToVec(brushCenter(turned!)!, { x: 0.5, y: 0.5, z: 0.5 });
	});
});

describe('scaleBrush', () => {
	it('scales about a pivot', () => {
		const scaled = scaleBrush(UNIT, { x: 2, y: 3, z: 1 }, { x: 0, y: 0, z: 0 });
		const bounds = brushBounds(scaled!)!;
		closeToVec(bounds.max, { x: 2, y: 3, z: 1 });
		closeToVec(bounds.min, { x: 0, y: 0, z: 0 });
		const centered = brushBounds(
			scaleBrush(UNIT, { x: 2, y: 2, z: 2 }, { x: 0.5, y: 0.5, z: 0.5 })!
		)!;
		closeToVec(centered.min, { x: -0.5, y: -0.5, z: -0.5 });
	});

	it('rejects a factor that would flatten or mirror', () => {
		expect(scaleBrush(UNIT, { x: 0, y: 1, z: 1 }, { x: 0, y: 0, z: 0 })).toBeNull();
		expect(scaleBrush(UNIT, { x: -1, y: 1, z: 1 }, { x: 0, y: 0, z: 0 })).toBeNull();
	});
});

describe('subdivideBrush', () => {
	it('cuts a floor into tiles on world grid lines', () => {
		const floor = boxBrush({ x: 0, y: 0, z: 0 }, { x: 4, y: 1, z: 4 });
		const tiles = subdivideBrush(floor, 2);
		expect(tiles).toHaveLength(4);
		for (const tile of tiles!) {
			const bounds = brushBounds(tile)!;
			expect(bounds.max.x - bounds.min.x).toBeCloseTo(2, 6);
			expect(bounds.max.z - bounds.min.z).toBeCloseTo(2, 6);
			expect(bounds.max.y - bounds.min.y).toBeCloseTo(1, 6);
		}
	});

	it('cuts on absolute grid lines, not from the brush corner', () => {
		const offset = boxBrush({ x: 1, y: 0, z: 0 }, { x: 5, y: 1, z: 2 });
		const tiles = subdivideBrush(offset, 2)!;
		const widths = tiles.map((tile) => {
			const bounds = brushBounds(tile)!;
			return Math.round((bounds.max.x - bounds.min.x) * 1000) / 1000;
		});
		expect(widths.sort()).toEqual([1, 1, 2]);
	});

	it('returns the brush unchanged when no grid line crosses it', () => {
		const tiles = subdivideBrush(UNIT, 4)!;
		expect(tiles).toHaveLength(1);
	});

	it('refuses to cut more pieces than the cap', () => {
		const floor = boxBrush({ x: 0, y: 0, z: 0 }, { x: 64, y: 1, z: 64 });
		expect(subdivideBrush(floor, 1, { maxPieces: 100 })).toBeNull();
		expect(subdivideBrush(floor, 0)).toBeNull();
	});
});
