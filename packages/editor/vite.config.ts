import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import path from 'path';

// `@zylem/ui/styles.css` is resolved via the package's `exports` map
// (`"./styles.css": "./dist/styles.css"`), so no explicit alias is needed
// here — Vite, Rollup, and esbuild all honor the subpath export.
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
			external: ['solid-js', 'solid-js/web', '@zylem/ui'],
		},
	},
});
