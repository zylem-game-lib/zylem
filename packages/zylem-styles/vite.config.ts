import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

// Dev server for the showcase app. The library build stays on tsup
// (see tsup.config.ts); this config only serves `showcase/`, compiling the
// vanilla-extract sources live so token/style edits hot-reload.
export default defineConfig({
  root: 'showcase',
  plugins: [solid(), vanillaExtractPlugin()],
  server: {
    port: 3030,
  },
});
