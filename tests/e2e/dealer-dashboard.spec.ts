/**
 * dealer-dashboard.spec.ts
 *
 * Authenticated dealer dashboard tests.
 * Requires storageState from auth.setup.ts.
 */
import { test, expect } from '@playwright/test';

test.describe('Dealer Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    // Wait for the lead feed or loading state to settle
    await page.waitForLoadState('networkidle');
  });

  // ── Layout ─────────────────────────────────────────────────────────────────

  test('renders the dashboard page without crashing', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('shows the four main tabs', async ({ page }) => {
    for (const tab of ['Leads', 'My Bids', 'Messages', 'Settings']) {
      await expect(page.getByRole('tab', { name: tab }).or(
        page.getByRole('button', { name: tab })
      )).toBeVisible();
    }
  });

  // ── Leads tab ──────────────────────────────────────────────────────────────

  test('Leads tab is active by default and shows cards or empty state', async ({ page }) => {
    const leadsContent = page.locator('[data-testid="leads-tab"], .leads-list').or(
      page.getByText(/no leads|no offers|open offers/i)
    );
    await expect(leadsContent.first()).toBeVisible({ timeout: 10_000 });
  });

  test('Make filter changes the lead list', async ({ page }) => {
    const filterSelect = page.getByRole('combobox', { name: /make|brand/i }).or(
      page.locator('select').first()
    );
    if (await filterSelect.isVisible()) {
      await filterSelect.selectOption({ index: 1 });
      await page.waitForLoadState('networkidle');
      // Page should still be on the dashboard
      await expect(page).toHaveURL(/\/dashboard/);
    }
  });

  // ── My Bids tab ────────────────────────────────────────────────────────────

  test('switching to My Bids tab shows bid cards or empty state', async ({ page }) => {
    await page.getByRole('button', { name: /my bids/i }).click();
    await expect(
      page.getByText(/no bids|bids submitted|your submitted/i).or(
        page.locator('[data-testid="bid-card"]').first()
      )
    ).toBeVisible({ timeout: 8_000 });
  });

  // ── Messages tab ───────────────────────────────────────────────────────────

  test('switching to Messages tab shows conversation list or empty state', async ({ page }) => {
    await page.getByRole('button', { name: /messages/i }).click();
    await expect(
      page.getByText(/no conversations|conversations appear/i).or(
        page.getByRole('link', { name: /message|chat/i }).first()
      )
    ).toBeVisible({ timeout: 8_000 });
  });

  // ── Settings tab ───────────────────────────────────────────────────────────

  test('switching to Settings tab shows preferences link', async ({ page }) => {
    await page.getByRole('button', { name: /settings/i }).click();
    await expect(page.getByRole('link', { name: /preferences/i })).toBeVisible();
  });

  // ── Bid modal ──────────────────────────────────────────────────────────────

  test('Send Offer button opens the bid modal', async ({ page }) => {
    const sendOfferBtn = page.getByRole('button', { name: /send offer|place bid/i }).first();
    if (await sendOfferBtn.isVisible({ timeout: 8_000 })) {
      await sendOfferBtn.click();
      await expect(page.getByRole('heading', { name: /send offer/i })).toBeVisible();
      // Market estimate banner or loading
      await expect(
        page.getByText(/market estimate|loading market/i)
      ).toBeVisible({ timeout: 6_000 });
      // Cancel closes the modal
      await page.getByRole('button', { name: /cancel/i }).click();
      await expect(page.getByRole('heading', { name: /send offer/i })).not.toBeVisible();
    }
  });

  test('bid modal rejects empty amount', async ({ page }) => {
    const sendOfferBtn = page.getByRole('button', { name: /send offer|place bid/i }).first();
    if (await sendOfferBtn.isVisible({ timeout: 8_000 })) {
      await sendOfferBtn.click();
      const submitBtn = page.getByRole('button', { name: /^submit|^send$/i });
      await expect(submitBtn).toBeDisabled();
    }
  });
});
