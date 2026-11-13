import { createHash } from 'node:crypto';
import { Value } from '@sinclair/typebox/value';
import { OrthographicCamera, PerspectiveCamera, Scene, Vector2 } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { RendererManager } from '../../../src/lib/camera/renderer-manager';
import { StageConfigJsonSchema } from '../../../src/lib/core/json-schemas/stage-config';
import { createAmbientOcclusion } from '../../../src/lib/graphics/ambient-occlusion/ambient-occlusion';
import {
	resolveAmbientOcclusion,
	type AmbientOcclusionOptions,
} from '../../../src/lib/graphics/ambient-occlusion/config';
import { createCortaoLookupData } from '../../../src/lib/graphics/ambient-occlusion/cortao-lookup';
import { parseStageOptions } from '../../../src/lib/stage/stage-config';

describe('stage ambient occlusion', () => {
	it('is opt-in and treats zero intensity as disabled', () => {
		expect(parseStageOptions().config.ambientOcclusion).toBe(false);
		for (const options of [undefined, false, { method: 'cortao', intensity: 0 }] as const) {
			expect(resolveAmbientOcclusion(options)).toBeNull();
			expect(createAmbientOcclusion(new Scene(), new PerspectiveCamera(), options)).toBeNull();
		}
	});

	it('preserves settings through stage parsing and its JSON schema', () => {
		const settings = {
			method: 'cortao',
			quality: 'high',
			radius: 2,
			intensity: 0.8,
			resolutionScale: 0.75,
			denoise: false,
		} as const;
		const config = parseStageOptions([{ ambientOcclusion: settings }]).config;
		expect(config.ambientOcclusion).toEqual(settings);
		expect(config.ambientOcclusion).not.toBe(settings);
		expect(Value.Check(StageConfigJsonSchema, { ambientOcclusion: settings })).toBe(true);
		for (const method of ['ssao', 'gtao', 'cortao'] as const) {
			expect(resolveAmbientOcclusion({ method })).toMatchObject({
				method,
				quality: 'medium',
				samples: 16,
				radius: 1,
				intensity: 1,
				resolutionScale: 0.5,
				denoise: true,
			});
			expect(resolveAmbientOcclusion({ method, quality: 'low' })?.samples).toBe(8);
			expect(resolveAmbientOcclusion({ method, quality: 'high' })).toMatchObject({
				samples: 32,
				resolutionScale: 1,
			});
		}
	});

	it.each([
		{ method: 'unknown' },
		{ method: 'gtao', quality: 'ultra' },
		{ method: 'ssao', radius: 0 },
		{ method: 'ssao', radius: Number.NaN },
		{ method: 'ssao', intensity: -1 },
		{ method: 'ssao', intensity: Infinity },
		{ method: 'cortao', resolutionScale: 0 },
		{ method: 'cortao', resolutionScale: 1.1 },
		{ method: 'cortao', denoise: 'yes' },
	])('rejects invalid settings before GPU allocation: %j', (settings) => {
		expect(() => parseStageOptions([{ ambientOcclusion: settings }])).toThrow();
		expect(Value.Check(StageConfigJsonSchema, { ambientOcclusion: settings })).toBe(false);
	});

	it('matches the upstream CORTAO generator byte for byte', () => {
		// SHA-256 of the upstream v1.0.0 generator's 24x24x16, 16-ray R16_UINT output.
		const data = createCortaoLookupData();
		const bytes = Buffer.alloc(data.length * 2);
		data.forEach((mask, i) => bytes.writeUInt16LE(mask, i * 2));
		expect(createHash('sha256').update(bytes).digest('hex')).toBe(
			'd1796d1b1596f3681745d109940ad5f3d1b74d12ec2c8e81e0b3a077747e23b5'
		);
	});

	it('owns and replaces AO resources on method, camera and stage changes', () => {
		const manager = new RendererManager(new Vector2(80, 60));
		manager.renderer = { setAnimationLoop: vi.fn(), dispose: vi.fn() } as any;
		const scene = new Scene();
		manager.setupPostProcessing(scene, new PerspectiveCamera(), { method: 'cortao' });
		const state = manager as any;
		const aoDispose = vi.spyOn(state._aoPass, 'dispose');
		const sceneDispose = vi.spyOn(state._ownedScenePass, 'dispose');
		const ortho = new OrthographicCamera();
		manager.rebindPostProcessingCamera(ortho);
		expect(aoDispose).toHaveBeenCalledOnce();
		expect(sceneDispose).toHaveBeenCalledOnce();
		expect(state._aoPass.config.method).toBe('cortao');
		manager.setAmbientOcclusion({ method: 'gtao' });
		expect(state._aoPass.config.method).toBe('gtao');
		const current = state._aoPass;
		expect(() =>
			manager.setAmbientOcclusion({ method: 'bad' } as unknown as AmbientOcclusionOptions)
		).toThrow();
		expect(state._aoPass).toBe(current);
		const dispose = vi.spyOn(current, 'dispose');
		// A stage without AO passes false explicitly, preventing settings leaking across stages.
		manager.setupPostProcessing(new Scene(), ortho, false);
		expect(dispose).toHaveBeenCalledOnce();
		expect(state._aoPass).toBeNull();
		manager.dispose();
		expect(state._ownedScenePass).toBeNull();
	});
});
