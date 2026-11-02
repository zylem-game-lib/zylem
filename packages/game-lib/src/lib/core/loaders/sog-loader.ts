/**
 * Bundled `.sog` (and an explicit `meta.json`) decoded with the optional
 * `@playcanvas/splat-transform` package, then handed to three's `SPZLoader`.
 * The package is a converter, not a renderer. Streamed `lod-meta.json` is rejected.
 */

import type { AssetLoadOptions, ModelLoadResult } from '../asset-types';
import { cloneModelObject } from './model-clone';
import { fetchBytes } from './fetch-buffer';
import { createGaussianSplatResult, parseGaussianBuffer } from './gaussian-splat-loader';
import { SOG_NOT_INSTALLED_MESSAGE, STREAMED_SOG_UNSUPPORTED_MESSAGE } from './model-sniff';
import { getUrlDirectory, getUrlFileExtension, getUrlFileName } from './url-utils';

const SPZ_OUTPUT_NAME = 'zylem-decoded.spz';

interface SogChunkSource {
	close?: () => Promise<void> | void;
}

interface SogReadFileSystem {
	set?: (name: string, data: Uint8Array) => void;
}

interface SogMemoryFileSystem {
	results: Map<string, Uint8Array>;
}

export interface SogDecoder {
	readFile: (options: {
		filename: string;
		inputFormat: string;
		fileSystem: SogReadFileSystem;
	}) => Promise<SogChunkSource[]>;
	writeSource: (
		options: {
			filename: string;
			outputFormat: string;
			source: SogChunkSource;
			pool: unknown;
			options: Record<string, never>;
		},
		fileSystem: SogMemoryFileSystem,
	) => Promise<void>;
	createChunkDataPool: () => unknown;
	MemoryReadFileSystem: new () => SogReadFileSystem;
	MemoryFileSystem: new () => SogMemoryFileSystem;
	UrlReadFileSystem: new (baseUrl?: string) => SogReadFileSystem;
}

export async function loadSogDecoder(
	load: () => Promise<unknown> = loadInstalledSogDecoder,
): Promise<SogDecoder> {
	try {
		const imported = await load();
		return imported as SogDecoder;
	} catch (error) {
		throw new Error(SOG_NOT_INSTALLED_MESSAGE, { cause: error });
	}
}

async function loadInstalledSogDecoder(): Promise<unknown> {
	const specifier = '@playcanvas/splat-transform';
	return import(/* @vite-ignore */ specifier);
}

export function importSogDecoder(): Promise<SogDecoder> {
	return loadSogDecoder();
}

export function assertBundledSog(url: string): void {
	if (getUrlFileName(url) === 'lod-meta.json') {
		throw new Error(STREAMED_SOG_UNSUPPORTED_MESSAGE);
	}
}

async function writeSpz(
	decoder: SogDecoder,
	filename: string,
	fileSystem: SogReadFileSystem,
): Promise<Uint8Array> {
	const pool = decoder.createChunkDataPool();
	const sources = await decoder.readFile({
		filename,
		inputFormat: 'sog',
		fileSystem,
	});
	const source = sources[0];
	if (!source) {
		throw new Error(`SOG file ${filename} did not contain a splat scene.`);
	}
	const output = new decoder.MemoryFileSystem();
	try {
		await decoder.writeSource({
			filename: SPZ_OUTPUT_NAME,
			outputFormat: 'spz',
			source,
			pool,
			options: {},
		}, output);
	} finally {
		await source.close?.();
	}
	const bytes = output.results.get(SPZ_OUTPUT_NAME);
	if (!bytes) {
		throw new Error('SOG decoder did not produce an SPZ buffer.');
	}
	return bytes;
}

export async function modelFromSogBytes(
	decoder: SogDecoder,
	bytes: Uint8Array,
	filename: string,
	options?: AssetLoadOptions,
): Promise<ModelLoadResult> {
	const fileSystem = new decoder.MemoryReadFileSystem();
	fileSystem.set?.(filename, bytes);
	const spz = await writeSpz(decoder, filename, fileSystem);
	const geometry = await parseGaussianBuffer('spz', spz.buffer.slice(
		spz.byteOffset,
		spz.byteOffset + spz.byteLength,
	) as ArrayBuffer);
	return createGaussianSplatResult(geometry, options);
}

export async function modelFromSogUrl(
	decoder: SogDecoder,
	url: string,
	options?: AssetLoadOptions,
): Promise<ModelLoadResult> {
	assertBundledSog(url);
	options?.onProgress?.(0);
	const extension = getUrlFileExtension(url);
	const result = extension === 'sog'
		? await modelFromSogBytes(decoder, await fetchBytes(url, options), getUrlFileName(url) || 'model.sog', options)
		: await (async () => {
			const filename = getUrlFileName(url);
			const fileSystem = new decoder.UrlReadFileSystem(getUrlDirectory(url));
			const spz = await writeSpz(decoder, filename, fileSystem);
			const geometry = await parseGaussianBuffer('spz', spz.buffer.slice(
				spz.byteOffset,
				spz.byteOffset + spz.byteLength,
			) as ArrayBuffer);
			return createGaussianSplatResult(geometry, options);
		})();
	options?.onProgress?.(1);
	return result;
}

export class SogLoaderAdapter {
	private decoderPromise: Promise<SogDecoder> | null = null;

	private decoder(): Promise<SogDecoder> {
		this.decoderPromise ??= importSogDecoder();
		return this.decoderPromise;
	}

	isSupported(url: string): boolean {
		return getUrlFileExtension(url) === 'sog' || getUrlFileName(url) === 'meta.json';
	}

	async load(url: string, options?: AssetLoadOptions): Promise<ModelLoadResult> {
		assertBundledSog(url);
		return modelFromSogUrl(await this.decoder(), url, options);
	}

	clone(result: ModelLoadResult): ModelLoadResult {
		return {
			object: cloneModelObject(result.object),
			animations: [],
		};
	}
}
