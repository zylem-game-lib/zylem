import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import path from 'path';

export default defineConfig({
	plugins: [solid()],
	build: { target: 'esnext' },
	resolve: {
		alias: {
			'@zylem/game-lib': path.resolve(__dirname, '../game-lib/src/api/main.ts'),
		},
	},
});
