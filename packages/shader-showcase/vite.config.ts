import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const devPort = Number(process.env.PORT ?? '3332');

export default defineConfig({
	plugins: [solidPlugin()] as any,
	build: {
		target: 'esnext',
	},
	resolve: {
		// Collapse every `three` / `three/webgpu` / `three/tsl` specifier onto a
		// single physical copy so the node system (and its shared `three.core`
		// realm) is never duplicated across the bundle. solid-js is deduped so
		// @zylem/ui (compiled from its shipped TSX source) shares the app's
		// Solid runtime instead of its own copy.
		dedupe: ['three', 'solid-js'],
	},
	optimizeDeps: {
		// @zylem/ui/components resolves to TypeScript source; keep it out of
		// esbuild prebundling (which would apply the React JSX transform) so
		// vite-plugin-solid compiles it instead.
		exclude: ['@zylem/ui'],
	},
	server: {
		port: Number.isFinite(devPort) ? devPort : 3332,
		fs: {
			// Allow serving files from sibling packages (workspace deps)
			allow: [path.resolve(__dirname, '..')],
		},
	},
	root: __dirname,
});
