/**
 * FBX loader adapter for the Asset Manager
 */

import { Object3D, AnimationClip } from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { LoaderAdapter, AssetLoadOptions, ModelLoadResult } from '../asset-types';

export interface FBXLoadOptions extends AssetLoadOptions {
	/** Use web worker for parsing (for large models) */
	useWorker?: boolean;
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
