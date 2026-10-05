import { afterEach, describe, expect, it } from 'vitest';
import { OrthographicCamera, PerspectiveCamera, Scene, Vector2, Vector3 } from 'three';
import { getZylemBridge } from '@zylem/bridge';

import { GameBridge } from '../../../src/lib/bridge/game-bridge';
import { CameraManager } from '../../../src/lib/camera/camera-manager';
import {
	EDITOR_CAMERAS,
	GAME_CAMERA_ID,
	resetEditorCameraSession,
	setEditorCamerasAttached,
} from '../../../src/lib/camera/editor-camera-session';
import { Perspectives } from '../../../src/lib/camera/perspective';
import { ZylemCamera } from '../../../src/lib/camera/zylem-camera';
import type { RendererManager } from '../../../src/lib/camera/renderer-manager';

function fakeRenderer(): RendererManager {
	const dom = document.createElement('canvas');
	return {
		screenResolution: new Vector2(800, 600),
		initialized: true,
		renderer: { domElement: dom },
		rebindPostProcessingCamera() {},
	} as unknown as RendererManager;
}

/** Let a frame-based editor-detach watch run. */
function frame(): Promise<void> {
	return new Promise((resolve) => {
		requestAnimationFrame(() => resolve());
	});
}

function gameCamera(): ZylemCamera {
	const camera = new ZylemCamera(Perspectives.ThirdPerson, new Vector2(800, 600));
	camera.camera.position.set(0, 5, 12);
	camera.camera.lookAt(0, 0, 0);
	return camera;
}

