/**
 * Arcade dissolve ("Robotron death") shader in TSL (WebGPU).
 *
 * Inspired by the enemy destruction effect in Robotron 2084: the mesh is
 * sliced into horizontal and vertical bands along its local X/Y axes. As
 * `progress` rises, each band peels off at a staggered time, sliding apart
 * sideways (rows along X, columns along Y) while flashing through a bright
 * arcade palette, then evaporating. At `progress` 1 the mesh is gone.
 *
 * The band displacement happens in the vertex stage (`positionNode`), so use
 * geometry with enough vertices for bands to separate (spheres, subdivided
 * planes, or a segmented `BoxGeometry`). Vertices on band boundaries stretch
 * into thin shreds — the characteristic arcade tear-apart look.
 *
 * Intended use: a transparent material on any sufficiently subdivided mesh.
 */
import { Color, type ColorRepresentation } from 'three';
import {
	Fn,
	clamp,
	float,
	floor,
	fract,
	max,
	mix,
	positionLocal,
	sin,
	smoothstep,
	step,
	time,
	uniform,
	vec3,
	vec4,
} from 'three/tsl';
import type { ZylemParameterizedShader } from '../types';
import type { TSLFn } from './utils.tsl';

export interface ArcadeDissolveOptions {
	/** Destruction progress: 0 = intact, 1 = fully destroyed. Default 0 */
	progress?: number;
	/** Band density (bands per local unit along X/Y). Default 2 */
	bandFrequency?: number;
	/** How far bands slide apart, in local units. Default 3 */
	displacement?: number;
	/** Per-band timing spread (0 = all at once, 1 = fully staggered). Default 0.6 */
	stagger?: number;
	/** Palette flash rate while a band dissolves. Default 8 */
	flashSpeed?: number;
	/** Base surface color of the intact mesh. Default light gray */
	baseColor?: ColorRepresentation;
	/** First arcade flash color. Default red */
	colorA?: ColorRepresentation;
	/** Second arcade flash color. Default yellow */
	colorB?: ColorRepresentation;
	/** Third arcade flash color. Default cyan */
	colorC?: ColorRepresentation;
	/**
	 * Optional TSL node used as the intact surface color (rgb) instead of
	 * `baseColor`. Baked at creation.
	 */
	baseColorNode?: any;
}

export interface ArcadeDissolveUniforms {
	progress: { value: number };
	bandFrequency: { value: number };
	displacement: { value: number };
	stagger: { value: number };
	flashSpeed: { value: number };
	baseColor: { value: Color };
	colorA: { value: Color };
	colorB: { value: Color };
	colorC: { value: Color };
	[key: string]: { value: any };
}

/** Cheap 1D hash (0..1) for per-band randomness. */
const hash1: TSLFn = Fn(([n]: [any]) => {
	return fract(sin(n.mul(127.1).add(311.7)).mul(43758.5453123));
});

/**
 * Create an arcade dissolve shader. Animate `uniforms.progress.value` from 0
 * to 1 to shred the mesh apart.
 */
export function createArcadeDissolve(
	options: ArcadeDissolveOptions = {},
): ZylemParameterizedShader<ArcadeDissolveUniforms> {
	const uProgress = uniform(options.progress ?? 0.0);
	const uBandFrequency = uniform(options.bandFrequency ?? 2.0);
	const uDisplacement = uniform(options.displacement ?? 3.0);
	const uStagger = uniform(options.stagger ?? 0.6);
	const uFlashSpeed = uniform(options.flashSpeed ?? 8.0);
	const uBaseColor = uniform(new Color(options.baseColor ?? '#b8bcc2'));
	const uColorA = uniform(new Color(options.colorA ?? '#ff2a2a'));
	const uColorB = uniform(new Color(options.colorB ?? '#ffd52a'));
	const uColorC = uniform(new Color(options.colorC ?? '#2ad5ff'));

	/**
	 * A band's local progress: starts at a hash-staggered time, reaches 1 for
	 * every band by global progress 1.
	 */
	const bandProgress: TSLFn = Fn(([h]: [any]) => {
		const p = clamp(float(uProgress), 0.0, 1.0);
		return clamp(
			p.mul(float(1.0).add(uStagger)).sub(h.mul(uStagger)),
			0.0,
			1.0,
		);
	});

	/** Shared per-fragment/per-vertex band data derived from local position. */
	const bands = () => {
		const rowIndex = floor(positionLocal.y.mul(uBandFrequency));
		const colIndex = floor(positionLocal.x.mul(uBandFrequency));
		const hRow = hash1(rowIndex);
		const hCol = hash1(colIndex.add(53.7));
		return { rowIndex, colIndex, hRow, hCol };
	};

	// Vertex stage: rows slide along X, columns along Y, each on its own
	// staggered schedule with hash-varied speed and direction.
	const positionNode = Fn(() => {
		const { hRow, hCol } = bands();
		const lpRow: any = bandProgress(hRow);
		const lpCol: any = bandProgress(hCol);

		const dirRow = step(0.5, hRow).mul(2.0).sub(1.0);
		const dirCol = step(0.5, hCol).mul(2.0).sub(1.0);

		const offX = dirRow
			.mul(lpRow.mul(lpRow))
			.mul(uDisplacement)
			.mul(hRow.mul(0.75).add(0.5));
		const offY = dirCol
			.mul(lpCol.mul(lpCol))
			.mul(uDisplacement)
			.mul(hCol.mul(0.75).add(0.5));

		return positionLocal.add(vec3(offX as any, offY as any, 0.0));
	})();

	const colorNode = Fn(() => {
		const { hRow, hCol } = bands();
		const lpRow: any = bandProgress(hRow);
		const lpCol: any = bandProgress(hCol);
		const lp = max(lpRow, lpCol);

		// Cycle the arcade palette per band while it dissolves
		const cycle = fract(
			hRow.add(hCol).add(time.mul(uFlashSpeed)),
		).mul(3.0);
		const palette = mix(
			mix(
				vec3(uColorA as any) as any,
				vec3(uColorB as any) as any,
				step(1.0, cycle),
			) as any,
			vec3(uColorC as any) as any,
			step(2.0, cycle),
		) as any;

		const base = options.baseColorNode ?? vec3(uBaseColor as any);
		// Flash in as soon as the band starts moving, evaporate at the end
		const flashAmount = smoothstep(0.0, 0.15, lp);
		const color: any = mix(base as any, palette, flashAmount) as any;
		const alpha = float(1.0).sub(smoothstep(0.7, 1.0, lp));

		return vec4(color, alpha);
	})();

	return {
		colorNode,
		positionNode,
		transparent: true,
		uniforms: {
			progress: uProgress,
			bandFrequency: uBandFrequency,
			displacement: uDisplacement,
			stagger: uStagger,
			flashSpeed: uFlashSpeed,
			baseColor: uBaseColor,
			colorA: uColorA,
			colorB: uColorB,
			colorC: uColorC,
		},
	};
}
