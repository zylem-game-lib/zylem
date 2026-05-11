import path from 'path';
import { fileURLToPath } from 'url';

import type { ConfigEnv, UserConfig, AliasOptions } from 'vite';

import solidPlugin from 'vite-plugin-solid';
import glsl from 'vite-plugin-glsl';

const configDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(configDir, '..');

export async function createBaseConfig(_env: ConfigEnv): Promise<UserConfig> {
	const gameLibRoot = path.resolve(projectRoot, 'packages/game-lib');
	const behaviorSharedRoot = path.resolve(projectRoot, 'packages/game-behavior-shared');
	const utilitiesRoot = path.resolve(projectRoot, 'packages/zylem-utilities');
	const aliases: AliasOptions = {
		'@lib/debug': path.resolve(gameLibRoot, './src/lib/debug'),
		'@lib/game': path.resolve(gameLibRoot, './src/lib/game'),
		'@lib/ui': path.resolve(gameLibRoot, './src/lib/ui'),
		'@lib': path.resolve(gameLibRoot, './src/lib'),
		'@src': path.resolve(gameLibRoot, './src'),
		'@zylem/game-behavior-shared': path.resolve(behaviorSharedRoot, './src/index.ts'),
		'@zylem/utilities/workers/destructible-prebake': path.resolve(
			utilitiesRoot,
			'./workers/destructible-prebake/src/worker.ts',
		),
		'@zylem/game-lib/core': path.resolve(gameLibRoot, './src/api/core.ts'),
		'@zylem/game-lib/entity': path.resolve(gameLibRoot, './src/api/entity.ts'),
		'@zylem/game-lib/behavior': path.resolve(gameLibRoot, './src/api/behavior.ts'),
		'@zylem/game-lib/audio': path.resolve(gameLibRoot, './src/api/audio.ts'),
		'@zylem/game-lib/globals': path.resolve(gameLibRoot, './src/api/globals.ts'),
		'@zylem/game-lib/actions': path.resolve(gameLibRoot, './src/api/actions.ts'),
		'@zylem/game-lib/input': path.resolve(gameLibRoot, './src/api/input.ts'),
		'@zylem/game-lib/input-ui': path.resolve(gameLibRoot, './src/api/input-ui.ts'),
		'@zylem/game-lib/graphics': path.resolve(gameLibRoot, './src/api/graphics.ts'),
		'@zylem/game-lib/events': path.resolve(gameLibRoot, './src/api/events.ts'),
		'@zylem/game-lib/debug': path.resolve(gameLibRoot, './src/api/debug.ts'),
		'@zylem/game-lib/web-components': path.resolve(gameLibRoot, './src/api/web-components.ts'),
		'@zylem/game-lib/runtime': path.resolve(gameLibRoot, './src/api/runtime.ts'),
	};

	return {
		// build: {
			// minify: 'terser',
			// terserOptions: {
			// 	maxWorkers: 6
			// },
		// },
		resolve: {
			alias: aliases,
		},
		plugins: [
			glsl(),
			solidPlugin()
		],
		assetsInclude: ['**/*.fbx', '**/*.gltf', '**/*.glb'],
		server: {
			port: 1337,
		},
		preview: {
			port: 4173,
		}
	};
}



