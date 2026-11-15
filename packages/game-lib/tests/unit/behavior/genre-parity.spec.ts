import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { expect, it } from 'vitest';

const packageRoot = path.resolve(import.meta.dirname, '../../..');

it('genre entries match the published behavior declarations', () => {
	expect(() =>
		execFileSync(
			process.execPath,
			['--experimental-strip-types', 'scripts/sync-genre-entries.ts'],
			{ cwd: packageRoot, stdio: 'pipe' },
		),
	).not.toThrow();
}, 30000);
