import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const devPort = Number(process.env.PORT ?? '1339');

export default defineConfig({
	plugins: [solidPlugin()] as any,
	build: {
		target: 'esnext',
	},
	resolve: {
		// Collapse every `three` / `three/webgpu` / `three/tsl` specifier onto a
		// single physical copy so the node system (and its shared `three.core`
		// realm) is never duplicated across the bundle.
		dedupe: ['three'],
	},
	server: {
		port: Number.isFinite(devPort) ? devPort : 1339,
		fs: {
			// Allow serving files from sibling packages (workspace deps)
			allow: [path.resolve(__dirname, '..')],
		},
	},
	root: __dirname,
});
