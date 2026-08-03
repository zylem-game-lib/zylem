import path from 'node:path';
import { defineConfig } from 'vitest/config';

// The dock layout geometry is pure TypeScript, so it needs no DOM environment
// or Solid transform.
export default defineConfig({
	test: {
		environment: 'node',
		include: [path.resolve(import.meta.dirname, './tests/unit/**/*.spec.ts')],
	},
});
