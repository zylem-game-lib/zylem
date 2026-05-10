import { defineConfig } from 'tsup';

const isProd = process.env.NODE_ENV === 'production';
/** Emit sourcemaps in production when SOURCEMAP=1 (default: off in production). */
const sourcemap = process.env.SOURCEMAP === '1' || !isProd;

export default defineConfig({
	entry: {
		// Public subpaths
		core: 'src/api/core.ts',
		entity: 'src/api/entity.ts',
		behavior: 'src/api/behavior.ts',
		audio: 'src/api/audio.ts',
		globals: 'src/api/globals.ts',
		actions: 'src/api/actions.ts',
		input: 'src/api/input.ts',
		'input-ui': 'src/api/input-ui.ts',
		graphics: 'src/api/graphics.ts',
		events: 'src/api/events.ts',
		debug: 'src/api/debug.ts',
		'web-components': 'src/api/web-components.ts',
		runtime: 'src/api/runtime.ts',

		// Build-time helpers consumed by Node tooling (e.g. the
		// destructible-prebake CLI). Kept on its legacy nested subpath.
		'behavior/destructible-3d-prebake-build':
			'src/lib/behaviors/destructible-3d/destructible-prebake-build.ts',

		// Internal: physics module entry (consumed via deep imports today)
		physics: 'src/lib/physics/index.ts',

		// Workers (standalone files for Web Worker instantiation; not exposed
		// publicly via the package `exports` map).
		'physics-worker': 'src/lib/physics/physics-worker.ts',
		'destructible-prebake-worker':
			'src/lib/behaviors/destructible-3d/destructible-prebake-worker.ts',
	},
	format: ['esm'],
	dts: true, // Generate TypeScript declaration files
	tsconfig: './tsconfig.build.json', // Use custom tsconfig for build
	splitting: true,
	sourcemap,
	clean: true,
	minify: true,
	outDir: 'dist',
	external: [
		'three',
		'@dimforge/rapier3d-compat',
		'@dimforge/rapier3d',
		'howler',
		'solid-js',
		'valtio',
		'stats.js',
		'nanoid',
		'bitecs',
		'three.quarks',
		'lucide-solid',
		'@kobalte/core',
	],
	outExtension({ format }) {
		return {
			js: '.js',
		};
	},
});
