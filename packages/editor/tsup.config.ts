import { defineConfig } from 'tsup';

const isProd = process.env.NODE_ENV === 'production';
const sourcemap = process.env.SOURCEMAP === '1' || !isProd;
import { solidPlugin } from 'esbuild-plugin-solid';
import { readFileSync, existsSync } from 'fs';
import { dirname } from 'path';
import type { Plugin } from 'esbuild';

// Plugin to handle Vite-style ?raw imports
const rawPlugin: Plugin = {
    name: 'raw-loader',
    setup(build) {
        // Intercept ?raw imports and return the file content as a JS module.
        // Delegates to esbuild's resolver so both relative paths
        // (`./foo.css?raw`) and package-subpath specifiers
        // (`@zylem/styles/styles.css?raw`, honoring `package.json` `exports`)
        // resolve correctly.
        build.onResolve({ filter: /\?raw$/ }, async (args) => {
            const bare = args.path.replace(/\?raw$/, '');
            const resolved = await build.resolve(bare, {
                kind: 'import-statement',
                importer: args.importer,
                resolveDir: dirname(args.importer),
            });
            if (resolved.errors.length) {
                console.error(`[raw-loader] Could not resolve ${bare}`);
                return { errors: resolved.errors };
            }
            console.log(`[raw-loader] Processing: ${resolved.path}`);
            return {
                path: resolved.path + '?raw',
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
    sourcemap,
    outDir: 'dist',
    minify: isProd,
    esbuildPlugins: [rawPlugin, solidPlugin()],
    external: [
        'solid-js',
        'solid-js/web',
        /^@zylem\/game-lib(\/.*)?$/,
    ],
    // tsup treats `dependencies` as external by default, which would
    // forward `@zylem/styles/styles.css?raw` to the consumer's bundler.
    // We want the bundled editor to inline the CSS string itself so the
    // shadow-DOM injection in `zylem-editor.tsx` works even when the
    // consumer has no `?raw` loader. Keep the package bundled; the
    // `rawPlugin` then handles the `?raw` subpath resolution.
    noExternal: [/^@zylem\/styles(\/.*)?$/],
});
