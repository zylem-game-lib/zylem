import path from 'path';
import { fileURLToPath } from 'url';

import type { ConfigEnv, UserConfig, AliasOptions } from 'vite';

import solidPlugin from 'vite-plugin-solid';
import glsl from 'vite-plugin-glsl';

const configDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(configDir, '..');

export async function createBaseConfig(_env: ConfigEnv): Promise<UserConfig> {
	const aliases: AliasOptions = {
		'@lib/debug': path.resolve(projectRoot, './src/lib/debug'),
		'@lib/game': path.resolve(projectRoot, './src/lib/game'),
		'@lib/ui': path.resolve(projectRoot, './src/lib/ui'),
		'@lib': path.resolve(projectRoot, './src/lib'),
		'@src': path.resolve(projectRoot, './src'),
		'@zylem/game-lib': path.resolve(projectRoot, './src/api/main.ts')
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



