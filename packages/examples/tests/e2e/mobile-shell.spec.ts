import { expect, test } from '@playwright/test';

test.describe('mobile examples shell', () => {
	test.beforeEach(async ({ page }, testInfo) => {
		test.skip(
			!testInfo.project.name.includes('Mobile'),
			'Mobile shell coverage only',
		);

		await page.goto('/');
	});

	test('shows the mobile shell with bottom bar and hidden desktop chrome', async ({
		page,
	}) => {
		await expect(page.locator('[data-mobile-shell]')).toBeVisible();
		await expect(page.locator('[data-mobile-demo-button]')).toBeVisible();
		await expect(page.locator('[data-mobile-editor-button]')).toBeVisible();
		await expect(page.locator('[data-side-panel]')).toHaveCount(0);
		await expect(page.locator('[data-viewport-controls]')).toHaveCount(0);

		const editor = page.locator('zylem-editor');
		await expect(editor.locator('#zylem-editor-toggle')).toHaveCount(0);
	});

	test('opens the demo drawer and closes it when the active tile is tapped', async ({
		page,
	}) => {
		const drawer = page.locator('[data-mobile-demo-drawer]');
		const demoButton = page.locator('[data-mobile-demo-button]');

		await expect(drawer).toHaveAttribute('data-state', 'closed');
		await demoButton.click();
		await expect(drawer).toHaveAttribute('data-state', 'open');

		const search = page.locator('[data-mobile-demo-search]');
		await expect(search).toBeVisible();
		await search.fill('empty');

		const emptyGameTile = page.locator('[data-mobile-demo-card="20-empty-game"]');
		await expect(emptyGameTile).toBeVisible();
		await emptyGameTile.click();

		await expect(page).toHaveURL(/\/demos\/empty-game$/);
		await expect(drawer).toHaveAttribute('data-state', 'closed');

		await demoButton.click();
		await expect(drawer).toHaveAttribute('data-state', 'open');
		await page.locator('[data-mobile-demo-card="20-empty-game"]').click();
		await expect(drawer).toHaveAttribute('data-state', 'closed');
	});

	test('opens the editor from the bottom bar', async ({ page }) => {
		const editor = page.locator('zylem-editor');

		await page.locator('[data-mobile-editor-button]').click();
		await expect(editor.getByText('Zylem Editor')).toBeVisible();

		await editor.locator('[data-testid="floating-panel-close"]').click();
		await expect(editor.getByText('Zylem Editor')).not.toBeVisible();
	});

	test('loads direct demo routes with the drawer closed', async ({ page }) => {
		await page.goto('/demos/empty-game');

		await expect(page.locator('[data-mobile-demo-drawer]')).toHaveAttribute(
			'data-state',
			'closed',
		);
		await expect(page.locator('zylem-game[data-demo-id="20-empty-game"]')).toBeVisible();
	});
});
