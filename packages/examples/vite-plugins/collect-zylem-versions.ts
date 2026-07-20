import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

interface PackageManifest {
	name?: string;
	version?: string;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
}

function readManifest(dir: string): PackageManifest | null {
	const pkgPath = join(dir, 'package.json');
	try {
		return JSON.parse(readFileSync(pkgPath, 'utf8')) as PackageManifest;
	} catch {
		return null;
	}
}

/** Resolve an installed package directory from a declaring package's context. */
function resolvePackageDir(fromDir: string, name: string): string | null {
	let dir = fromDir;
	while (dir !== dirname(dir)) {
		const candidate = join(dir, 'node_modules', name);
		if (existsSync(join(candidate, 'package.json'))) {
			return candidate;
		}
		dir = dirname(dir);
	}
	return null;
}

/**
 * Walk the resolved `@zylem/*` dependency graph starting from `rootPkgDir`
 * and return a sorted map of package name → installed version.
 */
export function collectZylemPackageVersions(rootPkgDir: string): Record<string, string> {
	const versions: Record<string, string> = {};
	const seenNames = new Set<string>();
	const visitedDirs = new Set<string>();
	const queue: Array<{ dir: string; isRoot: boolean }> = [{ dir: rootPkgDir, isRoot: true }];

	while (queue.length > 0) {
		const { dir, isRoot } = queue.shift()!;
		if (visitedDirs.has(dir)) continue;
		visitedDirs.add(dir);

		const manifest = readManifest(dir);
		if (!manifest) continue;

		if (typeof manifest.name === 'string' && manifest.name.startsWith('@zylem/')) {
			versions[manifest.name] =
				typeof manifest.version === 'string' ? manifest.version : '0.0.0';
		}

		const depFields: Array<'dependencies' | 'devDependencies'> = isRoot
			? ['dependencies', 'devDependencies']
			: ['dependencies'];

		for (const field of depFields) {
			const deps = manifest[field] ?? {};
			for (const name of Object.keys(deps)) {
				if (!name.startsWith('@zylem/') || seenNames.has(name)) continue;
				seenNames.add(name);

				const resolvedDir = resolvePackageDir(dir, name);
				if (!resolvedDir) continue;

				const resolvedManifest = readManifest(resolvedDir);
				if (!resolvedManifest) continue;

				versions[name] =
					typeof resolvedManifest.version === 'string'
						? resolvedManifest.version
						: '0.0.0';
				queue.push({ dir: resolvedDir, isRoot: false });
			}
		}
	}

	return Object.fromEntries(
		Object.entries(versions).sort(([a], [b]) => a.localeCompare(b)),
	);
}
