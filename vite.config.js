import path from 'path';
import { defineConfig } from 'vite';

import typescript from '@rollup/plugin-typescript';
import { typescriptPaths } from 'rollup-plugin-typescript-paths';
import { visualizer } from 'rollup-plugin-visualizer';

import solidPlugin from 'vite-plugin-solid';

import viteProgressBar from 'vite-plugin-progress';
import colors from 'picocolors';

// https://vitejs.dev/config/
export default defineConfig(async ({ command, mode }) => {
  const glsl = (await import('vite-plugin-glsl')).default;

  // Determine if we're building the library or running dev/preview
  const isLibraryBuild = command === 'build' && mode === 'production';

  const config = {
    plugins: [
      // https://github.com/jeddygong/vite-plugin-progress
      viteProgressBar({
        format: `Building ${colors.green('[:bar]')} :percent :eta`,
        total: 100,
        width: 60,
      }),
      glsl(),
      solidPlugin(),
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
    preview: {
      port: 4173,
    },
    test: {
      globals: true,
      environment: 'happy-dom',
    },
  };

  // Only add library build configuration when building for production
  if (isLibraryBuild) {
    config.build = {
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
    };
  } else {
    // For dev/preview, use standard web app build
    config.build = {
      outDir: 'dist-preview',
      minify: true,
      reportCompressedSize: true,
      target: 'esnext', // Support top-level await
      rollupOptions: {
        output: {
          manualChunks: {
            // External vendor libraries (no dependencies on each other)
            'vendor-three': ['three'],
            'vendor-rapier': ['@dimforge/rapier3d-compat'],
            'vendor-howler': ['howler'],

            // Core foundation (no internal dependencies)
            'zylem-foundation': [
              './src/lib/core/base-node.ts',
              './src/lib/core/base-node-life-cycle.ts',
              './src/lib/core/utility.ts',
              './src/lib/core/vector.ts',
              './src/lib/core/errors.ts',
              './src/lib/core/composable.ts',
              './src/lib/interfaces/entity.ts',
              './src/lib/interfaces/game.ts',
            ],

            // State management (depends only on foundation)
            'zylem-state': [
              './src/lib/state/index.ts',
              './src/lib/state/game-state.ts',
              './src/lib/state/stage-state.ts',
              './src/lib/state/debug-state.ts',
              './src/lib/state/console-state.ts',
            ],

            // Input system (minimal dependencies)
            'zylem-input': [
              './src/lib/input/input.ts',
              './src/lib/input/input-manager.ts',
              './src/lib/input/input-provider.ts',
              './src/lib/input/keyboard-provider.ts',
              './src/lib/input/gamepad-provider.ts',
            ],

            // Graphics and materials (depends on foundation)
            'zylem-graphics': [
              './src/lib/graphics/material.ts',
              './src/lib/graphics/mesh.ts',
              './src/lib/graphics/geometries/XZPlaneGeometry.ts',
              './src/lib/core/preset-shader.ts',
            ],

            // Physics/Collision (depends on foundation)
            'zylem-physics': [
              './src/lib/collision/physics.ts',
              './src/lib/collision/collision.ts',
              './src/lib/collision/collision-builder.ts',
              './src/lib/collision/collision-delegate.ts',
            ],

            // Camera system (depends on graphics)
            'zylem-camera': [
              './src/lib/camera/camera.ts',
              './src/lib/camera/zylem-camera.ts',
              './src/lib/camera/perspective.ts',
              './src/lib/camera/third-person.ts',
              './src/lib/camera/fixed-2d.ts',
              './src/lib/graphics/render-pass.ts',
            ],

            // Entities (depends on foundation, graphics, physics)
            'zylem-entities': [
              './src/lib/entities/entity.ts',
              './src/lib/entities/box.ts',
              './src/lib/entities/sphere.ts',
              './src/lib/entities/sprite.ts',
              './src/lib/entities/plane.ts',
              './src/lib/entities/zone.ts',
              './src/lib/entities/actor.ts',
              './src/lib/entities/create.ts',
              './src/lib/entities/destroy.ts',
              './src/lib/entities/delegates/animation.ts',
              './src/lib/entities/delegates/loader.ts',
            ],

            // Behaviors (depends on entities)
            'zylem-behaviors': [
              './src/lib/behaviors/actions.ts',
              './src/lib/behaviors/behavior.ts',
              './src/lib/behaviors/character-controller.ts',
              './src/lib/behaviors/entity-movement.ts',
              './src/lib/behaviors/entity-spawner.ts',
              './src/lib/behaviors/moveable.ts',
              './src/lib/behaviors/rotatable.ts',
              './src/lib/behaviors/transformable.system.ts',
            ],

            // Core game systems (depends on most other chunks)
            'zylem-core': [
              './src/lib/core/game/game.ts',
              './src/lib/core/game/zylem-game.ts',
              './src/lib/core/vessel.ts',
              './src/lib/core/asset-manager.ts',
              './src/lib/core/entity-asset-loader.ts',
              './src/lib/core/three-addons/Timer.ts',
            ],

            // Stage system (depends on everything - should load last)
            'zylem-stage': [
              './src/lib/core/stage/stage.ts',
              './src/lib/core/stage/zylem-stage.ts',
              './src/lib/collision/world.ts',
              './src/lib/graphics/zylem-scene.ts',
            ],

            // UI and Debug (optional, can be lazy loaded)
            'zylem-ui': [
              './src/lib/ui/hud.ts',
              './src/lib/ui/hud-bar.ts',
              './src/lib/ui/hud-label.ts',
              './src/lib/ui/hud-custom.ts',
            ],
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
    };
  }

  return config;
});
