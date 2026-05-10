// Game core
export { createGame, Game } from '../lib/game/game';
export type { GameLoadingEvent } from '../lib/game/game-loading-delegate';
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
export { gameConfig } from '../lib/game/game-config';
export type {
	GameConfigLike,
	GameDeviceConfig,
	ResolutionInput,
	DeviceProfile,
	ResolveGameConfigRuntime,
} from '../lib/game/game-config';

// Stage
export { createStage } from '../lib/stage/stage';
export { entitySpawner } from '../lib/stage/entity-spawner';
export type { StageOptions, LoadingEvent } from '../lib/stage/zylem-stage';
export type { StageBlueprint } from '../lib/core/blueprints';
export { StageManager, stageState } from '../lib/stage/stage-manager';
export {
	STAGE_STATE_CHANGE,
	initStageStateDispatcher,
	dispatchStageState,
} from '../lib/stage/stage-events';
export type { StageStateChangeEvent } from '../lib/stage/stage-events';

// Camera
export { createCamera, CameraWrapper } from '../lib/camera/camera';
export type { CameraOptions } from '../lib/camera/camera';
export type { PerspectiveType } from '../lib/camera/perspective';
export { Perspectives } from '../lib/camera/perspective';
export type { RendererType, ZylemRenderer, Viewport } from '../lib/camera/renderer-manager';
export { isWebGPUSupported } from '../lib/camera/renderer-manager';
export { CameraManager } from '../lib/camera/camera-manager';

// Camera pipeline & perspectives
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
export { CameraPipeline } from '../lib/camera/camera-pipeline';
export {
	ThirdPersonPerspective,
	Fixed2DPerspective,
	FirstPersonPerspective,
	createPerspective,
} from '../lib/camera/perspectives';
export type {
	ThirdPersonOptions,
	Fixed2DOptions,
	FirstPersonOptions,
	PerspectiveOptions,
} from '../lib/camera/perspectives';
export { createFollowTarget } from '../lib/camera/behaviors/follow-target';
export type { FollowTargetOptions } from '../lib/camera/behaviors/follow-target';
export { setCameraFeed } from '../lib/camera/camera-feed';
export type { CameraFeedOptions } from '../lib/camera/camera-feed';

// Vessel
export { vessel } from '../lib/core/vessel';

// Lifecycle types
export type { SetupContext, UpdateContext } from '../lib/core/base-node-life-cycle';

// Interfaces
export type { StageEntity } from '../lib/interfaces/entity';

// Display / aspect ratio
export { AspectRatio } from '../lib/device/aspect-ratio';
export type { AspectRatioValue } from '../lib/device/aspect-ratio';
export {
	getDisplayAspect,
	getPresetResolution,
	parseResolution,
} from '../lib/game/game-retro-resolutions';
export type {
	RetroPreset,
	RetroPresetKey,
	RetroResolution,
} from '../lib/game/game-retro-resolutions';

// Vector helpers
export type { Vect3 } from '../lib/core/utility/vector';
export type {
	Vec2,
	Vec2Components,
	Vec2Input,
	Vec3,
	Vec3Components,
	Vec3Input,
} from '../lib/core/vector';
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
