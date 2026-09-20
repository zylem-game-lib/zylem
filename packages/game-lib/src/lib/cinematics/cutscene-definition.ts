import { Type, type Static } from '@sinclair/typebox';

/**
 * TypeBox schema for a cutscene the cinematics module can play: a timeline in
 * seconds split into scenes, cameras (static, dolly along a spline, or
 * following an entity) placed on camera tracks as shots, camera keyframes,
 * and event/audio tracks that fire gameplay hooks at points in time.
 *
 * Creator's Director mode authors `.cutscene.json` documents that strip down
 * to this shape (`toRuntimeCutscene` in `@zylem-creator/shared`).
 */

export const Vec3Schema = Type.Object(
	{ x: Type.Number(), y: Type.Number(), z: Type.Number() },
	{ title: 'Vec3', additionalProperties: false },
);
export type Vec3Def = Static<typeof Vec3Schema>;

export const CutsceneEasingSchema = Type.Union(
	[Type.Literal('linear'), Type.Literal('easeIn'), Type.Literal('easeOut'), Type.Literal('easeInOut')],
	{ title: 'CutsceneEasing' },
);
export type CutsceneEasing = Static<typeof CutsceneEasingSchema>;

export const SceneTransitionTypeSchema = Type.Union(
	[
		Type.Literal('cut'),
		Type.Literal('fade'),
		Type.Literal('wipe'),
		Type.Literal('radial'),
		Type.Literal('noise'),
		Type.Literal('cells'),
	],
	{ title: 'SceneTransitionType' },
);
export type SceneTransitionType = Static<typeof SceneTransitionTypeSchema>;

export const SceneTransitionSchema = Type.Object(
	{
		type: SceneTransitionTypeSchema,
		/** Seconds; ignored for `cut`. */
		duration: Type.Number({ minimum: 0 }),
		easing: CutsceneEasingSchema,
	},
	{ title: 'SceneTransition', additionalProperties: false },
);
export type SceneTransition = Static<typeof SceneTransitionSchema>;

export const CutsceneSceneSchema = Type.Object(
	{
		id: Type.String(),
		name: Type.String(),
		/** Seconds from the cutscene start. */
		start: Type.Number({ minimum: 0 }),
		end: Type.Number({ minimum: 0 }),
		/** How the picture arrives at this scene's start. */
		transitionIn: SceneTransitionSchema,
	},
	{ title: 'CutsceneScene', additionalProperties: false },
);
export type CutsceneScene = Static<typeof CutsceneSceneSchema>;

export const CameraPoseDefSchema = Type.Object(
	{ position: Vec3Schema, lookAt: Vec3Schema },
	{ title: 'CameraPoseDef', additionalProperties: false },
);
export type CameraPoseDef = Static<typeof CameraPoseDefSchema>;

export const CameraKeyframeSchema = Type.Object(
	{
		id: Type.String(),
		/** Seconds from the cutscene start. */
		time: Type.Number({ minimum: 0 }),
		position: Type.Optional(Vec3Schema),
		lookAt: Type.Optional(Vec3Schema),
		fov: Type.Optional(Type.Number({ minimum: 1, maximum: 179 })),
		/** Easing used to arrive at this keyframe from the previous one. */
		easing: CutsceneEasingSchema,
	},
	{ title: 'CameraKeyframe', additionalProperties: false },
);
export type CameraKeyframe = Static<typeof CameraKeyframeSchema>;

export const CutsceneCameraKindSchema = Type.Union(
	[Type.Literal('static'), Type.Literal('dolly'), Type.Literal('follow')],
	{ title: 'CutsceneCameraKind' },
);
export type CutsceneCameraKind = Static<typeof CutsceneCameraKindSchema>;

export const CutsceneCameraSchema = Type.Object(
	{
		id: Type.String(),
		name: Type.String(),
		kind: CutsceneCameraKindSchema,
		/** Vertical field of view in degrees. */
		fov: Type.Number({ minimum: 1, maximum: 179 }),
		/** Base pose; `static` cameras hold it, keyframes and dollies start from it. */
		pose: CameraPoseDefSchema,
		/** `dolly` cameras ride this path over each shot. */
		dollyId: Type.Optional(Type.String()),
		/** Progress curve along the dolly path (0 → 1 over the shot). */
		dollyEasing: CutsceneEasingSchema,
		/** Entity name a `follow` camera tracks, and what a dolly looks at when set. */
		target: Type.Optional(Type.String()),
		/** Offset from the target for `follow` cameras. */
		offset: Type.Optional(Vec3Schema),
		/** Smoothing for `follow` cameras, 0 (instant) … 1 (very slow). */
		damping: Type.Number({ minimum: 0, maximum: 1 }),
		keyframes: Type.Array(CameraKeyframeSchema),
	},
	{ title: 'CutsceneCamera', additionalProperties: false },
);
export type CutsceneCamera = Static<typeof CutsceneCameraSchema>;

