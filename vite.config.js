import Checker from 'vite-plugin-checker';
import path from 'path';

export default {
	plugins: [Checker({ typescript: true })],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	build: {
		lib: {
			entry: 'src/index.ts',
			name: 'Zylem',
		},
		rollupOptions: {
			external: /^lit/,
			output: {
				globals: {
					lit: 'Lit',
				},
			},
		},
	},
	server: {
		open: '/playground.html',
	},
};
