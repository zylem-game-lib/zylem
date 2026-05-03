/**
 * Vite resolves this module worker entry for {@link Destructible3DBehavior} prebake.
 * Published builds can use `new URL('@zylem/game-lib/dist/destructible-prebake-worker.js', import.meta.url)` instead.
 */
export const destructiblePrebakeWorkerUrl = new URL(
	'../../../../game-lib/src/lib/behaviors/destructible-3d/destructible-prebake-worker.ts',
	import.meta.url,
);
