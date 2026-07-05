/**
 * Starry night / space background shader in TSL (WebGPU).
 *
 * A procedural skybox: layered twinkling stars, a noisy galactic dust band
 * (Milky Way) with a bright core ridge, and a large-scale nebula tint.
 * Colors and densities are parameterized as runtime uniforms.
 *
 * Unlike screen-space starfields, everything is derived from the world-space
 * view direction (spherical coordinates), so the sky is stable under camera
 * rotation and works from any angle. The band is a great circle defined by
 * `bandDirection` (the normal of the galactic plane), so it can be tilted
 * freely.
 *
 * Intended use: `createStage({ backgroundShader: createStarryNight() })`.
 */
import { Color, type ColorRepresentation, Vector3 } from 'three';
import {
	Fn,
	abs,
	asin,
	atan,
	clamp,
	dot,
	float,
	floor,
	fract,
	length,
	max,
	mix,
	normalize,
	positionWorldDirection,
	sin,
	smoothstep,
	step,
	time,
	uniform,
	vec2,
	vec3,
	vec4,
} from 'three/tsl';
import type { ZylemParameterizedShader } from '../types';
import { type TSLFn, sinHash2, valueNoise2d } from './utils.tsl';

export interface StarryNightOptions {
	/** Fraction of grid cells containing a star (0-1). Default 0.18 */
	starDensity?: number;
	/** Overall star brightness multiplier. Default 1.0 */
	starBrightness?: number;
	/** Twinkle animation speed. Default 1.0 */
	twinkleSpeed?: number;
	/** Milky Way band brightness (0 hides the band). Default 1.0 */
	bandIntensity?: number;
	/** Angular half-width of the band (0-1, fraction of the sky). Default 0.22 */
	bandWidth?: number;
	/**
	 * Normal of the galactic plane; the band appears along the great circle
	 * perpendicular to this direction (normalized internally).
	 * Default (0.55, 0.75, 0.35)
	 */
	bandDirection?: [number, number, number];
	/** Deep-sky background color. Default near-black blue */
	backgroundColor?: ColorRepresentation;
	/** Dust color at the band edges. Default dim cool blue */
	dustColorA?: ColorRepresentation;
	/** Dust color toward the band core. Default warm magenta */
	dustColorB?: ColorRepresentation;
	/** Bright ridge color along the band spine. Default violet */
	coreColor?: ColorRepresentation;
	/** Large-scale nebula tint color. Default deep purple */
	nebulaColor?: ColorRepresentation;
	/** Nebula tint strength. Default 1.0 */
	nebulaIntensity?: number;
	/** Warm star tint (mixed per star against the cool tint). Default warm white */
	starColorWarm?: ColorRepresentation;
	/** Cool star tint. Default ice blue */
	starColorCool?: ColorRepresentation;
}

export interface StarryNightUniforms {
	starDensity: { value: number };
	starBrightness: { value: number };
	twinkleSpeed: { value: number };
	bandIntensity: { value: number };
	bandWidth: { value: number };
	bandDirection: { value: Vector3 };
	backgroundColor: { value: Color };
	dustColorA: { value: Color };
	dustColorB: { value: Color };
	coreColor: { value: Color };
	nebulaColor: { value: Color };
	nebulaIntensity: { value: number };
	starColorWarm: { value: Color };
	starColorCool: { value: Color };
	[key: string]: { value: any };
}

/**
 * One star layer on a jittered grid: sparse cells get a star with a bright
 * core, a soft halo, and a per-star twinkle phase.
 */
const starLayer: TSLFn = Fn(([gridUv, scale, t, density]: [any, any, any, any]) => {
	const grid = gridUv.mul(scale);
	const id = floor(grid);
	const f = fract(grid).sub(0.5);

	const h = sinHash2(id);
	const hasStar = step(float(1.0).sub(density), h);
	// Rescale the hash within the star population so size/phase stay varied
	// regardless of density.
	const h2 = sinHash2(id.add(7.7));

	const starPos = vec2(
		sinHash2(id.add(1.3)).sub(0.5),
		sinHash2(id.add(2.1)).sub(0.5),
	).mul(0.8);
	const dist = length(f.sub(starPos));

	// Small, sharp points: cubed core falloff with a faint tight halo.
	const size = mix(float(0.012), float(0.045), h2.mul(h2));
	const core = max(float(0.0), float(1.0).sub(dist.div(size)));
	const halo = max(float(0.0), float(1.0).sub(dist.div(size.mul(3.0)))).mul(0.12);

	const twinkle = float(0.75).add(
		sin(t.mul(float(0.5).add(h2.mul(1.5))).add(h.mul(6.2831))).mul(0.25),
	);

	return core.mul(core).mul(core).add(halo).mul(twinkle).mul(hasStar);
});

/**
 * Create a starry night / space skybox shader. All options are exposed as
 * runtime uniforms on the returned `uniforms` object.
 */
