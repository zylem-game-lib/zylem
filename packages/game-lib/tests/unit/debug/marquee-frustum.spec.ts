import { describe, expect, it } from 'vitest';
import { Box3, OrthographicCamera, PerspectiveCamera, Vector2, Vector3 } from 'three';

import {
	frustumCatchesBox,
	frustumFromNdcRect,
	mergeModeFromModifiers,
	mergeSelection,
} from '../../../src/lib/debug/marquee-frustum';

function perspectiveLookingDownZ(): PerspectiveCamera {
	const camera = new PerspectiveCamera(60, 1, 0.1, 100);
	camera.position.set(0, 0, 10);
	camera.lookAt(0, 0, 0);
	camera.updateMatrixWorld(true);
	camera.updateProjectionMatrix();
	return camera;
}

function unitBoxAt(x: number, y: number, z = 0, half = 0.5): Box3 {
	return new Box3(new Vector3(x - half, y - half, z - half), new Vector3(x + half, y + half, z + half));
}

describe('frustumFromNdcRect', () => {
	it('catches a box centred in the dragged rectangle', () => {
		const camera = perspectiveLookingDownZ();
		const frustum = frustumFromNdcRect(camera, new Vector2(-0.2, -0.2), new Vector2(0.2, 0.2));
		expect(frustumCatchesBox(frustum, unitBoxAt(0, 0))).toBe(true);
	});

	it('ignores a box outside the rectangle but inside the camera view', () => {
		const camera = perspectiveLookingDownZ();
		// A small rectangle around the centre; a box off to the right at
		// z = 0 is clearly visible to the camera, but not to the marquee.
		const frustum = frustumFromNdcRect(camera, new Vector2(-0.1, -0.1), new Vector2(0.1, 0.1));
		expect(frustumCatchesBox(frustum, unitBoxAt(4, 0))).toBe(false);
	});

	it('uses intersect semantics: a box straddling the edge is caught', () => {
		const camera = perspectiveLookingDownZ();
		// At z = 0 (distance 10, fov 60), the half-height of the view is
		// tan(30°) * 10 ≈ 5.77, so NDC x = 0.1 is at x ≈ 0.577. A unit box at
		// x = 0.9 spans 0.4..1.4 and pokes into the rectangle.
		const frustum = frustumFromNdcRect(camera, new Vector2(-0.1, -0.1), new Vector2(0.1, 0.1));
		expect(frustumCatchesBox(frustum, unitBoxAt(0.9, 0))).toBe(true);
	});

	it('accepts corners in either order', () => {
		const camera = perspectiveLookingDownZ();
		const forward = frustumFromNdcRect(camera, new Vector2(-0.3, -0.3), new Vector2(0.3, 0.3));
		const reversed = frustumFromNdcRect(camera, new Vector2(0.3, 0.3), new Vector2(-0.3, -0.3));
		const box = unitBoxAt(1, 1);
		expect(frustumCatchesBox(forward, box)).toBe(frustumCatchesBox(reversed, box));
		expect(frustumCatchesBox(forward, box)).toBe(true);
	});

	it('does not catch anything behind the camera', () => {
		const camera = perspectiveLookingDownZ();
		const frustum = frustumFromNdcRect(camera, new Vector2(-0.5, -0.5), new Vector2(0.5, 0.5));
		expect(frustumCatchesBox(frustum, unitBoxAt(0, 0, 20))).toBe(false);
	});

	it('works with an orthographic camera', () => {
		const camera = new OrthographicCamera(-10, 10, 10, -10, 0.1, 100);
		camera.position.set(0, 0, 10);
		camera.lookAt(0, 0, 0);
		camera.updateMatrixWorld(true);
		camera.updateProjectionMatrix();
		// NDC x in [0.5, 1] maps to world x in [5, 10].
		const frustum = frustumFromNdcRect(camera, new Vector2(0.5, -1), new Vector2(1, 1));
		expect(frustumCatchesBox(frustum, unitBoxAt(7, 0))).toBe(true);
		expect(frustumCatchesBox(frustum, unitBoxAt(0, 0))).toBe(false);
	});

	it('rejects empty and non-finite boxes', () => {
		const camera = perspectiveLookingDownZ();
		const frustum = frustumFromNdcRect(camera, new Vector2(-1, -1), new Vector2(1, 1));
		expect(frustumCatchesBox(frustum, new Box3())).toBe(false);
		const nan = new Box3(new Vector3(Number.NaN, 0, 0), new Vector3(1, 1, 1));
		expect(frustumCatchesBox(frustum, nan)).toBe(false);
	});
});

describe('mergeSelection', () => {
	it('replace swaps the selection and drops duplicates', () => {
		expect(mergeSelection(['a'], ['b', 'c', 'b'], 'replace')).toEqual(['b', 'c']);
	});

	it('add appends only new uuids, keeping the existing order', () => {
		expect(mergeSelection(['a', 'b'], ['b', 'c'], 'add')).toEqual(['a', 'b', 'c']);
	});

	it('subtract removes caught uuids and ignores unknown ones', () => {
		expect(mergeSelection(['a', 'b', 'c'], ['b', 'z'], 'subtract')).toEqual(['a', 'c']);
	});
});

describe('mergeModeFromModifiers', () => {
	it('maps shift to add, alt to subtract, and alt wins when both are held', () => {
		expect(mergeModeFromModifiers({ shiftKey: false, altKey: false })).toBe('replace');
		expect(mergeModeFromModifiers({ shiftKey: true, altKey: false })).toBe('add');
		expect(mergeModeFromModifiers({ shiftKey: false, altKey: true })).toBe('subtract');
		expect(mergeModeFromModifiers({ shiftKey: true, altKey: true })).toBe('subtract');
	});
});
