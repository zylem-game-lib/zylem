import { Mesh, Scene } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { boxBrush, type LevelDocument } from '@zylem/bridge';

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