export function createStarryNight(
	options: StarryNightOptions = {},
): ZylemParameterizedShader<StarryNightUniforms> {
	const uStarDensity = uniform(options.starDensity ?? 0.18);
	const uStarBrightness = uniform(options.starBrightness ?? 1.0);
	const uTwinkleSpeed = uniform(options.twinkleSpeed ?? 1.0);
	const uBandIntensity = uniform(options.bandIntensity ?? 1.0);
	const uBandWidth = uniform(options.bandWidth ?? 0.22);
	const uBandDirection = uniform(
		new Vector3(...(options.bandDirection ?? [0.55, 0.75, 0.35])),
	);
	const uBackgroundColor = uniform(new Color(options.backgroundColor ?? '#030308'));
	const uDustColorA = uniform(new Color(options.dustColorA ?? '#0d1740'));
	const uDustColorB = uniform(new Color(options.dustColorB ?? '#421c4d'));
	const uCoreColor = uniform(new Color(options.coreColor ?? '#61478c'));
	const uNebulaColor = uniform(new Color(options.nebulaColor ?? '#160a26'));
	const uNebulaIntensity = uniform(options.nebulaIntensity ?? 1.0);
	const uStarColorWarm = uniform(new Color(options.starColorWarm ?? '#ffe6b3'));
	const uStarColorCool = uniform(new Color(options.starColorCool ?? '#b3d9ff'));

	const colorNode = Fn(() => {
		const t = time.mul(uTwinkleSpeed);
		// In a scene backgroundNode, positionWorldDirection is the per-pixel
		// view direction, so the sky is stable wherever the camera moves.
		const dir: any = positionWorldDirection;

		// Spherical coordinates for a seamless-around-the-horizon sky. The
		// atan seam and pole pinch land on star-cell boundaries, which is
		// unnoticeable for point stars.
		const sphUv = vec2(
			atan(dir.z, dir.x).mul(0.15915494).add(0.5).mul(2.0),
			asin(clamp(dir.y, -1.0, 1.0)).mul(0.31830989).add(0.5),
		);

		const color = vec3(uBackgroundColor as any).toVar();

		// --- Milky Way dust band (great circle ⟂ bandDirection) -----------
		const bandNormal = normalize(vec3(uBandDirection as any));
		const bandDist = abs(dot(dir, bandNormal));
		const bandFalloff = max(float(0.0), float(1.0).sub(bandDist.div(uBandWidth)));
		const band = bandFalloff.mul(bandFalloff).mul(uBandIntensity);

		// Clumpy dust: three octaves of drifting value noise
		const noiseCoord = sphUv.mul(6.0);
		const dust = valueNoise2d(noiseCoord.add(t.mul(0.01)))
			.mul(0.5)
			.add(valueNoise2d(noiseCoord.mul(2.1).sub(t.mul(0.008))).mul(0.3))
			.add(valueNoise2d(noiseCoord.mul(4.3)).mul(0.2));

		const dustDensity = dust.mul(0.7).add(0.3);
		const dustColor = mix(vec3(uDustColorA as any), vec3(uDustColorB as any), dust);
		color.addAssign(dustColor.mul(band).mul(dustDensity));

		// Bright core ridge concentrated on the band spine, broken up by dust
		const coreGlow = band.mul(band).mul(band);
		color.addAssign(vec3(uCoreColor as any).mul(coreGlow).mul(dustDensity));

		// --- Nebula tint (very low frequency noise) ------------------------
		const nebula = valueNoise2d(sphUv.mul(2.3).add(vec2(3.7, 9.1)))
			.mul(valueNoise2d(sphUv.mul(1.4).sub(t.mul(0.005))));
		color.addAssign(
			vec3(uNebulaColor as any).mul(nebula).mul(uNebulaIntensity),
		);

		// --- Stars ----------------------------------------------------------
		// Longitude compresses toward the poles (cell width scales with
		// cos(latitude)), so counter-scale u to keep star points round.
		const latCos = max(
			float(1.0).sub(dir.y.mul(dir.y)).sqrt(),
			0.15,
		);
		const starUv = vec2(sphUv.x.mul(latCos), sphUv.y);

		const starsA = starLayer(starUv, float(48.0), t, uStarDensity);
		const starsB = starLayer(starUv.add(0.37), float(110.0), t.mul(0.8), uStarDensity);
		const starsC = starLayer(
			starUv.add(0.71),
			float(220.0),
			t.mul(1.3),
			// The finest layer is denser to read as faint background dust
			clamp(float(uStarDensity).mul(1.5), 0.0, 1.0),
		);
		const allStars = starsA.add(starsB.mul(0.6)).add(starsC.mul(0.3));

		// Slightly denser-looking stars inside the band
		const starBoost = mix(float(1.0), float(1.6), bandFalloff);

		// Per-star warm/cool tint, biased halfway toward white
		const tint = sinHash2(floor(sphUv.mul(48.0)));
		const starColor = mix(
			mix(vec3(uStarColorWarm as any), vec3(uStarColorCool as any), tint),
			vec3(1.0),
			0.5,
		);

		color.addAssign(
			starColor.mul(allStars).mul(starBoost).mul(uStarBrightness).mul(1.2),
		);

		// Horizon-to-zenith depth: gently darken the nadir so scenes read
		// grounded even with a full sphere background.
		const horizonFade = smoothstep(-0.9, -0.1, dir.y).mul(0.35).add(0.65);
		return vec4(color.mul(horizonFade), 1.0);
	})();

	return {
		colorNode,
		transparent: false,
		uniforms: {
			starDensity: uStarDensity,
			starBrightness: uStarBrightness,
			twinkleSpeed: uTwinkleSpeed,
			bandIntensity: uBandIntensity,
			bandWidth: uBandWidth,
			bandDirection: uBandDirection,
			backgroundColor: uBackgroundColor,
			dustColorA: uDustColorA,
			dustColorB: uDustColorB,
			coreColor: uCoreColor,
			nebulaColor: uNebulaColor,
			nebulaIntensity: uNebulaIntensity,
			starColorWarm: uStarColorWarm,
			starColorCool: uStarColorCool,
		},
	};
}
