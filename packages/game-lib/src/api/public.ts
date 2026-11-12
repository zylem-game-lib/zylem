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
export * from './cinematics';
export { NavigationMesh, NavigationSession, bakeNavigationData } from './navigation';
export * from './debug';
export * from './bridge';
export * from './web-components';
export * from './runtime';
export * from './schema';

// Placement factories. Session types are already exported from `core`.
export {
	createHoverArea,
	createDroppableArea,
	entityRepresentative,
	ZylemHoverArea,
	ZylemDroppableArea,
	HOVER_AREA_TYPE,
	DROPPABLE_AREA_TYPE,
} from './placement';
export type {
	EntityRepresentative,
	EntityRepresentativeOptions,
	RepresentativeFrame,
	RepresentativeLook,
	RepresentativeSource,
	HoverAreaOptions,
	DroppableAreaOptions,
	PointerAreaContext,
	PlacementPointContext,
	PointerTargetEntity,
} from './placement';

// `graphics` overlaps `core` on stage-transition symbols — re-export the
// graphics-only surface explicitly to avoid duplicate `export *` conflicts.
export {
	standardShader,
	objectVertexShader,
	isTSLShader,
	isGLSLShader,
	createNodeMaterialFromTSL,
	applyEntityGlow,
	createEntityGlowMaterial,
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
	EntityGlowOptions,
} from './graphics';
