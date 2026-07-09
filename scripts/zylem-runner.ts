/**
 * Zylem interactive runner.
 *
 * Invoked via `pnpm run zylem`. Presents a clack-based TUI that asks for an
 * action (run / build / test / bump / publish) and then lets the user select
 * which packages to apply it to.
 *
 * The script supports two repo layouts and is shared verbatim across the
 * zylem, behaviors, runtime, and zylem-ui repos:
 * - Monorepo: packages are discovered under `<root>/packages` and commands
 *   run through pnpm workspace filters.
 * - Single package: the root `package.json` is the only package and commands
 *   run with plain `pnpm run <script>`.
 *
 * Run with `node --experimental-strip-types`, so this file must contain only
 * erasable TypeScript (type annotations, interfaces, type aliases) - no enums,
 * namespaces, or parameter properties.
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
	cancel,
	confirm,
	intro,
	isCancel,
	log,
	multiselect,
	outro,
	select,
	text,
} from '@clack/prompts';

type Action = 'run' | 'build' | 'test' | 'bump' | 'publish';
type BumpLevel = 'patch' | 'minor' | 'major';

interface PackageInfo {
	name: string;
	dir: string;
	version: string;
	isPrivate: boolean;
	scripts: Record<string, string>;
}

/** Maps an action to the package.json script it executes. */
const ACTION_SCRIPT: Record<Action, string> = {
	run: 'dev',
	build: 'build',
	test: 'test',
	bump: 'build',
	publish: 'build',
};

/** Actions that should load the repo .env before spawning. */
const ENV_ACTIONS: Action[] = ['build', 'bump', 'publish'];

const ROOT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const IS_MONOREPO = existsSync(join(ROOT_DIR, 'packages'));

/**
 * Parse the repo .env tolerantly. The file uses a `KEY = "value"` style with
 * spaces around `=` and quoted values, so we trim and unquote each entry.
 */
function parseEnvFile(root: string): Record<string, string> {
	const file = join(root, '.env');
	const out: Record<string, string> = {};
	if (!existsSync(file)) {
		return out;
	}
	for (const rawLine of readFileSync(file, 'utf8').split('\n')) {
		const line = rawLine.trim();
		if (line === '' || line.startsWith('#')) {
			continue;
		}
		const eq = line.indexOf('=');
		if (eq === -1) {
			continue;
		}
		const key = line.slice(0, eq).trim();
		if (key === '') {
			continue;
		}
		let value = line.slice(eq + 1).trim();
		if (
			value.length >= 2 &&
			((value.startsWith('"') && value.endsWith('"')) ||
				(value.startsWith("'") && value.endsWith("'")))
		) {
			value = value.slice(1, -1);
		}
		out[key] = value;
	}
	return out;
}

function readPackage(dir: string): PackageInfo | null {
	const pkgPath = join(dir, 'package.json');
	if (!existsSync(pkgPath)) {
		return null;
	}
	try {
		const json = JSON.parse(readFileSync(pkgPath, 'utf8'));
		if (typeof json.name !== 'string') {
			return null;
		}
		return {
			name: json.name,
			dir,
			version: typeof json.version === 'string' ? json.version : '0.0.0',
			isPrivate: json.private === true,
			scripts: json.scripts ?? {},
		};
	} catch {
		// Skip unreadable/invalid package manifests.
		return null;
	}
}

/**
 * Discover packages. In a monorepo this scans `packages/` (plus the nested
 * spacetimedb workspace entry); in a single-package repo it returns the root
 * package.
 */
