import { defineConfig } from 'tsup';

const isProd = process.env.NODE_ENV === 'production';
const sourcemap = process.env.SOURCEMAP === '1' || !isProd;

export default defineConfig({
	entry: {
		index: 'src/index.ts',
	},
	format: ['esm'],
	dts: true,
	splitting: true,
	sourcemap,
	clean: true,
	outDir: 'dist',
	external: [
		'@dimforge/rapier3d-compat',
		'three',
		'typescript-fsm',
		'valtio',
	],
	outExtension() {
		return { js: '.js' };
	},
});
