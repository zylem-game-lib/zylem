/**
 * Planet ring shader in TSL (WebGPU).
 *
 * A procedural, semi-transparent ring system: noisy radial bands in a
 * three-stop palette, drifting orbital dust, and sparse irregular rocks with
 * fake lighting that slowly orbit. Generalized from the zylem-planet-demo
 * ring shader in the Zylem examples app.
 *
 * Intended use: a transparent material on a flat disk/annulus (e.g.
 * `createDisk({ innerRadius, outerRadius })`) whose UVs span the full disk.
 */
import { Color, type ColorRepresentation } from 'three';
import {
	Fn,
	clamp,
	cos,
	float,
	floor,
	fract,
	length,
	mix,
	sin,
	smoothstep,
	time,
	uniform,
	uv,
	vec2,
	vec3,
	vec4,
} from 'three/tsl';
import type { ZylemParameterizedShader } from '../types';
import { type TSLFn, sinHash2, valueNoise2d } from './utils.tsl';

export interface PlanetRingOptions {
	/** Brightest band color. Default rust red */
	colorA?: ColorRepresentation;
	/** Mid band color. Default dark rust */
	colorB?: ColorRepresentation;
	/** Darkest band color. Default deep brown */
	colorC?: ColorRepresentation;
	/** Orbital dust color. Default light rust */
	dustColor?: ColorRepresentation;
	/** Rock highlight color. Default warm orange */
	rockColor?: ColorRepresentation;
	/** Animation speed (dust drift, rock orbit). Default 0.3 */
	speed?: number;
	/** Radial band frequency. Default 24 */
	bandFrequency?: number;
	/** Rock density (0 = none, 1 = many). Default 0.5 */
	rockDensity?: number;
	/** Overall opacity ceiling (0-1). Default 0.4 */
	maxAlpha?: number;
}

export interface PlanetRingUniforms {
	colorA: { value: Color };
	colorB: { value: Color };
	colorC: { value: Color };
	dustColor: { value: Color };
	rockColor: { value: Color };
	speed: { value: number };
	bandFrequency: { value: number };
	rockDensity: { value: number };
	maxAlpha: { value: number };
	[key: string]: { value: any };
}

/** 2-octave FBM (cheap). */
const fbm2: TSLFn = Fn(([p]: [any]) => {
	return valueNoise2d(p)
		.mul(0.6)
		.add(valueNoise2d(p.mul(2.0).add(5.7)).mul(0.4));
});

/**
 * Create a planet ring shader. All options are exposed as runtime uniforms
 * on the returned `uniforms` object.
 */
export function createPlanetRing(
	options: PlanetRingOptions = {},
): ZylemParameterizedShader<PlanetRingUniforms> {
	const uColorA = uniform(new Color(options.colorA ?? '#d94026'));
	const uColorB = uniform(new Color(options.colorB ?? '#8c261a'));
	const uColorC = uniform(new Color(options.colorC ?? '#4d120d'));
	const uDustColor = uniform(new Color(options.dustColor ?? '#cc5938'));
	const uRockColor = uniform(new Color(options.rockColor ?? '#f28c59'));
	const uSpeed = uniform(options.speed ?? 0.3);
	const uBandFrequency = uniform(options.bandFrequency ?? 24.0);
	const uRockDensity = uniform(options.rockDensity ?? 0.5);
	const uMaxAlpha = uniform(options.maxAlpha ?? 0.4);

	const colorNode = Fn(() => {
		const t = time.mul(uSpeed);
		const uvCoord = uv();

		const centered = uvCoord.sub(0.5);
		const radialDist = length(centered).mul(2.0);

		// Annulus mask: fade in past the inner edge, out at the rim
		const ringMask = smoothstep(0.42, 0.48, radialDist).mul(
			smoothstep(0.95, 0.88, radialDist),
		);

		// Noisy radial bands through the three-stop palette
		const bandNoise = fbm2(vec2(radialDist.mul(5.0), 0.0));
		const bands = sin(radialDist.mul(uBandFrequency).add(bandNoise.mul(2.0)))
			.mul(0.5)
			.add(0.5);
		const baseRing = mix(
			mix(vec3(uColorA as any), vec3(uColorB as any), bands),
			vec3(uColorC as any),
			bandNoise.mul(0.4),
		).mul(float(0.75).add(bandNoise.mul(0.25)));

		// Drifting orbital dust (radius-driven, no atan)
		const dustNoise = fbm2(vec2(radialDist.mul(5.0), t.mul(0.05)));
		const dust = smoothstep(0.55, 0.65, dustNoise).mul(ringMask).mul(0.008);

		// Sparse irregular rocks on a jittered grid, slowly orbiting
		const gridP = uvCoord.mul(45.0);
		const cell = floor(gridP);
		const local = fract(gridP).sub(0.5);
		const h = sinHash2(cell);

		// rockDensity shifts the hash threshold: 0.5 matches the original
		const threshold = float(1.0).sub(float(uRockDensity).mul(0.32)).sub(0.01);
		const rockMask = smoothstep(threshold, threshold.add(0.02), h);

		const angle = h.mul(6.28318).add(t.mul(0.03));
		const offset = vec2(cos(angle), sin(angle)).mul(0.08);
		const d = local.sub(offset);
		const dist = length(d);

		const size = mix(float(0.06), float(0.12), h.mul(h));
		const edgeNoise = valueNoise2d(d.mul(8.0).add(h.mul(10.0)));
		const distorted = dist.add(edgeNoise.sub(0.5).mul(size).mul(0.25));
		const rockShape = smoothstep(size, size.mul(0.6), distorted);
		const rocks = rockShape.mul(rockMask).mul(ringMask);

		// Fake lighting: bright core, lifted rim
		const centerFalloff = clamp(float(1.0).sub(dist.div(size)), 0.0, 1.0);
		const rim = smoothstep(0.6, 1.0, dist.div(size));
		const shade = centerFalloff.mul(0.8).add(rim.mul(0.3));
		const rockCol = mix(baseRing, vec3(uRockColor as any), shade);

		const withDust = baseRing.mul(ringMask).add(vec3(uDustColor as any).mul(dust));
		const finalColor = mix(withDust, rockCol, rocks);

		const alpha = clamp(
			ringMask.mul(float(0.5).add(rocks.mul(0.35)).add(dust.mul(0.2))),
			0.0,
			float(uMaxAlpha),
		);

		return vec4(finalColor, alpha);
	})();

	return {
		colorNode,
		transparent: true,
		uniforms: {
			colorA: uColorA,
			colorB: uColorB,
			colorC: uColorC,
			dustColor: uDustColor,
			rockColor: uRockColor,
			speed: uSpeed,
			bandFrequency: uBandFrequency,
			rockDensity: uRockDensity,
			maxAlpha: uMaxAlpha,
		},
	};
}
