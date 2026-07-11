import { Type, type Static } from '@sinclair/typebox';

/** 2D position tuple `[x, y]` used by blueprint entities. */
export const Vector2Schema = Type.Tuple([Type.Number(), Type.Number()], {
	title: 'Vector2',
	description: 'A 2D position as [x, y].',
});

/**
 * Runtime entity blueprint (open `data` for factory spreading).
 * Prefer {@link EntityJsonSchema} for editor / Monaco JSON Schema.
 */
export const EntitySchema = Type.Object(
	{
		id: Type.String(),
		type: Type.String({ minLength: 1 }),
		position: Type.Optional(Vector2Schema),
		data: Type.Optional(Type.Record(Type.String(), Type.Any())),
	},
	{ $id: 'EntityBlueprint', title: 'EntityBlueprint', additionalProperties: false },
);

/** Stage blueprint: id, optional name, entities, and optional asset URLs. */
export const StageSchema = Type.Object(
	{
		id: Type.String(),
		name: Type.Optional(Type.String()),
		entities: Type.Array(EntitySchema),
		assets: Type.Optional(Type.Array(Type.String())),
	},
	{ $id: 'StageBlueprint', title: 'StageBlueprint', additionalProperties: false },
);

/** JSON-serializable data for blueprint entities of type `text`. */
export const TextEntityDataSchema = Type.Object(
	{
		value: Type.Optional(Type.String()),
		color: Type.Optional(Type.String()),
		fontSize: Type.Optional(Type.Number()),
		fontFamily: Type.Optional(Type.String()),
	},
	{ title: 'TextEntityData', additionalProperties: true },
);

/** JSON-serializable data for blueprint entities of type `sprite`. */
export const SpriteEntityDataSchema = Type.Object(
	{
		imagePath: Type.Optional(Type.String()),
		width: Type.Optional(Type.Number()),
		height: Type.Optional(Type.Number()),
	},
	{ title: 'SpriteEntityData', additionalProperties: true },
);

/**
 * Editor-oriented entity blueprint with discriminated `type` / `data`.
 * Used for published JSON Schema; runtime code uses {@link EntitySchema}.
 */
export const EntityJsonSchema = Type.Union(
	[
		Type.Object({
			id: Type.String(),
			type: Type.Literal('text'),
			position: Type.Optional(Vector2Schema),
			data: Type.Optional(TextEntityDataSchema),
		}),
		Type.Object({
			id: Type.String(),
			type: Type.Literal('sprite'),
			position: Type.Optional(Vector2Schema),
			data: Type.Optional(SpriteEntityDataSchema),
		}),
		Type.Object({
			id: Type.String(),
			type: Type.String({ minLength: 1 }),
			position: Type.Optional(Vector2Schema),
			data: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
		}),
	],
	{ $id: 'EntityJson', title: 'EntityJson' },
);

/** Editor-oriented stage blueprint referencing {@link EntityJsonSchema}. */
export const StageJsonSchema = Type.Object(
	{
		id: Type.String(),
		name: Type.Optional(Type.String()),
		entities: Type.Array(EntityJsonSchema),
		assets: Type.Optional(Type.Array(Type.String())),
	},
	{ $id: 'StageJson', title: 'StageJson', additionalProperties: false },
);

export type EntityBlueprint = Static<typeof EntitySchema>;
export type StageBlueprint = Static<typeof StageSchema>;
export type TextEntityData = Static<typeof TextEntityDataSchema>;
export type SpriteEntityData = Static<typeof SpriteEntityDataSchema>;
export type EntityJson = Static<typeof EntityJsonSchema>;
export type StageJson = Static<typeof StageJsonSchema>;
