/**
 * Galaxy backdrop shader (WebGPU TSL).
 *
 * Backed by `createStarryNight` from `@zylem/shaders`: a world-space
 * procedural skybox with twinkling star layers, a tilted Milky Way dust band,
 * and a nebula tint. Unlike the previous screen-space implementation, it is
 * stable under camera rotation and seamless in every direction.
 *
 * Exported as `starfieldTSL` for backward compatibility with the demos that
 * consume it as `backgroundShader`. For per-demo customization, call
 * `createStarryNight(options)` directly instead.
 */
import type { ZylemTSLShader } from '@zylem/game-lib/graphics';
import { createStarryNight } from '@zylem/shaders';

export const starfieldTSL: ZylemTSLShader = createStarryNight();
