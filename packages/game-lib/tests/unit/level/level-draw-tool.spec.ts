import { describe, expect, it } from 'vitest';
import { frameForPlane, type LevelDrawShape } from '@zylem/bridge';
import { LevelDrawTool } from '../../../src/lib/level/level-draw-tool';

const BOX: LevelDrawShape = { shape: 'box', turn: 0, sides: 12, segments: 8, thickness: 1 };
const GROUND = frameForPlane({ x: 0, y: 1, z: 0 }, 0);
/** The Top view: looking down, with -Z up the screen. */
const TOP = { direction: { x: 0, y: -1, z: 0 }, up: { x: 0, y: 0, z: -1 } };

function down(x: number, z: number) {
	return { origin: { x, y: 10, z }, direction: { x: 0, y: -1, z: 0 } };
}

describe('LevelDrawTool', () => {
	it('snaps the footprint, starts the height one step tall, and commits', () => {
		const tool = new LevelDrawTool();
		tool.begin(GROUND, { x: 0.4, y: 0, z: 0.4 }, 0.5);
		tool.drag(down(1.6, -1.1));
		expect(tool.phase).toBe('footprint');
		expect(tool.state()).toEqual({
			frame: GROUND,
			footprint: { u0: 0.5, v0: -0.5, u1: 1.5, v1: 1 },
			height: null,
		});

		expect(tool.release(down(1.6, -1.1), TOP)).toBe(true);
		expect(tool.state()?.height).toBe(0.5);
		tool.raise(down(1.6, -2.1));
		expect(tool.state()?.height).toBe(1.5);

		expect(tool.commit(BOX)).toEqual({
			kind: 'primitive',
			frame: GROUND,
			footprint: { u0: 0.5, v0: -0.5, u1: 1.5, v1: 1 },
			height: 1.5,
			shape: BOX,
		});
		expect(tool.phase).toBe('idle');
	});

	it('ends without a height step for a footprint with no area', () => {
		const tool = new LevelDrawTool();
		tool.begin(GROUND, { x: 2, y: 0, z: 2 }, 1);
		tool.drag(down(2.2, 5));
		expect(tool.release(down(2.2, 5), TOP)).toBe(false);
		expect(tool.phase).toBe('idle');
		expect(tool.state()).toBeNull();
	});

	it('commits nothing at zero height', () => {
		const tool = new LevelDrawTool();
		tool.begin(GROUND, { x: 0, y: 0, z: 0 }, 1);
		tool.drag(down(2, -2));
		tool.release(down(2, -2), TOP);
		tool.raise(down(2, -1));
		expect(tool.state()?.height).toBe(0);
		expect(tool.commit(BOX)).toBeNull();
		expect(tool.phase).toBe('idle');
	});

	it('skips a footprint ray that grazes the frame', () => {
		const tool = new LevelDrawTool();
		tool.begin(GROUND, { x: 0, y: 0, z: 0 }, 1);
		tool.drag(down(2, -2));
		tool.drag({ origin: { x: 0, y: 0.1, z: 0 }, direction: { x: 0.9995, y: -0.0316, z: 0 } });
		expect(tool.state()?.footprint).toEqual({ u0: 0, v0: 0, u1: 2, v1: 2 });
	});

	it('names the frame and the corner it started from while drawing', () => {
		const tool = new LevelDrawTool();
		expect(tool.activeFrame).toBeNull();
		const face = frameForPlane({ x: 0, y: 1, z: 0 }, 1);
		tool.begin(face, { x: 0.2, y: 1, z: 0.2 }, 1);
		expect(tool.activeFrame).toEqual(face);
		expect(tool.anchor).toEqual({ x: 0, y: 1, z: 0 });
		tool.cancel();
		expect(tool.activeFrame).toBeNull();
		expect(tool.anchor).toBeNull();
	});
});
