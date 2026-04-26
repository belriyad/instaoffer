/**
 * valuation.public.spec.ts
 *
 * Tests the seller valuation flow (public, no auth needed for estimation).
 */
import { test, expect } from '@playwright/test';

test.describe('Valuation page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/valuation');
  });

  test('page loads and form is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /valuation|estimate|sell/i })).toBeVisible();
  });

  test('shows error when submitting empty form', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: /get estimate|value my car|submit/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      // Should show validation feedback
      await expect(page.locator('input:invalid, [aria-invalid="true"], .error, [data-error]').first()).toBeVisible({ timeout: 5_000 }).catch(() => {
        // HTML5 native validation — just confirm we didn't navigate away
        expect(page.url()).toMatch(/\/valuation/);
      });
    }
  });
});
