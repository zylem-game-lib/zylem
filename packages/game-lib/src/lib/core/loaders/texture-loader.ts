/**
 * Texture loader adapter for the Asset Manager
 */

import { TextureLoader, Texture, RepeatWrapping, Vector2, Wrapping } from 'three';
import { LoaderAdapter, AssetLoadOptions } from '../asset-types';

export interface TextureOptions extends AssetLoadOptions {
	repeat?: Vector2;
	wrapS?: Wrapping;
	wrapT?: Wrapping;
}

export class TextureLoaderAdapter implements LoaderAdapter<Texture> {
	private loader: TextureLoader;

	constructor() {
		this.loader = new TextureLoader();
	}

	isSupported(url: string): boolean {
		const ext = url.split('.').pop()?.toLowerCase();
		return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'tga'].includes(ext || '');
	}

	async load(url: string, options?: TextureOptions): Promise<Texture> {
		const texture = await this.loader.loadAsync(url, (event) => {
			if (options?.onProgress && event.lengthComputable) {
				options.onProgress(event.loaded / event.total);
			}
		});

		// Apply texture options
		if (options?.repeat) {
			texture.repeat.copy(options.repeat);
		}
		texture.wrapS = options?.wrapS ?? RepeatWrapping;
		texture.wrapT = options?.wrapT ?? RepeatWrapping;

		return texture;
	}

	/**
	 * Clone a texture for independent usage
	 */
	clone(texture: Texture): Texture {
		const cloned = texture.clone();
		cloned.needsUpdate = true;
		return cloned;
	}
}
