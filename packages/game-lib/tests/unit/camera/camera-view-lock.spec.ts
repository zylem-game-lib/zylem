import { afterEach, describe, expect, it } from 'vitest';
import { Frustum, Matrix4, OrthographicCamera, PerspectiveCamera, Scene, Vector2, Vector3 } from 'three';
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

function viewCanvas(): HTMLCanvasElement {
	const dom = document.createElement('canvas');
	dom.width = 800;
	dom.height = 600;
	Object.defineProperty(dom, 'clientWidth', { configurable: true, value: 800 });
	Object.defineProperty(dom, 'clientHeight', { configurable: true, value: 600 });
	dom.setPointerCapture = () => {};
	dom.releasePointerCapture = () => {};
	return dom;
}

function fakeRenderer(dom: HTMLCanvasElement = viewCanvas()): RendererManager {
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

/** Right-drag. Orbit listens for the move on the document after pointerdown. */
function dragPan(canvas: HTMLCanvasElement, dx: number, dy: number): void {
	const pointer = (type: string, x: number, y: number) => new PointerEvent(type, {
		bubbles: true,
		cancelable: true,
		clientX: x,
		clientY: y,
		button: 2,
		buttons: type === 'pointerup' ? 0 : 2,
		pointerId: 1,
		pointerType: 'mouse',
	});
	canvas.dispatchEvent(pointer('pointerdown', 100, 100));
	document.dispatchEvent(pointer('pointermove', 100 + dx, 100 + dy));
	document.dispatchEvent(pointer('pointerup', 100 + dx, 100 + dy));
}

/** Orbit damping applies a pan across later updates. */
function settle(camera: ZylemCamera): void {
	for (let i = 0; i < 90; i++) camera.updateOrbitControls();
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

	async function stage(): Promise<{ manager: CameraManager; game: ZylemCamera; canvas: HTMLCanvasElement }> {
		const canvas = viewCanvas();
		const manager = new CameraManager();
		const game = gameCamera();
		manager.addCamera(game, 'main');
		await manager.setup(new Scene(), fakeRenderer(canvas));
		managers.push(manager);
		return { manager, game, canvas };
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

	it('pans the side view on Y and Z and the top view on X and Z', async () => {
		const { manager, canvas } = await stage();
		await setEditorCamerasAttached(true);

		manager.activateCameraById(EDITOR_CAMERAS.side);
		const side = manager.primaryCamera!;
		side.camera.updateMatrixWorld(true);
		const sideStart = side.camera.position.clone();
		dragPan(canvas, 180, 0);
		settle(side);
		const sideRight = side.camera.position.clone().sub(sideStart);
		expect(Math.abs(sideRight.z)).toBeGreaterThan(0.5);
		expect(Math.abs(sideRight.y)).toBeLessThan(0.05);
		expect(Math.abs(sideRight.x)).toBeLessThan(0.05);

		dragPan(canvas, 0, 180);
		settle(side);
		const sideDown = side.camera.position.clone().sub(sideStart).sub(sideRight);
		expect(Math.abs(sideDown.y)).toBeGreaterThan(0.5);
		expect(Math.abs(sideDown.z)).toBeLessThan(0.05);
		expect(Math.abs(sideDown.x)).toBeLessThan(0.05);

		manager.activateCameraById(EDITOR_CAMERAS.top);
		const top = manager.primaryCamera!;
		top.camera.updateMatrixWorld(true);
		const topStart = top.camera.position.clone();
		dragPan(canvas, 180, 0);
		settle(top);
		const topRight = top.camera.position.clone().sub(topStart);
		expect(Math.abs(topRight.x)).toBeGreaterThan(0.5);
		expect(Math.abs(topRight.z)).toBeLessThan(0.05);
		expect(Math.abs(topRight.y)).toBeLessThan(0.05);

		dragPan(canvas, 0, 180);
		settle(top);
		const topDown = top.camera.position.clone().sub(topStart).sub(topRight);
		expect(Math.abs(topDown.z)).toBeGreaterThan(0.5);
		expect(Math.abs(topDown.x)).toBeLessThan(0.05);
		expect(Math.abs(topDown.y)).toBeLessThan(0.05);
	});

	it('keeps isometric geometry visible on both sides of the camera', async () => {
		const { manager } = await stage();
		await setEditorCamerasAttached(true);

		const isometric = manager.getCamera(EDITOR_CAMERAS.isometric)!.camera;
		expect(isometric.near).toBeLessThan(0);
		expect(isometric.far).toBeGreaterThan(1000);
		isometric.updateMatrixWorld(true);

		const viewProjection = new Matrix4().multiplyMatrices(
			isometric.projectionMatrix,
			isometric.matrixWorldInverse,
		);
		const frustum = new Frustum().setFromProjectionMatrix(viewProjection);
		const towardScene = new Vector3(-1, -1, -1).normalize();
		const behind = isometric.position.clone().addScaledVector(towardScene, -800);
		const ahead = isometric.position.clone().addScaledVector(towardScene, 800);
		expect(frustum.containsPoint(behind)).toBe(true);
		expect(frustum.containsPoint(ahead)).toBe(true);
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
