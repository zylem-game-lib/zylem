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
		alias: [
			// Solid-only: route valtio's React-coupled root entry to vanilla.
			{ find: /^valtio$/, replacement: 'valtio/vanilla' },
		],
	},
	assetsInclude: ['**/*.wasm'],
	optimizeDeps: {
		// @zylem/ui/components resolves to TypeScript source; keep it out of
		// esbuild prebundling (which would apply the React JSX transform) so
		// vite-plugin-solid compiles it instead.
		// @zylem/behaviors and @zylem/runtime are excluded so the runtime's
		// `new URL('./zylem_runtime.wasm', import.meta.url)` keeps resolving
		// next to the real module instead of vite's prebundle cache.
		exclude: ['@zylem/ui', '@zylem/behaviors', '@zylem/runtime'],
	},
	server: {
		port: Number.isFinite(devPort) ? devPort : 3332,
		fs: {
			// Allow serving files from sibling packages (workspace deps) and the
			// linked behaviors/runtime repos that ship the wasm module.
			allow: [
				path.resolve(__dirname, '../..'),
				path.resolve(__dirname, '../../../behaviors'),
				path.resolve(__dirname, '../../../runtime'),
			],
		},
	},
	root: __dirname,
});
