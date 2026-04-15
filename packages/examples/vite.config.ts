import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';
import solidPlugin from 'vite-plugin-solid';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultAllowedHosts = ['zylem.onrender.com', 'zylem-staging.onrender.com'];
const additionalAllowedHosts = (process.env.__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS ?? '')
	.split(',')
	.map(host => host.trim())
	.filter(Boolean);
const allowedHosts = [...new Set([...defaultAllowedHosts, ...additionalAllowedHosts])];
const devPort = Number(process.env.PORT ?? '1337');
const shouldOpenBrowser = !(
	process.env.CI === 'true' ||
	process.env.RENDER === 'true' ||
	process.env.PORT
);

export default defineConfig({
	plugins: [glsl(), solidPlugin()] as any,
	build: {
		target: 'esnext',
	},
	resolve: {
		alias: [
			// Examples source
			{ find: '@examples', replacement: path.resolve(__dirname, './src') },

			// Editor package aliases REMOVED - using built package

			// Styles aliases - Strict ordering required
			// 1. Force styles.css to resolve to the bundled dist file
			{ find: '@zylem/styles/styles.css', replacement: path.resolve(__dirname, '../zylem-styles/dist/styles.css') },
			// 2. Fallback for other imports (e.g. source files)
			{ find: '@zylem/styles', replacement: path.resolve(__dirname, '../zylem-styles/src') },
		],
	},
	assetsInclude: ['**/*.fbx', '**/*.gltf', '**/*.glb', '**/*.wasm'],
	server: {
		port: Number.isFinite(devPort) ? devPort : 1337,
		open: shouldOpenBrowser,
		allowedHosts,
		fs: {
			// Allow serving files from sibling packages (e.g. game-lib source for workers)
			allow: [path.resolve(__dirname, '..')],
		},
	},
	preview: {
		allowedHosts,
	},
	// Resolve paths relative to the package root where index.html is
	root: __dirname,
});
