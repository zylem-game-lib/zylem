/**
 * Alien planet sky shader in TSL (WebGPU).
 *
 * A full 360° skybox for standing on the surface of another world: a
 * gradient night sky with twinkling stars, a Milky Way band, a spiral
 * galaxy, a shaded moon, a warm horizon glow, and below the horizon a
 * layered mountain silhouette over a desert floor. Generalized from the
 * arena stage background (a Mars scene) in the Zylem examples app — the
 * defaults reproduce that look.
 *
 * Intended use: `createStage({ backgroundShader: createAlienSky() })`.
 */
import { Color, type ColorRepresentation } from 'three';
import {
	Fn,
	abs,
	asin,
	atan,
	clamp,
	dot,
	exp,
	float,
	floor,
	fract,
	length,
	max,
	mix,
	normalize,
	positionWorldDirection,
	pow,
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

const TAU = 6.28318530718;
const PI = 3.14159265359;

export interface AlienSkyOptions {
	/**
	 * Horizon elevation (-1..1, fraction of the vertical field). Ground is
	 * rendered below it. Default -0.18
	 */
	horizon?: number;
	/** Animation speed (twinkle, dust drift, galaxy swirl). Default 1 */
	speed?: number;
	/** Sky color at the zenith. Default near-black */
	skyTopColor?: ColorRepresentation;
	/** Sky color at mid elevation. Default dark violet */
	skyMidColor?: ColorRepresentation;
	/** Sky color at the horizon. Default rust red */
	horizonColor?: ColorRepresentation;
	/** Warm glow hugging the horizon line. Default ember orange */
	glowColor?: ColorRepresentation;
	/** Horizon glow strength. Default 1 */
	glowIntensity?: number;
	/** Star brightness multiplier (0 hides stars). Default 1 */
	starIntensity?: number;
	/** Milky Way band strength (0 hides the band). Default 1 */
	bandIntensity?: number;
	/** Milky Way cool tint. Default violet */
	bandColorCool?: ColorRepresentation;
	/** Milky Way warm tint. Default dusty amber */
	bandColorWarm?: ColorRepresentation;
	/** Spiral galaxy strength (0 hides the galaxy). Default 1 */
	galaxyIntensity?: number;
	/** Spiral galaxy tint. Default magenta */
	galaxyColor?: ColorRepresentation;
	/** Sky-uv position of the galaxy. Default [0.36, 0.68] */
	galaxyPosition?: [number, number];
	/** Moon color. Default dim red */
	moonColor?: ColorRepresentation;
	/** Sky-uv position of the moon. Default [0.78, 0.6] */
	moonPosition?: [number, number];
	/** Moon angular size multiplier. Default 1 */
	moonSize?: number;
	/** Desert color far at the horizon. Default dark rust */
	groundFarColor?: ColorRepresentation;
	/** Desert color at mid distance. Default rust */
	groundMidColor?: ColorRepresentation;
	/** Desert color near the viewer (straight down). Default bright rust */
	groundNearColor?: ColorRepresentation;
	/** Base color of the nearest mountain layer (far layers are darkened). Default brown-red */
	mountainColor?: ColorRepresentation;
}

export interface AlienSkyUniforms {
	speed: { value: number };
	skyTopColor: { value: Color };
	skyMidColor: { value: Color };
	horizonColor: { value: Color };
	glowColor: { value: Color };
	glowIntensity: { value: number };
	starIntensity: { value: number };
	bandIntensity: { value: number };
	bandColorCool: { value: Color };
	bandColorWarm: { value: Color };
	galaxyIntensity: { value: number };
	galaxyColor: { value: Color };
	moonColor: { value: Color };
	groundFarColor: { value: Color };
	groundMidColor: { value: Color };
	groundNearColor: { value: Color };
	mountainColor: { value: Color };
	[key: string]: { value: any };
}

// ── noise helpers ─────────────────────────────────────────────────────────

/** 4-octave 2D FBM. */
const fbm: TSLFn = Fn(([p]: [any]) => {
	let v: any = float(0.0);
	let a: any = float(0.5);
	let pp: any = p;
	v = v.add(a.mul(valueNoise2d(pp)));
	pp = pp.mul(2.02);
	a = a.mul(0.5);
	v = v.add(a.mul(valueNoise2d(pp)));
	pp = pp.mul(2.03);
	a = a.mul(0.5);
	v = v.add(a.mul(valueNoise2d(pp)));
	pp = pp.mul(2.01);
	a = a.mul(0.5);
	v = v.add(a.mul(valueNoise2d(pp)));
	return v;
});

/** 1D ridged noise — mountain silhouette heights. */
const ridged1: TSLFn = Fn(([x]: [any]) => {
	const base = valueNoise2d(vec2(x, 0.0));
	return float(1.0).sub(abs(base.mul(2.0).sub(1.0)));
});

/** Sparkly star layer on a grid; threshold controls sparsity. */
const stars: TSLFn = Fn(([uvIn, threshold, t]: [any, any, any]) => {
	const gv = fract(uvIn).sub(0.5);
	const id = floor(uvIn);
	const n = sinHash2(id);
	const star = smoothstep(threshold, float(1.0), n);
	const d = length(gv);
	const sparkle = float(0.0028).div(d.mul(d).add(0.0025));
	const tw = float(0.75).add(sin(t.mul(n.add(0.4)).add(n.mul(TAU))).mul(0.25));
	return star.mul(sparkle).mul(tw);
});

const milkyBand: TSLFn = Fn(([p, t]: [any, any]) => {
	const ps = vec2(p.x.mul(1.3), p.y);
	const band = exp(abs(ps.y).mul(5.5).negate());
	const n = fbm(ps.mul(3.0).add(vec2(t.mul(0.008), 0.0)));
	return band.mul(float(0.35).add(n.mul(0.75)));
});

const spiralGalaxy: TSLFn = Fn(([p, t]: [any, any]) => {
	const r = length(p);
	const ang = atan(p.y, p.x);
	const arms = sin(ang.mul(2.5).add(r.mul(11.0)).sub(t.mul(0.04)));
	const core = exp(r.mul(7.5).negate());
	const disc = exp(abs(r.sub(0.18)).mul(8.5).negate());
	const dust = fbm(p.mul(7.0));
	return max(core.mul(1.7), disc.mul(float(0.55).add(arms.mul(0.55))).mul(dust));
});

const mountainHeight: TSLFn = Fn(([x, scale, amp, base]: [any, any, any, any]) => {
	const f = fbm(vec2(x.mul(scale), 0.0));
	const rd = ridged1(x.mul(scale).mul(1.7));
	return base.add(f.mul(0.6).add(rd.mul(0.4)).sub(0.5).mul(amp));
});

/**
 * Create an alien planet sky shader. Colors and intensities are runtime
 * uniforms; positions, sizes, and the horizon level are baked at creation.
 */
export function createAlienSky(
	options: AlienSkyOptions = {},
): ZylemParameterizedShader<AlienSkyUniforms> {
	const HORIZON = options.horizon ?? -0.18;
	const galaxyPos = options.galaxyPosition ?? [0.36, 0.68];
	const moonPos = options.moonPosition ?? [0.78, 0.6];
	const moonSize = options.moonSize ?? 1.0;

	const uSpeed = uniform(options.speed ?? 1.0);
	const uSkyTop = uniform(new Color(options.skyTopColor ?? '#010105'));
	const uSkyMid = uniform(new Color(options.skyMidColor ?? '#06040e'));
	const uHorizonColor = uniform(new Color(options.horizonColor ?? '#471c0f'));
	const uGlowColor = uniform(new Color(options.glowColor ?? '#8c381a'));
	const uGlowIntensity = uniform(options.glowIntensity ?? 1.0);
	const uStarIntensity = uniform(options.starIntensity ?? 1.0);
	const uBandIntensity = uniform(options.bandIntensity ?? 1.0);
	const uBandCool = uniform(new Color(options.bandColorCool ?? '#382652'));
	const uBandWarm = uniform(new Color(options.bandColorWarm ?? '#734d38'));
	const uGalaxyIntensity = uniform(options.galaxyIntensity ?? 1.0);
	const uGalaxyColor = uniform(new Color(options.galaxyColor ?? '#d96bf2'));
	const uMoonColor = uniform(new Color(options.moonColor ?? '#99422e'));
	const uGroundFar = uniform(new Color(options.groundFarColor ?? '#4d2112'));
	const uGroundMid = uniform(new Color(options.groundMidColor ?? '#8f3b17'));
	const uGroundNear = uniform(new Color(options.groundNearColor ?? '#cc6129'));
	const uMountainColor = uniform(new Color(options.mountainColor ?? '#803819'));

	// Pre-rotated Milky Way band (theta = -0.55 rad)
	const COS_T = Math.cos(-0.55);
	const SIN_T = Math.sin(-0.55);

	const colorNode = Fn(() => {
		const t = time.mul(uSpeed);
		// In a scene backgroundNode, positionWorldDirection is the per-pixel
		// view direction, so the sky is stable wherever the camera moves.
		const rd = positionWorldDirection;

		const lon = atan(rd.z, rd.x);
		const lat = asin(clamp(rd.y, -1.0, 1.0));

		const sky = vec2(lon.div(TAU).add(0.5), lat.div(PI).add(0.5));
		const elev = lat.div(PI * 0.5);

		// ── SKY ──
		const h = clamp(elev.sub(HORIZON).div(1.0 - HORIZON), 0.0, 1.0);
		const skyC = mix(
			mix(vec3(uHorizonColor as any), vec3(uSkyMid as any), smoothstep(0.0, 0.22, h)),
			vec3(uSkyTop as any),
			smoothstep(0.22, 1.0, h),
		).toVar();

		const s = stars(sky.mul(320.0), float(0.994), t)
			.mul(1.4)
			.add(stars(sky.mul(180.0).add(0.37), float(0.988), t).mul(1.0))
			.add(stars(sky.mul(85.0).add(0.71), float(0.978), t).mul(0.8))
			.mul(uStarIntensity);
		skyC.addAssign(vec3(s, s, s));

		// Milky Way band, rotated diagonally across the sky
		const mw0 = sky.sub(vec2(0.3, 0.58)).mul(3.0);
		const mw = vec2(
			mw0.x.mul(COS_T).add(mw0.y.mul(SIN_T)),
			mw0.x.mul(-SIN_T).add(mw0.y.mul(COS_T)),
		);
		const band = milkyBand(mw, t).mul(uBandIntensity);
		skyC.addAssign(vec3(uBandCool as any).mul(band).mul(1.7));
		skyC.addAssign(vec3(uBandWarm as any).mul(band).mul(0.75));
		skyC.addAssign(
			vec3(0.95, 0.92, 0.98)
				.mul(band)
				.mul(stars(sky.mul(560.0), float(0.982), t))
				.mul(1.2),
		);

		// Spiral galaxy with a warm core flare
		const gP = sky.sub(vec2(galaxyPos[0], galaxyPos[1])).mul(4.0);
		const galaxy = spiralGalaxy(gP, t).mul(uGalaxyIntensity);
		skyC.addAssign(vec3(uGalaxyColor as any).mul(galaxy).mul(1.4));
		skyC.addAssign(
			mix(vec3(uGalaxyColor as any), vec3(1.0), 0.4).mul(galaxy).mul(0.6),
		);
		skyC.addAssign(
			vec3(1.0, 0.85, 0.7)
				.mul(pow(max(float(0.0), float(1.0).sub(length(gP).mul(5.5))), float(8.0)))
				.mul(2.4)
				.mul(uGalaxyIntensity),
		);

		// Shaded moon with a soft outer glow
		const moonP = sky.sub(vec2(moonPos[0], moonPos[1])).mul(vec2(4.5 / moonSize, 2.5 / moonSize));
		const moonD = length(moonP);
		const moon = smoothstep(0.14, 0.11, moonD);
		const shade = clamp(
			dot(
				normalize(vec3(moonP.x, moonP.y, 0.25)),
				normalize(vec3(-0.7, 0.3, 1.0)),
			),
			0.0,
			1.0,
		);
		skyC.assign(
			mix(skyC, vec3(uMoonColor as any).mul(float(0.35).add(shade.mul(0.65))), moon),
		);
		skyC.addAssign(
			vec3(uMoonColor as any).mul(0.5).mul(smoothstep(0.3, 0.14, moonD)).mul(0.35),
		);

		// Warm horizon glow
		const glow = exp(abs(elev.sub(HORIZON)).mul(14.0).negate());
		skyC.addAssign(vec3(uGlowColor as any).mul(glow).mul(float(0.55).mul(uGlowIntensity)));

		// ── GROUND ──
		const groundH = clamp(float(HORIZON).sub(elev).div(HORIZON + 1.0), 0.0, 1.0);
		const groundC = mix(
			mix(vec3(uGroundFar as any), vec3(uGroundMid as any), smoothstep(0.0, 0.35, groundH)),
			vec3(uGroundNear as any),
			smoothstep(0.35, 0.95, groundH),
		).toVar();

		// Three mountain silhouette layers, darker with distance
		const m1 = mountainHeight(lon.add(0.0), float(1.6), float(0.05), float(HORIZON - 0.015));
		const m2 = mountainHeight(lon.add(1.7), float(1.1), float(0.085), float(HORIZON - 0.055));
		const m3 = mountainHeight(lon.add(3.3), float(0.7), float(0.12), float(HORIZON - 0.1));

		const k1 = smoothstep(0.0, 0.006, m1.sub(elev));
		const k2 = smoothstep(0.0, 0.006, m2.sub(elev));
		const k3 = smoothstep(0.0, 0.008, m3.sub(elev));

		groundC.assign(mix(groundC, vec3(uMountainColor as any).mul(0.52), k1));
		groundC.assign(mix(groundC, vec3(uMountainColor as any).mul(0.76), k2));
		groundC.assign(mix(groundC, vec3(uMountainColor as any), k3));

		// Rocky texture and sparse pebble glints
		const rocks = fbm(sky.mul(vec2(42.0, 22.0)));
		groundC.mulAssign(float(0.88).add(rocks.mul(0.24)));
		const peb = sinHash2(sky.mul(420.0));
		groundC.mulAssign(float(0.94).add(step(0.92, peb).mul(0.18)));

		// Dust haze near the horizon; darken straight down
		const haze = exp(abs(elev.sub(HORIZON)).mul(18.0).negate());
		groundC.assign(mix(groundC, vec3(uGroundNear as any).mul(0.6), haze.mul(0.35)));
		groundC.mulAssign(clamp(float(1.0).add(elev.mul(0.6)), 0.6, 1.0));

		// Select sky vs ground by horizon, then a gentle filmic curve
		const col: any = elev
			.greaterThan(float(HORIZON))
			.select(skyC as any, groundC as any);
		return vec4(pow(col, vec3(0.92, 0.92, 0.92) as any) as any, 1.0);
	})();

	return {
		colorNode,
		transparent: false,
		uniforms: {
			speed: uSpeed,
			skyTopColor: uSkyTop,
			skyMidColor: uSkyMid,
			horizonColor: uHorizonColor,
			glowColor: uGlowColor,
			glowIntensity: uGlowIntensity,
			starIntensity: uStarIntensity,
			bandIntensity: uBandIntensity,
			bandColorCool: uBandCool,
			bandColorWarm: uBandWarm,
			galaxyIntensity: uGalaxyIntensity,
			galaxyColor: uGalaxyColor,
			moonColor: uMoonColor,
			groundFarColor: uGroundFar,
			groundMidColor: uGroundMid,
			groundNearColor: uGroundNear,
			mountainColor: uMountainColor,
		},
	};
}
