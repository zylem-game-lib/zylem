/**
 * Lava shader in TSL (WebGPU).
 *
 * Port of the classic three.js lava demo (webgl_shader_lava.html, lava shader
 * by TheGameMaker): two drifting, noise-distorted UV layers where one layer
 * modulates the brightness of the other, with channel-overflow bleed that
 * blows hot spots out toward white, and exponential-squared depth fog.
 *
 * The original samples a cloud noise texture and a lava tile texture. By
 * default this port substitutes procedural value noise and a three-stop
 * color ramp (dark → mid → hot), so it is fully self-contained. Pass
 * `noiseTexture` / `lavaTexture` (e.g. the original cloud.png / lavatile.jpg
 * with RepeatWrapping) to reproduce the original exactly.
 *
 * Intended use: a mesh surface material on any UV-mapped geometry.
 */
import { Color, type ColorRepresentation, type Texture, Vector2 } from 'three';
import {
	Fn,
	clamp,
	exp2,
	float,
	max,
	mix,
	positionView,
	smoothstep,
	texture,
	time,
	uniform,
	uv,
	vec2,
	vec3,
	vec4,
} from 'three/tsl';
import type { ZylemParameterizedShader } from '../types';
import { type TSLFn, valueNoise2d } from './utils.tsl';

export interface LavaOptions {
	/** Animation speed multiplier (1 matches the original demo). Default 1 */
	speed?: number;
	/** UV tiling, as in the original's uvScale uniform. Default [3, 1] */
	uvScale?: [number, number];
	/**
	 * Exponential-squared fog density (the original uses 0.45 with a camera
	 * ~4 units away; larger scenes need much smaller values). Default 0.1
	 */
	fogDensity?: number;
	/** Fog color. Default black */
	fogColor?: ColorRepresentation;
	/** Procedural lava ramp: coolest crust color. Default near-black red */
	darkColor?: ColorRepresentation;
	/** Procedural lava ramp: molten mid color. Default burnt orange */
	midColor?: ColorRepresentation;
	/** Procedural lava ramp: hottest color. Default yellow */
	hotColor?: ColorRepresentation;
	/**
	 * Optional RGBA noise texture (the original's cloud.png, RepeatWrapping).
	 * When set, replaces the procedural noise exactly as in the original.
	 */
	noiseTexture?: Texture;
	/**
	 * Optional lava color texture (the original's lavatile.jpg,
	 * RepeatWrapping). When set, replaces the procedural color ramp.
	 */
	lavaTexture?: Texture;
}

export interface LavaUniforms {
	speed: { value: number };
	uvScale: { value: Vector2 };
	fogDensity: { value: number };
	fogColor: { value: Color };
	darkColor: { value: Color };
	midColor: { value: Color };
	hotColor: { value: Color };
	[key: string]: { value: any };
}

/** Two-octave value noise, a soft stand-in for one channel of cloud.png. */
const cloudNoise: TSLFn = Fn(([p, offset]: [any, any]) => {
	const q = p.add(offset);
	return valueNoise2d(q.mul(4.0))
		.mul(0.65)
		.add(valueNoise2d(q.mul(9.0)).mul(0.35));
});

/**
 * Create a lava shader. All options are exposed as runtime uniforms on the
 * returned `uniforms` object (texture options are baked at creation).
 */
