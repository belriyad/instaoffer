/**
 * dealer-preferences.spec.ts
 *
 * Tests the /dashboard/preferences page (authenticated dealer).
 */
import { test, expect } from '@playwright/test';

test.describe('Dealer Preferences page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/preferences');
    await page.waitForLoadState('networkidle');
  });

  test('renders without crashing', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/preferences/);
  });

  test('has a back link to dashboard', async ({ page }) => {
    const back = page.getByRole('link', { name: /back|dashboard/i }).first();
    await expect(back).toBeVisible();
  });

  test('shows preferences form fields', async ({ page }) => {
    // At least one input/select/checkbox should exist
    const field = page.locator('input, select, textarea').first();
    await expect(field).toBeVisible({ timeout: 8_000 });
  });

  test('Save button is present', async ({ page }) => {
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible({ timeout: 8_000 });
  });
});
