import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, type ConfigEnv, type UserConfig } from 'vite';
import typescript from '@rollup/plugin-typescript';
import { typescriptPaths } from 'rollup-plugin-typescript-paths';
import { visualizer } from 'rollup-plugin-visualizer';
import { createBaseConfig } from './vite.base';

const configDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(configDir, '..');

export default defineConfig(async (env: ConfigEnv): Promise<UserConfig> => {
	const base = await createBaseConfig(env);

	const externals = [
		'three',
		'@dimforge/rapier3d-compat',
		'@dimforge/rapier3d',
		'howler',
		'solid-js',
		'dat.gui',
		'lil-gui',
		'valtio',
		'stats.js',
		'three-addons',
		'three-full',
		'three-instanced-uniforms-mesh',
		'three-spritetext',
		'nanoid',
		'bitecs',
		'lucide-solid',
	];

	const config: UserConfig = {
		...base,
		build: {
			manifest: true,
			minify: true,
			reportCompressedSize: true,
			lib: {
				entry: {
					main: path.resolve(projectRoot, 'src/api/main.ts'),
					core: path.resolve(projectRoot, 'src/api/core.ts'),
					camera: path.resolve(projectRoot, 'src/api/camera.ts'),
					stage: path.resolve(projectRoot, 'src/api/stage.ts'),
					entities: path.resolve(projectRoot, 'src/api/entities.ts'),
					actions: path.resolve(projectRoot, 'src/api/actions.ts'),
					behaviors: path.resolve(projectRoot, 'src/api/behaviors.ts'),
				},
				fileName: (_format, name) => name,
				formats: ['es'],
			},
			rollupOptions: {
				external: (id) => externals.some((pkg) => id === pkg || id.startsWith(pkg + '/')),
				plugins: [
					typescriptPaths({
						preserveExtensions: true,
					}),
					typescript({
						sourceMap: false,
						declaration: true,
						outDir: 'dist',
						exclude: ['**/__tests__'],
					}),
					visualizer({
						title: 'visualizer - zylem',
						template: 'network',
					}),
				],
				output: {
					entryFileNames: '[name].js',
					chunkFileNames: 'chunks/[name]-[hash].js',
					assetFileNames: 'assets/[name]-[hash].[ext]',
					preserveModules: true,
					preserveModulesRoot: 'src',
				},
			},
		},
	};

	return config;
});


