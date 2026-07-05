/**
 * Afterimage (motion trail) postprocessing effect.
 *
 * Wraps three's node-based `afterImage()` (the official TSL port of the
 * classic `AfterimageShader.js`) as a {@link ZylemPostEffect} that can be
 * registered on game-lib's render pipeline.
 */
import { afterImage } from 'three/addons/tsl/display/AfterImageNode.js';
import { uniform } from 'three/tsl';
import type { ZylemPostEffect } from '../types';

export interface AfterimageOptions {
	/**
	 * Damping intensity (0-1). Higher values leave longer trails.
	 * Default 0.96
	 */
	damp?: number;
}

export interface AfterimageEffect {
	/** Register this on the render pipeline (e.g. `postProcessingEffects`). */
	effect: ZylemPostEffect;
	/** Runtime-tweakable parameters. */
	uniforms: {
		damp: { value: number };
	};
}

/**
 * Create an afterimage effect.
 *
 * ```ts
 * const trails = createAfterimageEffect({ damp: 0.9 });
 * // stage config: postProcessingEffects: [trails.effect]
 * trails.uniforms.damp.value = 0.97; // tweak at runtime
 * ```
 */
export function createAfterimageEffect(
	options: AfterimageOptions = {},
): AfterimageEffect {
	const damp = uniform(options.damp ?? 0.96);

	const effect: ZylemPostEffect = inputNode => {
		return afterImage(inputNode, damp);
	};

	return {
		effect,
		uniforms: { damp },
	};
}