describe('editor view cameras', () => {
	const bridge = new GameBridge();
	const { channel } = getZylemBridge();
	const managers: CameraManager[] = [];
	let stopUpsert: (() => void) | null = null;
	let stopThumbnail: (() => void) | null = null;

	afterEach(() => {
		stopUpsert?.();
		stopThumbnail?.();
		stopUpsert = null;
		stopThumbnail = null;
		bridge.disconnect();
		channel.reset();
		for (const manager of managers) manager.dispose();
		managers.length = 0;
		resetEditorCameraSession();
	});

	async function stage(): Promise<{ manager: CameraManager; game: ZylemCamera }> {
		const manager = new CameraManager();
		const game = gameCamera();
		manager.addCamera(game, 'main');
		await manager.setup(new Scene(), fakeRenderer());
		managers.push(manager);
		return { manager, game };
	}

	it('does not create editor cameras until an editor attaches', async () => {
		const { manager } = await stage();
		expect(manager.hasEditorCameras()).toBe(false);
		expect(manager.getCamera(EDITOR_CAMERAS.side)).toBeNull();
	});

	it('creates four view cameras on attach and leaves the game camera active', async () => {
		const { manager, game } = await stage();

		await setEditorCamerasAttached(true);

		expect(manager.primaryCamera).toBe(game);
		expect(manager.getCamera(EDITOR_CAMERAS.side)?.camera).toBeInstanceOf(OrthographicCamera);
		expect(manager.getCamera(EDITOR_CAMERAS.top)?.camera).toBeInstanceOf(OrthographicCamera);
		expect(manager.getCamera(EDITOR_CAMERAS.isometric)?.camera).toBeInstanceOf(OrthographicCamera);
		expect(manager.getCamera(EDITOR_CAMERAS.free)?.camera).toBeInstanceOf(PerspectiveCamera);
		expect(manager.isEditorViewActive()).toBe(false);
	});

	it('seeds side, top, and isometric around the game camera look-at', async () => {
		const { manager } = await stage();
		await setEditorCamerasAttached(true);

		const side = manager.getCamera(EDITOR_CAMERAS.side)!.camera.position;
		const top = manager.getCamera(EDITOR_CAMERAS.top)!.camera.position;
		const isometric = manager.getCamera(EDITOR_CAMERAS.isometric)!.camera.position;

		expect(side.x).toBeGreaterThan(1);
		expect(Math.abs(side.y)).toBeLessThan(0.5);
		expect(Math.abs(side.z)).toBeLessThan(0.5);

		expect(top.y).toBeGreaterThan(1);
		expect(Math.abs(top.x)).toBeLessThan(0.5);
		expect(Math.abs(top.z)).toBeLessThan(0.5);

		expect(isometric.x).toBeGreaterThan(1);
		expect(isometric.y).toBeCloseTo(isometric.x, 0);
		expect(isometric.z).toBeCloseTo(isometric.x, 0);

		manager.activateCameraById(EDITOR_CAMERAS.side);
		const sideArmed = manager.primaryCamera!.camera.position;
		expect(sideArmed.x).toBeGreaterThan(1);
		expect(Math.abs(sideArmed.y)).toBeLessThan(1);
		expect(Math.abs(sideArmed.z)).toBeLessThan(1);

		manager.activateCameraById(EDITOR_CAMERAS.top);
		const topArmed = manager.primaryCamera!.camera.position;
		expect(topArmed.y).toBeGreaterThan(1);
		expect(Math.abs(topArmed.x)).toBeLessThan(1);
		expect(Math.abs(topArmed.z)).toBeLessThan(1);
		expect(manager.primaryCamera!.camera.up.z).toBeLessThan(0);
	});

	it('switches to an editor view and remembers a game camera change', async () => {
		const { manager, game } = await stage();
		await setEditorCamerasAttached(true);

		expect(manager.activateCameraById(EDITOR_CAMERAS.side)).toBe(true);
		expect(manager.primaryCamera?.name).toBe(EDITOR_CAMERAS.side);
		expect(manager.isEditorViewActive()).toBe(true);

		const cutscene = new ZylemCamera(Perspectives.ThirdPerson, new Vector2(800, 600));
		manager.addCamera(cutscene, 'cutscene');
		expect(manager.setActiveCamera('cutscene')).toBe(true);
		expect(manager.primaryCamera?.name).toBe(EDITOR_CAMERAS.side);

		expect(manager.activateCameraById(GAME_CAMERA_ID)).toBe(true);
		expect(manager.primaryCamera).toBe(cutscene);
		expect(manager.isEditorViewActive()).toBe(false);
		expect(manager.primaryCamera).not.toBe(game);
	});

	it('activates a named game camera from the bridge id', async () => {
		const { manager } = await stage();
		await setEditorCamerasAttached(true);
		const cutscene = new ZylemCamera(Perspectives.ThirdPerson, new Vector2(800, 600));
		manager.addCamera(cutscene, 'cutscene');

		expect(manager.activateCameraById('cutscene')).toBe(true);
		expect(manager.primaryCamera).toBe(cutscene);
		expect(manager.isEditorViewActive()).toBe(false);
	});

	it('creates cameras when the editor subscribes and destroys them when it leaves', async () => {
		bridge.connect({ resolveEntity: () => null });
		const { manager, game } = await stage();

		stopUpsert = channel.on('entity:upsert', () => {});
		stopThumbnail = channel.on('entity:thumbnail', () => {});
		await setEditorCamerasAttached(true);
		expect(manager.hasEditorCameras()).toBe(true);

		manager.activateCameraById(EDITOR_CAMERAS.free);
		expect(manager.primaryCamera?.name).toBe(EDITOR_CAMERAS.free);

		stopUpsert();
		stopUpsert = null;
		await frame();
		expect(manager.hasEditorCameras()).toBe(true);

		stopThumbnail();
		stopThumbnail = null;
		await frame();
		expect(manager.hasEditorCameras()).toBe(false);
		expect(manager.primaryCamera).toBe(game);
		expect(manager.getCamera(EDITOR_CAMERAS.free)).toBeNull();
	});

	it('gives a stage created while the editor is attached its own view cameras', async () => {
		await setEditorCamerasAttached(true);
		const { manager } = await stage();
		await manager.ensureEditorCameras();
		expect(manager.hasEditorCameras()).toBe(true);
		expect(manager.primaryCamera?.name).toBe('main');
	});

	it('keeps picture-in-picture cameras when an editor view takes the main view', async () => {
		const { manager } = await stage();
		const pip = new ZylemCamera(Perspectives.ThirdPerson, new Vector2(800, 600));
		pip.viewport = { x: 0.75, y: 0, width: 0.25, height: 0.25 };
		manager.addCamera(pip, 'pip');
		manager.addActiveCamera(pip);
		await setEditorCamerasAttached(true);

		manager.activateCameraById(EDITOR_CAMERAS.free);
		expect(manager.activeCameras.map((camera) => camera.name)).toEqual([
			EDITOR_CAMERAS.free,
			'pip',
		]);
	});

	it('does not follow the game camera after the view is seeded', async () => {
		const { manager, game } = await stage();
		await setEditorCamerasAttached(true);
		const side = manager.getCamera(EDITOR_CAMERAS.side)!;
		const seeded = side.camera.position.clone();

		game.camera.position.add(new Vector3(4, 0, 0));
		expect(side.camera.position.x).toBeCloseTo(seeded.x, 5);
	});
});