export const DollyPathSchema = Type.Object(
	{
		id: Type.String(),
		name: Type.String(),
		points: Type.Array(Vec3Schema, { minItems: 2 }),
		closed: Type.Boolean(),
		/** Catmull-Rom tension; 0.5 is centripetal. */
		tension: Type.Number({ minimum: 0, maximum: 1 }),
	},
	{ title: 'DollyPath', additionalProperties: false },
);
export type DollyPath = Static<typeof DollyPathSchema>;

export const ShotBlendSchema = Type.Object(
	{
		/** Seconds spent blending from the previous shot's camera; 0 is a hard cut. */
		duration: Type.Number({ minimum: 0 }),
		easing: CutsceneEasingSchema,
	},
	{ title: 'ShotBlend', additionalProperties: false },
);
export type ShotBlend = Static<typeof ShotBlendSchema>;

export const CameraShotSchema = Type.Object(
	{
		id: Type.String(),
		cameraId: Type.String(),
		start: Type.Number({ minimum: 0 }),
		end: Type.Number({ minimum: 0 }),
		blend: ShotBlendSchema,
	},
	{ title: 'CameraShot', additionalProperties: false },
);
export type CameraShot = Static<typeof CameraShotSchema>;

const ScalarSchema = Type.Union([Type.String(), Type.Number(), Type.Boolean()]);

export const CutsceneEventSchema = Type.Union(
	[
		Type.Object(
			{
				type: Type.Literal('emit'),
				/** Stage event name. */
				name: Type.String(),
				payload: Type.Record(Type.String(), ScalarSchema),
			},
			{ additionalProperties: false },
		),
		Type.Object(
			{
				type: Type.Literal('playAnimation'),
				/** Entity name. */
				entity: Type.String(),
				/** Animation key as passed to `playAnimation({ key })`. */
				key: Type.String(),
			},
			{ additionalProperties: false },
		),
		Type.Object(
			{
				type: Type.Literal('playSong'),
				/** Song slug or URL; resolved by the host. */
				song: Type.String(),
				loop: Type.Boolean(),
			},
			{ additionalProperties: false },
		),
		Type.Object(
			{
				type: Type.Literal('stopSong'),
				song: Type.Optional(Type.String()),
			},
			{ additionalProperties: false },
		),
		Type.Object(
			{
				type: Type.Literal('setVariable'),
				name: Type.String(),
				value: ScalarSchema,
			},
			{ additionalProperties: false },
		),
	],
	{ title: 'CutsceneEvent' },
);
export type CutsceneEvent = Static<typeof CutsceneEventSchema>;

export const EventItemSchema = Type.Object(
	{ id: Type.String(), time: Type.Number({ minimum: 0 }), event: CutsceneEventSchema },
	{ title: 'EventItem', additionalProperties: false },
);
export type EventItem = Static<typeof EventItemSchema>;

export const AudioItemSchema = Type.Object(
	{
		id: Type.String(),
		time: Type.Number({ minimum: 0 }),
		kind: Type.Union([Type.Literal('song'), Type.Literal('sfx')]),
		/** Song slug for `song`, asset URL for `sfx`. */
		ref: Type.String(),
		loop: Type.Boolean(),
		/** Gain in dB. */
		volume: Type.Number(),
	},
	{ title: 'AudioItem', additionalProperties: false },
);
export type AudioItem = Static<typeof AudioItemSchema>;

export const CameraTrackSchema = Type.Object(
	{ kind: Type.Literal('camera'), id: Type.String(), name: Type.String(), items: Type.Array(CameraShotSchema) },
	{ title: 'CameraTrack', additionalProperties: false },
);
export const EventTrackSchema = Type.Object(
	{ kind: Type.Literal('event'), id: Type.String(), name: Type.String(), items: Type.Array(EventItemSchema) },
	{ title: 'EventTrack', additionalProperties: false },
);
export const AudioTrackSchema = Type.Object(
	{ kind: Type.Literal('audio'), id: Type.String(), name: Type.String(), items: Type.Array(AudioItemSchema) },
	{ title: 'AudioTrack', additionalProperties: false },
);
export const CutsceneTrackSchema = Type.Union([CameraTrackSchema, EventTrackSchema, AudioTrackSchema], {
	title: 'CutsceneTrack',
});
export type CameraTrack = Static<typeof CameraTrackSchema>;
export type EventTrack = Static<typeof EventTrackSchema>;
export type AudioTrack = Static<typeof AudioTrackSchema>;
export type CutsceneTrack = Static<typeof CutsceneTrackSchema>;

export const CutsceneDefinitionSchema = Type.Object(
	{
		id: Type.String(),
		name: Type.String(),
		/** Seconds. */
		duration: Type.Number({ exclusiveMinimum: 0 }),
		/** Stage the cutscene was authored against; informational. */
		stage: Type.Union([Type.String(), Type.Null()]),
		skippable: Type.Boolean(),
		scenes: Type.Array(CutsceneSceneSchema),
		cameras: Type.Array(CutsceneCameraSchema),
		dollies: Type.Array(DollyPathSchema),
		tracks: Type.Array(CutsceneTrackSchema),
	},
	{ $id: 'CutsceneDefinition', title: 'CutsceneDefinition', additionalProperties: false },
);
export type CutsceneDefinition = Static<typeof CutsceneDefinitionSchema>;
