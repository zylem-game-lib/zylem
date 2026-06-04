import { defineConfig } from 'tsup';

const isProd = process.env.NODE_ENV === 'production';
const sourcemap = process.env.SOURCEMAP === '1' || !isProd;

export default defineConfig({
	entry: {
		index: 'src/index.ts',
		'destructible-prebake': 'src/destructible-prebake.ts',
		cooldown: 'src/lib/behaviors/cooldown/index.ts',
		'destructible-3d': 'src/lib/behaviors/destructible-3d/index.ts',
		'first-person': 'src/lib/behaviors/first-person/index.ts',
		'jumper-2d': 'src/lib/behaviors/jumper-2d/index.ts',
		'jumper-3d': 'src/lib/behaviors/jumper-3d/index.ts',
		'particle-emitter': 'src/lib/behaviors/particle-emitter/index.ts',
		'particle-emitter/presets': 'src/lib/behaviors/particle-emitter/presets/index.ts',
		'platformer-3d': 'src/lib/behaviors/platformer-3d/index.ts',
		'ricochet-2d': 'src/lib/behaviors/ricochet-2d/index.ts',
		'ricochet-3d': 'src/lib/behaviors/ricochet-3d/index.ts',
		'runtime-2d': 'src/lib/behaviors/runtime-2d/runtime-2d.descriptors.ts',
		'runtime-pong': 'src/lib/behaviors/runtime-pong/runtime-pong.descriptors.ts',
		'screen-visibility': 'src/lib/behaviors/screen-visibility/index.ts',
		'screen-wrap': 'src/lib/behaviors/screen-wrap/index.ts',
		'shooter-2d': 'src/lib/behaviors/shooter-2d/index.ts',
		thruster: 'src/lib/behaviors/thruster/index.ts',
		'top-down-movement': 'src/lib/behaviors/top-down-movement/index.ts',
		'world-boundary-2d': 'src/lib/behaviors/world-boundary-2d/index.ts',
		'world-boundary-3d': 'src/lib/behaviors/world-boundary-3d/index.ts',
		'coordinators/boundary-ricochet': 'src/lib/coordinators/boundary-ricochet.coordinator.ts',
		'coordinators/boundary-ricochet-3d': 'src/lib/coordinators/boundary-ricochet-3d.coordinator.ts',
		'coordinators/first-person-shooter': 'src/lib/coordinators/first-person-shooter.coordinator.ts',
		'coordinators/multidirectional-space-shooter': 'src/lib/coordinators/multidirectional-space-shooter.coordinator.ts',
		'coordinators/top-down-shooter': 'src/lib/coordinators/top-down-shooter.coordinator.ts',
	},
	format: ['esm'],
	dts: true,
	splitting: true,
	sourcemap,
	clean: true,
	outDir: 'dist',
	external: [
		'@dimforge/rapier3d-compat',
		'@dgreenheck/three-pinata',
		'@zylem/behavior-core',
		'comlink',
		'three',
		'three.quarks',
		'typescript-fsm',
		'valtio',
	],
	outExtension() {
		return { js: '.js' };
	},
});

