/**
 * auth.setup.ts
 *
 * Runs once before authenticated test projects.
 * Logs in as a dealer, saves localStorage tokens to tests/.auth/dealer.json
 * so every subsequent test reuses the session without re-logging in.
 *
 * Set env vars to override credentials:
 *   DEALER_EMAIL   (default: dealer@test.com)
 *   DEALER_PASSWORD
 */
import { test as setup, expect } from '@playwright/test';
import path from 'path';

const AUTH_FILE = path.join(__dirname, '.auth/dealer.json');

const EMAIL = process.env.DEALER_EMAIL ?? 'dealer@test.com';
const PASSWORD = process.env.DEALER_PASSWORD ?? 'password123';

setup('authenticate as dealer', async ({ page }) => {
  await page.goto('/login/dealer');

  // Make sure we're on the Sign In tab (not Register)
  await page.getByRole('button', { name: 'Sign In' }).click();

  await page.getByPlaceholder(/dealer@example\.com/i).fill(EMAIL);
  await page.getByPlaceholder(/••••••••/i).fill(PASSWORD);

  // Submit the form and wait for redirect to dashboard
  await page.getByRole('button', { name: /go to dashboard/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
  await expect(page).toHaveURL(/\/dashboard/);

  // Persist storage state (includes localStorage with JWT tokens)
  await page.context().storageState({ path: AUTH_FILE });
});
