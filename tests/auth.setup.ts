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

  await page.getByLabel(/email/i).fill(EMAIL);
  await page.getByLabel(/password/i).fill(PASSWORD);
  await page.getByRole('button', { name: /sign in|log in/i }).click();

  // Wait until we land on the dashboard
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
  await expect(page).toHaveURL(/\/dashboard/);

  // Persist storage state (includes localStorage with JWT tokens)
  await page.context().storageState({ path: AUTH_FILE });
});
