/**
 * GLTF loader adapter for the Asset Manager
 * Uses native fetch (already async/non-blocking in browsers) + parseAsync.
 * Automatically configures DRACOLoader for Draco-compressed meshes.
 */

import { GLTF, GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { LoaderAdapter, AssetLoadOptions, ModelLoadResult } from '../asset-types';

const DRACO_DECODER_PATH = 'https://www.gstatic.com/draco/v1/decoders/';

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

	constructor() {
		this.dracoLoader = new DRACOLoader();
		this.dracoLoader.setDecoderPath(DRACO_DECODER_PATH);

		this.loader = new GLTFLoader();
		this.loader.setDRACOLoader(this.dracoLoader);
	}

	isSupported(url: string): boolean {
		const ext = url.split('.').pop()?.toLowerCase();
		return ['gltf', 'glb'].includes(ext || '');
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
			object: result.object.clone(),
			animations: result.animations?.map(anim => anim.clone()),
			gltf: result.gltf
		};
	}
}
