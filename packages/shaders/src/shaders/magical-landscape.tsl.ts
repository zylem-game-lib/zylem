/**
 * "Magical Landscape" in TSL (WebGPU).
 *
 * A volumetric raymarched fractal terrain flythrough, ported from the GLSL
 * CodePen by Sabo Sugi (https://codepen.io/sabosugi/pen/OPbXXoN). Colors are
 * accumulated along each ray through a gyroid fractal masked by a value-noise
 * terrain SDF, then tone mapped with tanh and dithered.
 *
 * Intended use: fullscreen background (`backgroundShader`) — the shader is
 * screen-space and ignores mesh geometry.
 */
import { Color, type ColorRepresentation } from 'three';
import {
	Break,
	Fn,
	If,
	Loop,
	abs,
	cos,
	dot,
	float,
	fract,
	max,
	mix,
	normalize,
	screenCoordinate,
	screenSize,
	sin,
	smoothstep,
	tanh,
	time,
	uniform,
	vec2,
	vec3,
	vec4,
} from 'three/tsl';
import type { ZylemParameterizedShader } from '../types';
import {
	hash2,
	interleavedGradientNoise,
	type TSLFn,
	valueNoise2d,
} from './utils.tsl';

export interface MagicalLandscapeOptions {
	/** Flight speed over the terrain. Default 2.0 */
	speed?: number;
	/** Base raymarch step size. Default 0.020531 */
	fractalStep?: number;
	/** Raymarch step amplitude. Default 0.06688 */
	fractalAmp?: number;
	/** Terrain UV scale (smaller = larger mountains). Default 0.64 */
	terrainScale?: number;
	/** Terrain base height. Default 0.8 */
	terrainBaseHeight?: number;
	/** Terrain noise amplitude. Default 0.9 */
	terrainAmp?: number;
	/** Ground level offset. Default 2.3 */
	groundOffset?: number;
	/** Four colors cycled through the volumetric gradient. */
	colors?: [
		ColorRepresentation,
		ColorRepresentation,
		ColorRepresentation,
		ColorRepresentation,
	];
	/** Terrain/fractal noise seed. Default: random */
	seed?: number;
}

export interface MagicalLandscapeUniforms {
	speed: { value: number };
	fractalStep: { value: number };
	fractalAmp: { value: number };
	terrainScale: { value: number };
	terrainBaseHeight: { value: number };
	terrainAmp: { value: number };
	groundOffset: { value: number };
	color1: { value: Color };
	color2: { value: Color };
	color3: { value: Color };
	color4: { value: Color };
	seed: { value: number };
	[key: string]: { value: any };
}

const DEFAULT_COLORS: [string, string, string, string] = [
	'#0a9fbd',
	'#00d2ff',
	'#001adb',
	'#ff0055',
];

/** Camera pitch (radians) looking down at the terrain. */
const PITCH = 0.17;
/** Global time scale from the original pen. */
const TIME_SCALE = 0.3;

/** Cyclical four-color gradient. */
const getGradient: TSLFn = Fn(([tInput, c1, c2, c3, c4]: [any, any, any, any, any]) => {
	const t = fract(tInput);
	const result = mix(c4, c1, smoothstep(0.75, 1.0, t)).toVar();
	If(t.lessThan(0.25), () => {
		result.assign(mix(c1, c2, smoothstep(0.0, 0.25, t)));
	})
		.ElseIf(t.lessThan(0.5), () => {
			result.assign(mix(c2, c3, smoothstep(0.25, 0.5, t)));
		})
		.ElseIf(t.lessThan(0.75), () => {
			result.assign(mix(c3, c4, smoothstep(0.5, 0.75, t)));
		});
	return result;
});

// The original pen's pre-computed rotation matrix, decomposed into columns.
// GLSL `uv * rot55` (row-vector product) == vec2(dot(uv, col0), dot(uv, col1)).
const ROT55_COL0 = vec2(-0.163296, 8.20684);
const ROT55_COL1 = vec2(2.54316, 5.356704);

/**
 * Create the Magical Landscape shader. All options are exposed as runtime
 * uniforms on the returned `uniforms` object.
 */
