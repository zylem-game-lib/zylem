/**
 * Entity Asset Loader - Refactored to use AssetManager
 * 
 * This module provides a compatibility layer for existing code that uses EntityAssetLoader.
 * All loading now goes through the centralized AssetManager for caching.
 */

import { AnimationClip, Object3D } from 'three';
import { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { assetManager } from './asset-manager';
import type { AssetLoadOptions } from './asset-types';

export interface AssetLoaderResult {
	object?: Object3D;
	/** First clip. Separate-file Mixamo loads keep using this. */
	animation?: AnimationClip;
	/** Every clip in the file. Shared model URLs bind by clip name. */
	animations?: AnimationClip[];
	gltf?: GLTF;
}

/**
 * EntityAssetLoader - Uses AssetManager for all model loading
 * 
 * This class is now a thin wrapper around AssetManager, providing backward
 * compatibility for existing code while benefiting from centralized caching.
 */
export class EntityAssetLoader {
	/**
	 * Load a model file through `AssetManager.loadModel`.
	 */
	async loadFile(file: string, options?: AssetLoadOptions): Promise<AssetLoaderResult> {
		const result = await assetManager.loadModel(file, options);
		const animations = result.animations ?? [];
		return {
			object: result.object,
			animation: animations[0],
			animations,
			gltf: result.gltf,
		};
	}
}
