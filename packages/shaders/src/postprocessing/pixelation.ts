/**
 * Pixelation postprocessing effect.
 *
 * Wraps three's node-based `pixelationPass` (Kody King's pixelation pass
 * with optional single-pixel normal/depth edge outlines, from the
 * `webgpu_postprocessing_pixel` example) as a {@link ZylemPostEffect}.
 *
 * This is a *pass-replacing* effect: it renders its own scene pass (with
 * normal/depth channels) instead of transforming the incoming node, so it
 * should be first in the `postProcessingEffects` chain.
 */
import { pixelationPass } from 'three/addons/tsl/display/PixelationPassNode.js';
import { uniform } from 'three/tsl';
import type { ZylemPostEffect } from '../types';

export interface PixelationOptions {
	/** Size of a rendered pixel block in screen pixels. Default 6 */
	pixelSize?: number;
	/** Strength of outlines from normal discontinuities (0-2). Default 0.3 */
	normalEdgeStrength?: number;
	/** Strength of outlines from depth discontinuities (0-1). Default 0.4 */
	depthEdgeStrength?: number;
}

export interface PixelationEffect {
	/** Register this on the render pipeline (e.g. `postProcessingEffects`). */
	effect: ZylemPostEffect;
	/** Runtime-tweakable parameters. */
	uniforms: {
		pixelSize: { value: number };
		normalEdgeStrength: { value: number };
		depthEdgeStrength: { value: number };
	};
}

/**
 * Create a pixelation effect.
 *
 * ```ts
 * const pixels = createPixelationEffect({ pixelSize: 8 });
 * // stage config: postProcessingEffects: [pixels.effect]
 * pixels.uniforms.pixelSize.value = 4; // tweak at runtime
 * ```
 */
export function createPixelationEffect(
	options: PixelationOptions = {},
): PixelationEffect {
	const uPixelSize = uniform(options.pixelSize ?? 6);
	const uNormalEdgeStrength = uniform(options.normalEdgeStrength ?? 0.3);
	const uDepthEdgeStrength = uniform(options.depthEdgeStrength ?? 0.4);

	const effect: ZylemPostEffect = (_inputNode, ctx) => {
		return pixelationPass(
			ctx.scene,
			ctx.camera,
			uPixelSize,
			uNormalEdgeStrength,
			uDepthEdgeStrength,
		);
	};

	return {
		effect,
		uniforms: {
			pixelSize: uPixelSize,
			normalEdgeStrength: uNormalEdgeStrength,
			depthEdgeStrength: uDepthEdgeStrength,
		},
	};
}
