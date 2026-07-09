/**
 * Zylem interactive runner.
 *
 * Invoked via `pnpm run zylem`. Presents a clack-based TUI that asks for an
 * action (run / build / test / bump / publish / deps) and then lets the user
 * select which packages to apply it to.
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
import {
	existsSync,
	readdirSync,
	readFileSync,
	statSync,
	writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
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

type Action = 'run' | 'build' | 'test' | 'bump' | 'publish' | 'deps';
type BumpLevel = 'patch' | 'minor' | 'major';
type DepsMode = 'dev' | 'prod';

interface PackageInfo {
	name: string;
	dir: string;
	version: string;
	isPrivate: boolean;
	scripts: Record<string, string>;
}

interface SwitchableHit {
	pkgPath: string;
	pkgDir: string;
	repoRoot: string;
	/** package name -> current version string in the manifest */
	deps: Map<string, string>;
}

/** Maps an action to the package.json script it executes. */
const ACTION_SCRIPT: Record<Exclude<Action, 'deps'>, string> = {
	run: 'dev',
	build: 'build',
	test: 'test',
	bump: 'build',
	publish: 'build',
};

/** Actions that should load the repo .env before spawning. */
const ENV_ACTIONS: Action[] = ['build', 'bump', 'publish'];

/**
 * Cross-repo @zylem packages that can flip between local `link:` (dev) and
 * published semver (prod). Paths are relative to the zylem-projects workspace
 * root (parent of the individual repos).
 */
const SWITCHABLE_PACKAGES: Record<string, string> = {
	'@zylem/ui': 'zylem-ui',
	'@zylem/editor': 'zylem/packages/editor',
	'@zylem/game-lib': 'zylem/packages/game-lib',
	'@zylem/shaders': 'zylem/packages/shaders',
	'@zylem/runtime': 'runtime',
	'@zylem/behaviors': 'behaviors',
};

const SIBLING_REPO_DIRS = [
	'zylem',
	'creator',
	'behaviors',
	'zylem-ui',
	'runtime',
	'arena',
] as const;

const DEP_SECTIONS = [
	'dependencies',
	'devDependencies',
	'peerDependencies',
] as const;

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
function supportsAction(pkg: PackageInfo, action: Exclude<Action, 'deps'>): boolean {
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
	cwd: string = ROOT_DIR,
): Promise<number> {
	return new Promise((resolvePromise) => {
		const child = spawn(command, args, { stdio: 'inherit', env, cwd });
		child.on('close', (code) => resolvePromise(code ?? 0));
		child.on('error', (error) => {
			log.error(`Failed to start \`${command}\`: ${error.message}`);
			resolvePromise(1);
		});
	});
}

