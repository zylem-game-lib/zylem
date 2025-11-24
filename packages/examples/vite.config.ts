import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';
import solidPlugin from 'vite-plugin-solid';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [glsl(), solidPlugin()] as any,
	build: {
		target: 'esnext',
	},
	resolve: {
		alias: {
			// Use the built package for game-lib
			// '@zylem/game-lib': path.resolve(__dirname, '../game-lib/dist/main.js'),
			// Or if you want to develop against the source:
			'@zylem/game-lib': path.resolve(__dirname, '../game-lib/src/api/main.ts'),

			// Alias for editor package (source files for debug, UI, etc.)
			// Note: More specific paths must come before general patterns
			'@zylem/editor': path.resolve(__dirname, '../editor/src'),
			'@lib/debug': path.resolve(__dirname, '../editor/src/debug'),
			'@lib/ui': path.resolve(__dirname, '../editor/src/ui'),

			// Alias for game-lib internals (general pattern - must come after specific @lib/* patterns)
			'@lib': path.resolve(__dirname, '../game-lib/src/lib'),
			'@interfaces': path.resolve(__dirname, '../game-lib/src/lib/interfaces'),
			'@state': path.resolve(__dirname, '../game-lib/src/state'),
			'~': path.resolve(__dirname, '../game-lib/src'),
			'@': path.resolve(__dirname, '../game-lib/src'),

			// Alias for examples source
			'@examples': path.resolve(__dirname, './src'),
		},
	},
	assetsInclude: ['**/*.fbx', '**/*.gltf', '**/*.glb'],
	server: {
		port: 1337,
		open: true,
	},
	// Resolve paths relative to the package root where index.html is
	root: __dirname,
});
