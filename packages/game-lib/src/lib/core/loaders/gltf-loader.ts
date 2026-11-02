/**
 * GLTF loader adapter for the Asset Manager
 * Uses native fetch (already async/non-blocking in browsers) + parseAsync.
 * Automatically configures DRACOLoader for Draco-compressed meshes.
 */

import { WebGLRenderer, Object3D, Texture } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { WebGPURenderer } from 'three/webgpu';
import { LoaderAdapter, AssetLoadOptions, ModelLoadResult } from '../asset-types';
import { DEFAULT_TEXTURE_ANISOTROPY } from './texture-loader';
import { fetchArrayBuffer } from './fetch-buffer';
import { markGaussianSplats } from './gaussian-model';
import { cloneModelObject } from './model-clone';
import {
	gltfUsesGaussianSplatting,
	inspectGltfExtensions,
	requiredSpzGaussianCompression,
	unsupportedSpzExtensionError,
} from './model-sniff';
import { getUrlFileExtension } from './url-utils';

/** Material texture maps that benefit from anisotropic filtering. */
const ANISOTROPIC_MAP_KEYS = [
	'map',
	'normalMap',
	'roughnessMap',
	'metalnessMap',
	'emissiveMap',
	'aoMap',
] as const;

/** Draco WASM, fetched on the first KHR_draco_mesh_compression mesh. Apps serve the r187 glTF decoder files here, next to `/three/basis/`. */
export const DEFAULT_DRACO_DECODER_PATH = '/three/draco/';

export interface GLTFRuntimeConfig {
	meshopt?: boolean;
	ktx2TranscoderPath?: URL | string;
	renderer?: WebGLRenderer | WebGPURenderer | null;
}

export interface GLTFLoadOptions extends AssetLoadOptions {
	/**
	 * Retained for existing callers. Loads always download once and parse
	 * that buffer. A parse error rejects; it does not download the file again.
	 */
	useAsyncFetch?: boolean;
}

export class GLTFLoaderAdapter implements LoaderAdapter<ModelLoadResult> {
	private loader: GLTFLoader;
	private dracoLoader: DRACOLoader;
	private ktx2Loader: KTX2Loader | null = null;
	private meshoptEnabled = false;
	private configuredRenderer: WebGLRenderer | WebGPURenderer | null = null;
	private ktx2TranscoderPath: string | null = null;
	private gaussianPluginReady: Promise<void> | null = null;

	constructor() {
		this.dracoLoader = new DRACOLoader();
		this.dracoLoader.setDecoderPath(DEFAULT_DRACO_DECODER_PATH);

		this.loader = new GLTFLoader();
		this.loader.setDRACOLoader(this.dracoLoader);
		this.setMeshoptEnabled(true);
	}

	isSupported(url: string): boolean {
		const ext = getUrlFileExtension(url);
		return ['gltf', 'glb'].includes(ext || '');
	}

	async configureRuntime({
		meshopt = true,
		ktx2TranscoderPath,
		renderer = null,
	}: GLTFRuntimeConfig = {}): Promise<void> {
		this.setMeshoptEnabled(meshopt !== false);

		const nextTranscoderPath = this.normalizeTranscoderPath(ktx2TranscoderPath);
		if (!nextTranscoderPath) {
			this.clearKTX2Loader();
			return;
		}

		if (!renderer) {
			throw new Error(
				'GLTFLoaderAdapter.configureRuntime requires a renderer when ktx2TranscoderPath is provided.',
			);
		}

		const shouldCreateLoader = !this.ktx2Loader
			|| this.ktx2TranscoderPath !== nextTranscoderPath;
		if (shouldCreateLoader) {
			this.clearKTX2Loader();
			this.ktx2Loader = new KTX2Loader();
			this.ktx2Loader.setTranscoderPath(nextTranscoderPath);
			this.loader.setKTX2Loader(this.ktx2Loader);
			this.ktx2TranscoderPath = nextTranscoderPath;
			this.configuredRenderer = null;
		}

		if (!this.ktx2Loader || this.configuredRenderer === renderer) {
			return;
		}

		// r181+: detectSupportAsync() is deprecated. detectSupport() works for
		// both WebGL and WebGPU once the renderer is initialized (the renderer
		// manager awaits renderer.init() before configureRuntime runs).
		this.ktx2Loader.detectSupport(renderer);

		this.configuredRenderer = renderer;
	}

