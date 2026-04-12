/**
 * GLTF loader adapter for the Asset Manager
 * Uses native fetch (already async/non-blocking in browsers) + parseAsync.
 * Automatically configures DRACOLoader for Draco-compressed meshes.
 */

import { WebGLRenderer } from 'three';
import { GLTF, GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { WebGPURenderer } from 'three/webgpu';
import { LoaderAdapter, AssetLoadOptions, ModelLoadResult } from '../asset-types';
import { cloneModelObject } from './model-clone';
import { getUrlFileExtension } from './url-utils';

const DRACO_DECODER_PATH = 'https://www.gstatic.com/draco/v1/decoders/';

export interface GLTFRuntimeConfig {
	meshopt?: boolean;
	ktx2TranscoderPath?: URL | string;
	renderer?: WebGLRenderer | WebGPURenderer | null;
}

export interface GLTFLoadOptions extends AssetLoadOptions {
	/** 
	 * Use async fetch + parseAsync pattern instead of loader.load()
	 * Note: fetch() is already non-blocking in browsers, so this mainly
	 * provides a cleaner async/await pattern rather than performance gains
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

	constructor() {
		this.dracoLoader = new DRACOLoader();
		this.dracoLoader.setDecoderPath(DRACO_DECODER_PATH);

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

		if (renderer instanceof WebGPURenderer) {
			await this.ktx2Loader.detectSupportAsync(renderer);
		} else {
			this.ktx2Loader.detectSupport(renderer);
		}

		this.configuredRenderer = renderer;
	}

	async load(url: string, options?: GLTFLoadOptions): Promise<ModelLoadResult> {
		if (options?.useAsyncFetch) {
			return this.loadWithAsyncFetch(url, options);
		}
		return this.loadMainThread(url, options);
	}

	/**
	 * Load using native fetch + parseAsync
	 * Both fetch and parsing are async, keeping the main thread responsive
	 */
	private async loadWithAsyncFetch(url: string, options?: GLTFLoadOptions): Promise<ModelLoadResult> {
		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
			}
			const buffer = await response.arrayBuffer();

			// Parse on main thread using GLTFLoader.parseAsync
			// The url is passed as the path for resolving relative resources
			const gltf = await this.loader.parseAsync(buffer, url);

			return {
				object: gltf.scene,
				animations: gltf.animations,
				gltf
			};
		} catch (error) {
			console.error(`Async fetch GLTF load failed for ${url}, falling back to loader.load():`, error);
			return this.loadMainThread(url, options);
		}
	}

	private async loadMainThread(url: string, options?: GLTFLoadOptions): Promise<ModelLoadResult> {
		return new Promise((resolve, reject) => {
			this.loader.load(
				url,
				(gltf: GLTF) => {
					resolve({
						object: gltf.scene,
						animations: gltf.animations,
						gltf
					});
				},
				(event) => {
					if (options?.onProgress && event.lengthComputable) {
						options.onProgress(event.loaded / event.total);
					}
				},
				(error) => reject(error)
			);
		});
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
