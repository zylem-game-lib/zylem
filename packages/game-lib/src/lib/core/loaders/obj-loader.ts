/**
 * OBJ loader adapter for the Asset Manager
 * Supports optional MTL (material) file loading
 */

import { Object3D, Group } from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { LoaderAdapter, AssetLoadOptions, ModelLoadResult } from '../asset-types';

export interface OBJLoadOptions extends AssetLoadOptions {
	/** Path to MTL material file */
	mtlPath?: string;
}

export class OBJLoaderAdapter implements LoaderAdapter<ModelLoadResult> {
	private loader: OBJLoader;
	private mtlLoader: MTLLoader;

	constructor() {
		this.loader = new OBJLoader();
		this.mtlLoader = new MTLLoader();
	}

	isSupported(url: string): boolean {
		const ext = url.split('.').pop()?.toLowerCase();
		return ext === 'obj';
	}

	async load(url: string, options?: OBJLoadOptions): Promise<ModelLoadResult> {
		// Load MTL first if provided
		if (options?.mtlPath) {
			await this.loadMTL(options.mtlPath);
		}

		return new Promise((resolve, reject) => {
			this.loader.load(
				url,
				(object: Group) => {
					resolve({
						object,
						animations: []
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

	private async loadMTL(url: string): Promise<void> {
		return new Promise((resolve, reject) => {
			this.mtlLoader.load(
				url,
				(materials) => {
					materials.preload();
					this.loader.setMaterials(materials);
					resolve();
				},
				undefined,
				(error) => reject(error)
			);
		});
	}

	/**
	 * Clone a loaded OBJ object for reuse
	 */
	clone(result: ModelLoadResult): ModelLoadResult {
		return {
			object: result.object.clone(),
			animations: []
		};
	}
}
