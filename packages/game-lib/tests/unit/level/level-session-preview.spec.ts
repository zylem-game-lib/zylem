import { Line, Mesh, MeshStandardMaterial, Scene } from 'three';
import { describe, expect, it } from 'vitest';
import { boxBrush } from '../../../src/lib/level/brush';
import { LevelSession, type LevelSessionHost } from '../../../src/lib/level/level-session';
import type { LevelDocument, LevelSyncPayload } from '../../../src/lib/level/level-types';

const DEFAULT_BRUSH_COLOR = 0xc8c2b4;
const SELECTED_BRUSH_COLOR = 0xe4ddd0;

function host(scene: Scene): LevelSessionHost {
	return {
		getScene: () => scene,
		cameraId: () => null,
		physicsHit: () => null,
		spawnZone: async () => null,
		detach: () => {},
		spawnHulls: () => null,
		despawnHulls: () => {},
		publishGesture: () => {},
		publishSelect: () => {},
		publishNotice: () => {},
	};
}

function document(): LevelDocument {
	return {
		version: 2,
		solids: [
			{
				id: 'box',
				planes: boxBrush({ x: -1, y: 0, z: -1 }, { x: 1, y: 1, z: 1 }),
			},
		],
		doodads: [],
		entities: [],
	};
}

function payload(selectedIds: string[]): LevelSyncPayload {
	return {
		document: document(),
		hiddenLayers: [],
		selectedIds,
		activeLayer: 'solid',
		placement: null,
	};
}

function preview(scene: Scene) {
	const root = scene.getObjectByName('level-preview');
	if (!root) throw new Error('level preview is not mounted');
	return root;
}

function linesIn(scene: Scene): Line[] {
	const found: Line[] = [];
	preview(scene).traverse((child) => {
		if (child instanceof Line) found.push(child);
	});
	return found;
}

describe('level edit preview', () => {
	it('renders an unselected brush with the default material and no axis guides', () => {
		const scene = new Scene();
		const session = new LevelSession(host(scene));
		session.sync(payload([]));

		expect(session.isEditing).toBe(true);
		const meshes = preview(scene).children.filter((child) => child instanceof Mesh);
		expect(meshes).toHaveLength(1);
		const material = (meshes[0] as Mesh).material as MeshStandardMaterial;
		expect(material.color.getHex()).toBe(DEFAULT_BRUSH_COLOR);
		expect(material.transparent).toBe(false);
		expect(linesIn(scene)).toHaveLength(0);

		session.dispose();
	});

	it('draws axis guides through a selected brush and tints it lighter', () => {
		const scene = new Scene();
		const session = new LevelSession(host(scene));
		session.sync(payload(['box']));

		const root = preview(scene);
		const meshes = root.children.filter((child) => child instanceof Mesh);
		const material = (meshes[0] as Mesh).material as MeshStandardMaterial;
		expect(material.color.getHex()).toBe(SELECTED_BRUSH_COLOR);
		const lines = linesIn(scene);
		expect(lines).toHaveLength(3);
		const colors = lines
			.map((line) => ((line as Line).material as MeshStandardMaterial).color.getHex())
			.sort((a, b) => a - b);
		expect(colors).toEqual([0x3388ff, 0x33cc66, 0xff3333]);

		session.dispose();
	});

	it('drops the forced edit preview when the level plays or closes', () => {
		const scene = new Scene();
		const session = new LevelSession(host(scene));
		session.sync(payload(['box']));
		session.play(document());

		expect(session.isEditing).toBe(false);
		expect(linesIn(scene)).toHaveLength(0);

		session.close();
		expect(session.isEditing).toBe(false);
		expect(scene.getObjectByName('level-preview')).toBeUndefined();
	});
});
