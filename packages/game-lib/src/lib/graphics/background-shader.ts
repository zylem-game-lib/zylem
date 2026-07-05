/**
 * Convenience factory for creating background (skybox) shaders.
 *
 * Wraps a TSL color node into a {@link ZylemTSLShader} object suitable for
 * passing to `stageConfig({ backgroundShader: ... })`.
 *
 * @example
 * ```ts
 * import { createBackgroundShader, Fn, positionWorldDirection, vec4 } from '@zylem/game-lib/graphics';
 *
 * const myShader = createBackgroundShader(
 *   Fn(() => {
 *     const dir = positionWorldDirection; // per-pixel view direction
 *     return vec4(dir.x, dir.y, dir.z, 1.0);
 *   })()
 * );
 * ```
 */
import type { ZylemTSLShader } from './material';

/**
 * Create a background shader from a TSL color node.
 *
 * The node is rendered via the WebGPU renderer's `scene.backgroundNode` — a
 * true skybox pass evaluated per background pixel at infinite depth — and
 * should produce a `vec4` color output. Use `positionWorldDirection` (from
 * `three/tsl`), which in this context is the normalized per-pixel view
 * direction, to compute colors in spherical coordinates.
 *
 * @param colorNode - A TSL node expression that evaluates to a vec4 color
 * @param transparent - Whether the background should be transparent (default: false)
 * @returns A ZylemTSLShader that can be used as `backgroundShader` in stage config
 */
export function createBackgroundShader(
	colorNode: any,
	transparent: boolean = false,
): ZylemTSLShader {
	return {
		colorNode,
		transparent,
	};
}
