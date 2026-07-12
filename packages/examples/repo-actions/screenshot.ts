import fs from 'node:fs';
import path from 'node:path';
import { type Page, chromium } from '@playwright/test';
import { getDemoRoutePath, getDemoRouteSlug } from '../src/router-config.ts';
import { SCREENSHOT_MODE_SEARCH_PARAM } from '../src/screenshot-mode.ts';
import { OUTPUT_DIR, archiveOrphanScreenshots, collectDemoIds } from './screenshot-workflow.ts';

const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? 'http://127.0.0.1:3331';
const SCREENSHOT_TARGET_SELECTOR = '[data-demo-screenshot-target]';
const LOADING_OVERLAY_SELECTOR = '[data-demo-loading-overlay]';
const SETTLE_DELAY_MS = 1000;
const STEP_TIMEOUT_MS = 60_000;

/**
 * Full Chromium (new headless) + WebGPU flags.
 * Default `chromium.launch({ headless: true })` uses headless_shell, which
 * typically has no WebGPU adapter and falls back to WebGL2.
 */
const WEBGPU_LAUNCH_ARGS = [
	'--enable-unsafe-webgpu',
	'--enable-webgpu-developer-features',
	'--ignore-gpu-blocklist',
	'--enable-features=WebGPU,Vulkan',
	...(process.platform === 'linux'
		? ['--use-angle=vulkan', '--disable-vulkan-surface', '--no-sandbox']
		: []),
];

