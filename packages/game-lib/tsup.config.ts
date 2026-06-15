import { defineConfig } from 'tsup';

const isProd = process.env.NODE_ENV === 'production';
/** Emit sourcemaps in production when SOURCEMAP=1 (default: off in production). */
const sourcemap = process.env.SOURCEMAP === '1' || !isProd;

export default defineConfig({
	entry: {
		'core': 'src/api/core.ts',
		'entity': 'src/api/entity.ts',
		'behavior': 'src/api/behavior.ts',
		'audio': 'src/api/audio.ts',
		'globals': 'src/api/globals.ts',
		'actions': 'src/api/actions.ts',
		'input': 'src/api/input.ts',
		'input-ui': 'src/api/input-ui.ts',
		'graphics': 'src/api/graphics.ts',
		'events': 'src/api/events.ts',
		'debug': 'src/api/debug.ts',
		'web-components': 'src/api/web-components.ts',
		'runtime': 'src/api/runtime.ts',
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
		'@zylem/behaviors',
		'@zylem/behaviors/*',
		'howler',
		'solid-js',
		'valtio',
		'stats.js',
		'nanoid',
		'lucide-solid',
		'@kobalte/core',
	],
	outExtension({ format }) {
		return {
			js: '.js',
		};
	},
});
