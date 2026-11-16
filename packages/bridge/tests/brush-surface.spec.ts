import { describe, expect, it } from 'vitest';

import {
	boxBrush,
	clipBrush,
	compileBrush,
	translateBrush,
	type BrushPlane,
	type BrushSurface,
	type BrushVec3,
} from '../src/level/brush';
import {
	brushTopology,
	deleteBrushElements,
	extrudeFace,
	moveElements,
	moveFaces,
	rotateBrush,
	scaleBrush,
	subdivideBrush,
} from '../src/level/brush-edit';
import {
	carrySurfaces,
	createSurface,
	sameSurface,
	surfaceAxes,
	surfaceUv,
} from '../src/level/brush-surface';
import {
	BUILTIN_TEXTURES,
	builtinTextureKey,
	builtinTexturePixels,
} from '../src/level/builtin-textures';
import { navigationSourceHash } from '../src/navigation';
import type { LevelDocument } from '../src/protocol';

const BRICK: BrushSurface = {
	textureId: 'builtin:brick',
	scale: { u: 2, v: 2 },
	offset: { u: 0.25, v: 0 },
	rotation: 0,
};
const GRID = createSurface('builtin:grid');

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

function paint(planes: readonly BrushPlane[], normal: BrushVec3, surface: BrushSurface): BrushPlane[] {
	const index = planeIndex(planes, normal);
	return planes.map((plane, at) => (at === index ? { ...plane, surface } : { ...plane }));
}

function surfaceFacing(planes: readonly BrushPlane[], normal: BrushVec3): BrushSurface | undefined {
	return planes[planeIndex(planes, normal)]!.surface;
}

function closeToVec(actual: BrushVec3, expected: BrushVec3): void {
	expect(actual.x).toBeCloseTo(expected.x, 6);
	expect(actual.y).toBeCloseTo(expected.y, 6);
	expect(actual.z).toBeCloseTo(expected.z, 6);
}

const UP = { x: 0, y: 1, z: 0 };
const DOWN = { x: 0, y: -1, z: 0 };
const EAST = { x: 1, y: 0, z: 0 };
const SOUTH = { x: 0, y: 0, z: 1 };

const UNIT = boxBrush({ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 });
const TOPPED = paint(UNIT, UP, BRICK);

describe('surfaceAxes', () => {
	it('runs U east and V north on a floor', () => {
		const axes = surfaceAxes(UP);
		closeToVec(axes.u, { x: 1, y: 0, z: 0 });
		closeToVec(axes.v, { x: 0, y: 0, z: -1 });
	});

	it('keeps V up on walls', () => {
		for (const normal of [EAST, SOUTH, { x: -1, y: 0, z: 0 }, { x: 0.6, y: 0, z: 0.8 }]) {
			closeToVec(surfaceAxes(normal).v, UP);
		}
		closeToVec(surfaceAxes(SOUTH).u, EAST);
	});

	it('lies in the face with U × V along the normal', () => {
		const normals = [UP, DOWN, EAST, SOUTH, { x: 0.6, y: 0.8, z: 0 }, { x: 0.3, y: 0.2, z: -0.9 }];
		for (const normal of normals) {
			const length = Math.hypot(normal.x, normal.y, normal.z);
			const { u, v } = surfaceAxes(normal);
			const cross = {
				x: u.y * v.z - u.z * v.y,
				y: u.z * v.x - u.x * v.z,
				z: u.x * v.y - u.y * v.x,
			};
			closeToVec(cross, { x: normal.x / length, y: normal.y / length, z: normal.z / length });
			expect(Math.hypot(u.x, u.y, u.z)).toBeCloseTo(1, 6);
			expect(Math.hypot(v.x, v.y, v.z)).toBeCloseTo(1, 6);
		}
	});

	it('gives a ramp the axes of the floor it rises from', () => {
		// Rising toward +X and toward -Z, 45° and shallower.
		for (const normal of [
			{ x: -0.6, y: 0.8, z: 0 },
			{ x: 0, y: 0.8, z: 0.6 },
			{ x: -Math.SQRT1_2, y: Math.SQRT1_2, z: 0 },
		]) {
			const { u, v } = surfaceAxes(normal);
			expect(u.x).toBeGreaterThan(0.5);
			expect(u.z).toBeCloseTo(0, 6);
			expect(v.z).toBeLessThan(-0.5);
			expect(v.x).toBeCloseTo(0, 6);
		}
	});
});

