import { describe, expect, it } from 'vitest';
import {
	applyTerrainBrush,
	createSurface,
	createTerrainPlane,
	navigationSourceHash,
	sweepTerrainBrush,
	terrainSample,
	type LevelDocument,
	type TerrainBrush,
} from '../src';

const origin = { x: 0, y: 0, z: 0 };
const empty: LevelDocument = { version: 2, solids: [], doodads: [], entities: [] };

describe('terrain editing', () => {
	it('sweeps a continuous hill or valley independently of the number of pointer events', () => {
		const plane = createTerrainPlane('p', origin, 8);
		const brush: TerrainBrush = { kind: 'sculpt', delta: -2 };
		const weights = new Map<number, number>();
		const start = { x: -3, z: 0 },
			end = { x: 3, z: 0 };
		sweepTerrainBrush(weights, plane, brush, start, end, 2);
		const edited = applyTerrainBrush(plane, brush, weights);
		sweepTerrainBrush(weights, plane, brush, start, origin, 2);
		sweepTerrainBrush(weights, plane, brush, origin, end, 2);
		expect(applyTerrainBrush(plane, brush, weights)).toEqual(edited);
		expect(terrainSample(edited, 0, 0)?.height).toBe(-2);
		expect(terrainSample(edited, 0, 1)?.height).toBe(-1);
		expect(terrainSample(edited, 0, 2)?.height).toBe(0);
		expect(
			terrainSample(applyTerrainBrush(edited, { kind: 'sculpt', delta: 3 }, weights), 0, 0)?.height
		).toBe(1);
		expect(plane.heights.every((h) => h === 0)).toBe(true);
	});

	it('samples the same diagonal as the mesh at both triangle interiors and the outer edge', () => {
		const plane = {
			...createTerrainPlane('p', origin, 1),
			heights: [0, 2, 4, 10],
			tags: { 0: 'mud' },
		};
		expect(terrainSample(plane, -0.25, -0.25)).toEqual({ cell: 0, height: 1.5, tag: 'mud' });
		expect(terrainSample(plane, 0.25, 0.25)?.height).toBe(6.5);
		expect(terrainSample(plane, 0.5, 0.5)?.height).toBe(10);
		expect(terrainSample(plane, 0.51, 0.5)).toBeNull();
	});

	it('hashes sculpted geometry for navigation and ignores tags, textures and absent terrain', () => {
		const plane = createTerrainPlane('p', origin, 2);
		const weights: [number, number][] = [[0, 1]];
		const surface = createSurface('builtin:brick');
		const painted = applyTerrainBrush(plane, { kind: 'texture', surface }, weights);
		const tagged = applyTerrainBrush(painted, { kind: 'tag', tag: 'custom mud' }, weights);
		expect(applyTerrainBrush(tagged, { kind: 'tag', tag: 'custom mud' }, weights)).toBe(tagged);
		expect(tagged.surfaces).toEqual({ 0: surface });
		expect(tagged.tags).toEqual({ 0: 'custom mud' });
		const hash = navigationSourceHash({ ...empty, terrain: [plane] });
		expect(navigationSourceHash({ ...empty, terrain: [tagged] })).toBe(hash);
		const raised = applyTerrainBrush(tagged, { kind: 'sculpt', delta: 1 }, weights);
		expect(navigationSourceHash({ ...empty, terrain: [raised] })).not.toBe(hash);
		expect(navigationSourceHash({ ...empty, terrain: [] })).toBe(navigationSourceHash(empty));
	});
});
