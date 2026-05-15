import { test, expect, type Page } from '@playwright/test';

const SHARED_PROFILE = {
  make: 'Toyota',
  class_name: 'Camry',
  model: '',
  trim: '',
  year: 2020,
  km: 100000,
  condition: 'good',
  city: 'Doha',
};

function seedProfile(page: Page) {
  return page.addInitScript(value => {
    window.sessionStorage.setItem('instaoffer_vehicle_profile', JSON.stringify(value));
  }, SHARED_PROFILE);
}

test.describe('Shared vehicle profile prefill', () => {
  test('prefills valuation from shared vehicle profile', async ({ page }) => {
    await seedProfile(page);
    await page.goto('/valuation');
    await expect(page.getByText(/2020\s*·\s*Toyota\s*·\s*Camry/i).first()).toBeVisible();
  });

  test('prefills trade-in from shared vehicle profile', async ({ page }) => {
    await seedProfile(page);
    await page.goto('/trade-in');
    await expect(page.locator('select').first()).toHaveValue('2020');
    await expect(page.locator('select').nth(1)).toHaveValue('Doha');
  });

  test('prefills urgent sale from shared vehicle profile', async ({ page }) => {
    await seedProfile(page);
    await page.goto('/urgent-sale');
    await expect(page.locator('select').first()).toHaveValue('2020');
    await expect(page.locator('select').nth(2)).toHaveValue('Doha');
  });
});
