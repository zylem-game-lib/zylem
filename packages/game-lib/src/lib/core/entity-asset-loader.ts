/**
 * Entity Asset Loader - Refactored to use AssetManager
 * 
 * This module provides a compatibility layer for existing code that uses EntityAssetLoader.
 * All loading now goes through the centralized AssetManager for caching.
 */

import { AnimationClip, Object3D } from 'three';
import { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { assetManager } from './asset-manager';

export interface AssetLoaderResult {
	object?: Object3D;
	animation?: AnimationClip;
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
	 * Load a model file (FBX, GLTF, GLB, OBJ) using the asset manager
	 */
	async loadFile(file: string): Promise<AssetLoaderResult> {
		const ext = file.split('.').pop()?.toLowerCase();

		switch (ext) {
			case 'fbx': {
				const result = await assetManager.loadFBX(file);
				return {
					object: result.object,
					animation: result.animations?.[0]
				};
			}
			case 'gltf':
			case 'glb': {
				const result = await assetManager.loadGLTF(file);
				return {
					object: result.object,
					gltf: result.gltf
				};
			}
			case 'obj': {
				const result = await assetManager.loadOBJ(file);
				return {
					object: result.object
				};
			}
			default:
				throw new Error(`Unsupported file type: ${file}`);
		}
	}
}