const probeWebGpu = async (page: Page) => {
	return page.evaluate(async () => {
		const gpu = (navigator as { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
		if (!gpu) {
			return { available: false, reason: 'navigator.gpu missing' };
		}
		const adapter = (await gpu.requestAdapter()) as {
			info?: {
				vendor?: string;
				architecture?: string;
				description?: string;
				device?: string;
			};
		} | null;
		if (!adapter) {
			return { available: false, reason: 'requestAdapter() returned null' };
		}
		return {
			available: true,
			info: adapter.info
				? {
						vendor: adapter.info.vendor ?? null,
						architecture: adapter.info.architecture ?? null,
						description: adapter.info.description ?? null,
						device: adapter.info.device ?? null,
					}
				: null,
		};
	});
};

const HELP_TEXT = `
Usage:
  pnpm dev:examples:screenshot --name=space-invaders
  pnpm dev:examples:screenshot --all
  pnpm --filter @zylem/examples screenshot:local -- space-invaders
`;

type ScreenshotCliOptions = {
	help: boolean;
	all: boolean;
	requestedTargets: string[];
};

const parseCliOptions = (arguments_: string[]): ScreenshotCliOptions => {
	const options: ScreenshotCliOptions = {
		help: false,
		all: false,
		requestedTargets: [],
	};

	for (let index = 0; index < arguments_.length; index += 1) {
		const argument = arguments_[index];

		if (!argument || argument === '--') {
			continue;
		}

		if (argument === '--help' || argument === '-h') {
			options.help = true;
			continue;
		}

		if (argument === '--all') {
			options.all = true;
			continue;
		}

		if (argument.startsWith('--name=')) {
			const targetName = argument.slice('--name='.length).trim();
			if (!targetName) {
				throw new Error('Expected a demo name after "--name=".');
			}
			options.requestedTargets.push(targetName);
			continue;
		}

		if (argument === '--name') {
			const targetName = arguments_[index + 1]?.trim();
			if (!targetName || targetName.startsWith('-')) {
				throw new Error('Expected a demo name after "--name".');
			}
			options.requestedTargets.push(targetName);
			index += 1;
			continue;
		}

		if (argument.startsWith('-')) {
			throw new Error(`Unknown screenshot option "${argument}".`);
		}

		options.requestedTargets.push(argument);
	}

	return options;
};

const resolveRequestedDemoIds = (allDemoIds: string[]) => {
	const { all, requestedTargets } = parseCliOptions(process.argv.slice(2));

	if (all || requestedTargets.length === 0) {
		return allDemoIds;
	}

	const requestedDemos = new Set(requestedTargets);
	return allDemoIds.filter((demoId) => {
		return requestedDemos.has(demoId) || requestedDemos.has(getDemoRouteSlug(demoId));
	});
};

const formatMs = (startedAt: number) => `${Date.now() - startedAt}ms`;

const logStep = (demoId: string, message: string) => {
	console.log(`[screenshot:${demoId}] ${message}`);
};

const attachPageLogging = (page: Page, getDemoId: () => string) => {
	page.on('console', (message) => {
		console.log(`[browser:${getDemoId()}] ${message.type()}: ${message.text()}`);
	});
	page.on('pageerror', (error) => {
		console.error(`[browser:${getDemoId()}] pageerror: ${error.message}`);
	});
	page.on('requestfailed', (request) => {
		const failure = request.failure();
		console.error(
			`[browser:${getDemoId()}] requestfailed: ${request.method()} ${request.url()} (${failure?.errorText ?? 'unknown'})`
		);
	});
};

const describePageState = async (page: Page) => {
	return page.evaluate(
		({ screenshotTargetSelector, loadingOverlaySelector }) => {
			const target = document.querySelector(screenshotTargetSelector);
			const game = document.querySelector('zylem-game');
			const overlay = document.querySelector(loadingOverlaySelector);
			return {
				href: location.href,
				title: document.title,
				readyState: document.readyState,
				hasScreenshotTarget: Boolean(target),
				screenshotTargetVisible: Boolean(target && (target as HTMLElement).offsetParent !== null),
				hasZylemGame: Boolean(game),
				hasLoadingOverlay: Boolean(overlay),
				bodyTextSample: (document.body?.innerText ?? '').slice(0, 240),
			};
		},
		{
			screenshotTargetSelector: SCREENSHOT_TARGET_SELECTOR,
			loadingOverlaySelector: LOADING_OVERLAY_SELECTOR,
		}
	);
};

const runTimedStep = async <T>(
	demoId: string,
	label: string,
	action: () => Promise<T>
): Promise<T> => {
	const startedAt = Date.now();
	logStep(demoId, `start ${label}`);
	try {
		const result = await action();
		logStep(demoId, `done ${label} (${formatMs(startedAt)})`);
		return result;
	} catch (error) {
		logStep(demoId, `failed ${label} after ${formatMs(startedAt)}`);
		throw error;
	}
};

async function main() {
	const cliOptions = parseCliOptions(process.argv.slice(2));
	if (cliOptions.help) {
		console.log(HELP_TEXT.trim());
		return;
	}

	const allDemoIds = collectDemoIds();
	const archivedScreenshots = archiveOrphanScreenshots(allDemoIds);
	for (const fileName of archivedScreenshots) {
		console.log(`Moved orphaned screenshot to old-screens/${fileName}`);
	}

	const demoIds = resolveRequestedDemoIds(allDemoIds);

	if (demoIds.length === 0) {
		throw new Error('No matching demos were found for the requested screenshot targets.');
	}

	console.log(`[screenshot] baseUrl=${BASE_URL}`);
	console.log(`[screenshot] demos=${demoIds.join(', ')}`);

	const launchStartedAt = Date.now();
	console.log('[screenshot] launching full chromium with WebGPU (headless)');
	const browser = await chromium.launch({
		channel: 'chromium',
		headless: true,
		args: WEBGPU_LAUNCH_ARGS,
	});
	const page = await browser.newPage({
		viewport: { width: 1600, height: 1000 },
	});
	console.log(`[screenshot] browser ready (${formatMs(launchStartedAt)})`);

	// Probe on a real https/http origin; about:blank often has no navigator.gpu.
	await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: STEP_TIMEOUT_MS });
	const adapterInfo = await probeWebGpu(page);
	console.log(`[screenshot] webgpu=${JSON.stringify(adapterInfo)}`);
	if (!adapterInfo.available) {
		console.warn(
			'[screenshot] WebGPU adapter unavailable; demos may fall back to WebGL2 and run slowly.'
		);
	}

	fs.mkdirSync(OUTPUT_DIR, { recursive: true });

	const runStartedAt = Date.now();
	let activeDemoId = 'startup';
	attachPageLogging(page, () => activeDemoId);

	for (const demoId of demoIds) {
		activeDemoId = demoId;
		const demoStartedAt = Date.now();
		const routePath = getDemoRoutePath(demoId);
		const targetUrl = new URL(routePath, `${BASE_URL}/`);
		targetUrl.searchParams.set(SCREENSHOT_MODE_SEARCH_PARAM, '1');
		const url = targetUrl.toString();

		logStep(demoId, `capturing ${url}`);

		try {
			await runTimedStep(demoId, 'goto(domcontentloaded)', () =>
				page.goto(url, { waitUntil: 'domcontentloaded', timeout: STEP_TIMEOUT_MS })
			);
			await runTimedStep(demoId, `wait visible ${SCREENSHOT_TARGET_SELECTOR}`, () =>
				page.locator(SCREENSHOT_TARGET_SELECTOR).waitFor({
					state: 'visible',
					timeout: STEP_TIMEOUT_MS,
				})
			);
			await runTimedStep(demoId, 'wait attached zylem-game', () =>
				page.locator('zylem-game').waitFor({
					state: 'attached',
					timeout: STEP_TIMEOUT_MS,
				})
			);
			await runTimedStep(demoId, `wait gone ${LOADING_OVERLAY_SELECTOR}`, () =>
				page.waitForFunction(
					(loadingOverlaySelector) => {
						return !document.querySelector(loadingOverlaySelector);
					},
					LOADING_OVERLAY_SELECTOR,
					{ timeout: STEP_TIMEOUT_MS }
				)
			);
			await runTimedStep(demoId, `settle ${SETTLE_DELAY_MS}ms`, () =>
				page.waitForTimeout(SETTLE_DELAY_MS)
			);

			const outputPath = path.join(OUTPUT_DIR, `${demoId}.png`);
			await runTimedStep(demoId, `screenshot -> ${outputPath}`, () =>
				page.locator(SCREENSHOT_TARGET_SELECTOR).screenshot({
					path: outputPath,
				})
			);

			logStep(demoId, `saved ${routePath} (demo total ${formatMs(demoStartedAt)})`);
		} catch (error) {
			try {
				const state = await describePageState(page);
				console.error(`[screenshot:${demoId}] page state on failure:`, state);
			} catch (stateError) {
				console.error(
					`[screenshot:${demoId}] could not read page state:`,
					stateError instanceof Error ? stateError.message : stateError
				);
			}
			throw error;
		}
	}

	await browser.close();
	console.log(`[screenshot] done (${formatMs(runStartedAt)})`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
