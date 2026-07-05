/**
 * Dissolve shader in TSL (WebGPU).
 *
 * Port of the DissolveMaterial from the react-three-fiber dissolve-effect
 * sandbox (three-custom-shader-material + gl-noise): a 3D FBM over local
 * position is thresholded against a dissolve progress, discarding dissolved
 * fragments and painting a thin HDR glow border along the dissolve front.
 *
 * The original drives progress from an SDF-box gizmo; this port exposes a
 * plain `progress` uniform (0 = intact, 1 = fully dissolved) — animate it
 * over time for the classic teleport/burn-away effect.
 *
 * Intended use: a transparent material on any mesh.
 */
import { Color, type ColorRepresentation } from 'three';
import {
	Fn,
	clamp,
	float,
	mix,
	positionLocal,
	step,
	uniform,
	vec3,
	vec4,
} from 'three/tsl';
import type { ZylemParameterizedShader } from '../types';
import { fbm3d } from './utils.tsl';

export interface DissolveOptions {
	/** Dissolve progress: 0 = fully intact, 1 = fully dissolved. Default 0 */
	progress?: number;
	/** Width of the glowing border along the dissolve front. Default 0.1 */
	thickness?: number;
	/** Border glow color. Default green (#14c445) */
	edgeColor?: ColorRepresentation;
	/** HDR intensity multiplier of the border glow. Default 5 */
	intensity?: number;
	/** Noise frequency (larger = finer dissolve pattern). Default 3 */
	noiseScale?: number;
	/** Base surface color of the intact mesh. Default light gray */
	baseColor?: ColorRepresentation;
	/**
	 * Optional TSL node used as the intact surface color (rgb) instead of
	 * `baseColor` — e.g. another shader's color node. Baked at creation.
	 */
	baseColorNode?: any;
}

export interface DissolveUniforms {
	progress: { value: number };
	thickness: { value: number };
	edgeColor: { value: Color };
	intensity: { value: number };
	noiseScale: { value: number };
	baseColor: { value: Color };
	[key: string]: { value: any };
}

/**
 * Create a dissolve shader. All options are exposed as runtime uniforms on
 * the returned `uniforms` object; animate `uniforms.progress.value` to
 * dissolve/materialize the mesh.
 */
export function createDissolve(
	options: DissolveOptions = {},
): ZylemParameterizedShader<DissolveUniforms> {
	const uProgress = uniform(options.progress ?? 0.0);
	const uThickness = uniform(options.thickness ?? 0.1);
	const uEdgeColor = uniform(new Color(options.edgeColor ?? '#14c445'));
	const uIntensity = uniform(options.intensity ?? 5.0);
	const uNoiseScale = uniform(options.noiseScale ?? 3.0);
	const uBaseColor = uniform(new Color(options.baseColor ?? '#b8bcc2'));

	const colorNode = Fn(() => {
		const noise = fbm3d(positionLocal.mul(uNoiseScale));

		// As in the original: visible where noise clears the progress
		// threshold, with a thin border band just below it.
		const p = clamp(float(uProgress), 0.0, 1.0);
		const visible = step(p, noise);
		const border = step(p.sub(uThickness), noise).sub(visible);

		const base = options.baseColorNode ?? vec3(uBaseColor as any);
		const glow = vec3(uEdgeColor as any).mul(uIntensity);
		const color = mix(base, glow, border);

		return vec4(color, visible.add(border));
	})();

	return {
		colorNode,
		transparent: true,
		uniforms: {
			progress: uProgress,
			thickness: uThickness,
			edgeColor: uEdgeColor,
			intensity: uIntensity,
			noiseScale: uNoiseScale,
			baseColor: uBaseColor,
		},
	};
}