function discoverPackages(root: string): PackageInfo[] {
	if (!IS_MONOREPO) {
		const pkg = readPackage(root);
		return pkg ? [pkg] : [];
	}

	const packagesDir = join(root, 'packages');
	const candidates: string[] = [];
	for (const entry of readdirSync(packagesDir, { withFileTypes: true })) {
		if (entry.isDirectory()) {
			candidates.push(join(packagesDir, entry.name));
		}
	}
	// Nested workspace entry from pnpm-workspace.yaml.
	candidates.push(join(packagesDir, 'server', 'spacetimedb'));

	const byName = new Map<string, PackageInfo>();
	for (const dir of candidates) {
		const pkg = readPackage(dir);
		if (pkg) {
			byName.set(pkg.name, pkg);
		}
	}
	return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Whether a package can perform the given action. */
function supportsAction(pkg: PackageInfo, action: Action): boolean {
	if (action === 'publish' || action === 'bump') {
		return !pkg.isPrivate;
	}
	return Boolean(pkg.scripts[ACTION_SCRIPT[action]]);
}

/** Build the pnpm args to run a script for a package in either layout. */
function scriptArgs(pkg: PackageInfo, script: string): string[] {
	if (IS_MONOREPO) {
		return ['--filter', pkg.name, 'run', script];
	}
	return ['run', script];
}

/** Spawn a command, inheriting stdio, and resolve with its exit code. */
function runCommand(
	command: string,
	args: string[],
	env: Record<string, string | undefined>,
): Promise<number> {
	return new Promise((resolve) => {
		const child = spawn(command, args, { stdio: 'inherit', env, cwd: ROOT_DIR });
		child.on('close', (code) => resolve(code ?? 0));
		child.on('error', (error) => {
			log.error(`Failed to start \`${command}\`: ${error.message}`);
			resolve(1);
		});
	});
}

/** Run a command silently and return its stdout, or null on failure. */
function captureCommand(command: string, args: string[]): string | null {
	const result = spawnSync(command, args, { cwd: ROOT_DIR, encoding: 'utf8' });
	if (result.status !== 0) {
		return null;
	}
	return result.stdout;
}

function bumpVersion(version: string, level: BumpLevel): string | null {
	const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
	if (!match) {
		return null;
	}
	const [major, minor, patch] = [
		Number(match[1]),
		Number(match[2]),
		Number(match[3]),
	];
	if (level === 'major') {
		return `${major + 1}.0.0`;
	}
	if (level === 'minor') {
		return `${major}.${minor + 1}.0`;
	}
	return `${major}.${minor}.${patch + 1}`;
}

/**
 * Rewrite the `"version"` field in a package.json in place, preserving the
 * file's formatting (indentation style varies across repos).
 */
function writeVersion(pkg: PackageInfo, newVersion: string): boolean {
	const pkgPath = join(pkg.dir, 'package.json');
	const raw = readFileSync(pkgPath, 'utf8');
	const needle = `"version": "${pkg.version}"`;
	if (!raw.includes(needle)) {
		return false;
	}
	writeFileSync(pkgPath, raw.replace(needle, `"version": "${newVersion}"`));
	return true;
}

function bail(message: string): never {
	cancel(message);
	process.exit(1);
}

/**
 * Bump one package: prompt for level and message, rewrite the version,
 * rebuild, then commit and tag. Returns the exit code (0 on success).
 */
async function bumpPackage(
	pkg: PackageInfo,
	env: Record<string, string | undefined>,
): Promise<number> {
	const level = (await select({
		message: `Bump ${pkg.name} (current: ${pkg.version})`,
		options: (['patch', 'minor', 'major'] as BumpLevel[]).map((value) => ({
			value,
			label: value,
			hint: `${pkg.version} -> ${bumpVersion(pkg.version, value) ?? '?'}`,
		})),
		initialValue: 'patch',
	})) as BumpLevel | symbol;
	if (isCancel(level)) {
		bail('Cancelled.');
	}

	const message = (await text({
		message: `Message for ${pkg.name} bump`,
		placeholder: 'What changed?',
		validate: (value) =>
			value === undefined || value.trim() === ''
				? 'A message is required.'
				: undefined,
	})) as string | symbol;
	if (isCancel(message)) {
		bail('Cancelled.');
	}

	const newVersion = bumpVersion(pkg.version, level as BumpLevel);
	if (!newVersion) {
		log.error(`Cannot parse version \`${pkg.version}\` of ${pkg.name}.`);
		return 1;
	}
	if (!writeVersion(pkg, newVersion)) {
		log.error(
			`Could not find "version": "${pkg.version}" in ${pkg.name}'s package.json.`,
		);
		return 1;
	}
	log.step(`${pkg.name}: ${pkg.version} -> ${newVersion}`);

	log.step(`Building ${pkg.name}`);
	const buildCode = await runCommand(
		'pnpm',
		scriptArgs(pkg, ACTION_SCRIPT.build),
		env,
	);
	if (buildCode !== 0) {
		log.error(
			`Build failed; the version bump in package.json was left in place. Fix the build or revert before committing.`,
		);
		return buildCode;
	}

	// Stage only the bumped manifest (and the lockfile if pnpm touched it).
	const pkgJsonRel = relative(ROOT_DIR, join(pkg.dir, 'package.json'));
	const stage = [pkgJsonRel];
	const lockStatus = captureCommand('git', [
		'status',
		'--porcelain',
		'pnpm-lock.yaml',
	]);
	if (lockStatus !== null && lockStatus.trim() !== '') {
		stage.push('pnpm-lock.yaml');
	}
	const addCode = await runCommand('git', ['add', ...stage], env);
	if (addCode !== 0) {
		return addCode;
	}

	const commitMessage = `${pkg.name}@${newVersion}: ${(message as string).trim()}`;
	const commitCode = await runCommand(
		'git',
		['commit', '-m', commitMessage],
		env,
	);
	if (commitCode !== 0) {
		return commitCode;
	}

	const tagName = IS_MONOREPO ? `${pkg.name}@${newVersion}` : `v${newVersion}`;
	const tagCode = await runCommand('git', ['tag', tagName], env);
	if (tagCode !== 0) {
		return tagCode;
	}
	log.step(`Committed and tagged ${tagName}`);
	return 0;
}

async function main(): Promise<void> {
	intro('zylem');

	const packages = discoverPackages(ROOT_DIR);
	if (packages.length === 0) {
		bail(
			IS_MONOREPO
				? 'No workspace packages found under packages/.'
				: 'No package.json found at the repo root.',
		);
	}

	const action = (await select({
		message: 'What would you like to do?',
		options: [
			{ value: 'run', label: 'run', hint: 'start dev / watch mode' },
			{ value: 'build', label: 'build', hint: 'compile packages' },
			{ value: 'test', label: 'test', hint: 'run test suites' },
			{
				value: 'bump',
				label: 'bump',
				hint: 'bump semver, rebuild, commit, and tag',
			},
			{ value: 'publish', label: 'publish', hint: 'publish public packages' },
		],
		initialValue: 'run',
	})) as Action | symbol;

	if (isCancel(action)) {
		bail('Cancelled.');
	}
	const chosenAction = action as Action;

	const available = packages.filter((pkg) => supportsAction(pkg, chosenAction));
	if (available.length === 0) {
		bail(`No packages support \`${chosenAction}\`.`);
	}

	let targets: string[];
	const only = available.length === 1 ? available[0] : undefined;
	if (only) {
		targets = [only.name];
	} else {
		const selected = (await multiselect({
			message: `Select packages to ${chosenAction}`,
			options: available.map((pkg) => ({
				value: pkg.name,
				label: pkg.name,
				hint:
					chosenAction === 'publish' || chosenAction === 'bump'
						? `public, v${pkg.version}`
						: (pkg.scripts[ACTION_SCRIPT[chosenAction]] ?? ''),
			})),
			required: true,
		})) as string[] | symbol;

		if (isCancel(selected)) {
			bail('Cancelled.');
		}
		targets = selected as string[];
	}

	const proceed = await confirm({
		message: `${chosenAction} ${targets.length} package(s): ${targets.join(', ')}?`,
	});
	if (isCancel(proceed) || proceed === false) {
		bail('Cancelled.');
	}

	const env: Record<string, string | undefined> = { ...process.env };
	if (ENV_ACTIONS.includes(chosenAction)) {
		Object.assign(env, parseEnvFile(ROOT_DIR));
		if (chosenAction === 'build') {
			env.NODE_ENV = env.NODE_ENV ?? 'production';
		} else {
			env.NODE_ENV = 'production';
		}
	}

	const byName = new Map(packages.map((pkg) => [pkg.name, pkg]));
	let exitCode = 0;

	if (chosenAction === 'bump') {
		for (const name of targets) {
			const pkg = byName.get(name);
			if (!pkg) {
				continue;
			}
			exitCode = await bumpPackage(pkg, env);
			if (exitCode !== 0) {
				break;
			}
		}
	} else if (chosenAction === 'publish') {
		for (const name of targets) {
			const pkg = byName.get(name);
			if (!pkg) {
				continue;
			}
			log.step(`Building ${name}`);
			exitCode = await runCommand(
				'pnpm',
				scriptArgs(pkg, ACTION_SCRIPT.build),
				env,
			);
			if (exitCode !== 0) {
				break;
			}
			log.step(`Publishing ${name}`);
			exitCode = await runCommand(
				'pnpm',
				IS_MONOREPO
					? ['--filter', name, 'publish', '--access', 'public']
					: ['publish', '--access', 'public'],
				env,
			);
			if (exitCode !== 0) {
				break;
			}
		}
	} else {
		const args: string[] = [];
		if (chosenAction === 'run' && IS_MONOREPO) {
			args.push('--parallel');
		}
		if (IS_MONOREPO) {
			for (const name of targets) {
				args.push('--filter', name);
			}
		}
		args.push('run', ACTION_SCRIPT[chosenAction]);
		log.step(`pnpm ${args.join(' ')}`);
		exitCode = await runCommand('pnpm', args, env);
	}

	if (exitCode !== 0) {
		bail(`\`${chosenAction}\` exited with code ${exitCode}.`);
	}

	outro(`Done: ${chosenAction}.`);
}

main().catch((error) => {
	log.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
});
