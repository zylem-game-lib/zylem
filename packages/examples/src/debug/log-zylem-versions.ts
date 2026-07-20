import { ZYLEM_PACKAGE_VERSIONS } from 'virtual:zylem-versions';

declare global {
	interface Window {
		__ZYLEM_PACKAGE_VERSIONS__?: Record<string, string>;
	}
}

/** Log resolved `@zylem/*` package versions to the browser console on startup. */
export function logZylemPackageVersions(): void {
	globalThis.__ZYLEM_PACKAGE_VERSIONS__ = ZYLEM_PACKAGE_VERSIONS;

	console.groupCollapsed('[zylem] package versions');
	console.table(ZYLEM_PACKAGE_VERSIONS);
	console.groupEnd();
}
