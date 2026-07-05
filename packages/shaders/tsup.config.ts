import { defineConfig } from 'tsup';

const isProd = process.env.NODE_ENV === 'production';
const sourcemap = process.env.SOURCEMAP === '1' || !isProd;

export default defineConfig({
	entry: {
		index: 'src/index.ts',
		postprocessing: 'src/postprocessing/index.ts',
	},
	format: ['esm'],
	// `ignoreDeprecations` works around tsup injecting `baseUrl: '.'` into the
	// dts compiler options, which classic TypeScript 6 rejects (TS5101).
	dts: { compilerOptions: { ignoreDeprecations: '6.0' } },
	tsconfig: './tsconfig.build.json',
	splitting: true,
	sourcemap,
	clean: true,
	minify: isProd,
	outDir: 'dist',
	// Never bundle three: consumers must share a single three instance with
	// game-lib (TSL nodes are not interchangeable across copies of three).
	external: [/^three($|\/)/],
	outExtension() {
		return { js: '.js' };
	},
});
