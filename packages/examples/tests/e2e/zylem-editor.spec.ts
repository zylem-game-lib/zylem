import { test, expect } from '@playwright/test';

test.describe('<zylem-editor> web component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders the zylem-editor element', async ({ page }) => {
    // The zylem-editor web component should be present in the DOM
    const editor = page.locator('zylem-editor');
    await expect(editor).toBeAttached();
  });

  test('renders the editor toggle button', async ({ page }) => {
    // The toggle button lives inside the shadow DOM of zylem-editor
    const editor = page.locator('zylem-editor');
    const toggleButton = editor.locator('#zylem-editor-toggle');
    
    await expect(toggleButton).toBeVisible();
    await expect(toggleButton).toHaveAttribute('type', 'button');
  });

  test('opens the editor panel when toggle button is clicked', async ({ page }) => {
    const editor = page.locator('zylem-editor');
    const toggleButton = editor.locator('#zylem-editor-toggle');
    
    // Click the toggle button to open the editor panel
    await toggleButton.click();
    
    // The floating panel with title "Zylem Editor" should appear
    const panelTitle = editor.getByText('Zylem Editor');
    await expect(panelTitle).toBeVisible();
  });

  test('closes the editor panel when close button is clicked', async ({ page }) => {
    const editor = page.locator('zylem-editor');
    const toggleButton = editor.locator('#zylem-editor-toggle');
    
    // Open the panel
    await toggleButton.click();
    
    const panelTitle = editor.getByText('Zylem Editor');
    await expect(panelTitle).toBeVisible();
    
    // The close button has data-testid="floating-panel-close"
    const closeButton = editor.locator('[data-testid="floating-panel-close"]');
    await closeButton.click();
    
    // Panel should be closed
    await expect(panelTitle).not.toBeVisible();
  });
});
