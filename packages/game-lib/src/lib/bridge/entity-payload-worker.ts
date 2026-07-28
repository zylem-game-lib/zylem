/**
 * Off-main-thread encoder for heavy entity payload processing.
 *
 * Thumbnail readbacks arrive as raw RGBA pixel buffers. Encoding them (row
 * order fixup, linear-to-sRGB transfer, PNG encode) on the main thread blocks
 * the running game, so this module ships the work to a dedicated web worker:
 * the pixel buffer is **transferred** (zero-copy), the worker encodes via
 * `OffscreenCanvas.convertToBlob`, and the caller receives a compact blob
 * URL instead of a base64 data URL.
 *
 * The worker script is inlined and instantiated from a Blob URL, so it works
 * regardless of how game-lib is bundled (tsup dist, Vite dev prebundling)
 * without asset-path configuration. When workers or `OffscreenCanvas` are
 * unavailable (tests, older browsers), callers should fall back to the
 * synchronous canvas path.
 */

import { encodeReadbackPixels, type PixelEncodeOptions } from './pixel-encode';

interface WorkerSuccess {
	id: number;
	blob: Blob;
}

interface WorkerFailure {
	id: number;
	error: string;
}

type WorkerResponse = WorkerSuccess | WorkerFailure;

/**
 * The pixel transform is injected by stringifying the shared implementation so
 * the worker and the synchronous fallback can never drift apart. The assignment
 * form accepts either a function declaration or an arrow, whichever the bundler
 * emits after minification.
 */
const WORKER_SOURCE = `
const encodeReadbackPixels = ${encodeReadbackPixels.toString()};

self.onmessage = async (event) => {
	const { id, buffer, width, height, options } = event.data;
	try {
		const src = new Uint8ClampedArray(buffer);
		const pixels = encodeReadbackPixels(src, width, height, options);
		const canvas = new OffscreenCanvas(width, height);
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('OffscreenCanvas 2d context unavailable');
		ctx.putImageData(new ImageData(pixels, width, height), 0, 0);
		const blob = await canvas.convertToBlob({ type: 'image/png' });
		self.postMessage({ id, blob });
	} catch (error) {
		self.postMessage({ id, error: String(error) });
	}
};
`;

/**
 * Lazy singleton wrapper around the entity payload worker.
 */
export class EntityPayloadWorker {
	private worker: Worker | null = null;
	private workerFailed = false;
	private nextId = 1;
	private pending = new Map<
		number,
		{ resolve: (blob: Blob) => void; reject: (error: Error) => void }
	>();

	/** Whether the worker path (Worker + OffscreenCanvas) is available. */
	isSupported(): boolean {
		return (
			!this.workerFailed &&
			typeof Worker !== 'undefined' &&
			typeof OffscreenCanvas !== 'undefined' &&
			typeof URL !== 'undefined' &&
			typeof Blob !== 'undefined'
		);
	}

	/**
	 * Encode a raw RGBA readback to a PNG blob URL off-thread. The buffer is
	 * copied into a transferable and handed to the worker.
	 *
	 * @param options Row order and color space handling for the readback.
	 * @returns A blob URL (caller owns revocation), or null when the worker
	 *          path is unavailable or encoding fails.
	 */
	async encodeThumbnail(
		pixels: ArrayBufferView,
		width: number,
		height: number,
		options: PixelEncodeOptions = {},
	): Promise<string | null> {
		if (!this.isSupported()) return null;
		const worker = this.ensureWorker();
		if (!worker) return null;

		// Copy into a standalone ArrayBuffer so transferring never detaches
		// memory shared with the renderer's readback buffer.
		const copy = new Uint8Array(pixels.byteLength);
		copy.set(
			pixels instanceof Uint8Array
				? pixels
				: new Uint8Array(pixels.buffer, pixels.byteOffset, pixels.byteLength),
		);

		const id = this.nextId++;
		try {
			const blob = await new Promise<Blob>((resolve, reject) => {
				this.pending.set(id, { resolve, reject });
			worker.postMessage({ id, buffer: copy.buffer, width, height, options }, [
				copy.buffer,
			]);
			});
			return URL.createObjectURL(blob);
		} catch {
			return null;
		}
	}

	dispose(): void {
		if (this.worker) {
			this.worker.terminate();
			this.worker = null;
		}
		for (const { reject } of this.pending.values()) {
			reject(new Error('EntityPayloadWorker disposed'));
		}
		this.pending.clear();
	}

	private ensureWorker(): Worker | null {
		if (this.worker) return this.worker;
		try {
			const blob = new Blob([WORKER_SOURCE], { type: 'text/javascript' });
			const url = URL.createObjectURL(blob);
			const worker = new Worker(url, { type: 'module' });
			URL.revokeObjectURL(url);

			worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
				const { id } = event.data;
				const entry = this.pending.get(id);
				if (!entry) return;
				this.pending.delete(id);
				if ('blob' in event.data) {
					entry.resolve(event.data.blob);
				} else {
					entry.reject(new Error(event.data.error));
				}
			};
			worker.onerror = () => {
				this.workerFailed = true;
				this.dispose();
			};

			this.worker = worker;
			return worker;
		} catch {
			this.workerFailed = true;
			return null;
		}
	}
}

/** Shared worker instance for entity payload encoding. */
export const entityPayloadWorker = new EntityPayloadWorker();
