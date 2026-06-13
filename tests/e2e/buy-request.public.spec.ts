/**
 * buy-request.public.spec.ts
 *
 * M4/M5: Model is required by the API; the form must validate it client-side
 * with friendly copy (it used to read as optional and surface raw
 * 'class_name required' errors). Public page, no auth.
 */
import { test, expect } from '@playwright/test';

test.describe('Buy request form validation', () => {
  test('requires a model, with a friendly (non-raw) message', async ({ page }) => {
    // Prefill the make via URL; leave Model empty.
    await page.goto('/buy-request?make=Toyota');

    // Fill the natively-required fields so submit reaches the model check.
    await page.getByPlaceholder('Your name').fill('Regression Test');
    await page.getByPlaceholder('5x xxx xxxx').fill('50000000');
    // Max Budget is a required <select> — pick the first real option.
    await page.locator('label:has-text("Max Budget") + select').selectOption({ index: 1 });

    await page.getByRole('button', { name: /Submit Buy Request/ }).click();

    await expect(page.getByText('Please choose a model.')).toBeVisible();
    await expect(page.getByText(/class_name/)).toHaveCount(0);
  });
});
