/**
 * `@zylem/game-lib/schema` — TypeBox schemas for JSON-serializable config.
 * Published JSON Schema files are emitted to `dist/schema/*.schema.json` on build.
 * @public
 */

export {
	Vector2Schema,
	Vector3TupleSchema,
	TextEntityDataSchema,
	SpriteEntityDataSchema,
	LineEntityDataSchema,
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
	LineEntityData,
	EntityJson,
	StageJson,
	GameInputConfigJson,
	StageConfigJson,
	GameConfigJson,
	GameDeviceConfigJson,
} from '../lib/core/json-schemas';
