import { defineConfig } from 'tsup';

export default defineConfig({
	entry: {
		behaviors: 'src/api/behaviors.ts',
		main: 'src/api/main.ts',
		core: 'src/api/core.ts',
		camera: 'src/api/camera.ts',
		stage: 'src/api/stage.ts',
		entities: 'src/api/entities.ts',
		actions: 'src/api/actions.ts',
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
});
