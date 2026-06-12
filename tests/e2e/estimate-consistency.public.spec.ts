/**
 * estimate-consistency.public.spec.ts
 *
 * Issue 2 (HIGH): estimate ranges must match across pages. /valuation now carries
 * the full input set (condition, trim, fuel/gear/car type, cylinders, warranty,
 * exact km) into the sell flows, and PriceGuidanceCard sends those same inputs to
 * the deterministic estimate endpoint — so the "Estimated options" box reproduces
 * the valuation ranges instead of recomputing from defaults.
 *
 * This guards that the sell-flow card still renders a range from a deep link
 * carrying the full input set (i.e. the new props are wired, not crashing).
 */
import { test, expect } from '@playwright/test';

const FULL_PARAMS =
  'make=Toyota&class_name=Land+Cruiser&year=2022&km=65000&city=Doha' +
  '&condition=good&cylinder_count=6';

test.describe('Estimate consistency (sell flow)', () => {
  test('urgent-sale renders the estimate box from a full-input deep link', async ({ page }) => {
    await page.goto(`/urgent-sale?${FULL_PARAMS}`);
    const card = page.getByText('Estimated options for your car');
    await expect(card).toBeVisible({ timeout: 15000 });
    // The instant-offer row should show a QAR range once the estimate resolves.
    await expect(page.getByText(/QAR[\s\d,]+–[\s]*QAR[\s\d,]+/).first()).toBeVisible({ timeout: 15000 });
  });
});
