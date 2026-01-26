/**
 * Planet shader in TSL (Three.js Shading Language)
 * WebGPU-compatible version - optimized to match simplified GLSL
 */
import {
	Fn,
	uv,
	time,
	vec3,
	vec4,
	float,
	floor,
	fract,
	sin,
	cos,
	dot,
	mix,
	clamp,
	smoothstep,
} from 'three/tsl';
import type { ZylemTSLShader } from '@zylem/game-lib';

// Planet color palette
const colorA = vec3(0.02, 0.10, 0.45);
const colorB = vec3(0.03, 0.22, 0.80);
const colorC = vec3(0.05, 0.30, 0.95);
const speed = 0.3;

/**
 * Cheap 3D hash
 */
const hash3D = Fn(([p]: [any]) => {
	const dotResult = dot(p, vec3(127.1, 311.7, 74.7));
	return fract(sin(dotResult).mul(43758.5453123));
});

/**
 * Value noise (3D)
 */
const noise3D = Fn(([p]: [any]) => {
	const i = floor(p);
	const f = fract(p);
	// Smooth interpolation: f * f * (3 - 2 * f)
	const ff = f.mul(f).mul(float(3.0).sub(f.mul(2.0)));

	// Sample 8 corners and mix
	const n000 = hash3D(i);
	const n100 = hash3D(i.add(vec3(1, 0, 0)));
	const n010 = hash3D(i.add(vec3(0, 1, 0)));
	const n110 = hash3D(i.add(vec3(1, 1, 0)));
	const n001 = hash3D(i.add(vec3(0, 0, 1)));
	const n101 = hash3D(i.add(vec3(1, 0, 1)));
	const n011 = hash3D(i.add(vec3(0, 1, 1)));
	const n111 = hash3D(i.add(vec3(1, 1, 1)));

	const m00 = mix(n000, n100, ff.x);
	const m10 = mix(n010, n110, ff.x);
	const m01 = mix(n001, n101, ff.x);
	const m11 = mix(n011, n111, ff.x);

	const m0 = mix(m00, m10, ff.y);
	const m1 = mix(m01, m11, ff.y);

	return mix(m0, m1, ff.z);
});

/**
 * FBM - 4 octaves (reduced from original)
 */
const fbm = Fn(([x]: [any]) => {
	let v = float(0.0);
	let a = float(0.5);
	let p = x;

	// Octave 1
	v = v.add(a.mul(noise3D(p)));
	p = p.mul(2.0).add(1.7);
	a = a.mul(0.5);

	// Octave 2
	v = v.add(a.mul(noise3D(p)));
	p = p.mul(2.0).add(1.7);
	a = a.mul(0.5);

	// Octave 3
	v = v.add(a.mul(noise3D(p)));
	p = p.mul(2.0).add(1.7);
	a = a.mul(0.5);

	// Octave 4
	v = v.add(a.mul(noise3D(p)));

	return v;
});

/**
 * Convert UV to 3D spherical coordinates
 */
const uvTo3D = Fn(([uvInput]: [any]) => {
	const theta = uvInput.x.mul(6.2831853);
	const phi = uvInput.y.mul(3.1415926);

	return vec3(
		sin(phi).mul(cos(theta)),
		sin(phi).mul(sin(theta)),
		cos(phi)
	);
});

/**
 * Main planet color node
 */
const planetColorNode = Fn(() => {
	const t = time.mul(speed);
	const uvCoord = uv();

	// Convert UV to 3D position on sphere
	let pos = uvTo3D(uvCoord);

	// Animate cheaply
	const animOffset = vec3(
		cos(t.mul(0.2)),
		sin(t.mul(0.2)),
		sin(t.mul(0.2))
	);
	pos = pos.add(animOffset);

	// Single FBM
	const n = fbm(pos.add(t.mul(0.02)));

	// Derived variation (no second FBM)
	const q = vec3(n, sin(n.mul(3.0)), cos(n.mul(3.0)));

	// Color mixing
	const col1 = mix(colorA, colorB, clamp(q.x, float(0.0), float(1.0)));
	const col2 = mix(col1, colorC, clamp(q.y.mul(0.5).add(0.5), float(0.0), float(1.0)));

	// Lighting
	const light = smoothstep(float(0.2), float(0.8), n);
	const finalCol = col2.mul(light.mul(0.9).add(0.1));

	return vec4(finalCol, float(1.0));
})();

/**
 * TSL Planet shader for WebGPU
 */
export const planetTSL: ZylemTSLShader = {
	colorNode: planetColorNode,
	transparent: false,
};
