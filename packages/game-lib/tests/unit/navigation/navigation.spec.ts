// @vitest-environment node

import {
	boxBrush,
	createLevelNavigation,
	type LevelDocument,
	type LevelNavigation,
	navigationSourceHash,
} from '@zylem/bridge';
import { type BufferGeometry, type Line, type LineBasicMaterial, type Mesh, Scene } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isEditorInteractionActive } from '../../../src/lib/debug/debug-state';
import { NavigationSession } from '../../../src/lib/navigation/navigation-session';

const sessions: NavigationSession[] = [];
afterEach(() => {
	for (const session of sessions.splice(0)) session.dispose();
	vi.unstubAllGlobals();
});
function level(): LevelDocument & { navigation: LevelNavigation } {
	return {
		version: 2,
		solids: [{ id: 'floor', planes: boxBrush({ x: -10, y: -1, z: -10 }, { x: 10, y: 0, z: 10 }) }],
		doodads: [],
		entities: [],
		navigation: createLevelNavigation(),
	};
}
function session(document: LevelDocument) {
	const scene = new Scene();
	const baked = vi.fn();
	const status = vi.fn();
	const nav = new NavigationSession({ stageId: 'stage', scene: () => scene, baked, status });
	sessions.push(nav);
	nav.sync(document);
	return { nav, scene, baked, status };
}
const start = { x: -5, y: 0.1, z: 0 };
const end = { x: 5, y: 0.1, z: 0 };
describe('Recast navigation', () => {
	it('bakes real geometry, reloads its binary, and queries a complete path', async () => {
		const doc = level();
		const { nav, scene } = session(doc);
		const asset = await nav.bake('first');
		if (!asset) throw new Error('Bake failed');
		expect(asset).not.toBeNull();
		expect(nav.status.state).toBe('ready');
		expect(nav.findPath(start, end).status).toBe('complete');
		const loaded = session(level()).nav;
		await loaded.load(asset);
		expect(loaded.findPath(start, end).status).toBe('complete');
		nav.dispose();
		expect(scene.getObjectByName('navigation-overlay')).toBeUndefined();
	});
	it('carves an authored blocker out of the floor', async () => {
		const doc = level();
		doc.navigation.obstacles.push({
			id: 'wall',
			min: { x: -1, y: -0.2, z: -2 },
			max: { x: 1, y: 3, z: 2 },
		});
		const { nav } = session(doc);
		await nav.bake();
		const path = nav.findPath(start, end);
		expect(path.status).toBe('complete');
		expect(path.points.some((p) => Math.abs(p.z) >= 2.4 - 1e-5)).toBe(true);
	});
	it('reports disconnected islands as partial and distant endpoints as unreachable', async () => {
		const doc = level();
		doc.solids = [
			{ id: 'a', planes: boxBrush({ x: -10, y: -1, z: -5 }, { x: -2, y: 0, z: 5 }) },
			{ id: 'b', planes: boxBrush({ x: 2, y: -1, z: -5 }, { x: 10, y: 0, z: 5 }) },
		];
		const { nav } = session(doc);
		await nav.bake();
		expect(nav.findPath(start, end).status).toBe('partial');
		expect(nav.findPath(start, { x: 500, y: 0, z: 0 }).status).toBe('unreachable');
	});
	it('honors one-way traversal links across a gap', async () => {
		const doc = level();
		doc.solids = [
			{ id: 'a', planes: boxBrush({ x: -10, y: -1, z: -5 }, { x: -1, y: 0, z: 5 }) },
			{ id: 'b', planes: boxBrush({ x: 1, y: -1, z: -5 }, { x: 10, y: 0, z: 5 }) },
		];
		doc.navigation.links.push({
			id: 'jump',
			start: { x: -2, y: 0.1, z: 0 },
			end: { x: 2, y: 0.1, z: 0 },
			radius: 0.6,
			bidirectional: false,
		});
		const { nav } = session(doc);
		await nav.bake();
		expect(nav.findPath(start, end).status).toBe('complete');
		expect(nav.findPath(end, start).status).toBe('partial');
	});
	it('keeps the bake for cosmetic edits and disables queries after geometry changes', async () => {
		const doc = level();
		const { nav } = session(doc);
		const asset = await nav.bake();
		if (!asset) throw new Error('Bake failed');
		doc.navigation.baked = asset;
		const cosmetic = structuredClone(doc);
		cosmetic.sectors = { size: 4 };
		cosmetic.solids[0].groupId = 'group';
		nav.sync(cosmetic);
		expect(nav.status.state).toBe('ready');
		const changed = structuredClone(doc);
		changed.navigation.settings.agentRadius = 0.8;
		nav.sync(changed);
		expect(nav.status.state).toBe('stale');
		expect(nav.findPath(start, end).status).toBe('unreachable');
	});
	it('rejects invalid settings and empty sources with useful errors', async () => {
		const doc = level();
		doc.navigation.settings.cellSize = 0;
		const { nav, status } = session(doc);
		expect(await nav.bake()).toBeNull();
		expect(nav.status.state).toBe('error');
		expect(status.mock.lastCall?.[0].message).toContain('positive');
		const empty = level();
		empty.navigation.excludedSolidIds = ['floor'];
		nav.sync(empty);
		expect(await nav.bake()).toBeNull();
		expect(status.mock.lastCall?.[0].message).toContain('No solid geometry');
	});
	it('rejects oversized blockers rather than silently carving only some tiles', async () => {
		const doc = level();
		doc.solids[0].planes = boxBrush({ x: -50, y: -1, z: -50 }, { x: 50, y: 0, z: 50 });
		doc.navigation.obstacles.push({
			id: 'huge',
			min: { x: -40, y: -1, z: -40 },
			max: { x: 40, y: 3, z: 40 },
		});
		const { nav, status } = session(doc);
		expect(await nav.bake()).toBeNull();
		expect(status.mock.lastCall?.[0].message).toContain('eight navigation tiles');
	});
	it('rejects a saved asset that belongs to another geometry', async () => {
		const { nav } = session(level());
		const asset = await nav.bake();
		if (!asset) throw new Error('Bake failed');
		await expect(nav.load({ ...asset, sourceHash: 'obsolete' })).rejects.toThrow('stale');
		expect(nav.findPath(start, end).status).toBe('unreachable');
	});
	it('draws a tested path after the navmesh overlay so the overlay cannot cover it', async () => {
		// The overlay is a transparent mesh, which three draws after every opaque
		// object. An opaque route line that skips the depth test is painted first
		// and then buried under it.
		const { nav, scene } = session(level());
		await nav.bake();
		nav.query(start, end);
		const route = scene.getObjectByName('navigation-route');
		const line = route?.children[0] as Line<BufferGeometry, LineBasicMaterial> | undefined;
		if (!line) throw new Error('No route line was drawn');
		let overlayOrder = 0;
		scene.getObjectByName('navigation-overlay')?.traverse((child) => {
			if ((child as Mesh).isMesh) overlayOrder = Math.max(overlayOrder, child.renderOrder);
		});
		expect(line.material.transparent).toBe(true);
		expect(line.material.depthTest).toBe(false);
		expect(line.renderOrder).toBeGreaterThan(overlayOrder);
	});
	it('claims the editor pointer while a tool is armed, and releases it when disarmed or cleared', () => {
		// With Debug off and no other tool armed, this is the only thing that
		// attaches the canvas listeners the two-click tools read.
		const { nav } = session(level());
		expect(isEditorInteractionActive()).toBe(false);
		nav.setTool({ tool: 'path' });
		expect(isEditorInteractionActive()).toBe(true);
		nav.setTool({ tool: 'none' });
		expect(isEditorInteractionActive()).toBe(false);
		nav.setTool({ tool: 'obstacle', obstacleHeight: 2 });
		nav.clear();
		expect(isEditorInteractionActive()).toBe(false);
	});
	it('cancels an in-flight worker and never publishes its stale result', async () => {
		const workers: { terminate: ReturnType<typeof vi.fn>; onmessage?: (e: unknown) => void }[] = [];
		class FakeWorker {
			terminate = vi.fn();
			onmessage?: (e: unknown) => void;
			postMessage() {}
			constructor() {
				workers.push(this);
			}
		}
		vi.stubGlobal('Worker', FakeWorker);
		const doc = level();
		const { nav, baked } = session(doc);
		const pending = nav.bake('old');
		await vi.waitFor(() => expect(workers.length).toBe(1));
		const changed = structuredClone(doc);
		changed.navigation.settings.agentRadius = 0.8;
		nav.sync(changed);
		expect(workers[0].terminate).toHaveBeenCalled();
		expect(await pending).toBeNull();
		expect(baked).not.toHaveBeenCalled();
		expect(nav.status.sourceHash).toBe(navigationSourceHash(changed));
	});
});
