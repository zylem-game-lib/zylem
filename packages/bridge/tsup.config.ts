import { defineConfig } from 'tsup';

const isProd = process.env.NODE_ENV === 'production';
const sourcemap = process.env.SOURCEMAP === '1' || !isProd;

export default defineConfig((options) => ({
	entry: {
		index: 'src/index.ts',
	},
	format: ['esm'],
	// `ignoreDeprecations` works around tsup injecting `baseUrl: '.'` into the
	// dts compiler options, which classic TypeScript 6 rejects (TS5101).
	dts: { compilerOptions: { ignoreDeprecations: '6.0' } },
	tsconfig: './tsconfig.build.json',
	splitting: false,
	sourcemap,
	// In watch mode tsup would empty `dist` on every rebuild, and a consumer's
	// Vite sees a delete-then-add instead of a change (`zw dev` watch loop).
	clean: !options.watch,
	minify: isProd,
	outDir: 'dist',
	outExtension() {
		return { js: '.js' };
	},
}));
