/**
 * TypeBox schemas for JSON-serializable game-lib config surfaces.
 * These are the source of truth for published `dist/schema/*.schema.json` files.
 */

export {
	Vector2Schema,
	TextEntityDataSchema,
	SpriteEntityDataSchema,
	EntitySchema,
	StageSchema,
	EntityJsonSchema,
	StageJsonSchema,
	type EntityBlueprint,
	type StageBlueprint,
	type TextEntityData,
	type SpriteEntityData,
	type EntityJson,
	type StageJson,
} from './blueprints';

export {
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
	type GameInputConfigJson,
} from './input-config';

export {
	ColorJsonSchema,
	Vec3ComponentsSchema,
	StageGLTFAssetLoaderConfigSchema,
	StageAssetLoaderConfigSchema,
	StageConfigJsonSchema,
	type StageConfigJson,
} from './stage-config';

export {
	ResolutionInputSchema,
	GameDeviceConfigJsonSchema,
	GameConfigJsonSchema,
	type GameConfigJson,
	type GameDeviceConfigJson,
} from './game-config';
