import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const devPort = 3332;

// `@zylem/ui/styles.css` is resolved via the package's `exports` map
// (`"./styles.css": "./dist/styles.css"`), so no explicit alias is needed
// here — Vite, Rollup, and esbuild all honor the subpath export.
//
// Publish builds use `tsup` (`pnpm build`); this config is for `vite` serve
// (standalone stub harness) and `vite preview` only.
export default defineConfig({
	plugins: [solid()],
	build: {
		target: 'esnext',
	},
	resolve: {
		// Collapse solid-js onto one copy so `@zylem/ui/components` (shipped as
		// TSX source) shares the app Solid runtime instead of a duplicate.
		dedupe: ['solid-js'],
	},
	optimizeDeps: {
		// Keep `@zylem/ui` out of esbuild prebundling so vite-plugin-solid
		// compiles its TSX components instead of the React JSX transform.
		exclude: ['@zylem/ui'],
	},
	server: {
		port: devPort,
		fs: {
			allow: [path.resolve(__dirname, '..')],
		},
	},
});
