/**
 * Zylem interactive runner.
 *
 * Invoked via `pnpm run zylem`. Presents a clack-based TUI that asks for an
 * action (run / build / test / publish) and then lets the user multi-select
 * which workspace packages to apply it to. The chosen packages are executed
 * through pnpm's workspace filters.
 *
 * Run with `node --experimental-strip-types`, so this file must contain only
 * erasable TypeScript (type annotations, interfaces, type aliases) - no enums,
 * namespaces, or parameter properties.
 */
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
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
} from '@clack/prompts';

type Action = 'run' | 'build' | 'test' | 'publish';

interface PackageInfo {
	name: string;
	dir: string;
	isPrivate: boolean;
	scripts: Record<string, string>;
}

/** Maps an action to the package.json script it executes. */
const ACTION_SCRIPT: Record<Action, string> = {
	run: 'dev',
	build: 'build',
	test: 'test',
	publish: 'build',
};

/** Actions that should load the repo .env before spawning. */
const ENV_ACTIONS: Action[] = ['build', 'publish'];

/**
 * Packages eligible for `publish`. Only @zylem/game-lib is published to npm;
 * other packages are either private or not intended for the public registry
 * (e.g. @zylem/styles has no `private` flag but is not published here).
 */
const PUBLISHABLE_PACKAGES = new Set<string>(['@zylem/game-lib']);

const ROOT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');

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

/** Discover all workspace packages declared in pnpm-workspace.yaml. */
function discoverPackages(root: string): PackageInfo[] {
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
		const pkgPath = join(dir, 'package.json');
		if (!existsSync(pkgPath)) {
			continue;
		}
		try {
			const json = JSON.parse(readFileSync(pkgPath, 'utf8'));
			if (typeof json.name !== 'string') {
				continue;
			}
			byName.set(json.name, {
				name: json.name,
				dir,
				isPrivate: json.private === true,
				scripts: json.scripts ?? {},
			});
		} catch {
			// Skip unreadable/invalid package manifests.
		}
	}
	return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Whether a package can perform the given action. */
function supportsAction(pkg: PackageInfo, action: Action): boolean {
	if (action === 'publish') {
		return PUBLISHABLE_PACKAGES.has(pkg.name);
	}
	return Boolean(pkg.scripts[ACTION_SCRIPT[action]]);
}

/** Spawn a command, inheriting stdio, and resolve with its exit code. */
function runCommand(
	command: string,
	args: string[],
	env: Record<string, string | undefined>,
): Promise<number> {
	return new Promise((resolve) => {
		const child = spawn(command, args, { stdio: 'inherit', env });
		child.on('close', (code) => resolve(code ?? 0));
		child.on('error', (error) => {
			log.error(`Failed to start \`${command}\`: ${error.message}`);
			resolve(1);
		});
	});
}

function bail(message: string): never {
	cancel(message);
	process.exit(1);
}

async function main(): Promise<void> {
	intro('zylem');

	const packages = discoverPackages(ROOT_DIR);
	if (packages.length === 0) {
		bail('No workspace packages found under packages/.');
	}

	const action = (await select({
		message: 'What would you like to do?',
		options: [
			{ value: 'run', label: 'run', hint: 'start dev / watch mode' },
			{ value: 'build', label: 'build', hint: 'compile packages' },
			{ value: 'test', label: 'test', hint: 'run test suites' },
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

	const selected = (await multiselect({
		message: `Select packages to ${chosenAction}`,
		options: available.map((pkg) => ({
			value: pkg.name,
			label: pkg.name,
			hint:
				chosenAction === 'publish'
					? 'public'
					: (pkg.scripts[ACTION_SCRIPT[chosenAction]] ?? ''),
		})),
		required: true,
	})) as string[] | symbol;

	if (isCancel(selected)) {
		bail('Cancelled.');
	}
	const targets = selected as string[];

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

	let exitCode = 0;

	if (chosenAction === 'publish') {
		for (const name of targets) {
			log.step(`Building ${name}`);
			exitCode = await runCommand(
				'pnpm',
				['--filter', name, 'run', 'build'],
				env,
			);
			if (exitCode !== 0) {
				break;
			}
			log.step(`Publishing ${name}`);
			exitCode = await runCommand(
				'pnpm',
				['--filter', name, 'publish', '--access', 'public'],
				env,
			);
			if (exitCode !== 0) {
				break;
			}
		}
	} else {
		const args: string[] = [];
		if (chosenAction === 'run') {
			args.push('--parallel');
		}
		for (const name of targets) {
			args.push('--filter', name);
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
