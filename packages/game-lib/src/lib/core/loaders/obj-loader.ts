/**
 * OBJ loader adapter for the Asset Manager.
 *
 * Each load uses a new OBJLoader. A shared loader's `setMaterials` call
 * would paint the next OBJ with the previous MTL. When `mtlPath` is omitted,
 * the first `mtllib` line is resolved against the OBJ URL and loaded.
 */

import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { LoaderAdapter, AssetLoadOptions, ModelLoadResult } from '../asset-types';
import { fetchText } from './fetch-buffer';
import { cloneModelObject } from './model-clone';
import { getUrlDirectory, getUrlFileExtension, resolveAgainstFileUrl } from './url-utils';

export interface OBJLoadOptions extends AssetLoadOptions {
	/** Path to an MTL file. When omitted, the OBJ `mtllib` entry is used. */
	mtlPath?: string;
}

export function readObjMaterialLibrary(text: string): string | null {
	const match = /^mtllib\s+(.+)$/m.exec(text);
	const name = match?.[1]?.trim();
	return name || null;
}

export class OBJLoaderAdapter implements LoaderAdapter<ModelLoadResult> {
	isSupported(url: string): boolean {
		return getUrlFileExtension(url) === 'obj';
	}

	async load(url: string, options?: OBJLoadOptions): Promise<ModelLoadResult> {
		const text = await fetchText(url, options);
		const loader = new OBJLoader();
		const libraryName = options?.mtlPath ? null : readObjMaterialLibrary(text);
		const mtlUrl = options?.mtlPath ?? (libraryName ? resolveAgainstFileUrl(libraryName, url) : null);
		if (mtlUrl) {
			const materials = new MTLLoader().parse(await fetchText(mtlUrl, options), getUrlDirectory(mtlUrl));
			materials.preload();
			loader.setMaterials(materials);
		}

		return {
			object: loader.parse(text),
			animations: [],
		};
	}

	clone(result: ModelLoadResult): ModelLoadResult {
		return {
			object: cloneModelObject(result.object),
			animations: [],
		};
	}
}
