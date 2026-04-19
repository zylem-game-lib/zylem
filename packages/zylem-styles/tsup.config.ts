import { defineConfig } from 'tsup';

const isProd = process.env.NODE_ENV === 'production';
const sourcemap = process.env.SOURCEMAP === '1' || !isProd;

export default defineConfig({
  entry: ['src/index.ts', 'src/styles.css'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap,
  minify: isProd,
});
