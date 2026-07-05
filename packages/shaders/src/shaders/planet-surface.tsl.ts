/**
 * Planet surface shader in TSL (WebGPU).
 *
 * A procedural animated planet: UVs are mapped onto a sphere, then a 3D FBM
 * drives a three-stop color ramp with a soft light/shadow term, producing
 * slowly churning bands of color. Generalized from the zylem-planet-demo
 * planet shader in the Zylem examples app.
 *
 * Intended use: a material on a UV-mapped sphere.
 */
import { Color, type ColorRepresentation } from 'three';
import {
	Fn,
	clamp,
	cos,
	float,
	mix,
	sin,
	smoothstep,
	time,
	uniform,
	uv,
	vec3,
	vec4,
} from 'three/tsl';
import type { ZylemParameterizedShader } from '../types';
import { type TSLFn, fbm3d } from './utils.tsl';

export interface PlanetSurfaceOptions {
	/** Darkest surface color. Default deep ocean blue */
	colorA?: ColorRepresentation;
	/** Mid surface color. Default blue */
	colorB?: ColorRepresentation;
	/** Brightest surface color. Default bright azure */
	colorC?: ColorRepresentation;
	/** Animation speed of the churning surface. Default 0.3 */
	speed?: number;
	/** Noise frequency (larger = smaller features). Default 1 */
	noiseScale?: number;
	/** Light/shadow contrast (0 = flat, 1 = original). Default 1 */
	contrast?: number;
}

export interface PlanetSurfaceUniforms {
	colorA: { value: Color };
	colorB: { value: Color };
	colorC: { value: Color };
	speed: { value: number };
	noiseScale: { value: number };
	contrast: { value: number };
	[key: string]: { value: any };
}

/** Equirectangular UV to a unit-sphere position. */
const uvToSphere: TSLFn = Fn(([uvInput]: [any]) => {
	const theta = uvInput.x.mul(6.2831853);
	const phi = uvInput.y.mul(3.1415926);
	return vec3(sin(phi).mul(cos(theta)), sin(phi).mul(sin(theta)), cos(phi));
});

/**
 * Create a planet surface shader. All options are exposed as runtime
 * uniforms on the returned `uniforms` object.
 */
export function createPlanetSurface(
	options: PlanetSurfaceOptions = {},
): ZylemParameterizedShader<PlanetSurfaceUniforms> {
	const uColorA = uniform(new Color(options.colorA ?? '#051a73'));
	const uColorB = uniform(new Color(options.colorB ?? '#0838cc'));
	const uColorC = uniform(new Color(options.colorC ?? '#0d4df2'));
	const uSpeed = uniform(options.speed ?? 0.3);
	const uNoiseScale = uniform(options.noiseScale ?? 1.0);
	const uContrast = uniform(options.contrast ?? 1.0);

	const colorNode = Fn(() => {
		const t = time.mul(uSpeed);
		const pos = uvToSphere(uv())
			.mul(uNoiseScale)
			.add(vec3(cos(t.mul(0.2)), sin(t.mul(0.2)), sin(t.mul(0.2))));

		const n = fbm3d(pos.add(t.mul(0.02)));

		// Derived variation instead of a second FBM (cheap)
		const qx = clamp(n, 0.0, 1.0);
		const qy = sin(n.mul(3.0)).mul(0.5).add(0.5);

		const col = mix(
			mix(vec3(uColorA as any), vec3(uColorB as any), qx),
			vec3(uColorC as any),
			qy,
		);

		// Soft light/shadow from the noise itself, faded by contrast
		const light = smoothstep(0.2, 0.8, n).mul(0.9).add(0.1);
		const lit = col.mul(mix(float(1.0), light, float(uContrast)));

		return vec4(lit, 1.0);
	})();

	return {
		colorNode,
		transparent: false,
		uniforms: {
			colorA: uColorA,
			colorB: uColorB,
			colorC: uColorC,
			speed: uSpeed,
			noiseScale: uNoiseScale,
			contrast: uContrast,
		},
	};
}
