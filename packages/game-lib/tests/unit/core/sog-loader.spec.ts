import { BufferGeometry } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SOG_NOT_INSTALLED_MESSAGE, STREAMED_SOG_UNSUPPORTED_MESSAGE } from '../../../src/lib/core/loaders/model-sniff';
import {
	importSogDecoder,
	loadSogDecoder,
	modelFromSogBytes,
	type SogDecoder,
} from '../../../src/lib/core/loaders/sog-loader';

vi.mock('../../../src/lib/core/loaders/gaussian-splat-loader', () => {
	return {
		parseGaussianBuffer: vi.fn(async () => new BufferGeometry()),
		createGaussianSplatResult: vi.fn((geometry: BufferGeometry) => ({
			object: { geometry, userData: { zylemAssetKind: 'gaussian-splat' } },
			animations: [],
		})),
	};
});

describe('SOG decoder', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it('reports a missing optional package instead of a module resolution error', async () => {
		await expect(loadSogDecoder(async () => {
			throw new Error('Cannot find module');
		})).rejects.toThrow(SOG_NOT_INSTALLED_MESSAGE);
	});

	it('loads the installed splat-transform decoder', async () => {
		const decoder = await importSogDecoder();
		expect(typeof decoder.readFile).toBe('function');
		expect(typeof decoder.writeSource).toBe('function');
		expect(typeof decoder.MemoryReadFileSystem).toBe('function');
	});

	it('rejects streamed SOG and converts a bundled buffer into the Gaussian result', async () => {
		const { modelFromSogUrl } = await import('../../../src/lib/core/loaders/sog-loader');
		const decoder = {
			readFile: vi.fn(async () => [{ close: vi.fn() }]),
			writeSource: vi.fn(async (_options: unknown, fileSystem: { results: Map<string, Uint8Array> }) => {
				fileSystem.results.set('zylem-decoded.spz', new Uint8Array([9, 9, 9, 9]));
			}),
			createChunkDataPool: () => ({}),
			MemoryReadFileSystem: class {
				set(): void {}
			},
			MemoryFileSystem: class {
				results = new Map<string, Uint8Array>();
			},
			UrlReadFileSystem: class {},
		} as SogDecoder;

		await expect(modelFromSogUrl(decoder, '/lod-meta.json')).rejects.toThrow(STREAMED_SOG_UNSUPPORTED_MESSAGE);

		const result = await modelFromSogBytes(decoder, new Uint8Array([1, 2, 3]), 'cloud.sog');
		expect(result.object.userData.zylemAssetKind).toBe('gaussian-splat');
		expect(decoder.readFile).toHaveBeenCalled();
		expect(decoder.writeSource).toHaveBeenCalled();
	});
});
