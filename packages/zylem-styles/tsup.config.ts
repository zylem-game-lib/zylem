import { defineConfig } from 'tsup';
import { vanillaExtractPlugin } from '@vanilla-extract/esbuild-plugin';

const isProd = process.env.NODE_ENV === 'production';
const sourcemap = process.env.SOURCEMAP === '1' || !isProd;

export default defineConfig({
  // `index` exposes the typed `vars`/`sprinkles` API; `styles` is the
  // side-effect barrel whose CSS chunks (from every `*.css.ts` it pulls
  // in) get concatenated by esbuild into `dist/styles.css`.
  entry: { index: 'src/index.ts', styles: 'src/styles.ts' },
  format: ['esm'],
  // `ignoreDeprecations` works around tsup injecting `baseUrl: '.'` into the
  // dts compiler options, which classic TypeScript 6 rejects (TS5101).
  dts: { compilerOptions: { ignoreDeprecations: '6.0' } },
  clean: true,
  sourcemap,
  minify: isProd,
  esbuildPlugins: [vanillaExtractPlugin()],
  loader: { '.css': 'css' },
});
