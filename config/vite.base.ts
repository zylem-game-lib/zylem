import path from 'path';
import { fileURLToPath } from 'url';

import type { ConfigEnv, UserConfig, AliasOptions } from 'vite';

import solidPlugin from 'vite-plugin-solid';
import glsl from 'vite-plugin-glsl';

const configDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(configDir, '..');

export async function createBaseConfig(_env: ConfigEnv): Promise<UserConfig> {
	const gameLibRoot = path.resolve(projectRoot, 'packages/game-lib');
	const aliases: AliasOptions = {
		'@lib/debug': path.resolve(gameLibRoot, './src/lib/debug'),
		'@lib/game': path.resolve(gameLibRoot, './src/lib/game'),
		'@lib/ui': path.resolve(gameLibRoot, './src/lib/ui'),
		'@lib': path.resolve(gameLibRoot, './src/lib'),
		'@src': path.resolve(gameLibRoot, './src'),
		'@zylem/game-lib': path.resolve(gameLibRoot, './src/api/main.ts')
	};

	return {
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



