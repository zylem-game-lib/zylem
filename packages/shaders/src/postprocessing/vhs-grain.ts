/**
 * VHS grain postprocessing effect.
 *
 * Analog-tape look composed from film grain, a drifting tracking-noise band
 * with per-line horizontal wobble, RGB color fringing, and CRT scanlines
 * (via three's `CRT.js` TSL helpers). Pure input transform — works at any
 * position in the effect chain.
 */
import { scanlines } from 'three/addons/tsl/display/CRT.js';
import {
	Fn,
	abs,
	clamp,
	convertToTexture,
	float,
	floor,
	fract,
	min,
	mix,
	oneMinus,
	rand,
	smoothstep,
	time,
	uniform,
	uv,
	vec2,
	vec3,
	vec4,
} from 'three/tsl';
import type { ZylemPostEffect } from '../types';

export interface VhsGrainOptions {
	/** Film grain strength (0-1). Default 0.35 */
	grainIntensity?: number;
	/**
	 * Tracking-noise strength (0-1): the drifting static band and the
	 * per-line horizontal wobble. Default 0.5
	 */
	trackingIntensity?: number;
	/** Horizontal RGB fringe offset in UV units. Default 0.0015 */
	colorShift?: number;
	/** Scanline darkening (0-1). Default 0.25 */
	scanlineIntensity?: number;
	/** Number of scanlines across the screen. Default 400 */
	scanlineCount?: number;
}

export interface VhsGrainEffect {
	/** Register this on the render pipeline (e.g. `postProcessingEffects`). */
	effect: ZylemPostEffect;
	/** Runtime-tweakable parameters. */
	uniforms: {
		grainIntensity: { value: number };
		trackingIntensity: { value: number };
		colorShift: { value: number };
		scanlineIntensity: { value: number };
		scanlineCount: { value: number };
	};
}

/**
 * Create a VHS grain effect.
 *
 * ```ts
 * const vhs = createVhsGrainEffect({ grainIntensity: 0.5 });
 * // stage config: postProcessingEffects: [vhs.effect]
 * vhs.uniforms.trackingIntensity.value = 0.8; // tweak at runtime
 * ```
 */
export function createVhsGrainEffect(
	options: VhsGrainOptions = {},
): VhsGrainEffect {
	const uGrainIntensity = uniform(options.grainIntensity ?? 0.35);
	const uTrackingIntensity = uniform(options.trackingIntensity ?? 0.5);
	const uColorShift = uniform(options.colorShift ?? 0.0015);
	const uScanlineIntensity = uniform(options.scanlineIntensity ?? 0.25);
	const uScanlineCount = uniform(options.scanlineCount ?? 400);

	const effect: ZylemPostEffect = inputNode => {
		const inputTexture = convertToTexture(inputNode);

		return Fn(() => {
			const coord = uv();

			// Tracking band: a static-filled stripe that slowly rolls down
			// the screen (wraps around), like a worn tape's tracking error.
			const bandCenter = fract(time.mul(0.11));
			const bandDist = abs(fract(coord.y.sub(bandCenter).add(0.5)).sub(0.5));
			const band = oneMinus(smoothstep(0.0, 0.045, bandDist as any)).mul(
				uTrackingIntensity,
			);

			// Per-line horizontal wobble: every scan row jitters slightly,
			// with a much stronger tear inside the tracking band.
			const row = floor(coord.y.mul(240.0)).div(240.0);
			const frame = floor(time.mul(15.0));
			const lineNoise = rand(vec2(row, frame) as any).sub(0.5);
			const wobble = lineNoise
				.mul(0.0025)
				.mul(uTrackingIntensity)
				.add(lineNoise.mul(0.04).mul(band));
			const sampleUV = vec2(coord.x.add(wobble), coord.y);

			// Analog color fringing: offset red/blue horizontally.
			const shift = vec2(uColorShift, 0.0);
			const r = inputTexture.sample(sampleUV.add(shift) as any).r;
			const g = inputTexture.sample(sampleUV as any).g;
			const b = inputTexture.sample(sampleUV.sub(shift) as any).b;
			const fringed = vec3(r, g, b).toVar();

			// Static inside the tracking band.
			const staticNoise = rand(
				vec2(coord.y.mul(120.0), time.mul(23.0)) as any,
			);
			fringed.assign(
				mix(fringed, vec3(staticNoise), min(band.mul(0.75), 0.9)) as any,
			);

			// Film grain (FilmNode-style multiplicative noise).
			const grainNoise = rand(fract(coord.add(time)) as any);
			const grained = fringed.add(
				fringed.mul(clamp(grainNoise.add(0.1), 0.0, 1.0)),
			);
			const graded = mix(fringed, grained, uGrainIntensity);

			// Scanlines from three's CRT helpers (static, no roll).
			const lined = scanlines(
				graded as any,
				uScanlineIntensity as any,
				uScanlineCount as any,
				float(0.0) as any,
			);

			return vec4(lined, 1.0);
		})();
	};

	return {
		effect,
		uniforms: {
			grainIntensity: uGrainIntensity,
			trackingIntensity: uTrackingIntensity,
			colorShift: uColorShift,
			scanlineIntensity: uScanlineIntensity,
			scanlineCount: uScanlineCount,
		},
	};
}
