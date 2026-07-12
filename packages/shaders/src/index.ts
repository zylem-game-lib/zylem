/**
 * @zylem/shaders — WebGPU-compatible TSL shaders and postprocessing effects
 * for the Zylem game framework.
 */

// Third-party procedural TSL textures
export * from 'tsl-textures';

// Shared contracts
export type {
	ZylemParameterizedShader,
	ZylemPostEffect,
	ZylemShaderUniforms,
	ZylemTSLShader,
	ZylemTransitionShader,
} from './types';

// Shaders
export { fireTSL } from './shaders/fire.tsl';
export { starTSL } from './shaders/star.tsl';
export { debugTSL } from './shaders/debug.tsl';
export {
	createGradientSky,
	gradientSkyTSL,
} from './shaders/gradient-sky.tsl';
export {
	createMagicalLandscape,
	type MagicalLandscapeOptions,
	type MagicalLandscapeUniforms,
} from './shaders/magical-landscape.tsl';
export {
	createWaterSurface,
	type WaterSurfaceOptions,
	type WaterSurfaceUniforms,
} from './shaders/water-surface.tsl';
export {
	createLava,
	type LavaOptions,
	type LavaUniforms,
} from './shaders/lava.tsl';
export {
	createAlienSky,
	type AlienSkyOptions,
	type AlienSkyUniforms,
} from './shaders/alien-sky.tsl';
export {
	createArcadeDissolve,
	type ArcadeDissolveOptions,
	type ArcadeDissolveUniforms,
} from './shaders/arcade-dissolve.tsl';
export {
	createHolographic,
	type HolographicOptions,
	type HolographicUniforms,
} from './shaders/holographic.tsl';
export {
	createDissolve,
	type DissolveOptions,
	type DissolveUniforms,
} from './shaders/dissolve.tsl';
export {
	createFoliage,
	type FoliageOptions,
	type FoliageUniforms,
} from './shaders/foliage.tsl';
export {
	createFoliageClusterGeometry,
	type FoliageClusterOptions,
} from './shaders/foliage-geometry';
export {
	createEnergyShield,
	type EnergyShieldOptions,
	type EnergyShieldUniforms,
} from './shaders/energy-shield.tsl';
export {
	createPlanetRing,
	type PlanetRingOptions,
	type PlanetRingUniforms,
} from './shaders/planet-ring.tsl';
export {
	createPlanetSurface,
	type PlanetSurfaceOptions,
	type PlanetSurfaceUniforms,
} from './shaders/planet-surface.tsl';
export {
	createStarryNight,
	type StarryNightOptions,
	type StarryNightUniforms,
} from './shaders/starry-night.tsl';
export {
	createShadertoyWaterNoise,
	type ShadertoyWaterNoiseOptions,
	type ShadertoyWaterNoiseUniforms,
} from './shaders/shadertoy-water-noise.tsl';
export {
	createShadertoyFire,
	type FireColor,
	type ShadertoyFireOptions,
	type ShadertoyFireUniforms,
} from './shaders/shadertoy-fire.tsl';
export {
	createStageTransition,
	type StageTransitionOptions,
	type StageTransitionPattern,
	type StageTransitionUniforms,
	type ZylemStageTransition,
} from './shaders/stage-transition.tsl';

// Shadertoy runtime transpiler
export {
	parseShadertoy,
	parseShadertoyToNodeFactory,
	transpileShadertoy,
} from './shadertoy/shadertoy-node';

// Postprocessing effects
export {
	createAfterimageEffect,
	type AfterimageEffect,
	type AfterimageOptions,
} from './postprocessing/afterimage';
