import { defineConfig, type ConfigEnv, type UserConfig } from 'vite';
import { createBaseConfig } from './vite.base';

export default defineConfig(async (env: ConfigEnv): Promise<UserConfig> => {
	const base = await createBaseConfig(env);
	return {
		...base,
	};
});


