import { defineConfig } from 'tsup';
import fs from 'fs';

export default defineConfig({
	entry: {
		main: 'src/api/main.ts',
		core: 'src/api/core.ts',
		camera: 'src/api/camera.ts',
		stage: 'src/api/stage.ts',
		entities: 'src/api/entities.ts',
		actions: 'src/api/actions.ts',
		behaviors: 'src/api/behaviors.ts',
	},
	format: ['esm'],
	dts: true, // Generate TypeScript declaration files
	tsconfig: './tsconfig.build.json', // Use custom tsconfig for build
	splitting: false,
	sourcemap: true,
	clean: true,
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
		'lucide-solid',
		'@kobalte/core',
	],
	outExtension({ format }) {
		return {
			js: '.js',
		};
	},
	esbuildPlugins: [
		{
			name: 'glsl-loader',
			setup(build) {
				build.onLoad({ filter: /\.glsl$/}, async (args) => {
					const text = await fs.promises.readFile(args.path, 'utf8');
					return {
						contents: `export default ${JSON.stringify(text)}`,
						loader: 'js',
					};
				});
			},
		},
	],
});
