import { afterEach, describe, expect, it, vi } from 'vitest';

import { EntityPayloadWorker } from '../../../src/lib/bridge/entity-payload-worker';
import { encodeReadbackPixels } from '../../../src/lib/bridge/pixel-encode';
import {
	pixelsToDataUrl,
	readbackIsBottomUp,
} from '../../../src/lib/debug/entity-thumbnail';

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

/**
 * Capture what `pixelsToDataUrl` writes to the canvas without depending on a
 * real 2d context.
 */
function stubCanvas(): { written: () => ImageData | null } {
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
	return { written: () => written };
}

describe('pixelsToDataUrl fallback', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	const firstRow = [1, 1, 1, 255, 2, 2, 2, 255];
	const secondRow = [3, 3, 3, 255, 4, 4, 4, 255];

	it('flips bottom-up rows and returns the canvas PNG data URL', () => {
		const source = new Uint8Array([...firstRow, ...secondRow]);
		const canvas = stubCanvas();

		const dataUrl = pixelsToDataUrl(source, 2, 2, { flipY: true });

		expect(dataUrl).toBe('data:image/png;base64,FAKE');
		const written = canvas.written();
		expect(written).not.toBeNull();
		// Top-down output: the last buffer row becomes the first image row.
		expect([...written!.data.slice(0, 8)]).toEqual(secondRow);
		expect([...written!.data.slice(8, 16)]).toEqual(firstRow);
	});

	it('preserves row order for a top-down readback', () => {
		const source = new Uint8Array([...firstRow, ...secondRow]);
		const canvas = stubCanvas();

		pixelsToDataUrl(source, 2, 2, { flipY: false });

		const written = canvas.written();
		expect([...written!.data.slice(0, 8)]).toEqual(firstRow);
		expect([...written!.data.slice(8, 16)]).toEqual(secondRow);
	});

	it('sRGB encodes color channels and leaves alpha untouched', () => {
		const source = new Uint8Array([0, 128, 255, 128]);
		const canvas = stubCanvas();

		pixelsToDataUrl(source, 1, 1, { srgb: true });

		// Linear 128/255 encodes to 188; the endpoints are fixed points.
		expect([...canvas.written()!.data.slice(0, 4)]).toEqual([0, 188, 255, 128]);
	});

	it('returns null when no document is available', () => {
		vi.stubGlobal('document', undefined);
		const result = pixelsToDataUrl(new Uint8Array(4), 1, 1);
		vi.unstubAllGlobals();
		expect(result).toBeNull();
	});
});

describe('encodeReadbackPixels', () => {
	it('stays self-contained so it survives being stringified into the worker', () => {
		// The worker script embeds this function's source; a reference to module
		// scope would only fail at runtime, inside the worker.
		const rehydrated = new Function(
			`return (${encodeReadbackPixels.toString()});`,
		)() as typeof encodeReadbackPixels;

		const source = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
		const options = { flipY: true, srgb: true };

		expect([...rehydrated(source, 1, 2, options)]).toEqual([
			...encodeReadbackPixels(source, 1, 2, options),
		]);
	});
});

describe('readbackIsBottomUp', () => {
	it('flips only for the WebGL2 fallback backend', () => {
		expect(readbackIsBottomUp({ backend: { isWebGLBackend: true } } as never)).toBe(
			true,
		);
		expect(
			readbackIsBottomUp({ backend: { isWebGPUBackend: true } } as never),
		).toBe(false);
		expect(readbackIsBottomUp(null)).toBe(false);
	});
});
