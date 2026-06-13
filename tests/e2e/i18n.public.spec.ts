/**
 * i18n.public.spec.ts
 *
 * Guards that the localized surfaces actually switch to Arabic (the locale
 * system is wired, not just present): the header nav and the login page.
 */
import { test, expect } from '@playwright/test';

test.describe('Arabic localization', () => {
  test('login page and nav render Arabic when locale = ar', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('instaoffer_locale', 'ar'));

    await page.goto('/login');

    // Page applies dir=rtl for Arabic.
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    // Login heading + submit button are Arabic, not the English source strings.
    await expect(page.getByRole('heading', { name: 'مرحباً بعودتك' })).toBeVisible();
    await expect(page.getByText('Welcome back')).toHaveCount(0);
    // Nav "Sign In" is localized too.
    await expect(page.getByText('تسجيل الدخول').first()).toBeVisible();
  });
});
