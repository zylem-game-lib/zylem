/**
 * `@zylem/game-lib/schema` — TypeBox schemas for JSON-serializable config.
 * Published JSON Schema files are emitted to `dist/schema/*.schema.json` on build.
 * @public
 */

export {
	Vector2Schema,
	TextEntityDataSchema,
	SpriteEntityDataSchema,
	EntitySchema,
	StageSchema,
	EntityJsonSchema,
	StageJsonSchema,
	KeyboardMappingSchema,
	MouseMappingSchema,
	VirtualTouchStyleSchema,
	VirtualTouchPositionSchema,
	VirtualTouchButtonConfigSchema,
	VirtualTouchJoystickConfigSchema,
	VirtualTouchButtonsConfigSchema,
	VirtualTouchJoysticksConfigSchema,
	VirtualTouchConfigSchema,
	MouseConfigSchema,
	GameInputPlayerConfigSchema,
	GameInputConfigSchema,
	ColorJsonSchema,
	Vec3ComponentsSchema,
	StageGLTFAssetLoaderConfigSchema,
	StageAssetLoaderConfigSchema,
	StageConfigJsonSchema,
	ResolutionInputSchema,
	GameDeviceConfigJsonSchema,
	GameConfigJsonSchema,
} from '../lib/core/json-schemas';

export type {
	EntityBlueprint,
	StageBlueprint,
	TextEntityData,
	SpriteEntityData,
	EntityJson,
	StageJson,
	GameInputConfigJson,
	StageConfigJson,
	GameConfigJson,
	GameDeviceConfigJson,
} from '../lib/core/json-schemas';
