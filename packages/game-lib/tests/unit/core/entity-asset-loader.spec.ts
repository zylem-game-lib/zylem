import { Group, AnimationClip } from 'three';
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
		const file = '/src/assets/enemy-ship-purple.glb?t=1775283135030';

		const result = await loader.loadFile(file, { clone: true });

		expect(loadGLTFSpy).toHaveBeenCalledWith(file, { clone: true });
		expect(result.object).toBeInstanceOf(Group);
	});

	it('returns every clip from a GLB instead of dropping them', async () => {
		const clip = new AnimationClip('run', 1, []);
		vi.spyOn(assetManager, 'loadGLTF').mockResolvedValue({
			object: new Group(),
			animations: [clip],
			gltf: {} as any,
		});

		const result = await new EntityAssetLoader().loadFile('hero.glb');

		expect(result.animation).toBe(clip);
		expect(result.animations).toEqual([clip]);
		expect(result.gltf).toBeDefined();
	});

	it('rejects Alembic with a stable conversion error', async () => {
		await expect(new EntityAssetLoader().loadFile('cache.abc')).rejects.toThrow(/Alembic/);
	});
});
