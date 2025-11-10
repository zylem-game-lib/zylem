import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

import typescript from '@rollup/plugin-typescript';
import { typescriptPaths } from 'rollup-plugin-typescript-paths';
import { visualizer } from 'rollup-plugin-visualizer';

import solidPlugin from 'vite-plugin-solid';
import { Extractor, ExtractorConfig } from '@microsoft/api-extractor';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// TODO: needs to be updated once TS 5.9+ is supported
function apiExtractorPlugin() {
  return {
    name: 'api-extractor',
    apply: 'build',
    closeBundle() {
      const apiExtractorJsonPath = path.resolve(
        __dirname,
        './config/api-extractor.json',
      );
      try {
        const extractorConfig =
          ExtractorConfig.loadFileAndPrepare(apiExtractorJsonPath);
        const result = Extractor.invoke(extractorConfig, {
          localBuild: true,
          showVerboseMessages: true,
        });
        if (result.succeeded) {
          console.log('API Extractor completed successfully');
        } else {
          console.warn(
            `API Extractor completed with ${result.errorCount} errors and ${result.warningCount} warnings`,
          );
        }
      } catch (err) {
        console.warn(
          `API Extractor was skipped due to configuration error: ${
            err && err.message ? err.message : String(err)
          }`,
        );
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(async ({ command, mode }) => {
  const glsl = (await import('vite-plugin-glsl')).default;
  const isLibraryBuild = command === 'build' && mode === 'production';

  const config = {
    plugins: [glsl(), solidPlugin(), apiExtractorPlugin()],
    assetsInclude: ['**/*.fbx', '**/*.gltf', '**/*.glb'],
    resolve: {
      alias: [
        {
          find: '~',
          replacement: path.resolve(__dirname, './src'),
        },
        {
          find: '@lib/debug',
          replacement: path.resolve(__dirname, './src/lib/debug'),
        },
        {
          find: '@lib/ui',
          replacement: path.resolve(__dirname, './src/lib/ui'),
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
    preview: {
      port: 4173,
    },
    test: {
      globals: true,
      environment: 'happy-dom',
    },
  };

  if (isLibraryBuild) {
    config.build = {
      manifest: true,
      minify: true,
      reportCompressedSize: true,
      lib: {
        entry: {
          main: path.resolve(__dirname, 'src/api/main.ts'),
          core: path.resolve(__dirname, 'src/api/core.ts'),
          camera: path.resolve(__dirname, 'src/api/camera.ts'),
          stage: path.resolve(__dirname, 'src/api/stage.ts'),
          entities: path.resolve(__dirname, 'src/api/entities.ts'),
          actions: path.resolve(__dirname, 'src/api/actions.ts'),
          behaviors: path.resolve(__dirname, 'src/api/behaviors.ts'),
        },
        fileName: (format, name) => name,
        formats: ['es'],
      },
      rollupOptions: {
        external: (id) => {
          const pkgs = [
            'three',
            '@dimforge/rapier3d-compat',
            '@dimforge/rapier3d',
            'howler',
            'solid-js',
            'dat.gui',
            'lil-gui',
            'valtio',
            'stats.js',
            'three-addons',
            'three-full',
            'three-instanced-uniforms-mesh',
            'three-spritetext',
            'nanoid',
            'bitecs',
            'lucide-solid',
          ];
          return pkgs.some((pkg) => id === pkg || id.startsWith(pkg + '/'));
        },
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
        output: {
          entryFileNames: '[name].js',
          chunkFileNames: 'chunks/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
          preserveModules: true,
          preserveModulesRoot: 'src',
        },
      },
    };
  }

  return config;
});
