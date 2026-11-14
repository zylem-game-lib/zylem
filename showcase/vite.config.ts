import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
// Relative path so Vite's config bundler inlines the plugin. A package
// import of `@zylem/ui/vite` is externalized, and Node refuses to strip
// TypeScript that lives under node_modules.
import { zylemVersionsPlugin } from './node_modules/@zylem/ui/vite/index.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const devPort = Number(process.env.PORT ?? '4242');

export default defineConfig({
	plugins: [zylemVersionsPlugin(__dirname), solidPlugin()] as any,
	build: {
		target: 'esnext',
	},
	resolve: {
		// One physical copy of `three` (and its `three/webgpu` / `three/tsl`
		// entries) so the node system is never duplicated, and one solid-js so
		// @zylem/ui (compiled from its shipped TSX source) shares the app's
		// Solid runtime.
		dedupe: ['three', 'solid-js'],
		alias: [
			// Solid-only: route valtio's React-coupled root entry to vanilla.
			{ find: /^valtio$/, replacement: 'valtio/vanilla' },
		],
	},
	assetsInclude: ['**/*.fbx', '**/*.gltf', '**/*.glb', '**/*.wasm'],
	optimizeDeps: {
		// @zylem/ui/components resolves to TypeScript source; keep it out of
		// esbuild prebundling (which would apply the React JSX transform) so
		// vite-plugin-solid compiles it instead.
		// @zylem/behaviors and @zylem/runtime are excluded so the runtime's
		// `new URL('./zylem_runtime.wasm', import.meta.url)` keeps resolving
		// next to the real module instead of vite's prebundle cache.
		// @zylem/game-lib is a workspace link, which Vite already serves as
		// source from `packages/game-lib/dist`.
		// three is excluded because its KTX2 and Draco loaders reference
		// `new URL('../libs/...wasm', import.meta.url)`. Prebundling moves the
		// loaders away from those files, and Vite 7.0.8 then fails the import.
		exclude: ['@zylem/ui', '@zylem/behaviors', '@zylem/runtime', 'three'],
	},
	server: {
		port: Number.isFinite(devPort) ? devPort : 4242,
		fs: {
			// This monorepo (game-lib's dist) plus the sibling checkouts that
			// `zw link dev` can point dependencies at.
			allow: [
				path.resolve(__dirname, '..'),
				path.resolve(__dirname, '../../simulation'),
				path.resolve(__dirname, '../../shaders'),
				path.resolve(__dirname, '../../ui'),
			],
		},
		// Same-origin proxy for the demo asset CDN, so dev builds load
		// `assets.zylem.cloud` without a CORS rule for this origin.
		// `demoAsset(...)` composes URLs against `/cdn` when
		// `import.meta.env.DEV` is true; production builds use the CDN origin.
		proxy: {
			'/cdn': {
				target: 'https://assets.zylem.cloud',
				changeOrigin: true,
				secure: true,
				rewrite: (urlPath) => urlPath.replace(/^\/cdn/, ''),
			},
		},
	},
	root: __dirname,
});
