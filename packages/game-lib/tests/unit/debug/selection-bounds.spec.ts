import { describe, expect, it } from 'vitest';
import { Box3, BoxGeometry, Mesh, Vector3 } from 'three';

import {
	measureObjectSelectionBounds,
	padSelectionBounds,
	resolveSelectionBounds,
	SELECTION_BOUNDS_MARGIN,
	SELECTION_THIN_AXIS_MAX,
	SELECTION_THIN_AXIS_MIN,
	type SelectionBoundsProvider,
} from '../../../src/lib/debug/selection-bounds';

function box(size: { x: number; y: number; z: number }, center = new Vector3()): Box3 {
	const half = new Vector3(size.x / 2, size.y / 2, size.z / 2);
	return new Box3(center.clone().sub(half), center.clone().add(half));
}

function sizeOf(b: Box3): { x: number; y: number; z: number } {
	const s = b.getSize(new Vector3());
	return { x: s.x, y: s.y, z: s.z };
}

describe('padSelectionBounds', () => {
	it('gives a flat plane a slab proportional to its footprint', () => {
		const padded = padSelectionBounds(box({ x: 10, y: 0, z: 10 }));
		const size = sizeOf(padded);
		const margin = 10 * SELECTION_BOUNDS_MARGIN * 2;
		// 5% of the 10-unit footprint, plus the margin on both sides.
		expect(size.y).toBeCloseTo(0.5 + margin);
		expect(size.x).toBeCloseTo(10 + margin);
		expect(size.z).toBeCloseTo(10 + margin);
	});

	it('pads symmetrically so the centre does not move', () => {
		const centre = new Vector3(3, 7, -2);
		const padded = padSelectionBounds(box({ x: 4, y: 0, z: 4 }, centre));
		expect(padded.getCenter(new Vector3()).distanceTo(centre)).toBeLessThan(1e-9);
	});

	it('never pads a thin axis below the absolute floor', () => {
		// 5% of 0.05 would be invisible; the floor takes over.
		const padded = padSelectionBounds(box({ x: 0.05, y: 0.05, z: 0.05 }));
		const size = sizeOf(padded);
		const margin = 0.05 * SELECTION_BOUNDS_MARGIN * 2;
		expect(size.x).toBeCloseTo(SELECTION_THIN_AXIS_MIN + margin);
		expect(size.y).toBeCloseTo(SELECTION_THIN_AXIS_MIN + margin);
		expect(size.z).toBeCloseTo(SELECTION_THIN_AXIS_MIN + margin);
	});

	it('caps the thin-axis thickness on very large entities', () => {
		const padded = padSelectionBounds(box({ x: 100, y: 0, z: 100 }));
		const margin = 100 * SELECTION_BOUNDS_MARGIN * 2;
		expect(sizeOf(padded).y).toBeCloseTo(SELECTION_THIN_AXIS_MAX + margin);
	});

	it('leaves axes that are already thick enough alone, apart from the margin', () => {
		const padded = padSelectionBounds(box({ x: 2, y: 2, z: 2 }));
		const margin = 2 * SELECTION_BOUNDS_MARGIN * 2;
		expect(sizeOf(padded)).toEqual({
			x: expect.closeTo(2 + margin),
			y: expect.closeTo(2 + margin),
			z: expect.closeTo(2 + margin),
		});
	});

	it('handles a line thin on two axes', () => {
		const padded = padSelectionBounds(box({ x: 6, y: 0, z: 0 }));
		const size = sizeOf(padded);
		const margin = 6 * SELECTION_BOUNDS_MARGIN * 2;
		expect(size.y).toBeCloseTo(0.3 + margin);
		expect(size.z).toBeCloseTo(0.3 + margin);
	});

	it('returns empty and non-finite boxes untouched', () => {
		const empty = new Box3();
		expect(padSelectionBounds(empty).isEmpty()).toBe(true);
		const nan = new Box3(new Vector3(Number.NaN, 0, 0), new Vector3(1, 1, 1));
		padSelectionBounds(nan);
		expect(Number.isNaN(nan.min.x)).toBe(true);
	});
});

describe('measureObjectSelectionBounds', () => {
	it('measures the object in world space and pads it', () => {
		const mesh = new Mesh(new BoxGeometry(4, 0, 4));
		mesh.position.set(0, 5, 0);
		mesh.updateMatrixWorld(true);
		const bounds = measureObjectSelectionBounds(mesh, new Box3());
		expect(bounds.getCenter(new Vector3()).y).toBeCloseTo(5);
		expect(sizeOf(bounds).y).toBeGreaterThan(0.1);
	});
});

describe('resolveSelectionBounds', () => {
	it('prefers the entity override over measuring its render object', () => {
		const mesh = new Mesh(new BoxGeometry(1, 1, 1));
		mesh.updateMatrixWorld(true);
		const custom = box({ x: 20, y: 20, z: 20 });
		const entity: SelectionBoundsProvider & { mesh: Mesh } = {
			mesh,
			getSelectionBounds: (target) => target.copy(custom),
		};
		const bounds = resolveSelectionBounds(entity, new Box3());
		expect(bounds).not.toBeNull();
		expect(sizeOf(bounds!).x).toBeCloseTo(20);
	});

	it('measures group ?? mesh when there is no override', () => {
		const mesh = new Mesh(new BoxGeometry(2, 2, 2));
		mesh.position.set(1, 2, 3);
		mesh.updateMatrixWorld(true);
		const bounds = resolveSelectionBounds({ mesh }, new Box3());
		expect(bounds?.getCenter(new Vector3()).toArray()).toEqual([
			expect.closeTo(1),
			expect.closeTo(2),
			expect.closeTo(3),
		]);
	});

	it('returns null when the entity has neither an override nor a render object', () => {
		expect(resolveSelectionBounds({}, new Box3())).toBeNull();
		expect(resolveSelectionBounds(null, new Box3())).toBeNull();
	});

	it('returns null when the override declines or produces an empty box', () => {
		const declining: SelectionBoundsProvider = { getSelectionBounds: () => null };
		expect(resolveSelectionBounds(declining, new Box3())).toBeNull();
		const emptyBox: SelectionBoundsProvider = { getSelectionBounds: (target) => target.makeEmpty() };
		expect(resolveSelectionBounds(emptyBox, new Box3())).toBeNull();
	});
});
