/**
 * GLTF loader adapter for the Asset Manager
 * Supports both main-thread and worker-based loading
 */

import { Object3D, AnimationClip } from 'three';
import { GLTF, GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LoaderAdapter, AssetLoadOptions, ModelLoadResult } from '../asset-types';

export interface GLTFLoadOptions extends AssetLoadOptions {
	/** Use web worker for parsing (for large models) */
	useWorker?: boolean;
}

export class GLTFLoaderAdapter implements LoaderAdapter<ModelLoadResult> {
	private loader: GLTFLoader;

	constructor() {
		this.loader = new GLTFLoader();
	}

	isSupported(url: string): boolean {
		const ext = url.split('.').pop()?.toLowerCase();
		return ['gltf', 'glb'].includes(ext || '');
	}

	async load(url: string, options?: GLTFLoadOptions): Promise<ModelLoadResult> {
		// For now, use main thread loading
		// Worker support will be added in a future iteration
		return this.loadMainThread(url, options);
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
