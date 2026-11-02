import { WebGLRenderer } from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { WebGPURenderer } from 'three/webgpu';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_DRACO_DECODER_PATH, GLTFLoaderAdapter } from '../../../src/lib/core/loaders/gltf-loader';

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

		expect(loader.isSupported('/src/assets/enemy-ship-purple.glb?t=1775283135030')).toBe(true);
		expect(loader.isSupported('/src/assets/enemy-ship-purple.glb#preview')).toBe(true);
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
			.mockImplementation(function mockDetectSupport(this: KTX2Loader) {
				return this;
			});
		const disposeSpy = vi
			.spyOn(KTX2Loader.prototype, 'dispose')
			.mockImplementation(function mockDispose(this: KTX2Loader) {
				return this;
			});

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

	it('uses synchronous KTX2 support detection for WebGPU renderers (r181+)', async () => {
		const detectSupportSpy = vi
			.spyOn(KTX2Loader.prototype, 'detectSupport')
			.mockImplementation(function mockDetectSupport(this: KTX2Loader) {
				return this;
			});

		const loader = new GLTFLoaderAdapter();

		await loader.configureRuntime({
			ktx2TranscoderPath: '/three/basis/',
			renderer: createWebGPURendererStub(),
		});

		expect(detectSupportSpy).toHaveBeenCalledTimes(1);
	});

	it('recreates the KTX2 loader when the transcoder path changes', async () => {
		vi.spyOn(KTX2Loader.prototype, 'detectSupport').mockImplementation(
			function mockDetectSupport(this: KTX2Loader) {
				return this;
			},
		);
		const disposeSpy = vi
			.spyOn(KTX2Loader.prototype, 'dispose')
			.mockImplementation(function mockDispose(this: KTX2Loader) {
				return this;
			});

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

	it('points Draco at the local decoder path', () => {
		const setDecoderPath = vi.spyOn(DRACOLoader.prototype, 'setDecoderPath');

		new GLTFLoaderAdapter();

		expect(setDecoderPath).toHaveBeenCalledWith(DEFAULT_DRACO_DECODER_PATH);
		expect(DEFAULT_DRACO_DECODER_PATH).toBe('/three/draco/');
	});

	it('rejects a parse failure without downloading the file again', async () => {
		const fetchMock = vi.fn(async () => new Response(new Uint8Array([1, 2, 3, 4])));
		vi.stubGlobal('fetch', fetchMock);

		const loader = new GLTFLoaderAdapter();

		await expect(loader.load('broken.glb')).rejects.toBeTruthy();
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('rejects a required SPZ gaussian extension before parsing', async () => {
		vi.stubGlobal('fetch', async () => new Response(encodeGlb({
			asset: { version: '2.0' },
			extensionsRequired: ['KHR_spz_gaussian_splats_compression'],
		})));

		const loader = new GLTFLoaderAdapter();

		await expect(loader.load('compressed.glb')).rejects.toThrow(/KHR_spz_gaussian_splats_compression/);
	});

	it('registers the gaussian splat plugin only when the glTF extension is present', async () => {
		const register = vi.spyOn(GLTFLoader.prototype, 'register');
		const loader = new GLTFLoaderAdapter();
		const builtInRegistrations = register.mock.calls.length;

		vi.stubGlobal('fetch', async () => new Response(encodeGlb({
			asset: { version: '2.0' },
			scene: 0,
			scenes: [{ nodes: [] }],
		})));
		await loader.load('mesh.glb');
		expect(register.mock.calls.length).toBe(builtInRegistrations);

		vi.stubGlobal('fetch', async () => new Response(encodeGlb({
			asset: { version: '2.0' },
			extensionsUsed: ['KHR_gaussian_splatting'],
			scene: 0,
			scenes: [{ nodes: [] }],
		})));
		await loader.load('splats.glb');
		expect(register.mock.calls.length).toBeGreaterThan(builtInRegistrations);
	});
});

function encodeGlb(json: object): Uint8Array {
	const jsonBytes = new TextEncoder().encode(JSON.stringify(json));
	const padding = (4 - (jsonBytes.byteLength % 4)) % 4;
	const chunkLength = jsonBytes.byteLength + padding;
	const total = 12 + 8 + chunkLength;
	const buffer = new ArrayBuffer(total);
	const view = new DataView(buffer);
	view.setUint32(0, 0x46546c67, true);
	view.setUint32(4, 2, true);
	view.setUint32(8, total, true);
	view.setUint32(12, chunkLength, true);
	view.setUint32(16, 0x4e4f534a, true);
	const chunk = new Uint8Array(buffer, 20, chunkLength);
	chunk.set(jsonBytes);
	chunk.fill(0x20, jsonBytes.byteLength);
	return new Uint8Array(buffer);
}
