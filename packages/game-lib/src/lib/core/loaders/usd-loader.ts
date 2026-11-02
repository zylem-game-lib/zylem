/**
 * USD and USDZ via three's `USDLoader`.
 *
 * `USDZLoader` is a deprecated subclass that only warns and forwards.
 * This adapter never constructs it. Coverage is the r187 preview-surface
 * subset (meshes, preview materials, cameras, lights, skinning), not full OpenUSD.
 */

import { AnimationClip, Group } from 'three';
import type { USDLoader } from 'three/addons/loaders/USDLoader.js';
import type { AssetLoadOptions, ModelLoadResult } from '../asset-types';
import { fetchArrayBuffer } from './fetch-buffer';
import { cloneModelObject } from './model-clone';
import { getUrlDirectory, getUrlFileExtension } from './url-utils';

const USD_EXTENSIONS = new Set(['usd', 'usda', 'usdc', 'usdz']);

type AnimatedGroup = Group & { animations?: AnimationClip[] };

export class USDLoaderAdapter {
	private loaderPromise: Promise<USDLoader> | null = null;

	private loader(): Promise<USDLoader> {
		this.loaderPromise ??= import('three/addons/loaders/USDLoader.js').then(
			(module) => new module.USDLoader(),
		);
		return this.loaderPromise;
	}

	isSupported(url: string): boolean {
		const extension = getUrlFileExtension(url);
		return extension !== null && USD_EXTENSIONS.has(extension);
	}

	async load(url: string, options?: AssetLoadOptions): Promise<ModelLoadResult> {
		const buffer = await fetchArrayBuffer(url, options);
		const loader = await this.loader();
		const group = await new Promise<AnimatedGroup>((resolve, reject) => {
			try {
				loader.parse(buffer, getUrlDirectory(url), resolve, reject);
			} catch (error) {
				reject(error);
			}
		});
		return {
			object: group,
			animations: group.animations ?? [],
		};
	}

	clone(result: ModelLoadResult): ModelLoadResult {
		return {
			object: cloneModelObject(result.object),
			animations: result.animations?.map((clip) => clip.clone()),
		};
	}
}
