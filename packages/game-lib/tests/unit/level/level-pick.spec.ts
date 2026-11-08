import { BufferGeometry, OrthographicCamera, PerspectiveCamera } from 'three';
import { describe, expect, it } from 'vitest';
import { boxBrush, brushTopology, compileBrush, type BrushVec3 } from '@zylem/bridge';
import { brushGeometry } from '../../../src/lib/level/level-geometry';
import {
	cameraProjector,
	edgeCandidates,
	isDoubleClick,
	rankCandidates,
	segmentDistance,
	trianglePlane,
	vertexCandidates,
} from '../../../src/lib/level/level-pick';

const VIEWPORT = { width: 800, height: 600 };
const BOX = boxBrush({ x: -1, y: 0, z: -1 }, { x: 1, y: 1, z: 1 });

function topProjector() {
	const camera = new OrthographicCamera(-8, 8, 6, -6, 0.1, 500);
	camera.position.set(0, 100, 0);
	camera.up.set(0, 0, -1);
	camera.lookAt(0, 0, 0);
	camera.updateProjectionMatrix();
	return cameraProjector(camera, VIEWPORT);
}

function solids() {
	return [{ id: 'box', topology: brushTopology(BOX)! }];
}

function expectPoint(actual: BrushVec3, expected: BrushVec3): void {
	expect(actual.x).toBeCloseTo(expected.x, 9);
	expect(actual.y).toBeCloseTo(expected.y, 9);
	expect(actual.z).toBeCloseTo(expected.z, 9);
}

function candidate(item: string, distance: number, depth: number) {
	return { item, distance, depth, point: { x: 0, y: 0, z: 0 } as BrushVec3 };
}

describe('brushGeometry', () => {
	it('records the plane of every triangle for face picking', () => {
		const compiled = compileBrush(BOX)!;
		const geometry = brushGeometry(compiled);
		const planes = geometry.userData.trianglePlanes as number[];
		expect(planes).toHaveLength(geometry.getIndex()!.count / 3);
		for (const face of compiled.faces) {
			expect(planes.filter((plane) => plane === face.planeIndex)).toHaveLength(
				face.indices.length - 2
			);
		}
		expect(trianglePlane(geometry, 0)).toBe(compiled.faces[0]!.planeIndex);
		expect(trianglePlane(geometry, undefined)).toBeNull();
		expect(trianglePlane(new BufferGeometry(), 0)).toBeNull();
	});
});

describe('on-screen picking', () => {
	it('measures the pixel distance to a segment and where along it', () => {
		expect(segmentDistance({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toEqual({
			distance: 3,
			t: 0.5,
		});
		expect(segmentDistance({ x: -4, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toEqual({
			distance: 5,
			t: 0,
		});
		expect(segmentDistance({ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 2 }).distance).toBeCloseTo(
			Math.SQRT2
		);
	});

	it('ranks nearer candidates first and settles near ties by depth', () => {
		const ranked = rankCandidates([
			candidate('behind', 2, 20),
			candidate('front', 2.5, 5),
			candidate('nearest', 0.2, 30),
		]);
		expect(ranked.map((entry) => entry.item)).toEqual(['nearest', 'front', 'behind']);
	});

	it('finds the vertices within the threshold, front first', () => {
		const projector = topProjector();
		const pointer = projector.project({ x: 1.05, y: 1, z: 1.05 })!;
		const found = vertexCandidates(pointer, solids(), projector);
		expect(found).toHaveLength(2);
		expectPoint(found[0]!.point, { x: 1, y: 1, z: 1 });
		expectPoint(found[1]!.point, { x: 1, y: 0, z: 1 });
		expect(found[0]!.distance).toBeCloseTo(2.5 * Math.SQRT2, 6);
		const far = projector.project({ x: 1.3, y: 1, z: 1.3 })!;
		expect(vertexCandidates(far, solids(), projector)).toEqual([]);
	});

	it('finds the edge under the pointer and the point on it', () => {
		const projector = topProjector();
		const topology = solids()[0]!.topology;
		const pointer = projector.project({ x: 1.05, y: 1, z: 0.3 })!;
		const [first] = edgeCandidates(pointer, solids(), projector);
		expect(topology.edges[first!.item.index]!.planes).toEqual([0, 2]);
		expect(first!.point.x).toBeCloseTo(1, 9);
		expect(first!.point.y).toBeCloseTo(1, 9);
		expect(first!.point.z).toBeCloseTo(0.3, 6);
	});

	it('keeps the part of an edge in front of a perspective camera', () => {
		const camera = new PerspectiveCamera(60, VIEWPORT.width / VIEWPORT.height, 0.1, 500);
		camera.position.set(0, 1, 0);
		camera.lookAt(0, 1, -1);
		camera.updateProjectionMatrix();
		const projector = cameraProjector(camera, VIEWPORT);
		const long = boxBrush({ x: 0.5, y: -1, z: -20 }, { x: 1.5, y: 0, z: 5 });
		const pointer = projector.project({ x: 0.5, y: 0, z: -5 })!;
		const found = edgeCandidates(
			pointer,
			[{ id: 'long', topology: brushTopology(long)! }],
			projector
		);
		expect(found.length).toBeGreaterThan(0);
		expect(found[0]!.distance).toBeLessThan(0.01);
		expect(found[0]!.point.z).toBeCloseTo(-5, 6);
		expect(found[0]!.depth).toBeGreaterThan(projector.nearDepth);
	});
});

describe('double-click', () => {
	it('needs a short gap and a short distance', () => {
		const first = { time: 1000, x: 10, y: 10 };
		expect(isDoubleClick(null, first)).toBe(false);
		expect(isDoubleClick(first, { time: 1300, x: 13, y: 12 })).toBe(true);
		expect(isDoubleClick(first, { time: 1500, x: 10, y: 10 })).toBe(false);
		expect(isDoubleClick(first, { time: 1100, x: 30, y: 10 })).toBe(false);
		expect(isDoubleClick(first, { time: 900, x: 10, y: 10 })).toBe(false);
	});
});
