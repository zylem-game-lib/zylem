import { defineConfig } from 'tsup';
import { solidPlugin } from 'esbuild-plugin-solid';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import type { Plugin } from 'esbuild';

// Plugin to handle Vite-style ?raw imports
const rawPlugin: Plugin = {
    name: 'raw-loader',
    setup(build) {
        // Intercept ?raw imports and return the file content as a JS module
        build.onResolve({ filter: /\?raw$/ }, (args) => {
            const rawPath = args.path.replace(/\?raw$/, '');
            const filePath = resolve(dirname(args.importer), rawPath);
            console.log(`[raw-loader] Processing: ${filePath}`);

            if (!existsSync(filePath)) {
                console.error(`[raw-loader] File not found: ${filePath}`);
            }

            return {
                path: filePath + '?raw',
                namespace: 'raw-content',
            };
        });

        build.onLoad({ filter: /\?raw$/, namespace: 'raw-content' }, (args) => {
            const filePath = args.path.replace(/\?raw$/, '');
            console.log(`[raw-loader] Loading content from: ${filePath}`);

            if (!existsSync(filePath)) {
                return { contents: `export default "";`, loader: 'js' };
            }

            const content = readFileSync(filePath, 'utf-8');
            console.log(`[raw-loader] Read ${content.length} characters`);
            return {
                contents: `export default ${JSON.stringify(content)};`,
                loader: 'js'
            };
        });
    },
};

export default defineConfig({
    entry: { 'zylem-editor': 'src/index.ts' },
    format: ['esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    outDir: 'dist',
    minify: false,
    esbuildPlugins: [rawPlugin, solidPlugin()],
    external: [
        'solid-js',
        'solid-js/web',
        '@zylem/game-lib',
    ],
});
