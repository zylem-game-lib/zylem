// Core game functionality
export { createGame, Game } from '../lib/game/game';
export type { ZylemGameConfig } from '../lib/game/game-interfaces';
export { gameConfig } from '../lib/game/game-config';

export { createStage } from '../lib/stage/stage';
export { entitySpawner } from '../lib/stage/entity-spawner';
export type { StageOptions, LoadingEvent } from '../lib/stage/zylem-stage';
export type { StageBlueprint } from '../lib/core/blueprints';
export { StageManager, stageState } from '../lib/stage/stage-manager';

export { vessel } from '../lib/core/vessel';

// Camera
export { createCamera } from '../lib/camera/camera';
export type { CameraOptions } from '../lib/camera/camera';
export { CameraWrapper } from '../lib/camera/camera';
export type { PerspectiveType } from '../lib/camera/perspective';
export { Perspectives } from '../lib/camera/perspective';
export type { RendererType, ZylemRenderer, Viewport } from '../lib/camera/renderer-manager';
export { isWebGPUSupported } from '../lib/camera/renderer-manager';
export { CameraManager } from '../lib/camera/camera-manager';

// Utility types
export type { Vect3 } from '../lib/core/utility/vector';

// Entities
export { createBox } from '../lib/entities/box';
export { createSphere } from '../lib/entities/sphere';
export { createSprite } from '../lib/entities/sprite';
export { createPlane } from '../lib/entities/plane';
export { createZone } from '../lib/entities/zone';
export { createActor } from '../lib/entities/actor';
export { createText } from '../lib/entities/text';
export { createRect } from '../lib/entities/rect';
export { createDisk } from '../lib/entities/disk';
export { createEntityFactory, type TemplateFactory } from '../lib/entities/entity-factory';
export { ZylemBox } from '../lib/entities/box';

// ECS Components & Behaviors (new thruster system)
export * from '../lib/behaviors';

// Capabilities
export { makeMoveable } from '../lib/actions/capabilities/moveable';
export { makeRotatable } from '../lib/actions/capabilities/rotatable';
export { makeTransformable } from '../lib/actions/capabilities/transformable';
export { rotatable } from '../lib/actions/capabilities/rotatable';
export { moveable } from '../lib/actions/capabilities/moveable';
export { rotateInDirection } from '../lib/actions/capabilities/rotatable';
export { move } from '../lib/actions/capabilities/moveable';
export { resetVelocity } from '../lib/actions/capabilities/moveable';


// Destruction utilities
// Destruction utilities
export { destroy } from '../lib/entities/destroy';

// Sounds
export { ricochetSound, pingPongBeep } from '../lib/sounds';

// External dependencies - these will be in separate vendor chunks
export { Howl } from 'howler';
export * as THREE from 'three';
export * as RAPIER from '@dimforge/rapier3d-compat';

// Update helpers
export { globalChange, globalChanges, variableChange, variableChanges } from '../lib/actions/global-change';

// Input presets
export {
	useArrowsForAxes,
	useArrowsForDirections,
	useWASDForDirections,
	useWASDForAxes,
	useIJKLForAxes,
	useIJKLForDirections,
	mergeInputConfigs,
} from '../lib/input/input-presets';

// State management - standalone functions
export { setGlobal, getGlobal, createGlobal, onGlobalChange, onGlobalChanges, getGlobals, clearGlobalSubscriptions } from '../lib/game/game-state';
export { setVariable, getVariable, createVariable, onVariableChange, onVariableChanges } from '../lib/stage/stage-state';

// Debug state - exposed for direct mutation by editor integration
export { debugState, setDebugTool, setPaused, type DebugTools } from '../lib/debug/debug-state';

// Web Components
export { ZylemGameElement, type ZylemGameState } from '../web-components/zylem-game';

// Lifecycle types
export type { SetupContext, UpdateContext } from '../lib/core/base-node-life-cycle';

// Interfaces
export type { StageEntity } from '../lib/interfaces/entity';

// Entity type symbols for getEntityByName type inference
export { 
	TEXT_TYPE, SPRITE_TYPE, BOX_TYPE, SPHERE_TYPE, 
	RECT_TYPE, PLANE_TYPE, ZONE_TYPE, ACTOR_TYPE 
} from '../lib/types/entity-type-map';

// Events
export {
	EventEmitterDelegate,
	zylemEventBus,
	type ZylemEvents,
	type GameEvents,
	type StageEvents,
	type EntityEvents,
	type GameLoadingPayload,
	type StateDispatchPayload,
	type StageConfigPayload,
	type EntityConfigPayload,
} from '../lib/events';

// Shaders
export { fireShader } from '../lib/graphics/shaders/fire.shader';
export { starShader } from '../lib/graphics/shaders/star.shader';
export { standardShader } from '../lib/graphics/shaders/standard.shader';
export { debugShader } from '../lib/graphics/shaders/debug.shader';
export { objectVertexShader } from '../lib/graphics/shaders/vertex/object.shader';
export type { ZylemShaderObject, ZylemTSLShader, ZylemShader } from '../lib/graphics/material';
export { isTSLShader, isGLSLShader } from '../lib/graphics/material';

// TSL utilities for shader authoring (WebGPU)
export { uniform, uv, time, vec3, vec4, float, Fn } from '../lib/graphics/material';
