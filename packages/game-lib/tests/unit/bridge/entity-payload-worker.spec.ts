import { afterEach, describe, expect, it, vi } from 'vitest';

import { EntityPayloadWorker } from '../../../src/lib/bridge/entity-payload-worker';
import { pixelsToDataUrl } from '../../../src/lib/debug/entity-thumbnail';

describe('EntityPayloadWorker', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('reports unsupported when OffscreenCanvas is unavailable', () => {
		vi.stubGlobal('OffscreenCanvas', undefined);
		const worker = new EntityPayloadWorker();
		expect(worker.isSupported()).toBe(false);
	});

	it('encodeThumbnail resolves null on the unsupported path', async () => {
		vi.stubGlobal('OffscreenCanvas', undefined);
		const worker = new EntityPayloadWorker();
		const pixels = new Uint8Array(2 * 2 * 4);
		await expect(worker.encodeThumbnail(pixels, 2, 2)).resolves.toBeNull();
	});
});

describe('pixelsToDataUrl fallback', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('flips bottom-up rows and returns the canvas PNG data URL', () => {
		const width = 2;
		const height = 2;
		// Bottom-up source: first row in the buffer is the bottom image row.
		const bottomRow = [1, 1, 1, 255, 2, 2, 2, 255];
		const topRow = [3, 3, 3, 255, 4, 4, 4, 255];
		const source = new Uint8Array([...bottomRow, ...topRow]);

		let written: ImageData | null = null;
		const fakeContext = {
			createImageData: (w: number, h: number) =>
				({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }) as ImageData,
			putImageData: (imageData: ImageData) => {
				written = imageData;
			},
		};
		const fakeCanvas = {
			width: 0,
			height: 0,
			getContext: () => fakeContext,
			toDataURL: () => 'data:image/png;base64,FAKE',
		};
		vi.spyOn(document, 'createElement').mockReturnValue(
			fakeCanvas as unknown as HTMLElement,
		);

		const dataUrl = pixelsToDataUrl(source, width, height);

		expect(dataUrl).toBe('data:image/png;base64,FAKE');
		expect(written).not.toBeNull();
		// Top-down output: the top image row (last in the buffer) comes first.
		expect([...written!.data.slice(0, 8)]).toEqual(topRow);
		expect([...written!.data.slice(8, 16)]).toEqual(bottomRow);
	});

	it('returns null when no document is available', () => {
		vi.stubGlobal('document', undefined);
		const result = pixelsToDataUrl(new Uint8Array(4), 1, 1);
		vi.unstubAllGlobals();
		expect(result).toBeNull();
	});
});
