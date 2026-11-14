import { Type, type Static } from '@sinclair/typebox';

/** RGB(A) color as a CSS string or numeric hex. */
export const ColorJsonSchema = Type.Union([Type.String(), Type.Number()], {
	title: 'ColorJson',
	description: 'CSS color string or numeric hex (Three.js Color-compatible).',
});

/** Gravity as `[x, y, z]` components (JSON-serializable). */
export const Vec3ComponentsSchema = Type.Tuple([Type.Number(), Type.Number(), Type.Number()], {
	title: 'Vec3Components',
});

/** GLTF loader options that are JSON-serializable. */
export const StageGLTFAssetLoaderConfigSchema = Type.Object(
	{
		meshopt: Type.Optional(Type.Boolean()),
		ktx2TranscoderPath: Type.Optional(Type.String()),
	},
	{ title: 'StageGLTFAssetLoaderConfig', additionalProperties: false }
);

/** Stage asset loader configuration (JSON subset). */
export const StageAssetLoaderConfigSchema = Type.Object(
	{
		gltf: Type.Optional(StageGLTFAssetLoaderConfigSchema),
	},
	{ title: 'StageAssetLoaderConfig', additionalProperties: false }
);

/** Editor-friendly built-in background settings. */
const StarSettingsSchema = Type.Union([
	Type.Literal(false),
	Type.Object(
		{
			count: Type.Optional(Type.Integer({ minimum: 0, maximum: 50000 })),
			seed: Type.Optional(Type.Number({ minimum: 0, maximum: 4294967295 })),
			brightness: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
			size: Type.Optional(Type.Number({ minimum: 0.1, maximum: 8 })),
		},
		{ additionalProperties: false }
	),
]);
export const StageBackgroundSchema = Type.Union(
	[
		Type.Object(
			{ type: Type.Literal('color'), color: ColorJsonSchema },
			{ additionalProperties: false }
		),
		Type.Object(
			{
				type: Type.Literal('gradient'),
				top: ColorJsonSchema,
				horizon: ColorJsonSchema,
				bottom: Type.Optional(ColorJsonSchema),
			},
			{ additionalProperties: false }
		),
		Type.Object(
			{
				type: Type.Literal('space'),
				color: Type.Optional(ColorJsonSchema),
				stars: Type.Optional(StarSettingsSchema),
				sun: Type.Optional(
					Type.Object(
						{
							direction: Type.Optional(Vec3ComponentsSchema),
							color: Type.Optional(ColorJsonSchema),
							intensity: Type.Optional(Type.Number({ minimum: 0 })),
							ambient: Type.Optional(Type.Number({ minimum: 0 })),
						},
						{ additionalProperties: false }
					)
				),
			},
			{ additionalProperties: false }
		),
		Type.Object(
			{
				type: Type.Literal('sky'),
				preset: Type.Optional(
					Type.Union([Type.Literal('earth'), Type.Literal('mars'), Type.Literal('titan')])
				),
				quality: Type.Optional(
					Type.Union([Type.Literal('low'), Type.Literal('medium'), Type.Literal('high')])
				),
				timeOfDay: Type.Optional(Type.Number({ minimum: 0, maximum: 24 })),
				latitude: Type.Optional(Type.Number({ minimum: -90, maximum: 90 })),
				exposure: Type.Optional(Type.Number({ minimum: 0, maximum: 1000 })),
				stars: Type.Optional(StarSettingsSchema),
				cycleDuration: Type.Optional(Type.Number({ minimum: 1 })),
			},
			{ additionalProperties: false }
		),
	],
	{ title: 'StageBackground' }
);

/** Serializable stage AO selection. Algorithm-specific implementation stays in graphics. */
export const AmbientOcclusionSchema = Type.Union(
	[
		Type.Literal(false),
		Type.Object(
			{
				method: Type.Union([Type.Literal('ssao'), Type.Literal('gtao'), Type.Literal('cortao')]),
				quality: Type.Optional(
					Type.Union([Type.Literal('low'), Type.Literal('medium'), Type.Literal('high')])
				),
				radius: Type.Optional(Type.Number({ exclusiveMinimum: 0 })),
				intensity: Type.Optional(Type.Number({ minimum: 0 })),
				resolutionScale: Type.Optional(Type.Number({ exclusiveMinimum: 0, maximum: 1 })),
				denoise: Type.Optional(Type.Boolean()),
			},
			{ additionalProperties: false }
		),
	],
	{ title: 'AmbientOcclusion' }
);

/**
 * JSON-serializable subset of {@link StageConfigLike}.
 * Excludes live objects (shaders, runtime adapters, post-effects, wasm builders).
 */
export const StageConfigJsonSchema = Type.Object(
	{
		inputs: Type.Optional(Type.Record(Type.String(), Type.Array(Type.String()))),
		backgroundColor: Type.Optional(ColorJsonSchema),
		background: Type.Optional(StageBackgroundSchema),
		backgroundImage: Type.Optional(Type.Union([Type.String(), Type.Null()])),
		gravity: Type.Optional(Vec3ComponentsSchema),
		variables: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
		physicsRate: Type.Optional(Type.Number({ exclusiveMinimum: 0 })),
		assetLoaders: Type.Optional(StageAssetLoaderConfigSchema),
		defaultLighting: Type.Optional(Type.Boolean()),
		ambientOcclusion: Type.Optional(AmbientOcclusionSchema),
	},
	{
		$id: 'StageConfigJson',
		title: 'StageConfigJson',
		additionalProperties: false,
	}
);

export type StageConfigJson = Static<typeof StageConfigJsonSchema>;
