import { Type, type Static } from '@sinclair/typebox';
import { GameInputConfigSchema } from './input-config';

/** Resolution as `"WxH"`, a retro preset name, `{ width, height }`, or `"native"`. */
export const ResolutionInputSchema = Type.Union(
	[
		Type.String(),
		Type.Object({
			width: Type.Number({ exclusiveMinimum: 0 }),
			height: Type.Number({ exclusiveMinimum: 0 }),
		}),
		Type.Literal('native'),
	],
	{ title: 'ResolutionInput' },
);

/** Per-device (e.g. mobile) aspect / resolution overrides. */
export const GameDeviceConfigJsonSchema = Type.Object(
	{
		aspectRatio: Type.Optional(Type.Union([Type.Number(), Type.String()])),
		preset: Type.Optional(Type.String()),
		resolution: Type.Optional(ResolutionInputSchema),
		/** `true` enables default touch controls; object form is editor-extended later. */
		controls: Type.Optional(Type.Boolean()),
	},
	{ title: 'GameDeviceConfigJson', additionalProperties: false },
);

/**
 * JSON-serializable subset of {@link GameConfigLike}.
 * Excludes DOM nodes (`container`, `canvas`) and live stage instances.
 */
export const GameConfigJsonSchema = Type.Object(
	{
		id: Type.Optional(Type.String()),
		globals: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
		debug: Type.Optional(Type.Boolean()),
		time: Type.Optional(Type.Number()),
		input: Type.Optional(GameInputConfigSchema),
		aspectRatio: Type.Optional(Type.Union([Type.Number(), Type.String()])),
		preset: Type.Optional(Type.String()),
		resolution: Type.Optional(ResolutionInputSchema),
		mobile: Type.Optional(GameDeviceConfigJsonSchema),
		fullscreen: Type.Optional(Type.Boolean()),
		bodyBackground: Type.Optional(Type.String()),
		containerId: Type.Optional(Type.String()),
	},
	{
		$id: 'GameConfigJson',
		title: 'GameConfigJson',
		additionalProperties: false,
	},
);

export type GameConfigJson = Static<typeof GameConfigJsonSchema>;
export type GameDeviceConfigJson = Static<typeof GameDeviceConfigJsonSchema>;