describe('surfaceUv', () => {
	it('measures world units on a bare face', () => {
		expect(surfaceUv({ x: 3, y: 0, z: -2 }, UP)).toEqual({ u: 3, v: 2 });
		expect(surfaceUv({ x: 3, y: 5, z: 1 }, SOUTH)).toEqual({ u: 3, v: 5 });
	});

	it('divides by the scale and adds the offset', () => {
		const uv = surfaceUv({ x: 3, y: 0, z: -2 }, UP, BRICK);
		expect(uv.u).toBeCloseTo(1.75, 6);
		expect(uv.v).toBeCloseTo(1, 6);
	});

	it('turns the texture counter-clockwise', () => {
		const quarter = { ...GRID, rotation: Math.PI / 2 };
		// The texture's U now runs up the wall.
		const uv = surfaceUv({ x: 0, y: 4, z: 1 }, SOUTH, quarter);
		expect(uv.u).toBeCloseTo(4, 6);
		expect(uv.v).toBeCloseTo(0, 6);
	});

	it('does not stretch on a slope', () => {
		const normal = { x: 0, y: 0.8, z: 0.6 };
		const a = surfaceUv({ x: 0, y: 0, z: 0 }, normal);
		// Five units up the slope: three up, four north.
		const b = surfaceUv({ x: 0, y: 3, z: -4 }, normal);
		expect(Math.hypot(b.u - a.u, b.v - a.v)).toBeCloseTo(5, 6);
	});

	it('survives a zero scale', () => {
		const uv = surfaceUv({ x: 1, y: 0, z: 0 }, UP, { ...GRID, scale: { u: 0, v: 0 } });
		expect(Number.isFinite(uv.u)).toBe(true);
		expect(Number.isFinite(uv.v)).toBe(true);
	});
});

describe('sameSurface', () => {
	it('compares every field, and counts two bare faces alike', () => {
		expect(sameSurface(BRICK, { ...BRICK, scale: { u: 2, v: 2 } })).toBe(true);
		expect(sameSurface(BRICK, { ...BRICK, rotation: 1 })).toBe(false);
		expect(sameSurface(BRICK, GRID)).toBe(false);
		expect(sameSurface(null, undefined)).toBe(true);
		expect(sameSurface(BRICK, null)).toBe(false);
	});
});

describe('carrySurfaces', () => {
	it('gives each plane the surface of the old plane facing the same way', () => {
		const rebuilt = boxBrush({ x: 0, y: 0, z: 0 }, { x: 2, y: 3, z: 1 }).reverse();
		const carried = carrySurfaces(TOPPED, rebuilt);
		expect(surfaceFacing(carried, UP)).toEqual(BRICK);
		expect(carried.filter((plane) => plane.surface)).toHaveLength(1);
		expect(carried.map((plane) => plane.normal)).toEqual(rebuilt.map((plane) => plane.normal));
	});

	it('copies, leaving both inputs alone', () => {
		const rebuilt = boxBrush({ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 });
		const carried = carrySurfaces(TOPPED, rebuilt);
		expect(rebuilt.every((plane) => plane.surface === undefined)).toBe(true);
		expect(surfaceFacing(carried, UP)).not.toBe(BRICK);
	});

	it('paints the faces a rebuild adds beside a painted one', () => {
		const tilted = [...UNIT, { normal: { x: 0.6, y: 0.8, z: 0 }, distance: 1.2 }];
		const carried = carrySurfaces(TOPPED, tilted);
		expect(carried.at(-1)!.surface).toEqual(BRICK);
	});
});

