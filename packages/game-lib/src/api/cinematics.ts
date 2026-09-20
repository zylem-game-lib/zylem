/**
 * `@zylem/game-lib/cinematics` public API.
 *
 * In-game cutscenes authored in Creator's Director mode: a timeline of
 * scenes, cameras (static, dolly, follow) placed as shots with keyframes and
 * blends, plus event and audio tracks. `createCutscenePlayer` drives a live
 * stage's camera through the camera pipeline and fires the gameplay hooks.
 * @public
 */
export {
	CutsceneDefinitionSchema,
	CutsceneSceneSchema,
	CutsceneCameraSchema,
	CameraKeyframeSchema,
	CameraShotSchema,
	DollyPathSchema,
	CutsceneEventSchema,
	EventItemSchema,
	AudioItemSchema,
	CutsceneTrackSchema,
	SceneTransitionSchema,
	type CutsceneDefinition,
	type CutsceneScene,
	type CutsceneCamera,
	type CutsceneCameraKind,
	type CutsceneEasing,
	type CameraKeyframe,
	type CameraPoseDef,
	type CameraShot,
	type CameraTrack,
	type EventTrack,
	type AudioTrack,
	type CutsceneTrack,
	type DollyPath,
	type ShotBlend,
	type CutsceneEvent,
	type EventItem,
	type AudioItem,
	type SceneTransition,
	type SceneTransitionType,
	type Vec3Def,
} from '../lib/cinematics/cutscene-definition';
export {
	easeValue,
	lerpVec3,
	lerpPose,
	sceneAt,
	shotAt,
	activeShot,
	previousShot,
	dollyPointAt,
	sampleDollyPath,
	evaluateCameraPose,
	evaluateCutscene,
	itemsBetween,
	cameraTracks,
	cutsceneLength,
	type EvaluatedPose,
	type CutsceneFrame,
	type TargetLookup,
} from '../lib/cinematics/cutscene-math';
export { CutsceneCameraBehavior, CUTSCENE_BEHAVIOR_KEY } from '../lib/cinematics/cutscene-camera-behavior';
export {
	createCutscenePlayer,
	type CutscenePlayer,
	type CutscenePlayerOptions,
	type CutscenePlayerEvents,
	type CutscenePlayerState,
	type CutsceneHost,
} from '../lib/cinematics/cutscene-player';
export {
	createStageCutsceneHost,
	setCutsceneTransitionShaders,
	type CutsceneStageLike,
	type StageCutsceneHostOptions,
} from '../lib/cinematics/stage-host';
export { CutscenePreviewController } from '../lib/cinematics/preview-controller';
