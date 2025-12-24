import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import path from 'path';

export default defineConfig({
	plugins: [solid()],
	build: {
		target: 'esnext',
		lib: {
			entry: path.resolve(__dirname, 'src/index.ts'),
			name: 'ZylemEditor',
			fileName: 'zylem-editor',
			formats: ['es'],
		},
		rollupOptions: {
			// Externalize deps that shouldn't be bundled locally
			external: ['solid-js', 'solid-js/web', '@zylem/styles'],
		},
	},
	resolve: {
		alias: {
			// Resolve styles to the built dist folder for proper CSS bundling
			'@zylem/styles/styles.css': path.resolve(__dirname, '../zylem-styles/dist/styles.css'),
		},
	},
});
