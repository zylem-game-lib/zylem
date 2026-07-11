/**
 * Re-export blueprint schemas from the JSON schema module.
 * Prefer `@zylem/game-lib/schema` for new imports.
 */
export {
	Vector2Schema,
	EntitySchema,
	StageSchema,
	type EntityBlueprint,
	type StageBlueprint,
} from './json-schemas/blueprints';
