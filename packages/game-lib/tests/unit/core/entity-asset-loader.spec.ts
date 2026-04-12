import { Group } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { assetManager } from '../../../src/lib/core/asset-manager';
import { EntityAssetLoader } from '../../../src/lib/core/entity-asset-loader';

describe('EntityAssetLoader', () => {
	afterEach(() => {
		vi.restoreAllMocks();
		assetManager.clearCache();
	});

	it('routes Vite-style GLB URLs to the GLTF loader', async () => {
		const loadGLTFSpy = vi.spyOn(assetManager, 'loadGLTF').mockResolvedValue({
			object: new Group(),
			animations: [],
			gltf: {} as any,
		});

		const loader = new EntityAssetLoader();
		const file = '/src/assets/cougar-ship.glb?t=1775283135030';

		const result = await loader.loadFile(file, { clone: true });

		expect(loadGLTFSpy).toHaveBeenCalledWith(file, { clone: true });
		expect(result.object).toBeInstanceOf(Group);
	});
});
