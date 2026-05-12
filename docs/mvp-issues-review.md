# InstaOffer — MVP GitHub Issues Review

> Reviewed against current codebase on `main` branch.
> All 4 MVP issues are **OPEN** · **Unassigned** · **No milestone**

---

## Summary

| MVP Issue | Area | Frontend Status | Backend Issue | Priority |
|-----------|------|-----------------|--------------------|----------|
| [#39](https://github.com/belriyad/instaoffer/issues/39) Urgent seller flow | Seller UX | ❌ Not started | [#47](https://github.com/belriyad/instaoffer/issues/47) `is_urgent` / `urgency_reason` / `sell_priority` fields | 🔴 High |
| [#40](https://github.com/belriyad/instaoffer/issues/40) Dealer WhatsApp alerts | Dealer UX | ⚠️ Partial (preferences UI exists) | [#48](https://github.com/belriyad/instaoffer/issues/48) WhatsApp alert delivery engine + alert history endpoint | 🔴 High |
| [#41](https://github.com/belriyad/instaoffer/issues/41) Seller trust & listing quality | Trust layer | ❌ Not started | [#49](https://github.com/belriyad/instaoffer/issues/49) Trust scoring engine + `trust_badge` / `listing_completeness_pct` fields | 🟡 Medium |
| [#43](https://github.com/belriyad/instaoffer/issues/43) Deal scoring & opportunity ranking | Dealer UX | ❌ Not started | [#50](https://github.com/belriyad/instaoffer/issues/50) `opportunity_score` / `deal_classification` + sort/filter support | 🟡 Medium |

---

## Issue #39 — MVP: Urgent seller flow — fast car sale request

**Labels:** `seller` `urgent-flow` `dealer-acquisition`

### What it requires
A dedicated **"Sell My Car Fast"** CTA path on the homepage. Minimal form: make, model, year, mileage, city, phone, urgency reason. Seller states whether they prioritise **speed**, **best price**, or **balanced**. Submission triggers dealer alert pipeline with an `is_urgent` flag.

### Current codebase gap

| Item | Status |
|------|--------|
| Homepage CTA "Sell My Car Fast" | ❌ Only "Start Free Valuation" exists (`app/page.tsx`) |
| Urgent seller form / dedicated page | ❌ No `app/urgent-sale/` or equivalent route |
| `is_urgent` field on offer request payload | ❌ Not in `BuyRequestParams` or `createOfferRequest()` in `lib/api.ts` |
| `urgency_reason` / `sell_priority` fields | ❌ Not in any form or API type |
| Dealer alert pipeline triggering | ❌ Backend-only; frontend can only flag after backend ships the field |
| Seller confirmation screen ("sent to verified dealers") | ❌ Not implemented |

### What needs to be built (FE)

1. **`app/page.tsx`** — Add secondary CTA "Sell My Car Fast" alongside the existing valuation button.
2. **`app/urgent-sale/page.tsx`** — New minimal 1-screen form (6 fields + urgency reason dropdown + priority selector).
3. **`lib/api.ts`** — Add `is_urgent: boolean`, `urgency_reason?: string`, `sell_priority?: 'speed' | 'price' | 'balanced'` to the offer request params.
4. **Confirmation screen** — Show "Your car was sent to X verified dealers looking for this type of vehicle."

### Backend dependency
`POST /instant-offers/requests` must accept `is_urgent`, `urgency_reason`, `sell_priority`. Urgent submissions must be tagged in the dealer alert pipeline. **Tracked in [#47](https://github.com/belriyad/instaoffer/issues/47). Frontend can stub the UI now but cannot test end-to-end until backend ships.**

---

## Issue #40 — MVP: Dealer WhatsApp acquisition alerts with opportunity scoring

**Labels:** `dealer` `alerts` `whatsapp` `acquisition`

### What it requires
Dealer subscribes to alert preferences (make/model/year/price). When a high-scoring seller submits, dealer gets a WhatsApp message within 60 seconds including: valuation, suggested offer range, urgency level, evidence. Dealer can act directly from WhatsApp: Call seller / Send offer / Ignore / Save.

### Current codebase status

| Item | Status |
|------|--------|
| `getDealerPreferences()` / `setDealerPreferences()` in `lib/api.ts` | ✅ Exists — includes `notify_whatsapp: boolean` |
| WhatsApp notification toggle in preferences | ✅ `notify_whatsapp` field in API |
| WhatsApp mentioned in `/for-dealers` feature list | ✅ Marketing copy present |
| Actual alert delivery UI / management screen | ❌ No `app/dashboard/alerts/` page |
| Opportunity score in alert payload | ❌ No `opportunity_score` field in any type |
| Suggested offer range in alert | ❌ Not in alert payload types |
| Alert history / log for dealer | ❌ Not implemented |
| Alert throttling / duplicate prevention UI | ❌ Backend concern; no FE surface needed |
| "Why this is a good deal" explanation | ❌ Not in any response type |

### What needs to be built (FE)

1. **`app/dashboard/alerts/page.tsx`** — Alert history feed showing sent WhatsApp alerts with open/action rate.
2. **`app/dashboard/preferences/page.tsx`** (or merge into existing settings) — Full preference editor with WhatsApp opt-in toggle, per-make filter, urgency threshold slider.
3. **`lib/api.ts`** — Add `opportunity_score`, `score_explanation`, `suggested_offer_range` fields to the `OfferRequest`/alert payload types when backend ships.
4. **Alert badge on dashboard sidebar** — Show unread alert count.

### Backend dependency
Full alert delivery is backend. FE can build the preference UI and alert history screen against the existing `/instant-offers/preferences` endpoint now. **Tracked in [#48](https://github.com/belriyad/instaoffer/issues/48).**

---

## Issue #41 — MVP: Seller trust and listing quality scoring

**Labels:** `dealer` `trust` `quality`

### What it requires
Every offer request shown to dealers includes a **trust badge** (High / Medium / Low) derived from: VIN consistency, duplicate detection, phone reuse, listing completeness, and seller responsiveness. Low-quality listings are downranked. Incomplete listings cannot trigger premium alerts.

### Current codebase gap

| Item | Status |
|------|--------|
| `OfferRequest` type has a `trust_score` / `trust_badge` field | ❌ Not in `lib/api.ts` types |
| Trust badge displayed on listing cards | ❌ Not in `app/dashboard/` listing views |
| Trust badge on offer detail (`app/my-offers/[uid]/page.tsx`) | ❌ Not shown |
| Listing completeness indicator for seller | ❌ No prompt to complete listing |
| Seller responsiveness tracking surface | ❌ Not implemented |

### What needs to be built (FE)

1. **`lib/api.ts`** — Add `trust_score?: number`, `trust_badge?: 'high' | 'medium' | 'low'`, `listing_completeness_pct?: number` to `OfferRequest` type.
2. **Trust badge component** — Reusable `<TrustBadge level="high|medium|low" />` with colour-coded pill (green / amber / red).
3. **Listing cards in dealer dashboard** — Render trust badge alongside each listing.
4. **Seller offer detail** — Show completeness score + checklist prompting seller to add photos, VIN, description.
5. **`lib/api-types.ts`** — Forward-declare trust types now, migrate to `api.ts` when backend ships (same pattern as BE-002/003).

### Backend dependency
Entire scoring engine is backend. FE can add type stubs + badge component now and wire up when backend ships the field. **Tracked in [#49](https://github.com/belriyad/instaoffer/issues/49).**

---

## Issue #43 — MVP: Deal scoring and opportunity ranking engine

**Labels:** `dealer` `acquisition` `scoring` `ranking`

### What it requires
Every dealer-facing opportunity gets a score 0–100 based on market discount, gross margin, seller urgency, listing quality, dealer preference match. Opportunities classified: **Hot Deal** / **Good Deal** / **Watch** / **Skip**. WhatsApp alerts only sent above configurable score threshold. Dealer can sort by score / margin / urgency / freshness.

### Current codebase status

| Item | Status |
|------|--------|
| `GoodDealRow` type with `discount_pct`, `discount_qar` | ✅ Exists in `lib/api.ts` |
| `getDealerGoodDeals()` API function | ✅ Exists |
| `app/dashboard/good-deals/page.tsx` | ✅ Exists (shows discounted listings) |
| `opportunity_score` (0–100) field | ❌ Not in any type |
| `deal_classification` (Hot/Good/Watch/Skip) | ❌ Not in any type |
| Sort controls (score / margin / urgency / freshness) | ❌ No sort UI on good-deals or leads pages |
| "Why this is a good deal" explanation card | ❌ Not implemented |
| Score threshold setting in dealer preferences | ❌ Not in preferences form |

### What needs to be built (FE)

1. **`lib/api.ts`** — Add `opportunity_score?: number`, `deal_classification?: 'hot' | 'good' | 'watch' | 'skip'`, `score_explanation?: string[]` to `GoodDealRow` and relevant listing types.
2. **Deal classification badge** — `<DealBadge type="hot|good|watch|skip" />` with distinct colours:
   - 🔴 Hot Deal — red/orange
   - 🟢 Good Deal — green
   - 🟡 Watch — yellow
   - ⚫ Skip — grey
3. **Good Deals page** — Add sort controls: Score / Margin / Urgency / Freshness. Render score + classification badge per card.
4. **"Why this is a good deal" drawer** — Expandable panel per listing showing `score_explanation[]` bullet points.
5. **Dealer preferences** — Add score threshold slider (`min_score_for_alert: number`).

### Backend dependency
Score calculation is backend. `GoodDealRow` structure already exists — adding fields is straightforward. FE classification badge and sort UI can be built now with mock data.

---

## Recommended Build Order

```
Phase 1 — Pure FE (no backend blocker)
  ├── #39: Urgent sale homepage CTA + minimal form (stub is_urgent flag)
  ├── #40: Alert preferences page (extend existing /instant-offers/preferences)
  ├── #41: TrustBadge component + type stubs in lib/api-types.ts
  └── #43: DealBadge component + sort controls on Good Deals page (mock data)

Phase 2 — Wire up when backend ships
  ├── #39: Connect is_urgent / urgency_reason / sell_priority to real API
  ├── #40: Alert history feed (new endpoint needed from backend)
  ├── #41: Render trust_badge / listing_completeness from live API response
  └── #43: Render opportunity_score / deal_classification from live API
```

---

## Gaps vs Current User Scenarios

Comparing the MVP issues against `docs/user-scenarios.md`:

| Scenario | Missing from current scenarios |
|----------|-------------------------------|
| Scenario 1 (Seller valuation) | No urgent-sale CTA path documented |
| Scenario 2 (Submit offer) | No urgency reason / sell priority selection |
| Scenario 5 (Dealer dashboard) | No deal classification badges, no score sort |
| Scenario 6 (BI Tool) | No opportunity score or "Why this is a good deal" |
| *(New scenario needed)* | Dealer receiving & acting on WhatsApp alert |
| *(New scenario needed)* | Dealer reviewing trust badge before bidding |

The `user-scenarios.md` file should be updated to include Scenario 7 (WhatsApp alert flow) and Scenario 8 (trust/scoring-informed bid decision) once these issues are implemented.
