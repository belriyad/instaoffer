/**
 * homepage.public.spec.ts
 *
 * Public-facing home page tests — no auth required.
 * Runs in the "public" Playwright project.
 */
import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders the hero section', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('has a Get Valuation / Sell My Car CTA', async ({ page }) => {
    const cta = page.getByRole('link', { name: /sell my car|get valuation|instant offer/i }).first();
    await expect(cta).toBeVisible();
  });

  test('navbar is visible', async ({ page }) => {
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('footer is visible', async ({ page }) => {
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });

  test('navigates to How It Works', async ({ page }) => {
    await page.getByRole('link', { name: /how it works/i }).first().click();
    await expect(page).toHaveURL(/\/how-it-works/);
  });
});
