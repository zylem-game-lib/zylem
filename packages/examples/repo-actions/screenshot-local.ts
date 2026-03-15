import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, '..');
const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? 'http://127.0.0.1:1337';
const SERVER_READY_TIMEOUT_MS = 60_000;
const CHECK_INTERVAL_MS = 1_000;

const wait = (durationMs: number) =>
	new Promise((resolve) => {
		setTimeout(resolve, durationMs);
	});

const isServerReady = async (url: string) => {
	try {
		const response = await fetch(url);
		return response.ok;
	} catch {
		return false;
	}
};

const waitForServer = async (url: string) => {
	const timeoutAt = Date.now() + SERVER_READY_TIMEOUT_MS;

	while (Date.now() < timeoutAt) {
		if (await isServerReady(url)) {
			return;
		}

		await wait(CHECK_INTERVAL_MS);
	}

	throw new Error(`Timed out waiting for the examples app at ${url}.`);
};

const createChildProcess = (command: string, args: string[]) => {
	return spawn(command, args, {
		cwd: PACKAGE_ROOT,
		env: process.env,
		stdio: 'inherit',
		shell: process.platform === 'win32',
	});
};

const stopChildProcess = async (
	childProcess: ReturnType<typeof createChildProcess> | null
) => {
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

	try {
		if (!(await isServerReady(BASE_URL))) {
			const port = screenshotServerUrl.port || '1337';

			devServerProcess = createChildProcess('pnpm', [
				'exec',
				'vite',
				'--host',
				'127.0.0.1',
				'--port',
				port,
				'--strictPort',
			]);

			await waitForServer(BASE_URL);
		}

		const screenshotProcess = createChildProcess('node', [
			'--experimental-strip-types',
			'./repo-actions/screenshot.ts',
			...forwardedArgs,
		]);

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
