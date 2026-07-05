/**
 * Water surface shader in TSL (WebGPU).
 *
 * A self-contained animated water surface inspired by the surface shaders in
 * jeantimex/threejs-water (WaterAbove.frag / WaterNormal.frag). Instead of a
 * ping-pong wave simulation texture, the heightfield is layered procedural
 * value noise. Like the original, the surface is really displaced: the same
 * heightfield drives vertex displacement (`positionNode`) and the fragment
 * normals (finite differences), so waves have silhouettes and parallax.
 *
 * Shading follows the reference model: Schlick fresnel blending an underwater
 * tint against a sky reflection (a horizon-to-zenith gradient, or an optional
 * environment cubemap), plus the original's HDR high-power sun spot
 * (`pow(dot, sharpness) * vec3(10, 8, 6)`).
 *
 * Intended use: a mesh surface material on a subdivided XZ water plane (e.g.
 * `createPlane({ subdivisions: 128, ... })` — displacement needs vertices).
 * Wave coordinates come from world-space XZ, so the pattern is seamless
 * across any plane size.
 */
import { Color, type ColorRepresentation, type Texture, Vector3 } from 'three';
import {
	Fn,
	cameraPosition,
	clamp,
	cubeTexture,
	dot,
	float,
	max,
	mix,
	modelWorldMatrix,
	normalize,
	positionLocal,
	positionWorld,
	pow,
	reflect,
	smoothstep,
	time,
	uniform,
	vec2,
	vec3,
	vec4,
} from 'three/tsl';
import type { ZylemParameterizedShader } from '../types';
import { type TSLFn, valueNoise2d } from './utils.tsl';

export interface WaterSurfaceOptions {
	/** World-space wave frequency (larger = smaller waves). Default 0.35 */
	waveScale?: number;
	/** Wave animation speed. Default 0.6 */
	waveSpeed?: number;
	/** Strength of the wave normals (apparent choppiness). Default 1.4 */
	waveStrength?: number;
	/**
	 * Vertical displacement of the wave crests, in world units. Requires a
	 * subdivided plane; set to 0 for a flat (normal-mapped only) surface.
	 * Default 0.6
	 */
	waveAmplitude?: number;
	/** Water color at wave crests / shallow look. Default light cyan */
	shallowColor?: ColorRepresentation;
	/** Water color in troughs / deep look. Default deep blue */
	deepColor?: ColorRepresentation;
	/** Reflected sky color at the horizon. Default pale blue */
	skyColor?: ColorRepresentation;
	/** Reflected sky color straight up. Default deeper blue */
	zenithColor?: ColorRepresentation;
	/**
	 * Optional environment cubemap. When provided, reflections sample it
	 * instead of the skyColor/zenithColor gradient.
	 */
	envMap?: Texture;
	/** Direction TOWARD the sun (normalized internally). Default (0.5, 0.8, 0.3) */
	sunDirection?: [number, number, number];
	/** Sun specular highlight intensity. Default 1.0 */
	sunIntensity?: number;
	/**
	 * Sun specular exponent — higher is a smaller, more intense spot
	 * (the original uses 5000). Default 2000
	 */
	sunSharpness?: number;
	/**
	 * Base opacity (0-1) when looking straight down into the water. Actual
	 * per-pixel alpha is fresnel-driven: it rises to fully opaque at grazing
	 * angles where reflection dominates, so lower values read as clear water
	 * rather than a uniformly faded surface. Values below 1 mark the shader
	 * transparent. Default 1
	 */
	opacity?: number;
}

export interface WaterSurfaceUniforms {
	waveScale: { value: number };
	waveSpeed: { value: number };
	waveStrength: { value: number };
	waveAmplitude: { value: number };
	shallowColor: { value: Color };
	deepColor: { value: Color };
	skyColor: { value: Color };
	zenithColor: { value: Color };
	sunDirection: { value: Vector3 };
	sunIntensity: { value: number };
	sunSharpness: { value: number };
	opacity: { value: number };
	[key: string]: { value: any };
}

/** Mean of the waveHeight octave sum (0.5 + 0.25 + 0.125 halved). */
const WAVE_HEIGHT_MEAN = 0.4375;

/**
 * HDR sun spot color from WaterAbove.frag. Values above 1.0 clip/tone-map to
 * a white-hot core with a warm falloff.
 */
const SUN_COLOR: [number, number, number] = [10.0, 8.0, 6.0];

/** Layered value noise heightfield: three octaves drifting in different directions. */
const waveHeight: TSLFn = Fn(([p, t]: [any, any]) => {
	const h = float(0.0).toVar();
	h.addAssign(valueNoise2d(p.add(vec2(t, t.mul(0.8)))).mul(0.5));
	h.addAssign(
		valueNoise2d(p.mul(2.3).add(vec2(t.negate().mul(1.4), t.mul(0.6)))).mul(0.25),
	);
	h.addAssign(
		valueNoise2d(p.mul(4.1).add(vec2(t.mul(0.9), t.negate().mul(1.7)))).mul(0.125),
	);
	return h;
});

