import { WebGLRenderer } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { WebGPURenderer } from 'three/webgpu';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GLTFLoaderAdapter } from '../../../src/lib/core/loaders/gltf-loader';

function createWebGLRendererStub(): WebGLRenderer {
	return Object.create(WebGLRenderer.prototype) as WebGLRenderer;
}

function createWebGPURendererStub(): WebGPURenderer {
	return Object.create(WebGPURenderer.prototype) as WebGPURenderer;
}

describe('GLTFLoaderAdapter runtime configuration', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('treats Vite-style GLB URLs as supported', () => {
		const loader = new GLTFLoaderAdapter();

		expect(loader.isSupported('/src/assets/cougar-ship.glb?t=1775283135030')).toBe(true);
		expect(loader.isSupported('/src/assets/cougar-ship.glb#preview')).toBe(true);
	});

	it('registers Meshopt only once when left enabled', async () => {
		const setMeshoptDecoderSpy = vi.spyOn(
			GLTFLoader.prototype,
			'setMeshoptDecoder',
		);

		const loader = new GLTFLoaderAdapter();

		expect(setMeshoptDecoderSpy).toHaveBeenCalledTimes(1);

		await loader.configureRuntime();
		await loader.configureRuntime({ meshopt: true });

		expect(setMeshoptDecoderSpy).toHaveBeenCalledTimes(1);
	});

	it('creates a KTX2 loader lazily and reuses it for the same path and WebGL renderer', async () => {
		const detectSupportSpy = vi
			.spyOn(KTX2Loader.prototype, 'detectSupport')
			.mockImplementation(function mockDetectSupport() {
				return this;
			});
		const disposeSpy = vi
			.spyOn(KTX2Loader.prototype, 'dispose')
			.mockImplementation(() => {});

		const loader = new GLTFLoaderAdapter();
		const renderer = createWebGLRendererStub();

		expect((loader as any).ktx2Loader).toBeNull();

		await loader.configureRuntime({
			ktx2TranscoderPath: '/three/basis/',
			renderer,
		});

		const firstKtx2Loader = (loader as any).ktx2Loader;
		expect(firstKtx2Loader).toBeInstanceOf(KTX2Loader);
		expect((loader as any).ktx2TranscoderPath).toBe('/three/basis/');
		expect(detectSupportSpy).toHaveBeenCalledTimes(1);

		await loader.configureRuntime({
			ktx2TranscoderPath: '/three/basis',
			renderer,
		});

		expect((loader as any).ktx2Loader).toBe(firstKtx2Loader);
		expect(detectSupportSpy).toHaveBeenCalledTimes(1);
		expect(disposeSpy).not.toHaveBeenCalled();
	});

	it('uses async KTX2 support detection for WebGPU renderers', async () => {
		const detectSupportSpy = vi
			.spyOn(KTX2Loader.prototype, 'detectSupport')
			.mockImplementation(function mockDetectSupport() {
				return this;
			});
		const detectSupportAsyncSpy = vi
			.spyOn(KTX2Loader.prototype, 'detectSupportAsync')
			.mockResolvedValue(undefined as never);

		const loader = new GLTFLoaderAdapter();

		await loader.configureRuntime({
			ktx2TranscoderPath: '/three/basis/',
			renderer: createWebGPURendererStub(),
		});

		expect(detectSupportAsyncSpy).toHaveBeenCalledTimes(1);
		expect(detectSupportSpy).not.toHaveBeenCalled();
	});

	it('recreates the KTX2 loader when the transcoder path changes', async () => {
		vi.spyOn(KTX2Loader.prototype, 'detectSupport').mockImplementation(
			function mockDetectSupport() {
				return this;
			},
		);
		const disposeSpy = vi
			.spyOn(KTX2Loader.prototype, 'dispose')
			.mockImplementation(() => {});

		const loader = new GLTFLoaderAdapter();
		const renderer = createWebGLRendererStub();

		await loader.configureRuntime({
			ktx2TranscoderPath: '/three/basis/',
			renderer,
		});
		const firstKtx2Loader = (loader as any).ktx2Loader;

		await loader.configureRuntime({
			ktx2TranscoderPath: '/three/alternate-basis/',
			renderer,
		});

		expect((loader as any).ktx2Loader).not.toBe(firstKtx2Loader);
		expect(disposeSpy).toHaveBeenCalledTimes(1);
	});

	it('requires a renderer when KTX2 support is enabled', async () => {
		const loader = new GLTFLoaderAdapter();

		await expect(
			loader.configureRuntime({
				ktx2TranscoderPath: '/three/basis/',
			}),
		).rejects.toThrow(/requires a renderer/i);
	});
});
