import { afterEach, describe, expect, it, vi } from 'vitest';
import { Color } from 'three';
import { assetManager } from '../../../src/lib/core/asset-manager';
import { createStage } from '../../../src/lib/stage/stage';
import { ZylemStageConfig } from '../../../src/lib/stage/zylem-stage';

describe('create a basic stage', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('default configuration', () => {
		const result = createStage();
		result.wrappedStage = null as any;
		expect(result).toMatchSnapshot();
	});
	it('should create a stage with a coral background', async () => {
		const coral = new Color(Color.NAMES.coral);
		const result = createStage({ backgroundColor: coral });
		const options = result.options[0] as unknown as ZylemStageConfig;

		expect(options.backgroundColor).toBeInstanceOf(Color);
		expect(options.backgroundColor).toEqual(coral);
	});

	it('primes GLTF runtime requirements when stage asset loaders include KTX2 support', () => {
		const prepareGLTFRuntimeSpy = vi
			.spyOn(assetManager, 'prepareGLTFRuntime')
			.mockImplementation(() => {});

		createStage({
			assetLoaders: {
				gltf: {
					ktx2TranscoderPath: '/three/basis/',
				},
			},
		});

		expect(prepareGLTFRuntimeSpy).toHaveBeenCalledWith({
			ktx2TranscoderPath: '/three/basis/',
		});
	});
});
