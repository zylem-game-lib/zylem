import { describe, expect, it } from 'vitest';
import { MeshStandardMaterial } from 'three';
import {
	boxBrush,
	compileBrush,
	createSurface,
	type BrushPlane,
	type BrushSurface,
	type CompiledBrush,
} from '@zylem/bridge';
import {
	brushGeometry,
	geometryTextures,
	mergedBrushGeometry,
} from '../../../src/lib/level/level-geometry';
import { disposeMaterial } from '../../../src/lib/level/level-highlight';
import { LevelTextures } from '../../../src/lib/level/level-textures';

const BRICK: BrushSurface = { ...createSurface('builtin:brick'), scale: { u: 2, v: 2 } };
const GRID = createSurface('builtin:grid');

/** Planes: +X, -X, +Y, -Y, +Z, -Z. */
const TOP = 2;
const EAST = 0;

function box(x = 0): BrushPlane[] {
	return boxBrush({ x, y: 0, z: 0 }, { x: x + 2, y: 1, z: 2 });
}

function painted(planes: BrushPlane[], surfaces: Record<number, BrushSurface>): BrushPlane[] {
	return planes.map((plane, index) =>
		surfaces[index] ? { ...plane, surface: surfaces[index] } : plane,
	);
}

function compiled(planes: readonly BrushPlane[]): CompiledBrush {
	const brush = compileBrush(planes);
	if (!brush) throw new Error('the brush does not compile');
	return brush;
}

describe('brushGeometry', () => {
	it('draws a bare brush as one group', () => {
		const geometry = brushGeometry(compiled(box()));
		expect(geometryTextures(geometry)).toEqual([null]);
		expect(geometry.groups).toEqual([{ start: 0, count: 36, materialIndex: 0 }]);
		expect(geometry.getAttribute('uv').count).toBe(geometry.getAttribute('position').count);
	});

	it('groups triangles by texture, bare faces first', () => {
		const planes = painted(box(), { [TOP]: BRICK, [EAST]: GRID });
		const geometry = brushGeometry(compiled(planes), planes);

		expect(geometryTextures(geometry)).toEqual([null, 'builtin:grid', 'builtin:brick']);
		expect(geometry.groups).toEqual([
			{ start: 0, count: 24, materialIndex: 0 },
			{ start: 24, count: 6, materialIndex: 1 },
			{ start: 30, count: 6, materialIndex: 2 },
		]);
	});

	it('leaves out the bare group when every face is painted', () => {
		const planes = box().map((plane) => ({ ...plane, surface: GRID }));
		const geometry = brushGeometry(compiled(planes), planes);
		expect(geometryTextures(geometry)).toEqual(['builtin:grid']);
		expect(geometry.groups).toEqual([{ start: 0, count: 36, materialIndex: 0 }]);
	});

	it('names the plane of every triangle in the order it draws them', () => {
		const planes = painted(box(), { [TOP]: BRICK });
		const geometry = brushGeometry(compiled(planes), planes);
		const trianglePlanes = geometry.userData.trianglePlanes as number[];

		expect(trianglePlanes).toHaveLength(12);
		// The painted top is drawn last, after the five bare faces.
		expect(trianglePlanes.slice(10)).toEqual([TOP, TOP]);
		expect(trianglePlanes.slice(0, 10)).not.toContain(TOP);

		// Each triangle lies in the plane it names.
		const position = geometry.getAttribute('position');
		const index = geometry.getIndex()!;
		trianglePlanes.forEach((planeIndex, triangle) => {
			const plane = planes[planeIndex]!;
			for (let corner = 0; corner < 3; corner += 1) {
				const at = index.getX(triangle * 3 + corner);
				const distance =
					plane.normal.x * position.getX(at) +
					plane.normal.y * position.getY(at) +
					plane.normal.z * position.getZ(at);
				expect(distance).toBeCloseTo(plane.distance, 6);
			}
		});
	});

	it('takes UVs from world position and the surface', () => {
		const planes = painted(box(4), { [TOP]: BRICK });
		const geometry = brushGeometry(compiled(planes), planes);
		const position = geometry.getAttribute('position');
		const uv = geometry.getAttribute('uv');
		const top = geometry.groups[1]!;
		const index = geometry.getIndex()!;

		for (let at = top.start; at < top.start + top.count; at += 1) {
			const vertex = index.getX(at);
			// On a floor U runs east and V north, two world units to a tile.
			expect(uv.getX(vertex)).toBeCloseTo(position.getX(vertex) / 2, 6);
			expect(uv.getY(vertex)).toBeCloseTo(-position.getZ(vertex) / 2, 6);
		}
	});
});

describe('mergedBrushGeometry', () => {
	it('draws each texture once across every brush', () => {
		const a = painted(box(0), { [TOP]: BRICK });
		const b = painted(box(4), { [TOP]: BRICK, [EAST]: GRID });
		const geometry = mergedBrushGeometry([compiled(a), compiled(b)], [a, b]);

		expect(geometryTextures(geometry)).toEqual([null, 'builtin:brick', 'builtin:grid']);
		expect(geometry.groups).toEqual([
			{ start: 0, count: 54, materialIndex: 0 },
			{ start: 54, count: 12, materialIndex: 1 },
			{ start: 66, count: 6, materialIndex: 2 },
		]);
		expect(geometry.getIndex()?.count).toBe(72);
	});

	it('draws brushes without planes bare', () => {
		const geometry = mergedBrushGeometry([compiled(box(0)), compiled(box(4))]);
		expect(geometryTextures(geometry)).toEqual([null]);
		expect(geometry.getIndex()?.count).toBe(72);
	});
});

describe('LevelTextures', () => {
	it('shares one material per texture and look', () => {
		const textures = new LevelTextures();
		const brick = textures.material('builtin:brick');
		expect(textures.material('builtin:brick')).toBe(brick);
		expect(textures.material('builtin:brick', { selected: true })).not.toBe(brick);
		expect(textures.material('builtin:grid')).not.toBe(brick);
		expect(brick.map).toBe(textures.texture('builtin:brick'));
		expect(brick.color.getHex()).toBe(0xffffff);
		textures.dispose();
	});

	it('draws a face bare when the level has no such texture', () => {
		const textures = new LevelTextures();
		const missing = textures.material('tex-gone');
		expect(missing.map).toBeNull();
		expect(missing).toBe(textures.material(null));
		textures.dispose();
	});

	it('gives a one-slot geometry its material alone', () => {
		const textures = new LevelTextures();
		expect(textures.materialsFor([null])).toBeInstanceOf(MeshStandardMaterial);
		expect(textures.materialsFor([null, 'builtin:grid'])).toHaveLength(2);
		textures.dispose();
	});

	it('keeps its materials when a mesh that shows them is disposed', () => {
		const textures = new LevelTextures();
		const material = textures.material('builtin:grid');
		let disposed = 0;
		material.addEventListener('dispose', () => {
			disposed += 1;
		});

		disposeMaterial([material]);
		expect(disposed).toBe(0);
		textures.dispose();
		expect(disposed).toBe(1);
	});
});
