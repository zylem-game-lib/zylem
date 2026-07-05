/**
 * Shadertoy "fire smoke" shader in TSL (WebGPU).
 *
 * Native TSL port of the second example shader embedded in the three.js
 * `webgpu_shadertoy` example (https://www.shadertoy.com/view/3tcBzH by
 * trinketMage): scrolling perlin-style noise carving a vertical flame
 * gradient into layered fire colors.
 *
 * Intended use: a mesh surface material (uses `uv()`). The output has an
 * alpha channel, so the shader is transparent by default.
 */
import { Vector4 } from 'three';
import {
	Fn,
	dot,
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
	vec4,
} from 'three/tsl';
import type { ZylemParameterizedShader } from '../types';
import type { TSLFn } from './utils.tsl';

/** RGBA tuple (alpha participates in the flame layering). */
export type FireColor = [number, number, number, number];

export interface ShadertoyFireOptions {
	/** Bright flame color (RGBA). Default [1.0, 0.65, 0.1, 0.25] */
	brighterColor?: FireColor;
	/** Dark flame color (RGBA). Default [1.0, 0.0, 0.15, 0.0625] */
	darkerColor?: FireColor;
	/** Upward scroll speed. Default 0.3125 */
	scrollSpeed?: number;
	/** Base noise frequency. Default 10.0 */
	frequency?: number;
}

export interface ShadertoyFireUniforms {
	brighterColor: { value: Vector4 };
	darkerColor: { value: Vector4 };
	scrollSpeed: { value: number };
	frequency: { value: number };
	[key: string]: { value: any };
}

const GRADIENT_STEP = 0.2;
/** Perlin octaves (JS-unrolled). */
const OCTAVES = 5;
const PERSISTENCE = 0.5;

const rand: TSLFn = Fn(([co]: [any]) => {
	return fract(sin(dot(co, vec2(12.9898, 78.233))).mul(43758.5453));
});

const hermite: TSLFn = Fn(([t]: [any]) => {
	return t.mul(t).mul(float(3.0).sub(t.mul(2.0)));
});

/** Smooth value noise at a given frequency. */
const noise: TSLFn = Fn(([co, frequency]: [any, any]) => {
	const v = co.mul(frequency);

	const ix1 = floor(v.x);
	const iy1 = floor(v.y);
	const ix2 = floor(v.x.add(1.0));
	const iy2 = floor(v.y.add(1.0));

	const fx = hermite(fract(v.x));
	const fy = hermite(fract(v.y));

	const fade1 = mix(rand(vec2(ix1, iy1)), rand(vec2(ix2, iy1)), fx);
	const fade2 = mix(rand(vec2(ix1, iy2)), rand(vec2(ix2, iy2)), fx);

	return mix(fade1, fade2, fy);
});

/** Fractal (perlin-style) noise, unrolled to a fixed octave count. */
const pnoise: TSLFn = Fn(([co, freq]: [any, any]) => {
	let value: any = float(0.0);
	let sum = 0.0;
	let ampl = 1.0;
	let freqMultiplier = 1.0;
	for (let i = 0; i < OCTAVES; i++) {
		sum += ampl;
		value = value.add(noise(co, freq.mul(freqMultiplier)).mul(ampl));
		freqMultiplier *= 2.0;
		ampl *= PERSISTENCE;
	}
	return value.div(sum);
});

/**
 * Create the Shadertoy fire shader. All options are exposed as runtime
 * uniforms on the returned `uniforms` object.
 */
export function createShadertoyFire(
	options: ShadertoyFireOptions = {},
): ZylemParameterizedShader<ShadertoyFireUniforms> {
	const uBrighterColor = uniform(
		new Vector4(...(options.brighterColor ?? [1.0, 0.65, 0.1, 0.25])),
	);
	const uDarkerColor = uniform(
		new Vector4(...(options.darkerColor ?? [1.0, 0.0, 0.15, 0.0625])),
	);
	const uScrollSpeed = uniform(options.scrollSpeed ?? 0.3125);
	const uFrequency = uniform(options.frequency ?? 10.0);

	const colorNode = Fn(() => {
		const coords = uv();
		const gradient = float(1.0).sub(coords.y);

		const pos = vec2(coords.x, coords.y.sub(time.mul(uScrollSpeed)));

		const brighterColor = vec4(uBrighterColor);
		const darkerColor = vec4(uDarkerColor);
		const middleColor = mix(brighterColor, darkerColor, 0.5);

		const noiseTexel = pnoise(pos, uFrequency);

		const firstStep = smoothstep(float(0.0), noiseTexel, gradient);
		const darkerColorStep = smoothstep(
			float(0.0),
			noiseTexel,
			gradient.sub(GRADIENT_STEP),
		);
		const darkerColorPath = firstStep.sub(darkerColorStep);
		const color = mix(brighterColor, darkerColor, darkerColorPath).toVar();

		const middleColorStep = smoothstep(
			float(0.0),
			noiseTexel,
			gradient.sub(GRADIENT_STEP * 2.0),
		);

		color.assign(mix(color, middleColor, darkerColorStep.sub(middleColorStep)));
		color.assign(mix(vec4(0.0), color, firstStep));

		return color;
	})();

	return {
		colorNode,
		transparent: true,
		uniforms: {
			brighterColor: uBrighterColor,
			darkerColor: uDarkerColor,
			scrollSpeed: uScrollSpeed,
			frequency: uFrequency,
		},
	};
}
