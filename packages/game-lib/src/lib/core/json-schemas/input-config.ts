import { Type, type Static } from '@sinclair/typebox';

/** Keyboard action → key-code list mapping. */
export const KeyboardMappingSchema = Type.Record(Type.String(), Type.Array(Type.String()), {
	title: 'KeyboardMapping',
});

/** Mouse action → input-property list mapping. */
export const MouseMappingSchema = Type.Record(Type.String(), Type.Array(Type.String()), {
	title: 'MouseMapping',
});

/** CSS-like style bag for virtual touch controls. */
export const VirtualTouchStyleSchema = Type.Record(
	Type.String(),
	Type.Union([Type.String(), Type.Number()]),
	{ title: 'VirtualTouchStyle' },
);

/** Absolute/relative position for a virtual touch control. */
export const VirtualTouchPositionSchema = Type.Object(
	{
		top: Type.Optional(Type.Union([Type.String(), Type.Number()])),
		right: Type.Optional(Type.Union([Type.String(), Type.Number()])),
		bottom: Type.Optional(Type.Union([Type.String(), Type.Number()])),
		left: Type.Optional(Type.Union([Type.String(), Type.Number()])),
		transform: Type.Optional(Type.String()),
	},
	{ title: 'VirtualTouchPosition', additionalProperties: false },
);

/** Virtual touch button configuration. */
export const VirtualTouchButtonConfigSchema = Type.Object(
	{
		enabled: Type.Optional(Type.Boolean()),
		className: Type.Optional(Type.String()),
		style: Type.Optional(VirtualTouchStyleSchema),
		position: Type.Optional(VirtualTouchPositionSchema),
		size: Type.Optional(Type.Number()),
		label: Type.Optional(Type.String()),
		svg: Type.Optional(Type.String()),
	},
	{ title: 'VirtualTouchButtonConfig', additionalProperties: false },
);

/** Virtual touch joystick configuration. */
export const VirtualTouchJoystickConfigSchema = Type.Object(
	{
		enabled: Type.Optional(Type.Boolean()),
		className: Type.Optional(Type.String()),
		style: Type.Optional(VirtualTouchStyleSchema),
		position: Type.Optional(VirtualTouchPositionSchema),
		size: Type.Optional(Type.Number()),
		thumbSize: Type.Optional(Type.Number()),
		maxDistance: Type.Optional(Type.Number()),
		deadzone: Type.Optional(Type.Number()),
		directionThreshold: Type.Optional(Type.Number()),
		horizontalAxis: Type.Optional(
			Type.Union([Type.Literal('Horizontal'), Type.Literal('SecondaryHorizontal')]),
		),
		verticalAxis: Type.Optional(
			Type.Union([Type.Literal('Vertical'), Type.Literal('SecondaryVertical')]),
		),
		emitDirections: Type.Optional(Type.Boolean()),
		svg: Type.Optional(
			Type.Object({
				base: Type.Optional(Type.String()),
				thumb: Type.Optional(Type.String()),
			}),
		),
	},
	{ title: 'VirtualTouchJoystickConfig', additionalProperties: false },
);

const touchButtonOrFalse = Type.Union([VirtualTouchButtonConfigSchema, Type.Literal(false)]);

/**
 * Virtual touch buttons map (slot → config or `false` to disable).
 * Uses a string-keyed record so published JSON Schema stays compact
 * (explicit per-slot properties would inline the button schema 14×).
 */
export const VirtualTouchButtonsConfigSchema = Type.Record(Type.String(), touchButtonOrFalse, {
	title: 'VirtualTouchButtonsConfig',
	description:
		'Keys are touch button slots: A, B, X, Y, Start, Select, L, R, LTrigger, RTrigger, Up, Down, Left, Right.',
});

/** Virtual touch joysticks map. */
export const VirtualTouchJoysticksConfigSchema = Type.Object(
	{
		left: Type.Optional(Type.Union([VirtualTouchJoystickConfigSchema, Type.Literal(false)])),
		right: Type.Optional(Type.Union([VirtualTouchJoystickConfigSchema, Type.Literal(false)])),
	},
	{ title: 'VirtualTouchJoysticksConfig', additionalProperties: false },
);

/** Virtual touch input configuration. */
export const VirtualTouchConfigSchema = Type.Object(
	{
		enabled: Type.Optional(Type.Union([Type.Boolean(), Type.Literal('auto')])),
		className: Type.Optional(Type.String()),
		style: Type.Optional(VirtualTouchStyleSchema),
		joysticks: Type.Optional(Type.Union([VirtualTouchJoysticksConfigSchema, Type.Literal(false)])),
		buttons: Type.Optional(Type.Union([VirtualTouchButtonsConfigSchema, Type.Literal(false)])),
	},
	{ title: 'VirtualTouchConfig', additionalProperties: false },
);

/** Mouse input configuration. */
export const MouseConfigSchema = Type.Object(
	{
		mapping: Type.Optional(MouseMappingSchema),
		pointerLock: Type.Optional(Type.Boolean()),
		sensitivity: Type.Optional(Type.Number()),
		lookMode: Type.Optional(Type.Union([Type.Literal('delta'), Type.Literal('screenCenter')])),
		maxLookDegrees: Type.Optional(Type.Number()),
		lookSensitivity: Type.Optional(Type.Number()),
	},
	{ title: 'MouseConfig', additionalProperties: false },
);

/** Per-player input configuration. */
export const GameInputPlayerConfigSchema = Type.Object(
	{
		key: Type.Optional(KeyboardMappingSchema),
		mouse: Type.Optional(MouseConfigSchema),
		touch: Type.Optional(VirtualTouchConfigSchema),
		includeDefaults: Type.Optional(Type.Boolean()),
	},
	{ title: 'GameInputPlayerConfig', additionalProperties: false },
);

/**
 * Top-level game input configuration (p1–p8).
 * Uses a string-keyed record so published JSON Schema does not inline the
 * player config eight times.
 */
export const GameInputConfigSchema = Type.Record(Type.String(), GameInputPlayerConfigSchema, {
	$id: 'GameInputConfig',
	title: 'GameInputConfig',
	description: 'Keys are player slots: p1, p2, p3, p4, p5, p6, p7, p8.',
});

export type GameInputConfigJson = Static<typeof GameInputConfigSchema>;
