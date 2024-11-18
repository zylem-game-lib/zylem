import path from 'path';
import { defineConfig } from 'vite';

import typescript from '@rollup/plugin-typescript';
import { typescriptPaths } from 'rollup-plugin-typescript-paths';
import { visualizer } from 'rollup-plugin-visualizer';

import viteProgressBar from 'vite-plugin-progress';
import colors from 'picocolors';

// https://vitejs.dev/config/
export default defineConfig(async () => {
  const glsl = (await import('vite-plugin-glsl')).default;

  return {
    plugins: [
      // https://github.com/jeddygong/vite-plugin-progress
      viteProgressBar({
        format: `Building ${colors.green('[:bar]')} :percent :eta`,
        total: 100,
        width: 60,
      }),
      glsl(),
    ],
    resolve: {
      alias: [
        {
          find: '~',
          replacement: path.resolve(__dirname, './src'),
        },
        {
          find: '@lib',
          replacement: path.resolve(__dirname, './src/lib'),
        },
      ],
    },
    server: {
      port: 3123,
    },
    // https://vitejs.dev/guide/build.html#library-mode
    build: {
      manifest: true,
      minify: true,
      reportCompressedSize: true,
      lib: {
        entry: path.resolve(__dirname, 'src/main.ts'),
        fileName: 'main',
        formats: ['es', 'cjs'],
      },
      rollupOptions: {
        external: [],
        plugins: [
          typescriptPaths({
            preserveExtensions: true,
          }),
          typescript({
            sourceMap: false,
            declaration: true,
            outDir: 'dist',
            exclude: ['**/__tests__'],
          }),
          visualizer({
            title: 'visualizer - zylem',
            template: 'network',
          }),
        ],
      },
    },
    test: {
      globals: true,
      environment: 'happy-dom',
    },
  };
});
