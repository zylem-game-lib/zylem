// TSL shaders (WebGPU)
export { fireTSL } from '../lib/graphics/shaders/fire.tsl';
export { starTSL } from '../lib/graphics/shaders/star.tsl';
export { debugTSL } from '../lib/graphics/shaders/debug.tsl';

// Default-shader sentinel (used internally to detect "no custom shader").
export { standardShader } from '../lib/graphics/shaders/standard.shader';
export { objectVertexShader } from '../lib/graphics/shaders/vertex/object.shader';

// Material types and helpers
export type {
	ZylemShaderObject,
	ZylemTSLShader,
	ZylemShader,
} from '../lib/graphics/material';
export { isTSLShader, isGLSLShader, createNodeMaterialFromTSL } from '../lib/graphics/material';

// TSL utilities for shader authoring (WebGPU)
export { uniform, uv, time, vec3, vec4, float, Fn } from '../lib/graphics/material';
