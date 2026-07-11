/**
 * Emit published JSON Schema files from TypeBox sources.
 *
 * Runs after `tsup`. Imports compiled schemas from `dist/schema.js` and
 * writes plain JSON Schema documents to `dist/schema/*.schema.json`.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TSchema } from '@sinclair/typebox';
import {
	EntityJsonSchema,
	StageJsonSchema,
	GameConfigJsonSchema,
	StageConfigJsonSchema,
	GameInputConfigSchema,
} from '../dist/schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../dist/schema');

/** Strip TypeBox symbols and emit a plain JSON Schema document. */
function toJsonSchema(schema: TSchema): object {
	const plain = JSON.parse(JSON.stringify(schema)) as Record<string, unknown>;
	return {
		$schema: 'http://json-schema.org/draft-07/schema#',
		...plain,
	};
}

const schemas: Array<{ file: string; schema: TSchema }> = [
	{ file: 'entity.schema.json', schema: EntityJsonSchema },
	{ file: 'stage.schema.json', schema: StageJsonSchema },
	{ file: 'game-config.schema.json', schema: GameConfigJsonSchema },
	{ file: 'stage-config.schema.json', schema: StageConfigJsonSchema },
	{ file: 'input-config.schema.json', schema: GameInputConfigSchema },
];

await mkdir(outDir, { recursive: true });

for (const { file, schema } of schemas) {
	const target = path.join(outDir, file);
	const json = toJsonSchema(schema);
	await writeFile(target, `${JSON.stringify(json, null, 2)}\n`, 'utf8');
	console.log(`wrote ${path.relative(path.resolve(__dirname, '..'), target)}`);
}

console.log(`emitted ${schemas.length} JSON Schema file(s) to dist/schema/`);
