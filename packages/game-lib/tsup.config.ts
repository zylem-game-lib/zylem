import { build } from 'esbuild';
import { defineConfig } from 'tsup';

const isProd = process.env.NODE_ENV === 'production';
/** Emit sourcemaps in production when SOURCEMAP=1 (default: off in production). */
const sourcemap = process.env.SOURCEMAP === '1' || !isProd;

export default defineConfig((options) => ({
	entry: {
		'core': 'src/api/core.ts',
		'navigation': 'src/api/navigation.ts',
		'entity': 'src/api/entity.ts',
		'behavior': 'src/api/behavior.ts',
		'behavior/genre-map': 'src/api/behavior/genre-map.ts',
		'behavior/mechanics': 'src/api/behavior/mechanics.ts',
		'behavior/action': 'src/api/behavior/action.ts',
		'behavior/action/platform': 'src/api/behavior/action/platform.ts',
		'behavior/action/shooter': 'src/api/behavior/action/shooter.ts',
		'behavior/action/shooter/first-person': 'src/api/behavior/action/shooter/first-person.ts',
		'behavior/action/shooter/shoot-em-up': 'src/api/behavior/action/shooter/shoot-em-up.ts',
		'behavior/action/fighting': 'src/api/behavior/action/fighting.ts',
		'behavior/action/stealth': 'src/api/behavior/action/stealth.ts',
		'behavior/action/survival': 'src/api/behavior/action/survival.ts',
		'behavior/action/rhythm': 'src/api/behavior/action/rhythm.ts',
		'behavior/action/pinball': 'src/api/behavior/action/pinball.ts',
		'behavior/action-adventure': 'src/api/behavior/action-adventure.ts',
		'behavior/puzzle': 'src/api/behavior/puzzle.ts',
		'behavior/puzzle/physics': 'src/api/behavior/puzzle/physics.ts',
		'behavior/puzzle/tile-matching': 'src/api/behavior/puzzle/tile-matching.ts',
		'behavior/role-playing': 'src/api/behavior/role-playing.ts',
		'behavior/role-playing/action-rpg': 'src/api/behavior/role-playing/action-rpg.ts',
		'behavior/role-playing/turn-based': 'src/api/behavior/role-playing/turn-based.ts',
		'behavior/role-playing/monster-taming': 'src/api/behavior/role-playing/monster-taming.ts',
		'behavior/role-playing/tactical-rpg': 'src/api/behavior/role-playing/tactical-rpg.ts',
		'behavior/simulation': 'src/api/behavior/simulation.ts',
		'behavior/simulation/life': 'src/api/behavior/simulation/life.ts',
		'behavior/simulation/vehicle': 'src/api/behavior/simulation/vehicle.ts',
		'behavior/simulation/vehicle/racing': 'src/api/behavior/simulation/vehicle/racing.ts',
		'behavior/strategy': 'src/api/behavior/strategy.ts',
		'behavior/strategy/real-time-tactics': 'src/api/behavior/strategy/real-time-tactics.ts',
		'behavior/strategy/tower-defense': 'src/api/behavior/strategy/tower-defense.ts',
		'behavior/strategy/turn-based-tactics': 'src/api/behavior/strategy/turn-based-tactics.ts',
		'behavior/sports': 'src/api/behavior/sports.ts',
		'behavior/sports/racing': 'src/api/behavior/sports/racing.ts',
		'behavior/sports/skate': 'src/api/behavior/sports/skate.ts',
		'behavior/sports/golf': 'src/api/behavior/sports/golf.ts',
		'behavior/sports/racket': 'src/api/behavior/sports/racket.ts',
		'audio': 'src/api/audio.ts',
		'cinematics': 'src/api/cinematics.ts',
		'globals': 'src/api/globals.ts',
		'actions': 'src/api/actions.ts',
		'input': 'src/api/input.ts',
		'input-ui': 'src/api/input-ui.ts',
		'placement': 'src/api/placement.ts',
		'graphics': 'src/api/graphics.ts',
		'events': 'src/api/events.ts',
		'debug': 'src/api/debug.ts',
		'catalog': 'src/api/catalog.ts',
		'bridge': 'src/api/bridge.ts',
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
	// In watch mode tsup would empty `dist` on every rebuild, and a consumer's
	// Vite sees a delete-then-add instead of a change (`zw dev` watch loop).
	clean: !options.watch,
	minify: true,
	outDir: 'dist',
	onSuccess: async () => {
		// A standalone browser worker: no bare module imports and no host setup required.
		await build({
			entryPoints: ['src/lib/navigation/navigation-worker.js'],
			outfile: 'dist/navigation-worker.js',
			bundle: true,
			format: 'esm',
			platform: 'browser',
			target: 'es2022',
			minify: isProd,
		});
	},
	external: [
		'three',
		'@zylem/behaviors',
		'@zylem/behaviors/*',
		/^@zylem\/behaviors\//,
		'@zylem/bridge',
		'howler',
		'tone',
		'solid-js',
		/^valtio/,
		'stats.js',
		'nanoid',
		'lucide-solid',
		'@kobalte/core',
		'@playcanvas/splat-transform',
	],
	outExtension({ format }) {
		return {
			js: '.js',
		};
	},
}));