	async load(url: string, options?: GLTFLoadOptions): Promise<ModelLoadResult> {
		const buffer = await fetchArrayBuffer(url, options);
		await this.prepareGaussianPlugin(buffer);
		const gltf = await this.loader.parseAsync(buffer, url);
		this.applyTextureAnisotropy(gltf.scene);
		markGaussianSplats(gltf.scene);
		return {
			object: gltf.scene,
			animations: gltf.animations,
			gltf,
		};
	}

	/**
	 * Register the WebGPU splat plugin only after a file actually uses
	 * `KHR_gaussian_splatting`. A required SPZ compression extension cannot
	 * be decoded by r187 and fails the load.
	 */
	private prepareGaussianPlugin(buffer: ArrayBuffer): Promise<void> {
		const extensions = inspectGltfExtensions(buffer);
		if (requiredSpzGaussianCompression(extensions)) {
			return Promise.reject(unsupportedSpzExtensionError());
		}
		if (!gltfUsesGaussianSplatting(extensions)) {
			return Promise.resolve();
		}
		this.gaussianPluginReady ??= this.registerGaussianPlugin().catch((error) => {
			this.gaussianPluginReady = null;
			throw error;
		});
		return this.gaussianPluginReady;
	}

	private async registerGaussianPlugin(): Promise<void> {
		const { GLTFGaussianSplatLoaderExtension } = await import(
			'three/addons/loaders/GLTFGaussianSplatLoaderExtension.js'
		);
		this.loader.register((parser) => new GLTFGaussianSplatLoaderExtension(parser));
	}

	/**
	 * Clone a loaded GLTF scene for reuse
	 */
	clone(result: ModelLoadResult): ModelLoadResult {
		return {
			object: cloneModelObject(result.object),
			animations: result.animations?.map(anim => anim.clone()),
			gltf: result.gltf
		};
	}

	/**
	 * Apply anisotropic filtering to every texture map on a loaded model's
	 * materials. GLTFLoader leaves textures at the default `anisotropy = 1`,
	 * which moires on tiled/oblique surfaces under the sharp WebGPU pipeline.
	 */
	private applyTextureAnisotropy(object: Object3D): void {
		object.traverse((child) => {
			const material = (child as { material?: unknown }).material;
			if (!material) return;
			const materials = Array.isArray(material) ? material : [material];
			for (const mat of materials) {
				for (const key of ANISOTROPIC_MAP_KEYS) {
					const texture = (mat as Record<string, unknown>)[key];
					if (texture && (texture as Texture).isTexture) {
						const tex = texture as Texture;
						tex.anisotropy = DEFAULT_TEXTURE_ANISOTROPY;
						tex.needsUpdate = true;
					}
				}
			}
		});
	}

	private setMeshoptEnabled(enabled: boolean): void {
		if (enabled) {
			if (this.meshoptEnabled) {
				return;
			}
			this.loader.setMeshoptDecoder(MeshoptDecoder);
			this.meshoptEnabled = true;
			return;
		}

		if (!this.meshoptEnabled) {
			return;
		}

		this.loader.setMeshoptDecoder(undefined as any);
		this.meshoptEnabled = false;
	}

	private clearKTX2Loader(): void {
		if (this.ktx2Loader) {
			this.ktx2Loader.dispose();
			this.ktx2Loader = null;
		}

		this.loader.setKTX2Loader(undefined as any);
		this.configuredRenderer = null;
		this.ktx2TranscoderPath = null;
	}

	private normalizeTranscoderPath(
		path: URL | string | undefined,
	): string | null {
		if (!path) {
			return null;
		}

		const value = String(path);
		return value.endsWith('/') ? value : `${value}/`;
	}
}
