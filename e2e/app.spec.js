import { test, expect } from '@playwright/test';

test.describe('PDF Password Remover App', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    const appUrl = process.env.APP_URL || 'http://localhost:3001/pdf-password-remover';
    await page.goto(appUrl);
  });

  test('should display the PDF password remover interface', async ({ page }) => {
    // Check for main title
    await expect(page.getByRole('heading', { name: /pdf password remover/i })).toBeVisible();

    // Check for subtitle
    await expect(page.getByText(/upload a password-protected pdf/i)).toBeVisible();

    // Check for file input
    await expect(page.getByLabel(/select pdf file/i)).toBeVisible();

    // Check for password input
    await expect(page.getByLabel(/pdf password/i)).toBeVisible();

    // Check for submit button
    await expect(page.getByRole('button', { name: /remove password/i })).toBeVisible();
  });

  test('should display privacy information', async ({ page }) => {
    // Check for privacy information
    await expect(page.getByText(/all processing is done in your browser/i)).toBeVisible();
    await expect(page.getByText(/your files never leave your device/i)).toBeVisible();
  });

  test('should disable button when no file is selected', async ({ page }) => {
    const button = page.getByRole('button', { name: /remove password/i });
    await expect(button).toBeDisabled();
  });

  test('should have correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/pdf password remover/i);
  });

  test('should have proper page structure', async ({ page }) => {
    // Check for main content area
    const rootElement = page.locator('#root');
    await expect(rootElement).toBeVisible();
  });
});
