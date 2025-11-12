import path from 'path';
import { fileURLToPath } from 'url';
import type { ConfigEnv, UserConfig } from 'vite';
import { PluginOption } from 'vite';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

const configDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(configDir, '..');

export async function createBaseConfig(_env: ConfigEnv): Promise<UserConfig> {
	const glsl = (await import('vite-plugin-glsl')).default;

	return {
		plugins: [glsl(), solidPlugin() as PluginOption],
		assetsInclude: ['**/*.fbx', '**/*.gltf', '**/*.glb'],
		resolve: {
			alias: [
				{ find: '~', replacement: path.resolve(projectRoot, './src') },
				{ find: '@lib/debug', replacement: path.resolve(projectRoot, './src/lib/debug') },
				{ find: '@lib/ui', replacement: path.resolve(projectRoot, './src/lib/ui') },
				{ find: '@lib', replacement: path.resolve(projectRoot, './src/lib') },
			],
		},
		server: {
			port: 3123,
		},
		preview: {
			port: 4173,
		},
		test: {
			globals: true,
			environment: 'happy-dom',
		},
	};
}

export default defineConfig(async (env) => {
	return await createBaseConfig(env);
});


