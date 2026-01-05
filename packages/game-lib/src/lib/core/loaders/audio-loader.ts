/**
 * Audio loader adapter for the Asset Manager
 */

import { AudioLoader } from 'three';
import { LoaderAdapter, AssetLoadOptions } from '../asset-types';

export class AudioLoaderAdapter implements LoaderAdapter<AudioBuffer> {
	private loader: AudioLoader;

	constructor() {
		this.loader = new AudioLoader();
	}

	isSupported(url: string): boolean {
		const ext = url.split('.').pop()?.toLowerCase();
		return ['mp3', 'ogg', 'wav', 'flac', 'aac', 'm4a'].includes(ext || '');
	}

	async load(url: string, options?: AssetLoadOptions): Promise<AudioBuffer> {
		return new Promise((resolve, reject) => {
			this.loader.load(
				url,
				(buffer) => resolve(buffer),
				(event) => {
					if (options?.onProgress && event.lengthComputable) {
						options.onProgress(event.loaded / event.total);
					}
				},
				(error) => reject(error)
			);
		});
	}
}
