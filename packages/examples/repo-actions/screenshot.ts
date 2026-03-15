import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDemoRoutePath, getDemoRouteSlug } from '../src/router-config.ts';
import { SCREENSHOT_MODE_SEARCH_PARAM } from '../src/screenshot-mode.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, '..');
const DEMOS_DIR = path.join(PACKAGE_ROOT, 'src', 'demos');
const OUTPUT_DIR = path.join(PACKAGE_ROOT, 'screenshots');
const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? 'http://127.0.0.1:1337';
const SCREENSHOT_TARGET_SELECTOR = '[data-demo-screenshot-target]';
const LOADING_OVERLAY_SELECTOR = '[data-demo-loading-overlay]';
const SETTLE_DELAY_MS = 1000;

const HELP_TEXT = `
Usage:
  pnpm dev:examples:screenshot --name=space-invaders
  pnpm dev:examples:screenshot --all
  pnpm --filter @zylem/examples screenshot:local -- 00-space-invaders
`;

const collectDemoIds = () => {
	return fs
		.readdirSync(DEMOS_DIR, {
			withFileTypes: true,
		})
		.filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
		.map((entry) => entry.name.replace(/\.ts$/, ''))
		.sort((left, right) =>
			left.localeCompare(right, undefined, { numeric: true })
		);
};

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

const resolveRequestedDemoIds = () => {
	const { all, requestedTargets } = parseCliOptions(process.argv.slice(2));
	const allDemoIds = collectDemoIds();

	if (all || requestedTargets.length === 0) {
		return allDemoIds;
	}

	const requestedDemos = new Set(requestedTargets);
	return allDemoIds.filter((demoId) => {
		return (
			requestedDemos.has(demoId) || requestedDemos.has(getDemoRouteSlug(demoId))
		);
	});
};

async function main() {
	const cliOptions = parseCliOptions(process.argv.slice(2));
	if (cliOptions.help) {
		console.log(HELP_TEXT.trim());
		return;
	}

	const demoIds = resolveRequestedDemoIds();

	if (demoIds.length === 0) {
		throw new Error(
			'No matching demos were found for the requested screenshot targets.'
		);
	}

	const browser = await chromium.launch({ headless: true });
	const page = await browser.newPage({
		viewport: { width: 1600, height: 1000 },
	});

	fs.mkdirSync(OUTPUT_DIR, { recursive: true });

	for (const demoId of demoIds) {
		const routePath = getDemoRoutePath(demoId);
		const targetUrl = new URL(routePath, `${BASE_URL}/`);
		targetUrl.searchParams.set(SCREENSHOT_MODE_SEARCH_PARAM, '1');

		await page.goto(targetUrl.toString(), { waitUntil: 'domcontentloaded' });
		await page.locator(SCREENSHOT_TARGET_SELECTOR).waitFor({
			state: 'visible',
			timeout: 60_000,
		});
		await page.locator('zylem-game').waitFor({
			state: 'attached',
			timeout: 60_000,
		});
		await page.waitForFunction(
			(loadingOverlaySelector) => {
				return !document.querySelector(loadingOverlaySelector);
			},
			LOADING_OVERLAY_SELECTOR,
			{ timeout: 60_000 }
		);
		await page.waitForTimeout(SETTLE_DELAY_MS);

		await page.locator(SCREENSHOT_TARGET_SELECTOR).screenshot({
			path: path.join(OUTPUT_DIR, `${demoId}.png`),
		});

		console.log(`Saved screenshot for ${demoId} at ${routePath}`);
	}

	await browser.close();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
