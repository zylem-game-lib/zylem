import path from 'path';
import { defineConfig, mergeConfig } from 'vitest/config';
import { createBaseConfig } from '../../config/vite.base';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig(async (env) => {
	const baseConfig = await createBaseConfig(env);
	const testConfig = {
		test: {
			globals: true,
			projects: [
				{
					test: {
						name: 'unit',
						environment: 'happy-dom',
						include: [path.resolve(import.meta.dirname, './tests/unit/**/*.spec.ts')],
						exclude: [path.resolve(import.meta.dirname, './tests/integration/**/*.spec.ts')],
					}
				},
				{
					plugins: [solidPlugin({ dev: true, ssr: false })],
					test: {
						name: 'integration',
						environment: 'jsdom',
						resolve: {
							conditions: ['browser', 'development'],
						},
						server: {
							deps: {
								inline: [
									/solid-js/,
									/solid-testing-library/,
									/solid-presence/,
									/@kobalte/,
									/@solidjs/
								],
							},
						},
						include: [path.resolve(import.meta.dirname, './tests/integration/**/*.sim.spec.tsx')],
						exclude: [path.resolve(import.meta.dirname, './tests/unit/**/*.spec.ts')],
					}
				}
			],
		}
	}
	return mergeConfig(baseConfig, testConfig);
});

