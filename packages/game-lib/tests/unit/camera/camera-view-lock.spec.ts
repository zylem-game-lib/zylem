import { afterEach, describe, expect, it } from 'vitest';
import { PerspectiveCamera } from 'three';
import { getZylemBridge } from '@zylem/bridge';

import { GameBridge } from '../../../src/lib/bridge/game-bridge';
import { CameraOrbitController } from '../../../src/lib/camera/camera-debug-delegate';
import { resetCameraViewPreset } from '../../../src/lib/camera/camera-view';

describe('camera:view:set', () => {
	const bridge = new GameBridge();
	const { channel } = getZylemBridge();
	let controller: CameraOrbitController | null = null;
	let camera: PerspectiveCamera | null = null;

	afterEach(() => {
		controller?.dispose();
		controller = null;
		camera = null;
		bridge.disconnect();
		channel.reset();
		resetCameraViewPreset();
	});

	function orbitAt(x: number, y: number, z: number): CameraOrbitController {
		camera = new PerspectiveCamera(75, 1, 0.1, 1000);
		camera.position.set(x, y, z);
		camera.lookAt(0, 0, 0);
		const element = document.createElement('div');
		controller = new CameraOrbitController(camera, element);
		controller.enableUserOrbitControls();
		return controller;
	}

	it('locks the debug orbit camera to side, top, and isometric', () => {
		bridge.connect({ resolveEntity: () => null });
		const controls = orbitAt(0, 0, 8);

		channel.send('camera:view:set', { preset: 'side' });
		expect(camera!.position.x).toBeCloseTo(8, 1);
		expect(camera!.position.y).toBeCloseTo(0, 1);
		expect(camera!.position.z).toBeCloseTo(0, 1);
		expect(controls.viewPreset).toBe('side');

		channel.send('camera:view:set', { preset: 'top' });
		expect(camera!.position.y).toBeGreaterThan(7);
		expect(Math.abs(camera!.position.x)).toBeLessThan(0.05);
		expect(Math.abs(camera!.position.z)).toBeLessThan(0.05);

		channel.send('camera:view:set', { preset: 'isometric' });
		const { x, y, z } = camera!.position;
		expect(x).toBeGreaterThan(0);
		expect(y).toBeCloseTo(x, 1);
		expect(z).toBeCloseTo(x, 1);
	});

	it('unlocks rotation on custom without leaving the locked pose', () => {
		bridge.connect({ resolveEntity: () => null });
		const controls = orbitAt(0, 0, 8);

		channel.send('camera:view:set', { preset: 'side' });
		const lockedX = camera!.position.x;

		channel.send('camera:view:set', { preset: 'custom' });
		expect(controls.viewPreset).toBe('custom');
		expect(camera!.position.x).toBeCloseTo(lockedX, 1);
	});
});
