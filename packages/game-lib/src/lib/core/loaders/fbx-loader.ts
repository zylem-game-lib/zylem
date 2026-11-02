/**
 * FBX loader adapter for the Asset Manager.
 *
 * `FBXLoader` rotates Z-up files (`UpAxis === 2` sets `rotation.x = -π/2`)
 * and stores `UnitScaleFactor` on `userData.unitScaleFactor` without applying
 * it. Mixamo clips in the examples are authored against that unscaled size,
 * so unit scale stays off unless `applyUnitScale` is set.
 */

import { Object3D } from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { LoaderAdapter, AssetLoadOptions, ModelLoadResult } from '../asset-types';
import { cloneModelObject } from './model-clone';
import { getUrlFileExtension } from './url-utils';

export interface FBXLoadOptions extends AssetLoadOptions {
	/**
	 * Use async fetch + parse pattern instead of loader.load().
	 * The fetch is async. `FBXLoader.parse` still runs on the main thread.
	 */
	useAsyncFetch?: boolean;
	/**
	 * Scale the root by `userData.unitScaleFactor` when the file defines one.
	 * Defaults to false.
	 */
	applyUnitScale?: boolean;
}

function applyFbxUnitScale(object: Object3D, options?: FBXLoadOptions): void {
	if (!options?.applyUnitScale) {
		return;
	}
	const factor = object.userData?.unitScaleFactor;
	if (typeof factor !== 'number' || !Number.isFinite(factor) || factor === 1) {
		return;
	}
	object.scale.multiplyScalar(factor);
}

export class FBXLoaderAdapter implements LoaderAdapter<ModelLoadResult> {
	private loader: FBXLoader;

	constructor() {
		this.loader = new FBXLoader();
	}

	isSupported(url: string): boolean {
		const ext = getUrlFileExtension(url);
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
			applyFbxUnitScale(object, _options);

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
					applyFbxUnitScale(object, options);
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
			object: cloneModelObject(result.object),
			animations: result.animations?.map(anim => anim.clone())
		};
	}
}