describe('surfaces through brush edits', () => {
	it('stay on the faces of a moved, pushed, turned, or scaled brush', () => {
		expect(surfaceFacing(translateBrush(TOPPED, { x: 4, y: 1, z: 0 }), UP)).toEqual(BRICK);
		expect(surfaceFacing(moveFaces(TOPPED, [planeIndex(TOPPED, EAST)], 2)!, UP)).toEqual(BRICK);
		expect(
			surfaceFacing(scaleBrush(TOPPED, { x: 2, y: 3, z: 1 }, { x: 0, y: 0, z: 0 })!, UP)
		).toEqual(BRICK);

		// A quarter turn about Z lays the top face on its side, texture and all.
		const turned = rotateBrush(TOPPED, { x: 0, y: 0, z: 1 }, Math.PI / 2, { x: 0, y: 0, z: 0 })!;
		expect(surfaceFacing(turned, { x: -1, y: 0, z: 0 })).toEqual(BRICK);
		expect(turned.filter((plane) => plane.surface)).toHaveLength(1);
	});

	it('stay on both halves of a clip, and the cut is bare', () => {
		const halves = clipBrush(TOPPED, { normal: EAST, distance: 0.5 });
		expect(halves).toHaveLength(2);
		for (const half of halves) {
			expect(surfaceFacing(half, UP)).toEqual(BRICK);
			expect(half.filter((plane) => plane.surface)).toHaveLength(1);
		}
	});

	it('stay on every piece of a subdivide', () => {
		const wide = paint(boxBrush({ x: 0, y: 0, z: 0 }, { x: 4, y: 1, z: 2 }), UP, BRICK);
		const pieces = subdivideBrush(wide, 2)!;
		expect(pieces).toHaveLength(2);
		for (const piece of pieces) expect(surfaceFacing(piece, UP)).toEqual(BRICK);
	});

	it('follow a face when a corner moves and the hull is rebuilt', () => {
		const topology = brushTopology(TOPPED)!;
		const corner = topology.vertices.findIndex(
			(vertex) => vertex.x === 1 && vertex.y === 1 && vertex.z === 1
		);
		const moved = moveElements(
			TOPPED,
			[{ kind: 'vertex', planes: topology.vertexPlanes[corner]! }],
			{ x: 0, y: 0.5, z: 0 }
		)!;
		expect(compileBrush(moved.planes)).not.toBeNull();
		const painted = moved.planes.filter((plane) => plane.surface);
		// The top is now two triangles, both still brick; the sides stay bare.
		expect(painted.length).toBeGreaterThanOrEqual(2);
		for (const plane of painted) {
			expect(plane.surface).toEqual(BRICK);
			expect(plane.normal.y).toBeGreaterThan(0.7);
		}
		expect(surfaceFacing(moved.planes, DOWN)).toBeUndefined();
	});

	it('follow the faces left after a corner is deleted', () => {
		const floored = paint(UNIT, DOWN, GRID);
		const topology = brushTopology(floored)!;
		const corner = topology.vertices.findIndex(
			(vertex) => vertex.x === 1 && vertex.y === 1 && vertex.z === 1
		);
		const cut = deleteBrushElements(floored, [
			{ kind: 'vertex', planes: topology.vertexPlanes[corner]! },
		])!;
		expect(surfaceFacing(cut, DOWN)).toEqual(GRID);
	});

	it('put the source face on the cap of an extrusion', () => {
		const swept = extrudeFace(TOPPED, planeIndex(TOPPED, UP), 2)!;
		expect(swept[0]!.surface).toEqual(BRICK);
		expect(swept.slice(1).every((plane) => plane.surface === undefined)).toBe(true);
	});
});

describe('navigationSourceHash', () => {
	function documentOf(planes: BrushPlane[]): LevelDocument {
		return { version: 2, solids: [{ id: 'a', planes }], doodads: [], entities: [] };
	}

	it('is the same for a painted level and a bare one', () => {
		expect(navigationSourceHash(documentOf(TOPPED))).toBe(navigationSourceHash(documentOf(UNIT)));
	});

	it('still changes with the shape', () => {
		const moved = translateBrush(TOPPED, { x: 1, y: 0, z: 0 });
		expect(navigationSourceHash(documentOf(moved))).not.toBe(
			navigationSourceHash(documentOf(TOPPED))
		);
	});
});

describe('builtin textures', () => {
	it('name themselves with the builtin prefix', () => {
		for (const texture of BUILTIN_TEXTURES) {
			expect(texture.id).toBe(`builtin:${texture.key}`);
			expect(builtinTextureKey(texture.id)).toBe(texture.key);
		}
		expect(builtinTextureKey('builtin:lava')).toBeNull();
		expect(builtinTextureKey('tex-1')).toBeNull();
	});

	it('are opaque, the size asked for, and the same every time', () => {
		for (const texture of BUILTIN_TEXTURES) {
			const pixels = builtinTexturePixels(texture.key, 16);
			expect(pixels).toHaveLength(16 * 16 * 4);
			for (let at = 3; at < pixels.length; at += 4) expect(pixels[at]).toBe(255);
			expect([...builtinTexturePixels(texture.key, 16)]).toEqual([...pixels]);
		}
	});

	it('differ from one another', () => {
		const seen = new Set(
			BUILTIN_TEXTURES.map((texture) => builtinTexturePixels(texture.key, 16).join(','))
		);
		expect(seen.size).toBe(BUILTIN_TEXTURES.length);
	});
});
