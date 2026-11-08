import { describe, expect, it } from 'vitest';
import type { BrushPlane, BrushVec3 } from '@zylem/bridge';
import {
	LevelClipTool,
	clipPlaneThroughLine,
	clipPlaneThroughPoints,
} from '../../../src/lib/level/level-clip-tool';

const DOWN = { x: 0, y: -1, z: 0 };

function side(plane: BrushPlane, point: BrushVec3): number {
	return (
		plane.normal.x * point.x + plane.normal.y * point.y + plane.normal.z * point.z - plane.distance
	);
}

describe('clip planes', () => {
	it('stands straight out of an orthographic screen', () => {
		expect(clipPlaneThroughLine({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 2 }, DOWN)).toEqual({
			normal: { x: 1, y: 0, z: 0 },
			distance: 0,
		});
	});

	it('contains the view direction in an oblique view', () => {
		const view = { x: -0.5, y: -0.7, z: -0.5 };
		const a = { x: 1, y: 0, z: 0 };
		const b = { x: 1, y: 0, z: 3 };
		const plane = clipPlaneThroughLine(a, b, view)!;
		expect(side(plane, a)).toBeCloseTo(0, 9);
		expect(side(plane, b)).toBeCloseTo(0, 9);
		const along = plane.normal.x * view.x + plane.normal.y * view.y + plane.normal.z * view.z;
		expect(along).toBeCloseTo(0, 9);
	});

	it('refuses a line of no length or one running along the view', () => {
		expect(clipPlaneThroughLine({ x: 1, y: 1, z: 1 }, { x: 1, y: 1, z: 1 }, DOWN)).toBeNull();
		expect(clipPlaneThroughLine({ x: 0, y: 3, z: 0 }, { x: 0, y: 0, z: 0 }, DOWN)).toBeNull();
	});

	it('passes through three points, unless they are in a line', () => {
		const points = [
			{ x: -3, y: 0, z: -3 },
			{ x: 3, y: 0, z: -3 },
			{ x: 0, y: 1, z: 1 },
		] as const;
		const plane = clipPlaneThroughPoints(...points)!;
		for (const point of points) expect(side(plane, point)).toBeCloseTo(0, 9);
		expect(Math.hypot(plane.normal.x, plane.normal.y, plane.normal.z)).toBeCloseTo(1, 9);
		expect(
			clipPlaneThroughPoints({ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }, { x: 2, y: 2, z: 2 })
		).toBeNull();
	});
});

describe('LevelClipTool', () => {
	it('cuts on the second point', () => {
		const tool = new LevelClipTool();
		expect(tool.click({ x: 0, y: 0, z: -2 }, DOWN, false)).toBeNull();
		expect(tool.active).toBe(true);
		expect(tool.click({ x: 0, y: 0, z: 2 }, DOWN, false)).toEqual({
			normal: { x: 1, y: 0, z: 0 },
			distance: 0,
		});
		expect(tool.active).toBe(false);
	});

	it('waits for a third point when asked, then cuts through all three', () => {
		const tool = new LevelClipTool();
		tool.click({ x: -3, y: 0, z: -3 }, DOWN, false);
		expect(tool.click({ x: 3, y: 0, z: -3 }, DOWN, true)).toBeNull();
		expect(tool.placed).toHaveLength(2);
		const plane = tool.click({ x: 0, y: 1, z: 1 }, DOWN, false)!;
		expect(side(plane, { x: 0, y: 1, z: 1 })).toBeCloseTo(0, 9);
		expect(tool.active).toBe(false);
	});

	it('ignores a repeated point and previews the next cut', () => {
		const tool = new LevelClipTool();
		tool.click({ x: 1, y: 0, z: 1 }, DOWN, false);
		expect(tool.click({ x: 1, y: 0, z: 1 }, DOWN, false)).toBeNull();
		expect(tool.placed).toHaveLength(1);
		const preview = tool.preview({ x: 1, y: 0, z: 4 }, DOWN)!;
		expect(side(preview, { x: 1, y: 0, z: 4 })).toBeCloseTo(0, 9);
		tool.cancel();
		expect(tool.active).toBe(false);
		expect(tool.preview({ x: 1, y: 0, z: 4 }, DOWN)).toBeNull();
	});
});
