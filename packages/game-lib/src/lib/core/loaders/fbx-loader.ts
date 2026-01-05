/**
 * FBX loader adapter for the Asset Manager
 * Uses native fetch (already async/non-blocking in browsers) + parse
 */

import { Object3D } from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { LoaderAdapter, AssetLoadOptions, ModelLoadResult } from '../asset-types';

export interface FBXLoadOptions extends AssetLoadOptions {
	/** 
	 * Use async fetch + parse pattern instead of loader.load()
	 * Note: fetch() is already non-blocking in browsers
	 */
	useAsyncFetch?: boolean;
}

export class FBXLoaderAdapter implements LoaderAdapter<ModelLoadResult> {
	private loader: FBXLoader;

	constructor() {
		this.loader = new FBXLoader();
	}

	isSupported(url: string): boolean {
		const ext = url.split('.').pop()?.toLowerCase();
		return ext === 'fbx';
	}

	async load(url: string, options?: FBXLoadOptions): Promise<ModelLoadResult> {
		if (options?.useAsyncFetch) {
			return this.loadWithAsyncFetch(url, options);
		}
		return this.loadMainThread(url, options);
	}

	/**
	 * Load using native fetch + parse
	 */
	private async loadWithAsyncFetch(url: string, _options?: FBXLoadOptions): Promise<ModelLoadResult> {
		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
			}
			const buffer = await response.arrayBuffer();

			// Parse on main thread using FBXLoader.parse
			const object = this.loader.parse(buffer, url);

			return {
				object,
				animations: (object as any).animations || []
			};
		} catch (error) {
			console.error(`Async fetch FBX load failed for ${url}, falling back to loader.load():`, error);
			return this.loadMainThread(url, _options);
		}
	}

	private async loadMainThread(url: string, options?: FBXLoadOptions): Promise<ModelLoadResult> {
		return new Promise((resolve, reject) => {
			this.loader.load(
				url,
				(object: Object3D) => {
					resolve({
						object,
						animations: (object as any).animations || []
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
	 * Clone a loaded FBX object for reuse
	 */
	clone(result: ModelLoadResult): ModelLoadResult {
		return {
			object: result.object.clone(),
			animations: result.animations?.map(anim => anim.clone())
		};
	}
}
