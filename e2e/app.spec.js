import { test, expect } from '@playwright/test';
import fs from 'fs';
import { join, resolve } from 'path';

test.describe('PDF Password Remover App', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
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

    // Upload the file
    await page.setInputFiles('input[type="file"]', pdfPath);

    // Enter the password
    await page.getByLabel(/pdf password/i).fill('password');

    // Click the remove password button
    const button = page.getByRole('button', { name: /remove password/i });
    await expect(button).toBeEnabled();

    // Intercept the download after button click
    const [download] = await Promise.all([page.waitForEvent('download'), button.click()]);

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

  test('should produce decrypted PDF matching the original', async ({ page }) => {
    // Path to the protected PDF and original PDF in the repo
    const protectedPdfPath = resolve(__dirname, './assets/file-sample_150kB-protected.pdf');
    const originalPdfPath = resolve(__dirname, './assets/file-sample_150kB.pdf');

    // Upload the protected file
    await page.setInputFiles('input[type="file"]', protectedPdfPath);

    // Enter the password
    await page.getByLabel(/pdf password/i).fill('password');

    // Click the remove password button
    const button = page.getByRole('button', { name: /remove password/i });
    await expect(button).toBeEnabled();

    // Intercept the download after button click
    const [download] = await Promise.all([page.waitForEvent('download'), button.click()]);

    // Save the decrypted file
    const decryptedPdfPath = join(__dirname, 'assets', 'decrypted-temp.pdf');
    await download.saveAs(decryptedPdfPath);

    // Read both files
    const originalPdfBuffer = fs.readFileSync(originalPdfPath);
    const decryptedPdfBuffer = fs.readFileSync(decryptedPdfPath);

    // Verify both are valid PDFs
    expect(originalPdfBuffer.toString('utf-8', 0, 4)).toBe('%PDF');
    expect(decryptedPdfBuffer.toString('utf-8', 0, 4)).toBe('%PDF');

    // Verify decrypted file is not empty and reasonably similar in size
    // (allowing for some variation due to PDF re-encoding)
    const sizeDifference = Math.abs(decryptedPdfBuffer.length - originalPdfBuffer.length);
    const percentDifference = (sizeDifference / originalPdfBuffer.length) * 100;

    // Allow up to 10% difference in file size due to PDF rewriting/metadata
    expect(percentDifference).toBeLessThan(10);
    expect(decryptedPdfBuffer.length).toBeGreaterThan(0);

    // Clean up temporary file
    fs.unlinkSync(decryptedPdfPath);
  });
});

test.describe('HEIC to PNG Converter', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Switch to HEIC tab
    await page.getByRole('img').click();
  });

  test('should display HEIC to PNG converter interface', async ({ page }) => {
    // Check for HEIC-specific elements
    await expect(page.getByLabel(/select heic image/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /convert to png/i })).toBeVisible();
    await expect(page.getByText(/convert your heic images to png format/i)).toBeVisible();
  });

  test('should disable convert button when no file is selected', async ({ page }) => {
    const button = page.getByRole('button', { name: /convert to png/i });
    await expect(button).toBeDisabled();
  });

  test('should convert HEIC image to PNG', { timeout: 90000 }, async ({ page }) => {
    const heicPath = resolve(__dirname, './assets/sample.heic');

    // Upload the file
    await page.setInputFiles('input[type="file"]', heicPath);

    // Check that file is selected
    const fileInput = page.getByLabel(/select heic image/i);
    await expect(fileInput).toHaveValue(/sample\.heic/);

    // Click the convert button (HEIC conversion can take a while)
    const button = page.getByRole('button', { name: /convert to png/i });
    await expect(button).toBeEnabled();

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 90000 }),
      button.click(),
    ]);

    // Wait for the download to complete
    const filePath = await download.path();
    expect(filePath).toBeTruthy();

    // Check the file is a valid PNG (PNG signature: 89 50 4E 47)
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(4);
    fs.readSync(fd, buffer, 0, 4, 0);
    fs.closeSync(fd);
    expect(buffer.toString('latin1')).toBe('\x89PNG');

    // Verify file size is reasonable
    const stats = fs.statSync(filePath);
    expect(stats.size).toBeGreaterThan(0);
  });

  test('should switch between tabs correctly', async ({ page }) => {
    // Start on HEIC tab
    await expect(page.getByLabel(/select heic image/i)).toBeVisible();

    // Switch to PDF tab
    await page.getByRole('img').click();
    await expect(page.getByLabel(/select pdf file/i)).toBeVisible();

    // Switch back to HEIC tab
    await page.getByRole('img').click();
    await expect(page.getByLabel(/select heic image/i)).toBeVisible();
  });
});
