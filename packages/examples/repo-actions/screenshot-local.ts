import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, '..');
const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? 'http://127.0.0.1:3331';
const EXAMPLES_HEALTHCHECK_PATH = '/src/examples-config.ts';
const SERVER_READY_TIMEOUT_MS = 60_000;
const CHECK_INTERVAL_MS = 1_000;
const PORT_PROBE_LIMIT = 20;

const wait = (durationMs: number) =>
	new Promise((resolve) => {
		setTimeout(resolve, durationMs);
	});

const isServerReady = async (url: string) => {
	try {
		const response = await fetch(new URL(EXAMPLES_HEALTHCHECK_PATH, url));
		return response.ok && response.headers.get('content-type')?.includes('javascript') === true;
	} catch {
		return false;
	}
};

// Bind the wildcard address (dual-stack) so listeners on any interface are
// detected; a host-specific probe misses e.g. an IPv6-wildcard listener.
const isPortFree = (port: number) =>
	new Promise<boolean>((resolve) => {
		const probe = createServer();
		probe.once('error', () => resolve(false));
		probe.once('listening', () => {
			probe.close(() => resolve(true));
		});
		probe.listen(port);
	});

// Another app (e.g. a sibling repo's dev server) may already hold the
// preferred port, so scan forward for the first port we can bind.
const findFreePort = async (startPort: number) => {
	for (let offset = 0; offset < PORT_PROBE_LIMIT; offset += 1) {
		const candidate = startPort + offset;
		if (await isPortFree(candidate)) {
			return candidate;
		}
	}
	throw new Error(
		`Could not find a free port in range ${startPort}-${startPort + PORT_PROBE_LIMIT - 1}.`
	);
};

const waitForServer = async (url: string, hasProcessExited: () => boolean) => {
	const timeoutAt = Date.now() + SERVER_READY_TIMEOUT_MS;

	while (Date.now() < timeoutAt) {
		if (await isServerReady(url)) {
			return;
		}
		if (hasProcessExited()) {
			throw new Error('The examples dev server exited before becoming ready.');
		}

		await wait(CHECK_INTERVAL_MS);
	}

	throw new Error(`Timed out waiting for the examples app at ${url}.`);
};

const createChildProcess = (
	command: string,
	args: string[],
	env: NodeJS.ProcessEnv = process.env
) => {
	return spawn(command, args, {
		cwd: PACKAGE_ROOT,
		env,
		stdio: 'inherit',
		shell: process.platform === 'win32',
	});
};

const stopChildProcess = async (childProcess: ReturnType<typeof createChildProcess> | null) => {
	if (!childProcess || childProcess.killed) {
		return;
	}

	childProcess.kill(process.platform === 'win32' ? undefined : 'SIGINT');

	await new Promise<void>((resolve) => {
		childProcess.once('exit', () => resolve());
	});
};

async function main() {
	const forwardedArgs = process.argv.slice(2).filter((argument) => argument !== '--');
	const screenshotServerUrl = new URL(BASE_URL);
	let devServerProcess: ReturnType<typeof createChildProcess> | null = null;
	let resolvedBaseUrl = BASE_URL;

	try {
		if (!(await isServerReady(BASE_URL))) {
			const host = screenshotServerUrl.hostname || '127.0.0.1';
			const preferredPort = Number(screenshotServerUrl.port || '3331');
			const port = await findFreePort(preferredPort);
			if (port !== preferredPort) {
				console.log(
					`Port ${preferredPort} is in use by another app; starting the examples server on port ${port} instead.`
				);
			}
			screenshotServerUrl.port = String(port);
			resolvedBaseUrl = screenshotServerUrl.origin;

			devServerProcess = createChildProcess(
				'pnpm',
				[
					'exec',
					'vite',
					'--host',
					host,
					'--port',
					String(port),
					'--strictPort',
				],
				{ ...process.env, BROWSER: 'none' }
			);

			let devServerExited = false;
			devServerProcess.once('exit', () => {
				devServerExited = true;
			});

			await waitForServer(resolvedBaseUrl, () => devServerExited);
		}

		const screenshotProcess = createChildProcess(
			'node',
			[
				'--experimental-strip-types',
				'--disable-warning=ExperimentalWarning',
				'./repo-actions/screenshot.ts',
				...forwardedArgs,
			],
			{ ...process.env, SCREENSHOT_BASE_URL: resolvedBaseUrl }
		);

		const exitCode = await new Promise<number>((resolve, reject) => {
			screenshotProcess.once('error', reject);
			screenshotProcess.once('exit', (code) => resolve(code ?? 1));
		});

		if (exitCode !== 0) {
			process.exit(exitCode);
		}
	} finally {
		await stopChildProcess(devServerProcess);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
