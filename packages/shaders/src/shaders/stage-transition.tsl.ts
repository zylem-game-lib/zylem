/**
 * Stage transition shader factory.
 *
 * Blends two fullscreen frames (the outgoing and incoming stage) during a
 * stage switch, in the style of the three.js
 * `webgpu_postprocessing_transition` example. Returns a
 * `ZylemTransitionShader` — a function that game-lib's render pipeline calls
 * with the outgoing frame node, the incoming frame node, and a progress
 * uniform (0 = fully outgoing, 1 = fully incoming).
 *
 * Patterns are procedural (no assets required); pass `texture` to drive the
 * wipe from a grayscale mix map instead, mirroring three's `TransitionNode`.
 */
import { Vector2, type Texture } from 'three';
import {
	Fn,
	clamp,
	dot,
	float,
	floor,
	length,
	mix,
	normalize,
	screenSize,
	texture as textureNode,
	uniform,
	uv,
	vec2,
} from 'three/tsl';
import type { ZylemShaderUniforms, ZylemTransitionShader } from '../types';
import { hash2, valueNoise2d } from './utils.tsl';

/** Built-in procedural transition patterns. */
export type StageTransitionPattern =
	| 'fade'
	| 'wipe'
	| 'radial'
	| 'noise'
	| 'cells';

export interface StageTransitionOptions {
	/** Procedural pattern (default `'fade'`). Ignored when `texture` is set. */
	pattern?: StageTransitionPattern;
	/**
	 * Optional grayscale mix map (three.js `TransitionNode` style). Dark
	 * texels transition first. Overrides `pattern`.
	 */
	texture?: Texture;
	/** Soft-edge width of the transition front, 0..1 (default `0.1`). */
	threshold?: number;
	/** Wipe direction in screen space (default left-to-right `{ x: 1, y: 0 }`). */
	direction?: { x: number; y: number };
	/** Pattern frequency for `noise` / `cells` (default `8`). */
	scale?: number;
}

export interface StageTransitionUniforms extends ZylemShaderUniforms {
	/** Soft-edge width of the transition front. */
	threshold: { value: number };
	/** Wipe direction (normalized at evaluation time). */
	direction: { value: Vector2 };
	/** Pattern frequency for `noise` / `cells`. */
	scale: { value: number };
}

/**
 * A stage transition: the shader function consumed by game-lib plus a bag of
 * runtime-tweakable uniforms.
 */
export type ZylemStageTransition = {
	shader: ZylemTransitionShader;
	uniforms: StageTransitionUniforms;
};

/**
 * Create a stage transition shader.
 *
 * @example
 * game.nextStage({
 *   transition: { duration: 1.2, shader: createStageTransition({ pattern: 'noise' }) },
 * });
 */
export function createStageTransition(
	options: StageTransitionOptions = {},
): ZylemStageTransition {
	const pattern = options.pattern ?? 'fade';
	const uThreshold = uniform(options.threshold ?? 0.1);
	const uDirection = uniform(
		new Vector2(options.direction?.x ?? 1, options.direction?.y ?? 0),
	);
	const uScale = uniform(options.scale ?? 8);
	const mixTexture = options.texture;

	const shader: ZylemTransitionShader = ({ fromNode, toNode, progress }) => {
		return Fn(() => {
			const p: any = progress;
			const screenUv: any = uv();

			// Plain crossfade has no spatial front — mix directly on progress.
			if (!mixTexture && pattern === 'fade') {
				return mix(fromNode, toNode, clamp(p, 0.0, 1.0));
			}

			// Scalar field over the screen (0..1); low values transition first.
			let field: any;
			if (mixTexture) {
				field = textureNode(mixTexture, screenUv).r;
			} else if (pattern === 'wipe') {
				const dir: any = normalize(vec2(uDirection as any));
				field = dot(screenUv.sub(0.5), dir).add(0.5);
			} else if (pattern === 'radial') {
				const aspect = screenSize.x.div(screenSize.y);
				const centered = screenUv.sub(0.5).mul(vec2(aspect, 1.0));
				// ~0 at center, ~1 at the far corners: iris-out from the middle.
				field = length(centered).mul(1.2);
			} else if (pattern === 'cells') {
				field = hash2(floor(screenUv.mul(uScale as any)));
			} else {
				// 'noise'
				field = valueNoise2d(screenUv.mul(uScale as any));
			}

			// Sweep a soft-edged front through the field (TransitionNode math):
			// the edge travels from -threshold to 1+threshold so every pixel is
			// fully covered at progress 0 and 1 regardless of threshold.
			const t: any = uThreshold;
			const edge = p.mul(float(1.0).add(t.mul(2.0))).sub(t);
			const m = clamp(edge.sub(field).div(t), 0.0, 1.0);
			return mix(fromNode, toNode, m);
		})();
	};

	return {
		shader,
		uniforms: {
			threshold: uThreshold,
			direction: uDirection,
			scale: uScale,
		},
	};
}
