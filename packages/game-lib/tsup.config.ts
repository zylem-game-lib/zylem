import { defineConfig } from 'tsup';

export default defineConfig({
	entry: {
		// Main entry points
		main: 'src/api/main.ts',
		core: 'src/api/core.ts',
		camera: 'src/api/camera.ts',
		stage: 'src/api/stage.ts',
		entities: 'src/api/entities.ts',
		actions: 'src/api/actions.ts',

		// Individual behavior exports (tree-shakeable deep imports)
		'behavior/thruster': 'src/api/behavior/thruster.ts',
		'behavior/screen-wrap': 'src/api/behavior/screen-wrap.ts',
		'behavior/world-boundary-2d': 'src/api/behavior/world-boundary-2d.ts',
		'behavior/ricochet-2d': 'src/api/behavior/ricochet-2d.ts',
		'behavior/platformer-3d': 'src/api/behavior/platformer-3d.ts',
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
