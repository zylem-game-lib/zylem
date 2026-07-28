/**
 * Shared pixel normalization for thumbnail readbacks.
 *
 * Raw render-target readbacks are not canvas-ready: their row order depends on
 * the renderer backend, and renders into a `RenderTarget` are written in the
 * working (linear) color space because Three only applies `outputColorSpace`
 * when drawing to the output target. Both the worker and the synchronous
 * fallback run this same transform so their output matches.
 */

export interface PixelEncodeOptions {
	/** Source rows are bottom-up (WebGL2 `readPixels`) and need flipping. */
	flipY?: boolean;
	/** Apply the linear-to-sRGB transfer function to the RGB channels. */
	srgb?: boolean;
}

/**
 * Normalize a raw RGBA readback into top-down, optionally sRGB-encoded pixels.
 *
 * This function must stay self-contained — no references to module scope. Its
 * source is stringified into the entity payload worker (see
 * `entity-payload-worker.ts`), so a closure reference would throw there.
 *
 * @param src Raw RGBA bytes, `width * height * 4` long.
 * @param width Image width in pixels.
 * @param height Image height in pixels.
 * @param options Row order and color space handling.
 * @returns Canvas-ready pixels suitable for `ImageData`.
 */
export function encodeReadbackPixels(
	src: Uint8Array | Uint8ClampedArray,
	width: number,
	height: number,
	options: PixelEncodeOptions = {},
): Uint8ClampedArray {
	const rowBytes = width * 4;
	const out = new Uint8ClampedArray(height * rowBytes);

	let lut: Uint8Array | null = null;
	if (options.srgb) {
		lut = new Uint8Array(256);
		for (let i = 0; i < 256; i += 1) {
			const linear = i / 255;
			const encoded = linear <= 0.0031308
				? linear * 12.92
				: 1.055 * Math.pow(linear, 1 / 2.4) - 0.055;
			lut[i] = Math.round(Math.max(0, Math.min(1, encoded)) * 255);
		}
	}

	for (let y = 0; y < height; y += 1) {
		const srcRow = (options.flipY ? height - 1 - y : y) * rowBytes;
		const dstRow = y * rowBytes;
		if (lut === null) {
			out.set(src.subarray(srcRow, srcRow + rowBytes), dstRow);
			continue;
		}
		// Alpha is not gamma encoded.
		for (let i = 0; i < rowBytes; i += 4) {
			out[dstRow + i] = lut[src[srcRow + i]];
			out[dstRow + i + 1] = lut[src[srcRow + i + 1]];
			out[dstRow + i + 2] = lut[src[srcRow + i + 2]];
			out[dstRow + i + 3] = src[srcRow + i + 3];
		}
	}

	return out;
}
