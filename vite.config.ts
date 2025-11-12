// vite.config.ts
// Delegates to typed configs under config/ based on VITE_TARGET.
// Targets: 'lib' | 'app-dev' | 'app-prod'. Default: 'lib' for build, 'app-dev' for serve.

import { defineConfig, type UserConfig } from 'vite';

type Target = 'lib' | 'app-dev' | 'app-prod';

export default defineConfig(async (env): Promise<UserConfig> => {
	// Decide target from environment or CLI context
	const target: Target =
		(process.env.VITE_TARGET as Target) ??
		(env.command === 'serve' ? 'app-dev' : 'lib');

	// Route to the correct sub-config
	if (target === 'lib') {
		const mod = await import('./config/vite.lib');
		return mod.default(env);
	}

	if (target === 'app-prod') {
		const mod = await import('./config/vite.app.prod');
		return mod.default(env);
	}

	// Fallback to dev app config
	const mod = await import('./config/vite.app.dev');
	return mod.default(env);
});


