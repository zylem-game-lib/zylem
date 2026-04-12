import { defineConfig } from 'tsup';

export default defineConfig({
	entry: { cli: 'src/cli.ts' },
	format: ['esm'],
	platform: 'node',
	target: 'node22',
	sourcemap: true,
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
