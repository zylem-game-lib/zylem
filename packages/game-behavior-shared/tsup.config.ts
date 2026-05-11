import { defineConfig } from 'tsup';

const isProd = process.env.NODE_ENV === 'production';
const sourcemap = process.env.SOURCEMAP === '1' || !isProd;

export default defineConfig({
	entry: { index: 'src/index.ts' },
	format: ['esm'],
	dts: true,
	sourcemap,
	clean: true,
	outDir: 'dist',
	external: ['three', '@dgreenheck/three-pinata'],
	outExtension() {
		return { js: '.js' };
	},
});
