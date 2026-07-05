/**
 * Shadertoy "water noise" shader in TSL (WebGPU).
 *
 * Native TSL port of the first example shader embedded in the three.js
 * `webgpu_shadertoy` example (https://www.shadertoy.com/view/Mt2SzR by
 * jackdavenport): nested, time-driven fractal noise blended between two
 * colors for a caustic-like water look.
 *
 * Intended use: a mesh surface material (uses `uv()`).
 */
import { Color, type ColorRepresentation } from 'three';
import {
	Fn,
	ceil,
	float,
	floor,
	fract,
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
import type { TSLFn } from './utils.tsl';

export interface ShadertoyWaterNoiseOptions {
	/** Noise pattern scale. Default 6.0 */
	scale?: number;
	/** Animation speed multiplier. Default 1.0 */
	speed?: number;
	/** Color at low noise values. Default light blue */
	colorA?: ColorRepresentation;
	/** Color at high noise values. Default deep blue */
	colorB?: ColorRepresentation;
}

export interface ShadertoyWaterNoiseUniforms {
	scale: { value: number };
	speed: { value: number };
	colorA: { value: Color };
	colorB: { value: Color };
	[key: string]: { value: any };
}

const random: TSLFn = Fn(([x]: [any]) => {
	return fract(sin(x).mul(10000.0));
});

const noise: TSLFn = Fn(([p]: [any]) => {
	return random(p.x.add(p.y.mul(10000.0)));
});

const smoothNoise: TSLFn = Fn(([p]: [any]) => {
	const interp: any = smoothstep(0.0, 1.0, fract(p));
	const fp: any = floor(p);
	const cp: any = ceil(p);
	const s = mix(noise(vec2(fp.x, fp.y)), noise(vec2(cp.x, fp.y)), interp.x);
	const n = mix(noise(vec2(fp.x, cp.y)), noise(vec2(cp.x, cp.y)), interp.x);
	return mix(s, n, interp.y);
});

const fractalNoise: TSLFn = Fn(([p]: [any]) => {
	const x = smoothNoise(p)
		.add(smoothNoise(p.mul(2.0)).div(2.0))
		.add(smoothNoise(p.mul(4.0)).div(4.0))
		.add(smoothNoise(p.mul(8.0)).div(8.0))
		.add(smoothNoise(p.mul(16.0)).div(16.0));
	return x.div(1.0 + 1.0 / 2.0 + 1.0 / 4.0 + 1.0 / 8.0 + 1.0 / 16.0);
});

const movingNoise: TSLFn = Fn(([p, t]: [any, any]) => {
	const x = fractalNoise(p.add(t));
	const y = fractalNoise(p.sub(t));
	return fractalNoise(p.add(vec2(x, y)));
});

/** Nested noise: the "water" function from the original shader. */
const nestedNoise: TSLFn = Fn(([p, t]: [any, any]) => {
	const x = movingNoise(p, t);
	const y = movingNoise(p.add(100.0), t);
	return movingNoise(p.add(vec2(x, y)), t);
});

/**
 * Create the Shadertoy water noise shader. All options are exposed as runtime
 * uniforms on the returned `uniforms` object.
 */
export function createShadertoyWaterNoise(
	options: ShadertoyWaterNoiseOptions = {},
): ZylemParameterizedShader<ShadertoyWaterNoiseUniforms> {
	const uScale = uniform(options.scale ?? 6.0);
	const uSpeed = uniform(options.speed ?? 1.0);
	const uColorA = uniform(new Color(options.colorA ?? '#6699ff'));
	const uColorB = uniform(new Color(options.colorB ?? '#1a33ff'));

	const colorNode = Fn(() => {
		const t = time.mul(uSpeed);
		const n = nestedNoise(uv().mul(uScale), t);
		return vec4(mix(vec3(uColorA as any), vec3(uColorB as any), n), float(1.0));
	})();

	return {
		colorNode,
		transparent: false,
		uniforms: {
			scale: uScale,
			speed: uSpeed,
			colorA: uColorA,
			colorB: uColorB,
		},
	};
}
