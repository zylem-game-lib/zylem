import Checker from 'vite-plugin-checker';
import path from 'path';

export default {
	plugins: [Checker({ typescript: true })],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'@interfaces': path.resolve(__dirname, './src/interfaces'),
			'@state': path.resolve(__dirname, './src/state'),
		},
	},
	// assetsInclude: ['**/*.gltf', '**/*.wav'],
	build: {
		lib: {
			entry: 'src/index.ts',
			name: 'Zylem',
		},
	},
	server: {
		open: '../index.html',
	},
	preview: {
		port: 8080,
	},
};