export function createMagicalLandscape(
	options: MagicalLandscapeOptions = {},
): ZylemParameterizedShader<MagicalLandscapeUniforms> {
	const colors = options.colors ?? DEFAULT_COLORS;

	const uSpeed = uniform(options.speed ?? 2.0);
	const uFractalStep = uniform(options.fractalStep ?? 0.020531);
	const uFractalAmp = uniform(options.fractalAmp ?? 0.06688);
	const uTerrainScale = uniform(options.terrainScale ?? 0.64);
	const uTerrainBaseHeight = uniform(options.terrainBaseHeight ?? 0.8);
	const uTerrainAmp = uniform(options.terrainAmp ?? 0.9);
	const uGroundOffset = uniform(options.groundOffset ?? 2.3);
	const uColor1 = uniform(new Color(colors[0]));
	const uColor2 = uniform(new Color(colors[1]));
	const uColor3 = uniform(new Color(colors[2]));
	const uColor4 = uniform(new Color(colors[3]));
	const uSeed = uniform(options.seed ?? Math.random() * 1000.0);

	/** Landscape SDF with distance-based LOD. */
	const getTerrain: TSLFn = Fn(([p, dist]: [any, any]) => {
		const uvT = p.xz.mul(uTerrainScale).add(uSeed).toVar();
		const h = uTerrainBaseHeight.toVar();
		const a = uTerrainAmp.toVar();

		// LOD from the original pen: 2 octaves near, 3 in the mid range.
		const octaves = dist
			.greaterThan(33.1)
			.select(float(2.0), dist.greaterThan(21.6).select(float(3.0), float(2.0)));

		// Bounding volume: skip the noise octaves entirely above the terrain.
		If(p.y.lessThanEqual(6.0), () => {
			Loop({ start: float(0.0), end: float(4.0), type: 'float', condition: '<' } as any, ({ i }: any) => {
				If(i.greaterThanEqual(octaves), () => {
					Break();
				});
				h.addAssign(valueNoise2d(uvT).mul(a));
				uvT.assign(vec2(dot(uvT, ROT55_COL0), dot(uvT, ROT55_COL1)));
				uvT.addAssign(vec2(-4.8, 11.5));
				a.mulAssign(0.3);
			});
		});

		return p.y.greaterThan(6.0).select(p.y, p.y.add(h).sub(uGroundOffset));
	});

	const colorNode = Fn(() => {
		// Screen coordinates (flip y: WebGPU is top-left origin, GL is bottom-left)
		const fragCoord = vec2(
			screenCoordinate.x,
			screenSize.y.sub(screenCoordinate.y),
		);
		const uvCoord = fragCoord.mul(2.0).sub(screenSize).div(screenSize.y);

		const t = time.mul(TIME_SCALE);

		// Camera flying over the terrain, pitched down slightly
		const ro = vec3(0.0, 2.7, t.mul(uSpeed));
		const rd0 = normalize(vec3(uvCoord, 1.0));
		const cp = Math.cos(PITCH);
		const sp = Math.sin(PITCH);
		const rd = vec3(
			rd0.x,
			rd0.y.mul(cp).add(rd0.z.mul(sp)),
			rd0.y.negate().mul(sp).add(rd0.z.mul(cp)),
		);

		// Volumetric raymarching accumulation state (jittered start against banding)
		const accumulatedColor = vec3(3.0).toVar();
		const d = float(hash2(fragCoord).mul(0.03)).toVar();
		const s = float(0.0).toVar();

		Loop({ start: float(1.0), end: float(100.0), type: 'float', condition: '<=' } as any, ({ i }: any) => {
			If(d.greaterThan(60.0), () => {
				Break();
			});

			const p = ro.add(rd.mul(d));
			const terrainDist = getTerrain(p, d);
			const shape = float(0.0).toVar();

			If(terrainDist.greaterThan(4.0), () => {
				shape.assign(terrainDist);
			}).Else(() => {
				// Smooth gyroid fractal structure masked by the terrain
				const p3 = p.mul(2.5).add(uSeed);
				const sinP = sin(p3);
				const cosP = cos(vec3(p3.y, p3.z, p3.x));
				const structuralNoise = dot(sinP, cosP).mul(0.5);
				shape.assign(max(structuralNoise, terrainDist));
			});

			s.assign(uFractalStep.add(uFractalAmp.mul(abs(shape.sub(i.mul(0.02))))));
			d.addAssign(s);

			// Cycle through the four colors based on iteration depth
			const colorT = i.mul(0.04);
			const baseColor = getGradient(colorT, uColor1, uColor2, uColor3, uColor4).mul(1.4);

			// Distance dampening fades into darkness
			const dampening = d.mul(d).mul(-0.42);

			accumulatedColor.addAssign(max(baseColor.div(s), vec3(dampening)));
		});

		// Tone mapping + interleaved gradient dithering against banding
		const finalOutputColor = accumulatedColor.mul(accumulatedColor).mul(0.00000125);
		const toneMappedColor = tanh(finalOutputColor).toVar();
		const ditherNoise = interleavedGradientNoise(fragCoord);
		toneMappedColor.addAssign(ditherNoise.sub(0.5).mul(0.004));

		return vec4(toneMappedColor, 1.0);
	})();

	return {
		colorNode,
		transparent: false,
		uniforms: {
			speed: uSpeed,
			fractalStep: uFractalStep,
			fractalAmp: uFractalAmp,
			terrainScale: uTerrainScale,
			terrainBaseHeight: uTerrainBaseHeight,
			terrainAmp: uTerrainAmp,
			groundOffset: uGroundOffset,
			color1: uColor1,
			color2: uColor2,
			color3: uColor3,
			color4: uColor4,
			seed: uSeed,
		},
	};
}