export function createLava(
	options: LavaOptions = {},
): ZylemParameterizedShader<LavaUniforms> {
	const uSpeed = uniform(options.speed ?? 1.0);
	const uUvScale = uniform(new Vector2(...(options.uvScale ?? [3.0, 1.0])));
	const uFogDensity = uniform(options.fogDensity ?? 0.1);
	const uFogColor = uniform(new Color(options.fogColor ?? '#000000'));
	const uDarkColor = uniform(new Color(options.darkColor ?? '#1c0502'));
	const uMidColor = uniform(new Color(options.midColor ?? '#b33409'));
	const uHotColor = uniform(new Color(options.hotColor ?? '#ffcf50'));

	const noiseTex = options.noiseTexture;
	const lavaTex = options.lavaTexture;

	/** Lava tile stand-in: fractal noise through a dark→mid→hot color ramp. */
	const lavaRamp: TSLFn = Fn(([p]: [any]) => {
		const n = valueNoise2d(p.mul(3.0))
			.mul(0.5)
			.add(valueNoise2d(p.mul(6.0)).mul(0.3))
			.add(valueNoise2d(p.mul(12.0)).mul(0.2));
		const base = mix(
			vec3(uDarkColor as any),
			vec3(uMidColor as any),
			smoothstep(0.15, 0.55, n),
		);
		return mix(base, vec3(uHotColor as any), smoothstep(0.55, 0.9, n));
	});

	const colorNode = Fn(() => {
		const t = time.mul(uSpeed);
		const uvBase = uv().mul(vec2(uUvScale as any));

		// Distortion noise (the original's cloud.png RGB channels)
		const noiseX = noiseTex
			? (texture(noiseTex, uvBase) as any).x
			: cloudNoise(uvBase, vec2(0.0, 0.0));
		const noiseY = noiseTex
			? (texture(noiseTex, uvBase) as any).y
			: cloudNoise(uvBase, vec2(17.7, 5.1));
		const noiseZ = noiseTex
			? (texture(noiseTex, uvBase) as any).z
			: cloudNoise(uvBase, vec2(41.3, 23.9));

		// Two UV layers drifting in different directions, warped by the noise
		const T1 = uvBase
			.add(vec2(1.5, -1.5).mul(t).mul(0.02))
			.add(vec2(noiseX, noiseY).mul(2.0));
		const T2 = uvBase
			.add(vec2(-0.5, 2.0).mul(t).mul(0.01))
			.add(vec2(noiseY.negate().mul(0.2), noiseZ.mul(0.2)));

		// Brightness layer and lava color layer
		const p = noiseTex
			? (texture(noiseTex, T1.mul(2.0)) as any).a
			: cloudNoise(T1.mul(2.0), vec2(7.3, 61.7));
		const lavaColor = lavaTex
			? (texture(lavaTex, T2.mul(2.0)) as any).rgb
			: lavaRamp(T2.mul(2.0));

		// temp = color * (p * 2) + (color * color - 0.1)
		const c = lavaColor
			.mul(p.mul(2.0))
			.add(lavaColor.mul(lavaColor).sub(0.1))
			.toVar();

		// Channel-overflow bleed from the original: overshooting channels
		// leak into the others, blowing hot spots out toward white. The adds
		// are branch-free equivalents of the original's `if` guards (the
		// clamped overflow is zero when the condition is false).
		const rOver = clamp(c.r.sub(2.0), 0.0, 100.0);
		c.assign(vec3(c.r, c.g.add(rOver), c.b.add(rOver)));
		const gOver = max(c.g.sub(1.0), 0.0);
		c.assign(vec3(c.r.add(gOver), c.g, c.b.add(gOver)));
		const bOver = max(c.b.sub(1.0), 0.0);
		c.assign(vec3(c.r.add(bOver), c.g.add(bOver), c.b));

		// Exponential-squared depth fog (gl_FragCoord.z / gl_FragCoord.w
		// in the original is view-space depth)
		const depth = positionView.z.negate();
		const LOG2 = float(1.442695);
		const fogFactor = float(1.0).sub(
			clamp(
				exp2(
					uFogDensity
						.mul(uFogDensity)
						.mul(depth)
						.mul(depth)
						.mul(LOG2)
						.negate(),
				),
				0.0,
				1.0,
			),
		);

		return vec4(mix(c, vec3(uFogColor as any), fogFactor), 1.0);
	})();

	return {
		colorNode,
		transparent: false,
		uniforms: {
			speed: uSpeed,
			uvScale: uUvScale,
			fogDensity: uFogDensity,
			fogColor: uFogColor,
			darkColor: uDarkColor,
			midColor: uMidColor,
			hotColor: uHotColor,
		},
	};
}
