/**
 * `@zylem/game-lib/core` — game, stage, camera, and vector public API.
 * @public
 */
// Game core
/** @public */
export { createGame, Game } from '../lib/game/game';
/** @public */
export type { GameLoadingEvent } from '../lib/game/game-loading-delegate';
/** @public */
export type {
	GameInputConfig,
	GameInputPlayerConfig,
	KeyboardMapping,
	MouseConfig,
	MouseMapping,
	VirtualTouchButtonConfig,
	VirtualTouchButtonsConfig,
	VirtualTouchButtonSlot,
	VirtualTouchConfig,
	VirtualTouchJoystickConfig,
	VirtualTouchJoysticksConfig,
	VirtualTouchPosition,
	VirtualTouchStyle,
	ZylemGameConfig,
} from '../lib/game/game-interfaces';
/** @public */
export { gameConfig } from '../lib/game/game-config';
/** @public */
export type {
	GameConfigLike,
	GameDeviceConfig,
	ResolutionInput,
	DeviceProfile,
	ResolveGameConfigRuntime,
} from '../lib/game/game-config';

// Stage
/** @public */
export { createStage } from '../lib/stage/stage';
/** @public */
export { entitySpawner } from '../lib/stage/entity-spawner';
/** @public */
export { stageConfig } from '../lib/stage/stage-config';
/** @public */
export type { StageConfigLike } from '../lib/stage/stage-config';
/** @public */
export type { StageOptions, LoadingEvent } from '../lib/stage/zylem-stage';
/** @public */
export type { StageBlueprint } from '../lib/core/blueprints';
/** @public */
export { StageManager, stageState } from '../lib/stage/stage-manager';
/** @public */
export {
	STAGE_STATE_CHANGE,
	initStageStateDispatcher,
	dispatchStageState,
} from '../lib/stage/stage-events';
/** @public */
export type { StageStateChangeEvent } from '../lib/stage/stage-events';

// Stage transitions
/** @public */
export type { StageNavigationOptions } from '../lib/core/interfaces';
/** @public */
export type {
	StageTransitionConfig,
	StageTransitionEasing,
	ZylemTransitionShader,
} from '../lib/graphics/stage-transition';
/** @public */
export { crossfadeTransitionShader } from '../lib/graphics/stage-transition';

// Camera
/** @public */
export { createCamera, CameraWrapper } from '../lib/camera/camera';
/** @public */
export type { CameraOptions } from '../lib/camera/camera';
/** @public */
export type { PerspectiveType } from '../lib/camera/perspective';
/** @public */
export { Perspectives } from '../lib/camera/perspective';
/** @public */
export type { RendererType, ZylemRenderer, Viewport } from '../lib/camera/renderer-manager';
/** @public */
export { isWebGPUSupported } from '../lib/camera/renderer-manager';
/** @public */
export { CameraManager } from '../lib/camera/camera-manager';

// Camera pipeline & perspectives
/** @public */
export type {
	CameraPose,
	PoseDelta,
	CameraContext,
	TransformLike,
	CameraPerspective,
	CameraBehavior,
	CameraAction,
	CameraPipelineState,
} from '../lib/camera/types';
/** @public */
export { CameraPipeline } from '../lib/camera/camera-pipeline';
/** @public */
export {
	ThirdPersonPerspective,
	Fixed2DPerspective,
	FirstPersonPerspective,
	createPerspective,
} from '../lib/camera/perspectives';
/** @public */
export type {
	ThirdPersonOptions,
	Fixed2DOptions,
	FirstPersonOptions,
	PerspectiveOptions,
} from '../lib/camera/perspectives';
/** @public */
export { createFollowTarget } from '../lib/camera/behaviors/follow-target';
/** @public */
export type { FollowTargetOptions } from '../lib/camera/behaviors/follow-target';
/** @public */
export { setCameraFeed } from '../lib/camera/camera-feed';
/** @public */
export type { CameraFeedOptions } from '../lib/camera/camera-feed';

// Vessel
/** @public */
export { vessel } from '../lib/core/vessel';

// Lifecycle types
/** @public */
export type { SetupContext, UpdateContext } from '../lib/core/base-node-life-cycle';

// Interfaces
/** @public */
export type { StageEntity } from '../lib/interfaces/entity';

// Display / aspect ratio
/** @public */
export { AspectRatio } from '../lib/device/aspect-ratio';
/** @public */
export type { AspectRatioValue } from '../lib/device/aspect-ratio';
/** @public */
export {
	getDisplayAspect,
	getPresetResolution,
	parseResolution,
} from '../lib/game/game-retro-resolutions';
/** @public */
export type {
	RetroPreset,
	RetroPresetKey,
	RetroResolution,
} from '../lib/game/game-retro-resolutions';

// Vector helpers
/** @public */
export type { Vect3 } from '../lib/core/utility/vector';
/** @public */
export type {
	Vec2,
	Vec2Components,
	Vec2Input,
	Vec3,
	Vec3Components,
	Vec3Input,
} from '../lib/core/vector';
/** @public */
export {
	VEC2_ONE,
	VEC2_ZERO,
	VEC3_ONE,
	VEC3_ZERO,
	normalizeVec2,
	normalizeVec3,
	toRapierVector3,
	toThreeVector2,
	toThreeVector3,
} from '../lib/core/vector';
