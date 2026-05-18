import { expect, test } from '@playwright/test';

test.describe('desktop side panel', () => {
	test.beforeEach(async ({ page }, testInfo) => {
		test.skip(
			testInfo.project.name.includes('Mobile'),
			'Desktop side panel coverage only',
		);

		await page.goto('/');
	});

	test('keeps side panel content within available width', async ({ page }) => {
		const sidePanel = page.locator('[data-side-panel]');
		await expect(sidePanel).toBeVisible();

		const sidePanelHasHorizontalOverflow = await sidePanel.evaluate((element) => {
			const contentElements = Array.from(element.children).filter(
				(child) => child.tagName !== 'BUTTON',
			);

			return contentElements.some(
				(contentElement) => contentElement.scrollWidth > contentElement.clientWidth,
			);
		});

		expect(sidePanelHasHorizontalOverflow).toBeFalsy();
	});

	test('closes side panel after selecting a demo', async ({ page }) => {
		const searchInput = page.locator('[data-side-panel] input[placeholder="Search..."]');
		const sidePanelToggle = page.locator('[data-side-panel] button[aria-controls="examples-list-panel"]');
		const demoButton = page.locator('[data-side-panel] button[aria-label="Empty Game"]');

		await searchInput.fill('empty game');
		await expect(demoButton).toBeVisible();
		await demoButton.click();

		await expect(page).toHaveURL(/\/demos\/empty-game$/);
		await expect(sidePanelToggle).toHaveAttribute('aria-expanded', 'false');
	});
});