/**
 * Create a water surface shader. All options are exposed as runtime uniforms
 * on the returned `uniforms` object.
 */
export function createWaterSurface(
	options: WaterSurfaceOptions = {},
): ZylemParameterizedShader<WaterSurfaceUniforms> {
	const uWaveScale = uniform(options.waveScale ?? 0.35);
	const uWaveSpeed = uniform(options.waveSpeed ?? 0.6);
	const uWaveStrength = uniform(options.waveStrength ?? 1.4);
	const uWaveAmplitude = uniform(options.waveAmplitude ?? 0.6);
	const uShallowColor = uniform(new Color(options.shallowColor ?? '#3fd8e8'));
	const uDeepColor = uniform(new Color(options.deepColor ?? '#03335f'));
	const uSkyColor = uniform(new Color(options.skyColor ?? '#a5c8e8'));
	const uZenithColor = uniform(new Color(options.zenithColor ?? '#2b5f9e'));
	const uSunDirection = uniform(
		new Vector3(...(options.sunDirection ?? [0.5, 0.8, 0.3])),
	);
	const uSunIntensity = uniform(options.sunIntensity ?? 1.0);
	const uSunSharpness = uniform(options.sunSharpness ?? 2000.0);
	const opacity = options.opacity ?? 1.0;
	const uOpacity = uniform(opacity);

	// Vertex displacement: the same heightfield the fragment normals use.
	// World XZ is unaffected by the vertical offset, so vertex and fragment
	// stages sample identical wave coordinates.
	const positionNode = Fn(() => {
		const worldPos = (modelWorldMatrix as any).mul(vec4(positionLocal, 1.0)).xyz;
		const t = time.mul(uWaveSpeed);
		const h = waveHeight(worldPos.xz.mul(uWaveScale), t);
		const offset = float(h).sub(WAVE_HEIGHT_MEAN).mul(uWaveAmplitude);
		return positionLocal.add(vec3(0.0, offset, 0.0));
	})();

	const colorNode = Fn(() => {
		const t = time.mul(uWaveSpeed);
		const p = positionWorld.xz.mul(uWaveScale);

		// Normal reconstruction via finite differences of the heightfield,
		// N = normalize(-dh/dx, 1, -dh/dz) as in WaterNormal.frag.
		const eps = float(0.12);
		const h = waveHeight(p, t);
		const hx = waveHeight(p.add(vec2(eps, 0.0)), t);
		const hz = waveHeight(p.add(vec2(0.0, eps)), t);
		const normal = normalize(
			vec3(
				hx.sub(h).div(eps).mul(uWaveStrength).negate(),
				1.0,
				hz.sub(h).div(eps).mul(uWaveStrength).negate(),
			),
		);

		const viewDir = normalize(cameraPosition.sub(positionWorld));
		const facing = max(dot(normal, viewDir), 0.0);

		// Modified Schlick fresnel (F0 = 0.25, power = 3) from WaterAbove.frag
		const fresnel = mix(float(0.25), float(1.0), pow(float(1.0).sub(facing), 3.0));

		// Underwater tint: deep in troughs, shallow at crests
		const crest = smoothstep(0.35, 0.85, h);
		const waterColor = mix(vec3(uDeepColor as any), vec3(uShallowColor as any), crest);

		// Reflection along the reflected view ray: environment cubemap when
		// provided, otherwise a horizon-to-zenith sky gradient.
		const reflected = reflect(viewDir.negate(), normal);
		const reflectionColor = options.envMap
			? (cubeTexture(options.envMap as any, reflected) as any).rgb
			: mix(
					vec3(uSkyColor as any),
					vec3(uZenithColor as any),
					smoothstep(0.0, 0.7, clamp(reflected.y, 0.0, 1.0)),
				);

		// HDR sun spot as in the original: tiny, intense, warm.
		const sunDir = normalize(vec3(uSunDirection as any));
		const spec = pow(max(dot(reflected, sunDir), 0.0), uSunSharpness);
		const sunHighlight = vec3(...SUN_COLOR).mul(spec).mul(uSunIntensity);

		const color = mix(waterColor, reflectionColor, fresnel).add(sunHighlight);

		// Fresnel-driven transparency: most see-through looking straight down,
		// fully opaque at grazing angles (reflection dominates there). Adding
		// `spec` keeps the sun glints solid on otherwise clear water.
		const alpha = clamp(
			mix(float(uOpacity), 1.0, fresnel).add(spec),
			0.0,
			1.0,
		);

		return vec4(color, alpha);
	})();

	return {
		colorNode,
		positionNode,
		transparent: opacity < 1.0,
		uniforms: {
			waveScale: uWaveScale,
			waveSpeed: uWaveSpeed,
			waveStrength: uWaveStrength,
			waveAmplitude: uWaveAmplitude,
			shallowColor: uShallowColor,
			deepColor: uDeepColor,
			skyColor: uSkyColor,
			zenithColor: uZenithColor,
			sunDirection: uSunDirection,
			sunIntensity: uSunIntensity,
			sunSharpness: uSunSharpness,
			opacity: uOpacity,
		},
	};
}
