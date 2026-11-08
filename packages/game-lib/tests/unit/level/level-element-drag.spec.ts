import { describe, expect, it } from 'vitest';
import { boxBrush, brushBounds, type BrushVec3, type LevelElementRef } from '@zylem/bridge';
import { AxisDrag } from '../../../src/lib/level/level-draw';
import {
	ElementMoveDrag,
	FaceDrag,
	ShearDrag,
	refsByBrush,
} from '../../../src/lib/level/level-element-drag';

const BOX = boxBrush({ x: -1, y: 0, z: -1 }, { x: 1, y: 1, z: 1 });
const SOLIDS = new Map([['box', BOX]]);
const TOP: LevelElementRef = { brushId: 'box', kind: 'face', planes: [2] };
const TOP_VIEW = { direction: { x: 0, y: -1, z: 0 }, up: { x: 0, y: 0, z: -1 } };

function down(x: number, z: number) {
	return { origin: { x, y: 10, z }, direction: { x: 0, y: -1, z: 0 } };
}

function expectPoint(actual: BrushVec3, expected: BrushVec3): void {
	expect(actual.x).toBeCloseTo(expected.x, 9);
	expect(actual.y).toBeCloseTo(expected.y, 9);
	expect(actual.z).toBeCloseTo(expected.z, 9);
}

function topPush(): AxisDrag {
	return new AxisDrag({ x: 0, y: 1, z: 0 }, { x: 0, y: 1, z: 0 }, down(0, 0), TOP_VIEW);
}

describe('FaceDrag', () => {
	it('previews the moved solid and keeps the last step the kernel accepted', () => {
		const drag = new FaceDrag([TOP], SOLIDS, topPush(), 1, false);
		expect(drag.preview()).toBeNull();
		drag.update(down(0, -1.2), {});
		const moved = drag.preview()!.solids.get('box')!;
		expect(brushBounds(moved)!.max.y).toBeCloseTo(2, 9);

		drag.update(down(0, 4), {});
		expect(drag.preview()!.solids.get('box')).toBe(moved);
		expect(drag.finish()).toEqual({ kind: 'face-move', faces: [TOP], distance: 1 });
	});

	it('switches to an extrude while Alt is held', () => {
		const drag = new FaceDrag([TOP], SOLIDS, topPush(), 1, false);
		drag.update(down(0, -2), { altKey: true });
		const preview = drag.preview()!;
		expect(preview.solids.size).toBe(0);
		expect(preview.added).toHaveLength(1);
		const bounds = brushBounds(preview.added[0]!)!;
		expect(bounds.min.y).toBeCloseTo(1, 9);
		expect(bounds.max.y).toBeCloseTo(3, 9);
		expect(drag.finish()).toEqual({ kind: 'face-extrude', faces: [TOP], distance: 2 });
	});
});

describe('ElementMoveDrag', () => {
	it('moves an edge by whole steps in its plane', () => {
		const edge: LevelElementRef = { brushId: 'box', kind: 'edge', planes: [0, 2] };
		const plane = { normal: { x: 0, y: 1, z: 0 }, distance: 1 };
		const drag = new ElementMoveDrag([edge], SOLIDS, plane, { x: 1, y: 1, z: 0.3 }, null, 0.5);
		drag.update(down(1.8, 0.4));
		expect(drag.finish()).toEqual({
			kind: 'element-move',
			elements: [edge],
			delta: { x: 1, y: 0, z: 0 },
		});
	});

	it('lands a lone vertex on a grid point', () => {
		const vertex: LevelElementRef = { brushId: 'box', kind: 'vertex', planes: [0, 2, 4] };
		const plane = { normal: { x: 0, y: 1, z: 0 }, distance: 1 };
		const start = { x: 1, y: 1, z: 1 };
		const drag = new ElementMoveDrag([vertex], SOLIDS, plane, { x: 1.05, y: 1, z: 1.05 }, start, 1);
		drag.update(down(2.3, 1.2));
		const gesture = drag.finish();
		expect(gesture?.kind).toBe('element-move');
		expectPoint((gesture as { delta: BrushVec3 }).delta, { x: 1, y: 0, z: 0 });
	});
});

describe('ShearDrag', () => {
	it('slides a face within its plane and ignores travel along the normal', () => {
		const plane = { normal: { x: 0, y: 1, z: 0 }, distance: 1 };
		const drag = new ShearDrag([TOP], SOLIDS, plane, { x: 0, y: 1, z: 0 }, 1);
		drag.update(down(0.2, 0.1));
		expect(drag.finish()).toBeNull();
		drag.update(down(-1.1, 0.2));
		expect(drag.finish()).toEqual({ kind: 'shear', faces: [TOP], delta: { x: -1, y: 0, z: 0 } });
		const sheared = brushBounds(drag.preview()!.solids.get('box')!)!;
		expect(sheared.min.x).toBeCloseTo(-2, 9);
	});
});

describe('refsByBrush', () => {
	it('groups refs by solid in first-seen order', () => {
		const groups = refsByBrush([
			{ brushId: 'b', kind: 'face', planes: [0] },
			{ brushId: 'a', kind: 'face', planes: [1] },
			{ brushId: 'b', kind: 'face', planes: [2] },
		]);
		expect([...groups.keys()]).toEqual(['b', 'a']);
		expect(groups.get('b')!.map((ref) => ref.planes[0])).toEqual([0, 2]);
	});
});
