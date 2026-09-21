import { EntityJsonSchema, GameConfigJsonSchema } from '@zylem/game-lib/schema';

/** TypeBox schemas used in code; plain JSON Schema files ship under `@zylem/game-lib/schema/*`. */
export const publishedSchemas = {
	entity: EntityJsonSchema,
	gameConfig: GameConfigJsonSchema,
} as const;
