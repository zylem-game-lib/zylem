import { defineConfig } from 'tsup';

const isProd = process.env.NODE_ENV === 'production';
const sourcemap = process.env.SOURCEMAP === '1' || !isProd;

export default defineConfig({
	entry: { cli: 'src/cli.ts' },
	format: ['esm'],
	platform: 'node',
	target: 'node22',
	sourcemap,
	minify: isProd,
	clean: true,
	outDir: 'dist',
	banner: {
		js: '#!/usr/bin/env node',
	},
	external: ['three', '@zylem/game-lib', '@dgreenheck/three-pinata'],
	outExtension() {
		return { js: '.js' };
	},
});
