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

// Camera pipeline types
export type {
	CameraPose, PoseDelta, CameraContext, TransformLike,
	CameraPerspective, CameraBehavior, CameraAction, CameraPipelineState,
} from '../lib/camera/types';
export { CameraPipeline } from '../lib/camera/camera-pipeline';

// Camera perspectives
export { ThirdPersonPerspective, Fixed2DPerspective, createPerspective } from '../lib/camera/perspectives';
export type { ThirdPersonOptions, Fixed2DOptions, PerspectiveOptions } from '../lib/camera/perspectives';

// Camera behaviors
export { createFollowTarget } from '../lib/camera/behaviors/follow-target';
export type { FollowTargetOptions } from '../lib/camera/behaviors/follow-target';

// Camera feed (render-to-texture utilities)
export { setCameraFeed } from '../lib/camera/camera-feed';
export type { CameraFeedOptions } from '../lib/camera/camera-feed';

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
export { createCone } from '../lib/entities/cone';
export { createPyramid } from '../lib/entities/pyramid';
export { createCylinder } from '../lib/entities/cylinder';
export { createPill } from '../lib/entities/pill';
export { createEntityFactory, type TemplateFactory } from '../lib/entities/entity-factory';
export { ZylemBox } from '../lib/entities/box';
export { create } from '../lib/entities/entity';

// Component factories for composable entity API
export {
	boxMesh, sphereMesh, coneMesh, pyramidMesh, cylinderMesh, pillMesh,
	boxCollision, sphereCollision, coneCollision, pyramidCollision,
	cylinderCollision, pillCollision, planeCollision, zoneCollision,
	type CollisionComponent,
} from '../lib/entities/parts';

// ECS Components & Behaviors (new thruster system)
export * from '../lib/behaviors';

// Standalone action functions (capabilities are auto-applied on all entities)
export { rotateInDirection } from '../lib/actions/capabilities/rotatable';
export { move, resetVelocity } from '../lib/actions/capabilities/moveable';

// Actions API (Cocos2d-inspired)
export { type Action } from '../lib/actions/action';
export { moveBy, moveTo, rotateBy, delay, callFunc } from '../lib/actions/interval-actions';
export { throttle, onPress, onRelease } from '../lib/actions/persistent-actions';
export { sequence, parallel, repeat, repeatForever } from '../lib/actions/composition';

// Cooldown system
export {
	CooldownBehavior,
	registerCooldown, getCooldown, fireCooldown, resetCooldown,
	type CooldownEntry, type CooldownHandle, type CooldownOptions,
} from '../lib/behaviors/cooldown';
export { createCooldownIcon, type IconSize, type IconSizePreset, type ScreenAnchor } from '../lib/entities/cooldown-icon';

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
	useMouseLook,
	useMouse,
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
	RECT_TYPE, PLANE_TYPE, ZONE_TYPE, ACTOR_TYPE,
	CONE_TYPE, PYRAMID_TYPE, CYLINDER_TYPE, PILL_TYPE,
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
