/**
 * estimate-consistency.public.spec.ts
 *
 * Issue 2 (HIGH): estimate ranges must match across pages. /valuation carries the
 * full input set (condition, trim, drivetrain, cylinders, warranty, exact km)
 * into the sell flows, and PriceGuidanceCard sends those same inputs to the
 * deterministic estimate endpoint — so the sell-flow "Estimated options" box
 * reproduces the valuation ranges instead of recomputing from defaults.
 *
 * Runs unauthenticated (guest token) in the "public" Playwright project.
 */
import { test, expect, type Page, type Locator } from '@playwright/test';

// Pull the grouped numbers (>=4 digits) out of a "QAR 166,000 – 214,000" string.
function nums(s: string): number[] {
  return (s.match(/\d[\d,]{3,}/g) ?? []).map(n => parseInt(n.replace(/,/g, ''), 10));
}

// The [low, high] in the box whose label-parent contains the given caption/label.
async function rangeUnder(scope: Locator): Promise<number[]> {
  await expect(scope).toBeVisible({ timeout: 30000 });
  return nums(await scope.locator('xpath=..').innerText());
}

test.describe('Estimate consistency (sell flow)', () => {
  test('valuation ranges carry over byte-identically to the urgent-sale box', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/valuation');

    // ── Screen 1: make + model (custom searchable selects render <button> options)
    await page.getByPlaceholder('Search make…').fill('Toyota');
    await page.getByRole('button', { name: 'Toyota', exact: true }).click();
    await page.getByPlaceholder(/Search model/).fill('Land Cruiser');
    await page.getByRole('button', { name: 'Land Cruiser', exact: true }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // ── Screen 2: year, km bucket, condition (city defaults to Doha)
    await page.getByRole('button', { name: '2022', exact: true }).click();
    await page.getByRole('button', { name: /50\s*.\s*80k/ }).click();
    await page.getByRole('button', { name: /Good/ }).click();
    await page.getByRole('button', { name: /Get My Free Estimate/ }).click();

    // ── Result: read Private Party (default tab) then switch to Instant Offer.
    const valPrivate = await rangeUnder(page.getByText('Private Party Range', { exact: true }));
    await page.getByRole('button', { name: 'Instant Offer', exact: true }).click();
    const valInstant = await rangeUnder(page.getByText('Instant Offer Range', { exact: true }));

    expect(valPrivate).toHaveLength(2);
    expect(valInstant).toHaveLength(2);

    // ── Follow the Instant-Offer CTA into the urgent-sale flow.
    await page.getByRole('link', { name: /Sell Fast Now/ }).click();
    await expect(page.getByText('Estimated options for your car')).toBeVisible({ timeout: 30000 });

    const sellPrivate = await rangeUnder(page.getByText('Private sale', { exact: true }));
    const sellInstant = await rangeUnder(page.getByText('Instant offer', { exact: true }));

    // The fix: identical inputs -> identical bands, on both pages.
    expect(sellPrivate).toEqual(valPrivate);
    expect(sellInstant).toEqual(valInstant);
  });
});
