/**
 * Retro (PS1/CRT) postprocessing effect.
 *
 * Port of three's `webgpu_postprocessing_retro` example pipeline: a
 * `retroPass` scene pass (vertex snapping, affine texture mapping,
 * quarter-resolution nearest-filtered rendering) followed by a CRT chain —
 * barrel distortion, color bleeding, ordered (Bayer) dithering, posterize,
 * vignette, and scanlines.
 *
 * This is a *pass-replacing* effect: it renders its own scene pass instead
 * of transforming the incoming node, so it should be first in the
 * `postProcessingEffects` chain.
 */
import {
	barrelUV,
	colorBleeding,
	scanlines,
	vignette,
} from 'three/addons/tsl/display/CRT.js';
import { retroPass } from 'three/addons/tsl/display/RetroPassNode.js';
import { circle } from 'three/addons/tsl/display/Shape.js';
import {
	Fn,
	floor,
	fract,
	posterize,
	replaceDefaultUV,
	screenCoordinate,
	screenSize,
	uniform,
} from 'three/tsl';
import type { ZylemPostEffect } from '../types';

export interface RetroOptions {
	/** CRT screen curvature (0 = flat, ~0.2 = very curved). Default 0.02 */
	curvature?: number;
	/** Color quantization levels per channel (PS1 = 32). Default 32 */
	colorDepthSteps?: number;
	/** Scanline darkening (0-1). Default 0.3 */
	scanlineIntensity?: number;
	/** Scanline density relative to screen height (0-1). Default 1 */
	scanlineDensity?: number;
	/** Scanline roll speed (0 = static). Default 0 */
	scanlineSpeed?: number;
	/** Vignette edge darkening (0-1). Default 0.3 */
	vignetteIntensity?: number;
	/** Horizontal color bleeding amount (0-0.005). Default 0.001 */
	bleeding?: number;
	/** Affine texture distortion (0-1, the PS1 texture warp). Default 0 */
	affineDistortion?: number;
	/**
	 * Filter textures in the retro pass instead of forcing nearest mip level
	 * 0. Baked. Default false
	 */
	filterTextures?: boolean;
}

export interface RetroEffect {
	/** Register this on the render pipeline (e.g. `postProcessingEffects`). */
	effect: ZylemPostEffect;
	/** Runtime-tweakable parameters. */
	uniforms: {
		curvature: { value: number };
		colorDepthSteps: { value: number };
		scanlineIntensity: { value: number };
		scanlineDensity: { value: number };
		scanlineSpeed: { value: number };
		vignetteIntensity: { value: number };
		bleeding: { value: number };
		affineDistortion: { value: number };
	};
}

/**
 * Ordered 8x8 Bayer dither threshold via the classic compact recursion
 * (`bayer2(a) = fract(a.x/2 + a.y*a.y*0.75)`; `bayerN(a) =
 * bayerN/2(a/2)*0.25 + bayer2(a)`). three's `tsl/math/Bayer.js` addon
 * doesn't exist in r184, so this is inlined here. Returns a 0..1 threshold
 * per screen pixel.
 */
const bayer2 = Fn(([coord]: [any]) => {
	const a = floor(coord) as any;
	return fract(a.x.div(2.0).add(a.y.mul(a.y).mul(0.75)));
});

const bayerThreshold = (coord: any): any => {
	const bayer4 = (bayer2(coord.mul(0.25)) as any)
		.mul(0.25)
		.add(bayer2(coord.mul(0.5)));
	// Recursion range is [0, 1.3125); normalize to [0, 1).
	return bayer4.mul(0.25).add(bayer2(coord)).div(1.3125);
};

/**
 * Create a retro (PS1/CRT) effect.
 *
 * ```ts
 * const retro = createRetroEffect({ curvature: 0.04 });
 * // stage config: postProcessingEffects: [retro.effect]  (must be first)
 * retro.uniforms.colorDepthSteps.value = 8; // tweak at runtime
 * ```
 */
export function createRetroEffect(options: RetroOptions = {}): RetroEffect {
	const uCurvature = uniform(options.curvature ?? 0.02);
	const uColorDepthSteps = uniform(options.colorDepthSteps ?? 32);
	const uScanlineIntensity = uniform(options.scanlineIntensity ?? 0.3);
	const uScanlineDensity = uniform(options.scanlineDensity ?? 1);
	const uScanlineSpeed = uniform(options.scanlineSpeed ?? 0);
	const uVignetteIntensity = uniform(options.vignetteIntensity ?? 0.3);
	const uBleeding = uniform(options.bleeding ?? 0.001);
	const uAffineDistortion = uniform(options.affineDistortion ?? 0);
	const filterTextures = options.filterTextures ?? false;

	const effect: ZylemPostEffect = (_inputNode, ctx) => {
		const retro = retroPass(ctx.scene, ctx.camera, {
			affineDistortion: uAffineDistortion,
		} as any);
		(retro as any).filterTextures = filterTextures;

		// Same chain as the three.js example: barrel-distorted UVs, edge-
		// weighted color bleeding, dither + posterize, vignette, scanlines.
		const distortedUV = (barrelUV as any)(uCurvature);
		const distortedDelta = (circle as any)(
			(uCurvature as any).add(0.1).mul(10),
			1,
		)
			.mul(uCurvature)
			.mul(0.05);

		let pipeline: any = retro;
		pipeline = replaceDefaultUV(distortedUV, pipeline);
		pipeline = (colorBleeding as any)(
			pipeline,
			(uBleeding as any).add(distortedDelta),
		);
		// Centered ordered dither before posterize breaks up banding.
		const dither = bayerThreshold(screenCoordinate)
			.sub(0.5)
			.div(uColorDepthSteps);
		pipeline = pipeline.add(dither);
		pipeline = posterize(pipeline, uColorDepthSteps);
		pipeline = (vignette as any)(pipeline, uVignetteIntensity, 0.6);
		pipeline = (scanlines as any)(
			pipeline,
			uScanlineIntensity,
			screenSize.y.mul(uScanlineDensity),
			uScanlineSpeed,
		);

		return pipeline;
	};

	return {
		effect,
		uniforms: {
			curvature: uCurvature,
			colorDepthSteps: uColorDepthSteps,
			scanlineIntensity: uScanlineIntensity,
			scanlineDensity: uScanlineDensity,
			scanlineSpeed: uScanlineSpeed,
			vignetteIntensity: uVignetteIntensity,
			bleeding: uBleeding,
			affineDistortion: uAffineDistortion,
		},
	};
}
