/**
 * Shared TSL noise helpers used by multiple shaders in this package.
 */
import { Fn, dot, float, floor, fract, mix, sin, vec2, vec3 } from 'three/tsl';

// Note: helpers are annotated with loose `any` call signatures because the
// three.js TSL type definitions do not reliably infer node types through
// `Fn()` chains yet.

/** A TSL function node taking node arguments and returning a node. */
export type TSLFn = (...args: any[]) => any;

/** Pseudo-random hash from a 2D input (0..1). */
export const hash2: TSLFn = Fn(([pInput]: [any]) => {
	const p: any = fract(pInput.mul(vec2(125.86, 458.36))).toVar();
	p.addAssign(dot(p, p.add(44.21)));
	return fract(p.x.mul(p.y));
});

/** Sine-based hash from a 2D input (0..1). */
export const sinHash2: TSLFn = Fn(([p]: [any]) => {
	return fract(sin(dot(p, vec2(12.9898, 78.233))).mul(43758.5453));
});

/** 2D value noise with smooth (hermite) interpolation. */
export const valueNoise2d: TSLFn = Fn(([x]: [any]) => {
	const p = floor(x);
	const f0 = fract(x);
	const f = f0.mul(f0).mul(vec2(3.0).sub(f0.mul(2.0)));
	const a = hash2(p);
	const b = hash2(p.add(vec2(1.0, 0.0)));
	const c = hash2(p.add(vec2(0.0, 1.0)));
	const d = hash2(p.add(vec2(1.0, 1.0)));
	return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
});

/** Interleaved Gradient Noise, useful for dithering against banding. */
export const interleavedGradientNoise: TSLFn = Fn(([p]: [any]) => {
	const magic = vec3(0.02711056, 0.00583715, 52.9829189);
	return fract(magic.z.mul(fract(dot(p, magic.xy))));
});

/** Cheap 3D hash (0..1). */
export const hash3d: TSLFn = Fn(([p]: [any]) => {
	return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))).mul(43758.5453123));
});

/** 3D value noise with smooth interpolation (8 corner samples). */
export const valueNoise3d: TSLFn = Fn(([p]: [any]) => {
	const i = floor(p);
	const f: any = fract(p);
	const ff: any = f.mul(f).mul(vec3(3.0).sub(f.mul(2.0)));

	const n000 = hash3d(i);
	const n100 = hash3d(i.add(vec3(1, 0, 0)));
	const n010 = hash3d(i.add(vec3(0, 1, 0)));
	const n110 = hash3d(i.add(vec3(1, 1, 0)));
	const n001 = hash3d(i.add(vec3(0, 0, 1)));
	const n101 = hash3d(i.add(vec3(1, 0, 1)));
	const n011 = hash3d(i.add(vec3(0, 1, 1)));
	const n111 = hash3d(i.add(vec3(1, 1, 1)));

	const m0 = mix(mix(n000, n100, ff.x), mix(n010, n110, ff.x), ff.y);
	const m1 = mix(mix(n001, n101, ff.x), mix(n011, n111, ff.x), ff.y);
	return mix(m0, m1, ff.z);
});

/** 4-octave 3D FBM (0..~1). */
export const fbm3d: TSLFn = Fn(([x]: [any]) => {
	let v: any = float(0.0);
	let a: any = float(0.5);
	let p: any = x;
	v = v.add(a.mul(valueNoise3d(p)));
	p = p.mul(2.0).add(1.7);
	a = a.mul(0.5);
	v = v.add(a.mul(valueNoise3d(p)));
	p = p.mul(2.0).add(1.7);
	a = a.mul(0.5);
	v = v.add(a.mul(valueNoise3d(p)));
	p = p.mul(2.0).add(1.7);
	a = a.mul(0.5);
	v = v.add(a.mul(valueNoise3d(p)));
	return v;
});
