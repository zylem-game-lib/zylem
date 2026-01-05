/**
 * File loader adapter for the Asset Manager
 */

import { FileLoader } from 'three';
import { LoaderAdapter, AssetLoadOptions } from '../asset-types';

export interface FileLoadOptions extends AssetLoadOptions {
	responseType?: 'text' | 'arraybuffer' | 'blob' | 'json';
}

export class FileLoaderAdapter implements LoaderAdapter<string | ArrayBuffer> {
	private loader: FileLoader;

	constructor() {
		this.loader = new FileLoader();
	}

	isSupported(_url: string): boolean {
		// FileLoader can handle any file type
		return true;
	}

	async load(url: string, options?: FileLoadOptions): Promise<string | ArrayBuffer> {
		const responseType = options?.responseType ?? 'text';
		this.loader.setResponseType(responseType as any);

		return new Promise((resolve, reject) => {
			this.loader.load(
				url,
				(data) => resolve(data as string | ArrayBuffer),
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

/**
 * JSON loader using FileLoader
 */
export class JsonLoaderAdapter implements LoaderAdapter<unknown> {
	private fileLoader: FileLoaderAdapter;

	constructor() {
		this.fileLoader = new FileLoaderAdapter();
	}

	isSupported(url: string): boolean {
		const ext = url.split('.').pop()?.toLowerCase();
		return ext === 'json';
	}

	async load<T = unknown>(url: string, options?: AssetLoadOptions): Promise<T> {
		const data = await this.fileLoader.load(url, { ...options, responseType: 'json' });
		return data as T;
	}
}
