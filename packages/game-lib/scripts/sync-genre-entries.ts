/**
 * Writes `@zylem/game-lib/behavior/<genre>` named re-exports from the published
 * `@zylem/behaviors` package, and checks that those files still match.
 *
 * `export *` from an external package is erased by esbuild, so game-lib must
 * list every name. Run with `--write` to regenerate. The default is a check.
 *
 * Names come from the installed package's declaration files, not from the
 * behaviors source tree.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { publishedBehaviorEntries } from '@zylem/behaviors/genre-map';

const gameLibRoot = path.resolve(import.meta.dirname, '..');
const gameLibApi = path.join(gameLibRoot, 'src/api/behavior');
const require = createRequire(import.meta.url);

export interface EntryExports {
	id: string;
	values: string[];
	types: string[];
}

interface PackageExport {
	types?: string;
}

function behaviorsPackageRoot(): string {
	return path.dirname(require.resolve('@zylem/behaviors/package.json'));
}

function declarationFor(id: string): string {
	const root = behaviorsPackageRoot();
	const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as {
		exports?: Record<string, string | PackageExport>;
	};
	const key = `./${id}`;
	const spec = manifest.exports?.[key];
	if (!spec) throw new Error(`@zylem/behaviors has no export ${key}`);
	const types = typeof spec === 'string' ? spec : spec.types;
	if (!types) throw new Error(`@zylem/behaviors export ${key} has no types condition`);
	return path.join(root, types);
}

function loadExports(files: string[]): Map<string, { values: string[]; types: string[] }> {
	const program = ts.createProgram(files, {
		noEmit: true,
		module: ts.ModuleKind.NodeNext,
		moduleResolution: ts.ModuleResolutionKind.NodeNext,
		target: ts.ScriptTarget.ES2022,
		strict: false,
		skipLibCheck: true,
	});
	const checker = program.getTypeChecker();
	const out = new Map<string, { values: string[]; types: string[] }>();
	for (const file of files) {
		const source = program.getSourceFile(file);
		if (!source) throw new Error(`Missing declaration file ${file}`);
		const moduleSymbol = checker.getSymbolAtLocation(source);
		if (!moduleSymbol) throw new Error(`No module symbol for ${file}`);
		const values: string[] = [];
		const types: string[] = [];
		for (const exported of checker.getExportsOfModule(moduleSymbol)) {
			if (exported.name === 'default' || exported.name.startsWith('__')) continue;
			const resolved = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
			if (resolved.flags & ts.SymbolFlags.Value) values.push(exported.name);
			else types.push(exported.name);
		}
		values.sort();
		types.sort();
		out.set(file, { values, types });
	}
	return out;
}

export function collectEntryExports(): EntryExports[] {
	const entries = publishedBehaviorEntries();
	const files = entries.map((entry) => declarationFor(entry.id));
	const exportsByFile = loadExports(files);
	return entries.map((entry) => {
		const found = exportsByFile.get(declarationFor(entry.id));
		if (!found) throw new Error(`No exports for ${entry.id}`);
		return { id: entry.id, ...found };
	});
}

function block(kind: 'value' | 'type', names: string[], from: string): string {
	if (!names.length) return '';
	const keyword = kind === 'type' ? 'export type' : 'export';
	const body = names.map((name) => `\t${name},`).join('\n');
	return `${keyword} {\n${body}\n} from '${from}';\n`;
}

export function renderGameLibEntry(entry: EntryExports): string {
	const from = `@zylem/behaviors/${entry.id}`;
	return `/**
 * \`@zylem/game-lib/behavior/${entry.id}\`
 *
 * Named re-exports of \`@zylem/behaviors/${entry.id}\`. Do not switch this file
 * to \`export *\`: game-lib marks that package external, and esbuild drops the
 * static names.
 */
${block('value', entry.values, from)}${entry.values.length && entry.types.length ? '\n' : ''}${block('type', entry.types, from)}`;
}

export function gameLibEntryPath(id: string): string {
	return path.join(gameLibApi, `${id}.ts`);
}

export function genreEntryDiffs(): string[] {
	const diffs: string[] = [];
	for (const entry of collectEntryExports()) {
		const file = gameLibEntryPath(entry.id);
		const expected = renderGameLibEntry(entry);
		const actual = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
		if (actual !== expected) diffs.push(entry.id);
	}
	return diffs;
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename);
if (isDirectRun) {
	const write = process.argv.includes('--write');
	const entries = collectEntryExports();
	if (write) {
		for (const entry of entries) {
			const file = gameLibEntryPath(entry.id);
			fs.mkdirSync(path.dirname(file), { recursive: true });
			fs.writeFileSync(file, renderGameLibEntry(entry));
		}
		console.log(`wrote ${entries.length} game-lib genre entries`);
	} else {
		const diffs = genreEntryDiffs();
		if (diffs.length) {
			console.error(`game-lib genre entries drifted: ${diffs.join(', ')}`);
			console.error('Regenerate with: node --experimental-strip-types scripts/sync-genre-entries.ts --write');
			process.exit(1);
		}
		console.log(`genre entry parity ok (${entries.length} entries)`);
	}
}
