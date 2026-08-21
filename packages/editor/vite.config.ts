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
// (the dev harness, which boots a real game) and `vite preview` only.
export default defineConfig({
	plugins: [solid()],
	build: {
		target: 'esnext',
	},
	// The physics runtime resolves its binary with
	// `new URL('./zylem_runtime.wasm', import.meta.url)`.
	assetsInclude: ['**/*.wasm'],
	resolve: {
		// Collapse solid-js onto one copy so `@zylem/ui/components` (shipped as
		// TSX source) shares the app Solid runtime instead of a duplicate. three
		// and the bridge are deduped for the same reason: two three.js copies
		// break `instanceof` checks, and two bridge copies would leave the editor
		// and the game talking on separate channels.
		dedupe: ['solid-js', 'three', '@zylem/bridge', '@zylem/game-lib'],
	},
	optimizeDeps: {
		exclude: [
			// Keep `@zylem/ui` out of esbuild prebundling so vite-plugin-solid
			// compiles its TSX components instead of the React JSX transform.
			'@zylem/ui',
			// Prebundling rewrites the runtime into a flat chunk, which moves the
			// module away from its `.wasm` sibling and breaks the URL above.
			'@zylem/behaviors',
			'@zylem/runtime',
		],
	},
	server: {
		port: devPort,
		fs: {
			// The monorepo root plus sibling polyrepo dirs when zw-linked. A
			// published `@zylem/runtime` serves its wasm from
			// `zylem/node_modules/.pnpm/@zylem+runtime@*/dist`, but a linked one
			// resolves through the symlink to `runtime/dist`, which is outside
			// this repo and would otherwise be refused with a 403.
			allow: [
				path.resolve(__dirname, '../..'),
				path.resolve(__dirname, '../../../zylem-ui'),
				path.resolve(__dirname, '../../../behaviors'),
				path.resolve(__dirname, '../../../runtime'),
			],
		},
	},
});
