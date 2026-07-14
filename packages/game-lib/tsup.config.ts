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
		'schema': 'src/api/schema.ts',
		// Docs-only synthetic entry for API Extractor (not a consumer import path).
		'public': 'src/api/public.ts',
	},
	format: ['esm'],
	// Generate TypeScript declaration files. `ignoreDeprecations` is required
	// because tsup injects `baseUrl: '.'` into the dts compiler options, which
	// classic TypeScript 6 rejects as deprecated (TS5101).
	dts: { compilerOptions: { ignoreDeprecations: '6.0' } },
	tsconfig: './tsconfig.build.json', // Use custom tsconfig for build
	splitting: true,
	sourcemap,
	clean: true,
	minify: true,
	outDir: 'dist',
	external: [
		'three',
		'@zylem/behaviors',
		'@zylem/behaviors/*',
		'howler',
		'solid-js',
		/^valtio/,
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
