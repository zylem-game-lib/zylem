import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';
import solidPlugin from 'vite-plugin-solid';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [glsl(), solidPlugin()],
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
			'@zylem/editor': path.resolve(__dirname, '../editor/src'),
			'@lib/debug': path.resolve(__dirname, '../editor/src/debug'),
			'@lib/ui': path.resolve(__dirname, '../editor/src/ui'),
			
			// Alias for examples source
			'@examples': path.resolve(__dirname, './src'),
		},
	},
	assetsInclude: ['**/*.fbx', '**/*.gltf', '**/*.glb'],
	server: {
		port: 3000,
		open: true,
	},
	// Resolve paths relative to the package root where index.html is
	root: __dirname,
});
