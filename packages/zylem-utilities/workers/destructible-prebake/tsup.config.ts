import { defineConfig } from 'tsup';

const isProd = process.env.NODE_ENV === 'production';
const sourcemap = process.env.SOURCEMAP === '1' || !isProd;

/**
 * Browser Web Worker bundle for the Destructible3D prebake job.
 * Consumers reference the emitted `dist/worker.js` via
 * `new URL('@zylem/utilities/workers/destructible-prebake/worker.js', import.meta.url)`.
 *
 * `three` is left external because downstream apps already provide it via
 * their own bundler graph; everything else (comlink, three-pinata, the shared
 * helpers) is bundled in so the file works as a self-contained worker module.
 */
export default defineConfig({
	entry: { worker: 'src/worker.ts' },
	format: ['esm'],
	platform: 'browser',
	target: 'es2022',
	sourcemap,
	clean: true,
	minify: isProd,
	outDir: 'dist',
	external: ['three'],
	outExtension() {
		return { js: '.js' };
	},
});
