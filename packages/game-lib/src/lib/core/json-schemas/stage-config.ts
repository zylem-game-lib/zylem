import { Type, type Static } from '@sinclair/typebox';

/** RGB(A) color as a CSS string or numeric hex. */
export const ColorJsonSchema = Type.Union([Type.String(), Type.Number()], {
	title: 'ColorJson',
	description: 'CSS color string or numeric hex (Three.js Color-compatible).',
});

/** Gravity as `[x, y, z]` components (JSON-serializable). */
export const Vec3ComponentsSchema = Type.Tuple(
	[Type.Number(), Type.Number(), Type.Number()],
	{ title: 'Vec3Components' },
);

/** GLTF loader options that are JSON-serializable. */
export const StageGLTFAssetLoaderConfigSchema = Type.Object(
	{
		meshopt: Type.Optional(Type.Boolean()),
		ktx2TranscoderPath: Type.Optional(Type.String()),
	},
	{ title: 'StageGLTFAssetLoaderConfig', additionalProperties: false },
);

/** Stage asset loader configuration (JSON subset). */
export const StageAssetLoaderConfigSchema = Type.Object(
	{
		gltf: Type.Optional(StageGLTFAssetLoaderConfigSchema),
	},
	{ title: 'StageAssetLoaderConfig', additionalProperties: false },
);

/**
 * JSON-serializable subset of {@link StageConfigLike}.
 * Excludes live objects (shaders, runtime adapters, post-effects, wasm builders).
 */
export const StageConfigJsonSchema = Type.Object(
	{
		inputs: Type.Optional(Type.Record(Type.String(), Type.Array(Type.String()))),
		backgroundColor: Type.Optional(ColorJsonSchema),
		backgroundImage: Type.Optional(Type.Union([Type.String(), Type.Null()])),
		gravity: Type.Optional(Vec3ComponentsSchema),
		variables: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
		physicsRate: Type.Optional(Type.Number({ exclusiveMinimum: 0 })),
		assetLoaders: Type.Optional(StageAssetLoaderConfigSchema),
		defaultLighting: Type.Optional(Type.Boolean()),
	},
	{
		$id: 'StageConfigJson',
		title: 'StageConfigJson',
		additionalProperties: false,
	},
);

export type StageConfigJson = Static<typeof StageConfigJsonSchema>;
