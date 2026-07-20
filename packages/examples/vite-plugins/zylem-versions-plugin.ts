import type { Plugin } from 'vite';
import { collectZylemPackageVersions } from './collect-zylem-versions.ts';

const VIRTUAL_MODULE_ID = 'virtual:zylem-versions';
const RESOLVED_VIRTUAL_MODULE_ID = '\0virtual:zylem-versions';

export function zylemVersionsPlugin(rootPkgDir: string): Plugin {
	const versions = collectZylemPackageVersions(rootPkgDir);

	return {
		name: 'zylem-versions',
		resolveId(id) {
			if (id === VIRTUAL_MODULE_ID) {
				return RESOLVED_VIRTUAL_MODULE_ID;
			}
		},
		load(id) {
			if (id === RESOLVED_VIRTUAL_MODULE_ID) {
				return `export const ZYLEM_PACKAGE_VERSIONS = ${JSON.stringify(versions)};`;
			}
		},
	};
}
