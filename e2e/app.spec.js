import { test, expect } from '@playwright/test';
import { join, resolve } from 'path';

test.describe('PDF Password Remover App', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    const appUrl = process.env.APP_URL || 'http://localhost:3001/pdf-password-remover/';
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

  test('should decrypt a password-protected PDF', async ({ page }) => {
    // Path to the protected PDF in the repo
    const pdfPath = resolve(__dirname, './assets/file-sample_150kB-protected.pdf');

    // Intercept the download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      // Upload the file
      page.setInputFiles('input[type="file"]', pdfPath),
    ]);

    // Enter the password
    await page.getByLabel(/pdf password/i).fill('password');

    // Click the remove password button
    const button = page.getByRole('button', { name: /remove password/i });
    await expect(button).toBeEnabled();
    await button.click();

    // Wait for the download to complete
    const savePath = join(__dirname, 'assets', 'decrypted.pdf');
    const filePath = await download.path();
    expect(filePath).toBeTruthy();
    // Optionally, save the file somewhere
    await download.saveAs(savePath);

    // Optionally, check the file size or type
    const fs = require('fs');
    const stats = fs.statSync(filePath);
    expect(stats.size).toBeGreaterThan(0);
    // Optionally, check the file is a PDF
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(4);
    fs.readSync(fd, buffer, 0, 4, 0);
    fs.closeSync(fd);
    expect(buffer.toString()).toBe('%PDF');
  });

  test('should have proper page structure', async ({ page }) => {
    // Check for main content area
    const rootElement = page.locator('#root');
    await expect(rootElement).toBeVisible();
  });
});
