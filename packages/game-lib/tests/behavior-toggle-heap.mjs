/**
 * On-demand heap report for switching behaviors on and off.
 *
 *   pnpm --filter @zylem/game-lib bench:behavior-toggling
 *
 * The measurement itself is tests/heap/behavior-toggling.heap.ts. It needs the
 * stage internals and a DOM shim, so it runs under vitest; this launcher turns
 * the `heap` project on and the project runs its worker with --expose-gc.
 * Extra arguments are passed to vitest.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const packageRoot = fileURLToPath(new URL('..', import.meta.url));
const vitest = fileURLToPath(new URL('../node_modules/vitest/vitest.mjs', import.meta.url));

const result = spawnSync(
	process.execPath,
	[vitest, 'run', '--project', 'heap', ...process.argv.slice(2)],
	{
		cwd: packageRoot,
		stdio: 'inherit',
		env: { ...process.env, ZYLEM_HEAP_RUN: '1' },
	},
);
process.exit(result.status ?? 1);
