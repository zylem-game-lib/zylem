import { Mesh, Scene } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { boxBrush, createTerrainPlane, type LevelDocument } from '@zylem/bridge';

import { createStage } from '../../../src/lib/stage/stage';
import { ZylemStage } from '../../../src/lib/stage/zylem-stage';

const LEVEL: LevelDocument = {
	version: 2,
	solids: [
		{ id: 'floor', planes: boxBrush({ x: -4, y: -1, z: -4 }, { x: 4, y: 0, z: 4 }) },
		{ id: 'crate', planes: boxBrush({ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }) },
	],
	doodads: [],
	entities: [],
};

/** A stage with the scene and physics `load()` would have built. */
function loadedStage() {
	const scene = new Scene();
	const simulation = {
		spawn: vi.fn(() => ({ id: 1 })),
		despawn: vi.fn(),
	};
	const stage = new ZylemStage();
	stage.scene = { scene, destroy: () => {} } as any;
	stage.world = { simulation, collisionMap: new Map(), destroy: () => {} } as any;
	return { stage, scene, simulation };
}

function setup(stage: ZylemStage): void {
	stage.nodeSetup({ me: stage, globals: {} } as any);
}

function sectorMeshes(scene: Scene): Mesh[] {
	const root = scene.getObjectByName('level-preview');
	return (root?.children ?? []).filter((child): child is Mesh => child instanceof Mesh);
}

describe('ZylemStage.playLevel', () => {
	it('looks up tags using the transformed triangles of a tilted, scaled plane', () => {
		const { stage } = loadedStage();
		const plane = createTerrainPlane('incline', { x: 3, y: 2, z: 4 }, 2);
		plane.pose.rotation = { x: Math.PI / 6, y: 0, z: 0 };
		plane.pose.scale = { x: 2, y: 1, z: 1 };
		plane.tags = { 3: 'gravel' };
		stage.playLevel({ version: 2, solids: [], doodads: [], entities: [], terrain: [plane] });
		setup(stage);
		const hit = stage.terrainAt({ x: 3.8, y: 3, z: 4 + Math.sqrt(3) / 4 });
		expect(hit?.height).toBeCloseTo(1.75);
		expect(hit?.tag).toBe('gravel');
		stage.destroy();
	});
	it('plays the actual terrain triangles and queries the tagged surface below either character', () => {
		const { stage, simulation } = loadedStage();
		const lower = createTerrainPlane('valley', { x: 3, y: 2, z: 4 }, 2);
		lower.heights[4] = -2;
		lower.tags = { 3: 'mud' };
		const upper = createTerrainPlane('bridge', { x: 3, y: 5, z: 4 }, 2);
		stage.playLevel({ version: 2, solids: [], doodads: [], entities: [], terrain: [lower, upper] });
		setup(stage);
		const shape = (simulation.spawn.mock.calls as any)[0][0].colliders[0].shape;
		expect(shape.type).toBe('trimesh');
		expect(Array.from(shape.vertices.slice(12, 15))).toEqual([3, 0, 4]);
		expect(shape.indices).toHaveLength(24);
		expect(stage.terrainAt({ x: 3.25, y: 4, z: 4.25 })).toEqual({
			planeId: 'valley',
			height: 1,
			tag: 'mud',
		});
		expect(stage.terrainAt({ x: 3.25, y: 6, z: 4.25 })).toEqual({
			planeId: 'bridge',
			height: 5,
			tag: null,
		});
		expect(stage.terrainAt({ x: 10, y: 6, z: 4 })).toBeNull();
		stage.closeLevel();
		expect(stage.terrainAt({ x: 3, y: 6, z: 4 })).toBeNull();
		expect(simulation.despawn).toHaveBeenCalledTimes(2);
		stage.destroy();
	});
	it('holds a level played before setup and applies it ahead of the setup callbacks', () => {
		const { stage, scene, simulation } = loadedStage();
		const seenBySetup: number[] = [];
		stage.setup = () => {
			seenBySetup.push(sectorMeshes(scene).length);
		};

		stage.playLevel(LEVEL);
		expect(sectorMeshes(scene)).toHaveLength(0);
		expect(simulation.spawn).not.toHaveBeenCalled();

		setup(stage);

		expect(seenBySetup).toEqual([1]);
		expect(simulation.spawn).toHaveBeenCalledTimes(1);
		const [definition] = simulation.spawn.mock.calls[0] as unknown as [{ colliders: unknown[] }];
		expect(definition.colliders).toHaveLength(LEVEL.solids.length);
		expect(stage.navigation.status.sourceHash).not.toBe('');

		stage.nodeDestroy({ me: stage, globals: {} } as any);
	});

	it('plays immediately once the stage is set up, and closeLevel removes it', () => {
		const { stage, scene, simulation } = loadedStage();
		setup(stage);
		expect(sectorMeshes(scene)).toHaveLength(0);

		stage.playLevel(LEVEL);
		expect(sectorMeshes(scene)).toHaveLength(1);

		stage.closeLevel();
		expect(scene.getObjectByName('level-preview')).toBeUndefined();
		expect(simulation.despawn).toHaveBeenCalledWith({ id: 1 });
		expect(stage.navigation.status.sourceHash).toBe('');

		stage.nodeDestroy({ me: stage, globals: {} } as any);
	});

	it('drops a held level that is closed before setup', () => {
		const { stage, scene, simulation } = loadedStage();
		stage.playLevel(LEVEL);
		stage.closeLevel();
		setup(stage);

		expect(sectorMeshes(scene)).toHaveLength(0);
		expect(simulation.spawn).not.toHaveBeenCalled();

		stage.nodeDestroy({ me: stage, globals: {} } as any);
	});
});

describe('Stage.playLevel', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('plays the level again on every load, until it is closed', async () => {
		vi.spyOn(ZylemStage.prototype, 'load').mockResolvedValue(undefined);
		const play = vi.spyOn(ZylemStage.prototype, 'playLevel').mockImplementation(() => {});
		const close = vi.spyOn(ZylemStage.prototype, 'closeLevel').mockImplementation(() => {});

		const stage = createStage();
		expect(stage.playLevel(LEVEL)).toBe(stage);
		expect(play).not.toHaveBeenCalled();

		await stage.load('first');
		await stage.load('second');
		expect(play.mock.calls).toEqual([[LEVEL], [LEVEL]]);

		expect(stage.closeLevel()).toBe(stage);
		expect(close).toHaveBeenCalledTimes(1);

		await stage.load('third');
		expect(play).toHaveBeenCalledTimes(2);
	});

	it('forwards to the loaded stage when played after load', async () => {
		vi.spyOn(ZylemStage.prototype, 'load').mockResolvedValue(undefined);
		const play = vi.spyOn(ZylemStage.prototype, 'playLevel').mockImplementation(() => {});

		const stage = createStage();
		await stage.load('first');
		stage.playLevel(LEVEL);

		expect(play.mock.calls).toEqual([[LEVEL]]);
	});
});
