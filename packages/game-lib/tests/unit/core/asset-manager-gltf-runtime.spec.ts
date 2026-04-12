import { Group, WebGLRenderer } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AssetManager } from '../../../src/lib/core/asset-manager';

function flushPromises(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('AssetManager GLTF runtime preparation', () => {
	afterEach(() => {
		AssetManager.resetInstance();
		vi.restoreAllMocks();
	});

	it('waits for renderer-backed KTX2 runtime config before starting a primed GLTF load', async () => {
		const manager = AssetManager.getInstance();
		const gltfLoader = (manager as any).gltfLoader;
		const loadSpy = vi
			.spyOn(gltfLoader, 'load')
			.mockResolvedValue({
				object: new Group(),
				animations: [],
				gltf: {} as any,
			});
		vi.spyOn(gltfLoader, 'configureRuntime').mockResolvedValue(undefined);

		manager.prepareGLTFRuntime({
			ktx2TranscoderPath: '/three/basis/',
		});

		const pendingLoad = manager.loadGLTF('/assets/fisher-ship.glb');
		await flushPromises();

		expect(loadSpy).not.toHaveBeenCalled();

		await manager.configureGLTFRuntime({
			ktx2TranscoderPath: '/three/basis/',
			renderer: Object.create(WebGLRenderer.prototype) as WebGLRenderer,
		});

		await pendingLoad;

		expect(loadSpy).toHaveBeenCalledTimes(1);
	});
});
