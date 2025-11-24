import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
	await page.goto('/');
	await page.locator('canvas');
	await page.locator('#zylem-debug-button').click();
	await page.getByLabel('Pause').click();
	expect(page.locator('canvas')).toBeDefined();
});