/** Run a command silently and return its stdout, or null on failure. */
function captureCommand(
	command: string,
	args: string[],
	cwd: string = ROOT_DIR,
): string | null {
	const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
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
 * Resolve the zylem-projects workspace root (parent of sibling repos). Falls
 * back to ROOT_DIR when siblings are not present.
 */
function resolveWorkspaceRoot(): string {
	const parent = dirname(ROOT_DIR);
	const hits = SIBLING_REPO_DIRS.filter((name) =>
		existsSync(join(parent, name)),
	);
	if (hits.length >= 2) {
		return parent;
	}
	return ROOT_DIR;
}

function isSwitchableValue(value: unknown): value is string {
	if (typeof value !== 'string') {
		return false;
	}
	if (value.startsWith('workspace:')) {
		return false;
	}
	if (value.startsWith('link:')) {
		return true;
	}
	// Registry ranges / tags (caret, tilde, exact, latest, etc.).
	return true;
}

function collectPackageJsonPaths(repoRoot: string): string[] {
	const out: string[] = [];
	const skip = new Set([
		'node_modules',
		'.git',
		'dist',
		'target',
		'.pnpm-store',
		'coverage',
	]);

	const walk = (dir: string) => {
		let entries;
		try {
			entries = readdirSync(dir, { withFileTypes: true });
		} catch {
			return;
		}
		for (const entry of entries) {
			if (skip.has(entry.name)) {
				continue;
			}
			const full = join(dir, entry.name);
			if (entry.isDirectory()) {
				walk(full);
			} else if (entry.name === 'package.json') {
				out.push(full);
			}
		}
	};

	if (existsSync(join(repoRoot, 'package.json'))) {
		out.push(join(repoRoot, 'package.json'));
	}
	// Walk one level of common monorepo roots, then recurse.
	for (const sub of ['packages', 'apps', 'web', 'server']) {
		const subDir = join(repoRoot, sub);
		if (existsSync(subDir) && statSync(subDir).isDirectory()) {
			walk(subDir);
		}
	}
	// Also walk repo root children that aren't skipped (e.g. behaviors/web).
	try {
		for (const entry of readdirSync(repoRoot, { withFileTypes: true })) {
			if (!entry.isDirectory() || skip.has(entry.name)) {
				continue;
			}
			if (['packages', 'apps', 'web', 'server'].includes(entry.name)) {
				continue; // already walked
			}
			const nested = join(repoRoot, entry.name, 'package.json');
			if (existsSync(nested)) {
				out.push(nested);
			}
			// One more level for apps/* style without packages/
			const nestedDir = join(repoRoot, entry.name);
			for (const child of ['web', 'apps', 'packages']) {
				const childDir = join(nestedDir, child);
				if (existsSync(childDir) && statSync(childDir).isDirectory()) {
					walk(childDir);
				}
			}
		}
	} catch {
		// ignore
	}

	return [...new Set(out)];
}

function scanSwitchableHits(workspaceRoot: string): SwitchableHit[] {
	const repoRoots: string[] = [];
	for (const name of SIBLING_REPO_DIRS) {
		const dir = join(workspaceRoot, name);
		if (existsSync(join(dir, 'package.json')) || existsSync(join(dir, 'packages'))) {
			repoRoots.push(dir);
		}
	}
	// Always include ROOT_DIR if somehow outside the sibling set.
	if (!repoRoots.includes(ROOT_DIR) && existsSync(join(ROOT_DIR, 'package.json'))) {
		repoRoots.push(ROOT_DIR);
	}

	const hits: SwitchableHit[] = [];
	for (const repoRoot of repoRoots) {
		for (const pkgPath of collectPackageJsonPaths(repoRoot)) {
			let json: Record<string, unknown>;
			try {
				json = JSON.parse(readFileSync(pkgPath, 'utf8'));
			} catch {
				continue;
			}
			const deps = new Map<string, string>();
			for (const section of DEP_SECTIONS) {
				const block = json[section];
				if (!block || typeof block !== 'object') {
					continue;
				}
				for (const [name, value] of Object.entries(
					block as Record<string, unknown>,
				)) {
					if (!(name in SWITCHABLE_PACKAGES)) {
						continue;
					}
					if (!isSwitchableValue(value)) {
						continue;
					}
					deps.set(name, value);
				}
			}
			if (deps.size === 0) {
				continue;
			}
			hits.push({
				pkgPath,
				pkgDir: dirname(pkgPath),
				repoRoot,
				deps,
			});
		}
	}
	return hits;
}

function fetchNpmLatest(name: string): string | null {
	const out = captureCommand('npm', ['view', name, 'version']);
	if (!out) {
		return null;
	}
	const version = out.trim();
	return version === '' ? null : version;
}

function normalizeProdRange(input: string): string {
	const trimmed = input.trim();
	if (
		trimmed.startsWith('^') ||
		trimmed.startsWith('~') ||
		trimmed.startsWith('>=') ||
		trimmed.startsWith('<') ||
		trimmed === 'latest' ||
		trimmed.startsWith('workspace:') ||
		trimmed.startsWith('link:')
	) {
		return trimmed;
	}
	return `^${trimmed}`;
}

function stripRangeToVersion(range: string): string {
	return range.replace(/^[\^~>=<\s]+/, '').trim();
}

/**
 * Replace `"@zylem/foo": "<old>"` with a new value in raw package.json text,
 * preserving surrounding formatting.
 */
function rewriteDepValue(
	raw: string,
	name: string,
	oldValue: string,
	newValue: string,
): string {
	const needle = `"${name}": "${oldValue}"`;
	const replacement = `"${name}": "${newValue}"`;
	if (!raw.includes(needle)) {
		return raw;
	}
	return raw.split(needle).join(replacement);
}

function linkSpec(workspaceRoot: string, consumerDir: string, name: string): string {
	const localRel = SWITCHABLE_PACKAGES[name];
	if (localRel === undefined) {
		throw new Error(`Unknown switchable package: ${name}`);
	}
	const localAbs = resolve(workspaceRoot, localRel);
	let rel = relative(consumerDir, localAbs);
	if (!rel.startsWith('.')) {
		rel = `./${rel}`;
	}
	// pnpm link: paths use forward slashes.
	return `link:${rel.split('\\').join('/')}`;
}

async function runDepsAction(
	env: Record<string, string | undefined>,
): Promise<number> {
	const workspaceRoot = resolveWorkspaceRoot();
	const hits = scanSwitchableHits(workspaceRoot);
	if (hits.length === 0) {
		bail('No switchable @zylem/* dependencies found in sibling repos.');
	}

	const uniquePackages = [
		...new Set(hits.flatMap((hit) => [...hit.deps.keys()])),
	].sort();

	log.info(
		`Found ${hits.length} package.json file(s) with: ${uniquePackages.join(', ')}`,
	);

	const mode = (await select({
		message: 'Dependency mode',
		options: [
			{
				value: 'dev',
				label: 'dev',
				hint: 'link local sibling packages',
			},
			{
				value: 'prod',
				label: 'prod',
				hint: 'use published npm versions',
			},
		],
		initialValue: 'prod',
	})) as DepsMode | symbol;
	if (isCancel(mode)) {
		bail('Cancelled.');
	}
	const chosenMode = mode as DepsMode;

	const versions = new Map<string, string>();
	if (chosenMode === 'prod') {
		for (const name of uniquePackages) {
			const latest = fetchNpmLatest(name);
			const fallback =
				latest ??
				stripRangeToVersion(
					hits.find((h) => h.deps.has(name))?.deps.get(name) ?? '0.0.0',
				);
			const answer = (await text({
				message: `Version for ${name}`,
				placeholder: fallback,
				defaultValue: fallback,
				initialValue: fallback,
			})) as string | symbol;
			if (isCancel(answer)) {
				bail('Cancelled.');
			}
			const chosen =
				typeof answer === 'string' && answer.trim() !== ''
					? answer.trim()
					: fallback;
			versions.set(name, normalizeProdRange(chosen));
		}
	}

	const proceed = await confirm({
		message: `Switch ${hits.length} package.json file(s) to ${chosenMode}?`,
	});
	if (isCancel(proceed) || proceed === false) {
		bail('Cancelled.');
	}

	const affectedInstallRoots = new Set<string>();
	for (const hit of hits) {
		let raw = readFileSync(hit.pkgPath, 'utf8');
		let changed = false;
		for (const [name, oldValue] of hit.deps) {
			const newValue =
				chosenMode === 'dev'
					? linkSpec(workspaceRoot, hit.pkgDir, name)
					: (versions.get(name) ?? oldValue);
			if (newValue === oldValue) {
				continue;
			}
			const next = rewriteDepValue(raw, name, oldValue, newValue);
			if (next !== raw) {
				raw = next;
				changed = true;
				log.step(
					`${relative(workspaceRoot, hit.pkgPath)}: ${name} ${oldValue} -> ${newValue}`,
				);
			} else {
				log.warn(
					`Could not rewrite ${name} in ${relative(workspaceRoot, hit.pkgPath)}`,
				);
			}
		}
		if (changed) {
			writeFileSync(hit.pkgPath, raw);
			affectedInstallRoots.add(resolveInstallRoot(hit.pkgDir, hit.repoRoot));
		}
	}

	if (affectedInstallRoots.size === 0) {
		log.info('No package.json files needed changes.');
		return 0;
	}

	for (const installRoot of [...affectedInstallRoots].sort()) {
		log.step(`pnpm install in ${relative(workspaceRoot, installRoot) || '.'}`);
		const code = await runCommand('pnpm', ['install'], env, installRoot);
		if (code !== 0) {
			return code;
		}
	}
	return 0;
}

/**
 * Prefer the nearest directory that owns a pnpm-lock.yaml (covers nested
 * packages like behaviors/web that are not part of the parent workspace).
 * Fall back to the sibling repo root.
 */
function resolveInstallRoot(pkgDir: string, repoRoot: string): string {
	let dir = pkgDir;
	while (true) {
		if (existsSync(join(dir, 'pnpm-lock.yaml'))) {
			return dir;
		}
		if (dir === repoRoot) {
			break;
		}
		const parent = dirname(dir);
		if (parent === dir) {
			break;
		}
		dir = parent;
	}
	return repoRoot;
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
			{
				value: 'deps',
				label: 'deps',
				hint: 'switch @zylem/* deps between link (dev) and published (prod)',
			},
		],
		initialValue: 'run',
	})) as Action | symbol;

	if (isCancel(action)) {
		bail('Cancelled.');
	}
	const chosenAction = action as Action;

	const env: Record<string, string | undefined> = { ...process.env };

	if (chosenAction === 'deps') {
		const exitCode = await runDepsAction(env);
		if (exitCode !== 0) {
			bail(`\`deps\` exited with code ${exitCode}.`);
		}
		outro('Done: deps.');
		return;
	}

	const packageAction = chosenAction as Exclude<Action, 'deps'>;
	const available = packages.filter((pkg) =>
		supportsAction(pkg, packageAction),
	);
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
						: (pkg.scripts[ACTION_SCRIPT[packageAction]] ?? ''),
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
		args.push('run', ACTION_SCRIPT[packageAction]);
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
