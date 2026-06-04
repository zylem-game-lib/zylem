import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [solidPlugin()],
	resolve: {
		alias: [
			{ find: /^@behaviors\/(.*)$/, replacement: path.resolve(__dirname, '../src/lib/$1') },
			{ find: /^valtio$/, replacement: 'valtio/vanilla' },
		],
	},
	optimizeDeps: {
		exclude: ['valtio'],
		include: ['valtio/vanilla'],
	},
	server: {
		port: 5180,
		open: false,
		fs: {
			allow: [path.resolve(__dirname, '..')],
		},
	},
	build: {
		target: 'esnext',
	},
	root: __dirname,
});
