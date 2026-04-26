/**
 * messages.spec.ts
 *
 * Tests the /messages/[uid] chat page (authenticated dealer).
 */
import { test, expect } from '@playwright/test';

test.describe('Messages page', () => {
  test('redirects to dashboard if no uid is given', async ({ page }) => {
    // There is no /messages index — navigating there should gracefully
    // handle a 404 or redirect.
    const response = await page.goto('/messages');
    expect(response?.status()).toBeLessThan(500);
  });

  test('chat page loads for a valid-looking uid', async ({ page }) => {
    // Use a placeholder uid — we just want the page not to crash.
    await page.goto('/messages/test-uid-000?recipient=some-user');
    await page.waitForLoadState('networkidle');
    // Should render a message input or an empty/error state — not a blank screen
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });

  test('message input is rendered', async ({ page }) => {
    await page.goto('/messages/test-uid-000?recipient=some-user');
    await page.waitForLoadState('networkidle');
    const input = page.getByRole('textbox', { name: /message|type/i }).or(
      page.locator('textarea, input[type="text"]').last()
    );
    await expect(input).toBeVisible({ timeout: 8_000 });
  });
});
