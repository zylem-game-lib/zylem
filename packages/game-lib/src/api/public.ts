/**
 * Synthetic public API entry for API Extractor and documentation tooling.
 *
 * Consumers should import from `@zylem/game-lib/<subpath>` (e.g. `core`,
 * `entity`) rather than this barrel. It exists so a single extractor run can
 * cover the full intentional public surface.
 *
 * @packageDocumentation
 */

export * from './core';
export * from './entity';
export * from './behavior';
export * from './actions';
export * from './input';
export * from './input-ui';
export * from './events';
export * from './globals';
export * from './audio';
export * from './debug';
export * from './web-components';
export * from './runtime';
export * from './schema';

// `graphics` overlaps `core` on stage-transition symbols — re-export the
// graphics-only surface explicitly to avoid duplicate `export *` conflicts.
export {
	fireTSL,
	starTSL,
	debugTSL,
	gradientSkyTSL,
	createGradientSky,
	starfieldSkyTSL,
	standardShader,
	objectVertexShader,
	isTSLShader,
	isGLSLShader,
	createNodeMaterialFromTSL,
	uniform,
	uv,
	time,
	vec3,
	vec4,
	float,
	Fn,
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
	createBackgroundShader,
} from './graphics';
export type {
	ZylemShaderObject,
	ZylemTSLShader,
	ZylemShader,
	ZylemPostEffect,
} from './graphics';
