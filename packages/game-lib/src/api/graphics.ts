// Shaders
export { fireShader } from '../lib/graphics/shaders/fire.shader';
export { starShader } from '../lib/graphics/shaders/star.shader';
export { standardShader } from '../lib/graphics/shaders/standard.shader';
export { debugShader } from '../lib/graphics/shaders/debug.shader';
export { objectVertexShader } from '../lib/graphics/shaders/vertex/object.shader';

// Material types and helpers
export type {
	ZylemShaderObject,
	ZylemTSLShader,
	ZylemShader,
} from '../lib/graphics/material';
export { isTSLShader, isGLSLShader } from '../lib/graphics/material';

// TSL utilities for shader authoring (WebGPU)
export { uniform, uv, time, vec3, vec4, float, Fn } from '../lib/graphics/material';
