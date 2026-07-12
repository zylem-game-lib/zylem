/**
 * `@zylem/game-lib/graphics` public API.
 * @public
 */
// Default-shader sentinel (used internally to detect "no custom shader").
export { standardShader } from '../lib/graphics/shaders/standard.shader';
export { objectVertexShader } from '../lib/graphics/shaders/vertex/object.shader';

// Material types and helpers
export type {
	ZylemShaderObject,
	ZylemTSLShader,
	ZylemShader,
} from '../lib/graphics/material';

// Postprocessing effect contract (structurally compatible with @zylem/shaders)
export type { ZylemPostEffect } from '../lib/camera/renderer-manager';

// Stage transition contract (structurally compatible with @zylem/shaders)
export type {
	StageTransitionConfig,
	StageTransitionEasing,
	ZylemTransitionShader,
} from '../lib/graphics/stage-transition';
export { crossfadeTransitionShader } from '../lib/graphics/stage-transition';
export { isTSLShader, isGLSLShader, createNodeMaterialFromTSL } from '../lib/graphics/material';

// TSL utilities for shader authoring (WebGPU)
export { uniform, uv, time, vec3, vec4, float, Fn } from '../lib/graphics/material';

// Extended TSL utilities for skybox / background shader authoring.
// `positionWorldDirection` is the per-pixel view direction inside a
// background shader.
export {
	positionWorldDirection,
	positionWorld,
	normalize,
	mix,
	smoothstep,
	clamp,
	sin,
	cos,
	atan,
	asin,
	abs,
	exp,
	pow,
	step,
	max,
	min,
	floor,
	fract,
	dot,
	length,
	vec2,
	mod,
} from 'three/tsl';

// Background shader factory
export { createBackgroundShader } from '../lib/graphics/background-shader';
