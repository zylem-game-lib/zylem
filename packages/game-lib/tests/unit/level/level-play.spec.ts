import { Mesh, Scene } from 'three';
import { describe, expect, it } from 'vitest';
import { boxBrush, type BrushSolid, type LevelDocument } from '@zylem/bridge';
import { buildPlaySectors } from '../../../src/lib/level/level-play';
import { LevelSession, type LevelSessionHost } from '../../../src/lib/level/level-session';

/** Twelve triangles of three indices. */
const BOX_INDICES = 36;

function box(id: string, x: number, z: number): BrushSolid {
	return { id, planes: boxBrush({ x, y: 0, z }, { x: x + 2, y: 2, z: z + 2 }) };
}

const SOLIDS: BrushSolid[] = [
	box('a', 0, 0),
	box('b', 10, 4),
	box('c', 40, 0),
	{ id: 'flat', planes: boxBrush({ x: 1, y: 0, z: 1 }, { x: 2, y: 0, z: 2 }) },
];

describe('buildPlaySectors', () => {
	it('merges each sector into one geometry with one hull per solid', () => {
		const sectors = buildPlaySectors(SOLIDS, 32);
		expect(sectors.map((sector) => sector.key)).toEqual(['0:0', '1:0']);

		const [home, east] = sectors;
		expect(home!.geometry.getIndex()?.count).toBe(BOX_INDICES * 2);
		expect(home!.hulls).toHaveLength(2);
		expect(home!.hulls[0]).toHaveLength(8 * 3);
		expect(east!.geometry.getIndex()?.count).toBe(BOX_INDICES);
		expect(east!.hulls).toHaveLength(1);
	});

	it('groups by the sector size it is given', () => {
		expect(buildPlaySectors(SOLIDS, 64).map((sector) => sector.key)).toEqual(['0:0']);
	});
});

describe('level play', () => {
	function playHost(scene: Scene, spawned: Float32Array[][], despawned: unknown[]): LevelSessionHost {
		return {
			getScene: () => scene,
			cameraId: () => null,
			viewDirection: () => ({ x: 0, y: -1, z: 0 }),
			camera: () => null,
			viewport: () => null,
			physicsHit: () => null,
			spawnZone: async () => null,
			detach: () => {},
			spawnHulls: (hulls) => {
				spawned.push(hulls);
				return { body: spawned.length };
			},
			despawnHulls: (handle) => {
				despawned.push(handle);
			},
			publishGesture: () => {},
			publishSelect: () => {},
			publishNotice: () => {},
		};
	}

	const DOCUMENT: LevelDocument = {
		version: 2,
		solids: SOLIDS,
		doodads: [],
		entities: [],
		sectors: { size: 32 },
	};

	it('spawns one mesh and one static body per sector, and closing removes them', () => {
		const scene = new Scene();
		const spawned: Float32Array[][] = [];
		const despawned: unknown[] = [];
		const session = new LevelSession(playHost(scene, spawned, despawned));
		session.play(DOCUMENT);

		const root = scene.getObjectByName('level-preview');
		const meshes = (root?.children ?? []).filter((child) => child instanceof Mesh);
		expect(meshes.map((mesh) => mesh.name).sort()).toEqual([
			'level-sector:0:0',
			'level-sector:1:0',
		]);
		expect(spawned.map((hulls) => hulls.length)).toEqual([2, 1]);

		session.close();
		expect(despawned).toEqual([{ body: 1 }, { body: 2 }]);
		expect(scene.getObjectByName('level-preview')).toBeUndefined();
	});

	it('respawns every sector body when play restarts', () => {
		const scene = new Scene();
		const spawned: Float32Array[][] = [];
		const despawned: unknown[] = [];
		const session = new LevelSession(playHost(scene, spawned, despawned));
		session.play(DOCUMENT);
		session.play({ ...DOCUMENT, sectors: { size: 64 } });

		expect(despawned).toEqual([{ body: 1 }, { body: 2 }]);
		expect(spawned.map((hulls) => hulls.length)).toEqual([2, 1, 3]);
		session.dispose();
	});
});
