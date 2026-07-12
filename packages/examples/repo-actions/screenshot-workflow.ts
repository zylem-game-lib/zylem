import { existsSync, mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const PACKAGE_ROOT = path.resolve(__dirname, '..');
export const DEMOS_DIR = path.join(PACKAGE_ROOT, 'src', 'demos');
export const OUTPUT_DIR = path.join(PACKAGE_ROOT, 'screenshots');
export const OLD_SCREENS_DIR = path.join(OUTPUT_DIR, 'old-screens');

/**
 * Collect demo IDs whose folder and TypeScript entrypoint share the same name.
 */
export function collectDemoIds(demosDir: string = DEMOS_DIR): string[] {
	return readdirSync(demosDir, { withFileTypes: true })
		.filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
		.filter((entry) => existsSync(path.join(demosDir, entry.name, `${entry.name}.ts`)))
		.map((entry) => entry.name)
		.sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
}

/**
 * Move direct screenshot PNGs without a matching demo into the archive.
 */
export function archiveOrphanScreenshots(
	demoIds: readonly string[],
	outputDir: string = OUTPUT_DIR,
	archiveDir: string = OLD_SCREENS_DIR
): string[] {
	if (!existsSync(outputDir)) {
		return [];
	}

	const knownDemoIds = new Set(demoIds);
	const orphanFiles = readdirSync(outputDir, { withFileTypes: true })
		.filter((entry) => entry.isFile() && path.extname(entry.name) === '.png')
		.filter((entry) => !knownDemoIds.has(path.basename(entry.name, path.extname(entry.name))))
		.map((entry) => entry.name)
		.sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));

	if (orphanFiles.length === 0) {
		return [];
	}

	mkdirSync(archiveDir, { recursive: true });
	for (const fileName of orphanFiles) {
		const destination = path.join(archiveDir, fileName);
		rmSync(destination, { force: true });
		renameSync(path.join(outputDir, fileName), destination);
	}

	return orphanFiles;
}
