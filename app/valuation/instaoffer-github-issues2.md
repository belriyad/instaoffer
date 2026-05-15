# InstaOffer — GitHub Issues (UX Audit)

> Generated from wireframe-vs-live UX audit · May 2026  
> Source: FigJam wireframe `QqTc15FAXJg2eV4LWFFEx3` vs `instaoffer.vercel.app`  
> To create all issues at once: use the bulk script at the bottom of this file.

---

## Critical

---

### Issue 1 — `/valuation` page renders blank — primary revenue path is broken

**Labels:** `bug` `critical` `seller-flow`  
**Milestone:** MVP · **Priority:** P0

**Description**

The `/valuation` route renders only `"Loading…"` indefinitely. Every homepage CTA points here. The entire seller funnel is blocked.

**Wireframe intent**
- Step 1: vehicle basics form (make, model, year, mileage)
- Step 2: details form (condition, city, photos optional)
- Output: 3-price result screen — private sale estimate / trade-in value / instant offer

**Current behaviour**
- Page loads, spinner appears, nothing renders
- No error message, no fallback state

**Acceptance criteria**
- [ ] `/valuation` step 1 form renders without error
- [ ] Step 2 form is reachable from step 1
- [ ] Result screen shows all 3 price variants (private sale, trade-in, instant offer)
- [ ] Loading skeleton shown during ML API call
- [ ] Error state shown if API call fails

---

### Issue 2 — 3 of 5 homepage intent paths lead to empty pages

**Labels:** `bug` `critical` `seller-flow`  
**Milestone:** MVP · **Priority:** P0

**Description**

`/urgent-sale`, `/trade-in`, and `/buy-request` all render an empty page (nav + footer only). These are presented as primary CTAs on the homepage intent selector.

**Affected routes**

| Route | Wireframe screen | Current state |
|---|---|---|
| `/urgent-sale` | 4-step wizard with evidence package | Empty |
| `/trade-in` | Dual-car form (target + current car) | Empty |
| `/buy-request` | Desired spec form (make/model/budget/timeline) | Empty |

**Immediate fix (until flows are built)**
- Replace empty pages with a "coming soon / notify me" placeholder
- Remove or disable homepage CTAs that link to these routes

**Acceptance criteria**
- [ ] No homepage CTA links to a fully empty page
- [ ] Each route has either a working flow or a "coming soon" state with email capture

---

### Issue 3 — `/login` renders blank — all authenticated flows inaccessible

**Labels:** `bug` `critical` `auth`  
**Milestone:** MVP · **Priority:** P0

**Description**

`/login` renders only the WhatsApp help widget. No sign-in form is present. This blocks all post-submission flows for both sellers and dealers.

**Blocked flows**
- Seller: my offers, offer detail, deal outcome
- Dealer: dashboard, full offer/request detail, typed queue management

**Acceptance criteria**
- [ ] `/login` renders a working authentication form
- [ ] Role-based redirect post-login (seller → my offers, dealer → dashboard)
- [ ] Until ready: replace nav "Sign In" link with a waitlist/notify form

---

### Issue 4 — Opportunity type routing engine not implemented

**Labels:** `feature` `critical` `architecture` `backend`  
**Milestone:** MVP · **Priority:** P0

**Description**

The wireframe defines a central "Opportunity Type" decision node that routes all leads into 5 typed queues. Hard guardrail: **"never route by button"** — the type must be derived from data/context at submission time.

**5 opportunity types**

| Type | Source flow | Dealer queue |
|---|---|---|
| `trade_in_deal` | Trade-in screen | Trade-in Deals Queue |
| `dealer_inquiry` | Car detail "contact dealer" | Direct Inquiries Queue |
| `seller_offer_request` | Valuation result → private/max value | Seller Leads Queue |
| `urgent_sale_lead` | Urgent sale screen | Urgent Sellers Queue |
| `buyer_request` | Buy request screen | Buyer Requests Queue |

**Wireframe guardrails**
- All flows must write `opportunity_type` on submission
- Dealer dashboard must show separate queues per type — not a flat feed
- Trade-in leads must never be mixed with normal seller leads

**Acceptance criteria**
- [ ] `opportunity_type` enum column added to leads/opportunities table in Supabase
- [ ] Every submission flow writes the correct type on insert
- [ ] Dealer dashboard renders 5 typed tabs/queues
- [ ] No flat untyped lead feed exposed to dealers

---

## High

---

### Issue 5 — Shared vehicle profile module not implemented — users re-enter car details per flow

**Labels:** `feature` `high` `ux` `seller-flow`  
**Milestone:** MVP · **Priority:** P1

**Description**

The wireframe marks the vehicle profile as a **reusable module** with guardrail: **"do not duplicate vehicle entry."** Data entered once (make/model/year/mileage/condition) must persist and pre-fill across valuation, trade-in, and urgent sale.

**Fields in shared vehicle profile**
- Make / Model
- Year / Mileage
- Condition / City
- Photos (optional)

**Acceptance criteria**
- [ ] Vehicle profile stored in session (guest) or user account (authenticated)
- [ ] Trade-in and urgent sale forms pre-fill from existing vehicle profile
- [ ] User can edit pre-filled values before submitting
- [ ] Vehicle profile written to Supabase on valuation submit

---

### Issue 6 — Valuation result must show 3 prices — homepage copy implies only one

**Labels:** `feature` `high` `seller-flow` `content`  
**Milestone:** MVP · **Priority:** P1

**Description**

Wireframe specifies 3 distinct outputs on the valuation result screen:
1. Private sale estimate
2. Trade-in value
3. Instant offer

The homepage only references "an AI-powered estimate" — one number. This undersells the product and creates a mismatch between marketing and actual output.

**Acceptance criteria**
- [ ] Result screen renders all 3 price variants with labels
- [ ] Each price has a CTA routing to the appropriate next flow
- [ ] Homepage "How it works" copy updated to reference 3 valuations
- [ ] Meta description updated accordingly

---

### Issue 7 — Pricing contradiction: 499 QAR vs 1,000 QAR on the same site

**Labels:** `bug` `high` `dealer-flow` `content`  
**Milestone:** Pre-launch · **Priority:** P1

**Description**

- Homepage dealer section: **"Only 1,000 QAR / month"**
- `/for-dealers` Pro plan card: **499 QAR / month**

Visible within 2 clicks. Will kill trust with dealer prospects.

**Fix options**
- Pick one price and update both locations
- Or use anchoring: `"Launch price 499 QAR — renews at 999 QAR"`

**Acceptance criteria**
- [ ] Only one dealer price shown across the entire site
- [ ] If two prices coexist, explained explicitly with anchoring language

---

### Issue 8 — Nav component is inconsistent across pages

**Labels:** `bug` `high` `ux`  
**Milestone:** Pre-launch · **Priority:** P1

**Description**

Homepage nav includes "New Cars." Internal pages (`/how-it-works`, `/for-dealers`, `/urgent-sale`) show a different nav without it. Breaks spatial memory and signals unfinished work.

**Acceptance criteria**
- [ ] Single shared nav component used on all pages
- [ ] "New Cars" either appears everywhere or removed until `/cars` is built
- [ ] Nav only varies between authenticated and unauthenticated state

---

### Issue 9 — Urgent sale evidence package not built (6 required fields)

**Labels:** `feature` `high` `seller-flow`  
**Milestone:** MVP · **Priority:** P1

**Description**

The wireframe defines a dedicated evidence package step inside the 4-step urgent sale wizard. This is the quality signal that makes urgent sale leads credible to dealers.

**Required evidence fields (wireframe)**
1. Exterior photos
2. Interior photos
3. Odometer photo
4. Registration / VIN
5. Inspection report
6. Accident count

**Acceptance criteria**
- [ ] `/urgent-sale` step 3 renders all 6 evidence fields
- [ ] Photo upload works for exterior, interior, odometer
- [ ] Document upload works for registration and inspection report
- [ ] Accident count is a numeric input (default: 0)
- [ ] Evidence data surfaced in the dealer offer detail view

---

### Issue 10 — Dealer dashboard must show 5 typed queues, not a flat lead feed

**Labels:** `feature` `high` `dealer-flow`  
**Milestone:** MVP · **Priority:** P1

**Description**

Wireframe guardrail: **"dealer dashboard — separate queues by opportunity type."** A flat feed violates this and makes the dashboard unusable at scale.

**Required queues**
1. Trade-in Deals
2. Direct Inquiries
3. Seller Leads (normal)
4. Urgent Sellers (fast-sale)
5. Buyer Requests

**Acceptance criteria**
- [ ] Dashboard shows 5 distinct tabs or columns by opportunity type
- [ ] Each queue shows relevant fields for that lead type
- [ ] Urgency score and time-since-listed visible in urgent sellers queue
- [ ] Trade-in queue shows both target car and trade-in car fields

---

## Medium

---

### Issue 11 — Sign-up gate at step 3 not signposted — breaks "no sign-up" promise

**Labels:** `ux` `medium` `seller-flow` `content`  
**Milestone:** MVP · **Priority:** P2

**Description**

Homepage and steps 1–2 say "no sign-up required." Step 3 reveals an account is needed to receive offers. Feels like a bait-and-switch even though it's technically accurate.

**Fix**
- Visually separate "guest steps" (1–2) from "account steps" (3–5)
- Add inline copy at step 3 gate: `"Create a free account to activate your dealer requests — takes 30 seconds"`

**Acceptance criteria**
- [ ] Guest vs account steps visually distinct in the how-it-works flow
- [ ] Inline copy at sign-up gate sets expectation before the form appears

---

### Issue 12 — `/cars` listing and car detail screens not built

**Labels:** `feature` `medium` `browse-flow`  
**Milestone:** Post-MVP · **Priority:** P2

**Description**

The wireframe defines a full browse path: listing screen (search + filters + car cards) → car detail screen (gallery, specs, dealer, price, actions: contact dealer + trade in my car). Both are linked from homepage and nav but not built.

**Acceptance criteria**
- [ ] `/cars` renders a searchable, filterable listing
- [ ] Car detail screen shows gallery, specs, dealer info, price, and action buttons
- [ ] "Trade in my car" on detail screen routes to trade-in flow with target car pre-filled
- [ ] Until built: "New Cars" removed from nav

---

### Issue 13 — Dealer offer detail screen missing required context fields

**Labels:** `feature` `medium` `dealer-flow`  
**Milestone:** MVP · **Priority:** P2

**Description**

Wireframe guardrail: **"no title-only detail pages — must show full context."** The full offer detail screen must include all 8 fields.

**Required fields**
1. Lead type (`opportunity_type`)
2. Vehicle details
3. Valuation ranges
4. Evidence (photos + docs)
5. Notes
6. Status timeline
7. Actions
8. Seller contact request status

**Acceptance criteria**
- [ ] All 8 fields present in dealer offer detail view
- [ ] Valuation ranges pulled from ML model output
- [ ] Status timeline shows: created → offer sent → accepted/rejected
- [ ] Evidence photos/docs rendered inline

---

### Issue 14 — Deal outcome screen not built — seller flow has no closing state

**Labels:** `feature` `medium` `seller-flow`  
**Milestone:** MVP · **Priority:** P2

**Description**

The wireframe ends with a Deal Outcome node: accepted / rejected / closed + track final result. Without it, sellers who accept an offer have no confirmation screen and InstaOffer has no conversion data.

**Acceptance criteria**
- [ ] Deal outcome screen reachable from seller offer detail
- [ ] Three states: accepted, rejected, closed
- [ ] Accepted state shows dealer contact info and next steps
- [ ] Outcome written to database for analytics

---

### Issue 15 — Buyer request queue not mentioned on `/for-dealers`

**Labels:** `content` `medium` `dealer-flow`  
**Milestone:** Pre-launch · **Priority:** P2

**Description**

The wireframe defines a "Buyer Requests Queue" for dealers — inbound demand signals from buyers specifying a desired car. This is a meaningful differentiator. The `/for-dealers` page makes no mention of it.

**Acceptance criteria**
- [ ] Buyer request leads added as a feature callout on `/for-dealers`
- [ ] Dealer dashboard buyer requests tab labelled and described

---

### Issue 16 — Trade-in acquisition missing from `/for-dealers` value proposition

**Labels:** `content` `medium` `dealer-flow`  
**Milestone:** Pre-launch · **Priority:** P2

**Description**

The wireframe defines a dedicated Trade-in Deals Queue with a hard guardrail separating it from normal leads. `/for-dealers` makes no mention of trade-in as an acquisition use case.

**Suggested copy**
> "Receive trade-in leads separately — buyers who want to upgrade, not just sell."

**Acceptance criteria**
- [ ] Trade-in leads added as a callout on `/for-dealers`
- [ ] Trade-in queue visible and labelled in dealer dashboard

---

## Low / UX debt

---

### Issue 17 — Unverified social proof stats on homepage

**Labels:** `content` `low` `trust`  
**Milestone:** Pre-launch · **Priority:** P3

**Description**

"500+ Cars Sold" and "30+ Verified Dealers" shown with no timestamp or source. Damages credibility with sophisticated users if unverifiable.

**Acceptance criteria**
- [ ] Add `"as of [month year]"` to stats, or replace with verifiable claims, or remove until real

---

### Issue 18 — Mobile sticky CTA label "Sell" is too vague

**Labels:** `ux` `low`  
**Milestone:** Pre-launch · **Priority:** P3

**Description**

Mobile sticky nav shows a "Sell" button. Ambiguous to first-time visitors who haven't yet understood the product.

**Fix:** Change to `"Get estimate"` or `"Sell my car"`.

**Acceptance criteria**
- [ ] Mobile sticky CTA label updated to `"Get estimate"` or equivalent

---

### Issue 19 — Footer "Contact Us" links to `/how-it-works` instead of a contact destination

**Labels:** `bug` `low`  
**Milestone:** Pre-launch · **Priority:** P3

**Description**

Footer → Company → Contact Us resolves to `/how-it-works`. Users trying to reach support hit an unrelated page.

**Acceptance criteria**
- [ ] `/contact` created, or footer link updated to WhatsApp contact
- [ ] Footer "Contact Us" label accurately reflects its destination

---

### Issue 20 — WhatsApp contact number appears to be a placeholder (97430000000)

**Labels:** `bug` `low` `dealer-flow`  
**Milestone:** Pre-launch · **Priority:** P3

**Description**

All dealer WhatsApp CTAs and the help widget use `+974 3000 0000` — a sequential number almost certainly left as a placeholder. Any dealer clicking "Chat on WhatsApp" reaches the wrong number.

**Acceptance criteria**
- [ ] All WhatsApp links updated to the real InstaOffer contact number
- [ ] Tested that clicking the link opens the correct WhatsApp conversation

---

## Bulk create script (GitHub CLI)

Requires [GitHub CLI](https://cli.github.com/) (`gh auth login` first).

```bash
#!/bin/bash
REPO="your-org/instaoffer"

gh issue create --repo $REPO \
  --title "[BUG] /valuation page renders blank — primary revenue path broken" \
  --label "bug,critical,seller-flow" --body "Wireframe: 2-step form → 3-price result screen. Live: blank Loading… state. See instaoffer-github-issues.md Issue 1."

gh issue create --repo $REPO \
  --title "[BUG] 3 homepage intent paths lead to empty pages (/urgent-sale, /trade-in, /buy-request)" \
  --label "bug,critical,seller-flow" --body "All 3 routes render nav + footer only. See instaoffer-github-issues.md Issue 2."

gh issue create --repo $REPO \
  --title "[BUG] /login renders blank — all authenticated flows inaccessible" \
  --label "bug,critical,auth" --body "Login page shows only WhatsApp widget. No auth form. See instaoffer-github-issues.md Issue 3."

gh issue create --repo $REPO \
  --title "[FEATURE] Implement opportunity type routing engine (5 typed queues, no button routing)" \
  --label "feature,critical,architecture,backend" --body "Wireframe guardrail: never route by button. All 5 types need explicit opportunity_type field. See instaoffer-github-issues.md Issue 4."

gh issue create --repo $REPO \
  --title "[FEATURE] Shared vehicle profile module — prevent duplicate data entry across flows" \
  --label "feature,high,ux,seller-flow" --body "Wireframe guardrail: do not duplicate vehicle entry. See instaoffer-github-issues.md Issue 5."

gh issue create --repo $REPO \
  --title "[FEATURE] Valuation result must show 3 prices (private sale / trade-in / instant offer)" \
  --label "feature,high,seller-flow,content" --body "Wireframe specifies 3-price output. Homepage only implies one. See instaoffer-github-issues.md Issue 6."

gh issue create --repo $REPO \
  --title "[BUG] Pricing contradiction: 499 QAR on /for-dealers vs 1,000 QAR on homepage" \
  --label "bug,high,dealer-flow,content" --body "See instaoffer-github-issues.md Issue 7."

gh issue create --repo $REPO \
  --title "[BUG] Nav component inconsistent across pages" \
  --label "bug,high,ux" --body "New Cars nav item disappears on internal pages. See instaoffer-github-issues.md Issue 8."

gh issue create --repo $REPO \
  --title "[FEATURE] Build urgent sale evidence package — 6 required fields (photos, VIN, inspection, accident count)" \
  --label "feature,high,seller-flow" --body "See instaoffer-github-issues.md Issue 9."

gh issue create --repo $REPO \
  --title "[FEATURE] Dealer dashboard: implement 5 typed queues (not flat feed)" \
  --label "feature,high,dealer-flow" --body "Wireframe guardrail: separate queues by opportunity type. See instaoffer-github-issues.md Issue 10."

gh issue create --repo $REPO \
  --title "[UX] Sign-up gate at step 3 not signposted — breaks no-sign-up expectation" \
  --label "ux,medium,seller-flow,content" --body "See instaoffer-github-issues.md Issue 11."

gh issue create --repo $REPO \
  --title "[FEATURE] Build /cars listing and car detail screens (browse flow)" \
  --label "feature,medium,browse-flow" --body "See instaoffer-github-issues.md Issue 12."

gh issue create --repo $REPO \
  --title "[FEATURE] Dealer offer detail — implement all 8 required context fields" \
  --label "feature,medium,dealer-flow" --body "Wireframe guardrail: no title-only detail pages. See instaoffer-github-issues.md Issue 13."

gh issue create --repo $REPO \
  --title "[FEATURE] Build deal outcome screen — accepted/rejected/closed states" \
  --label "feature,medium,seller-flow" --body "See instaoffer-github-issues.md Issue 14."

gh issue create --repo $REPO \
  --title "[CONTENT] Add buyer request queue to /for-dealers — missing dealer value prop" \
  --label "content,medium,dealer-flow" --body "See instaoffer-github-issues.md Issue 15."

gh issue create --repo $REPO \
  --title "[CONTENT] Trade-in acquisition missing from /for-dealers value proposition" \
  --label "content,medium,dealer-flow" --body "See instaoffer-github-issues.md Issue 16."

gh issue create --repo $REPO \
  --title "[CONTENT] Unverified social proof stats on homepage — add attribution or replace" \
  --label "content,low,trust" --body "See instaoffer-github-issues.md Issue 17."

gh issue create --repo $REPO \
  --title "[UX] Mobile sticky CTA label 'Sell' too vague — change to 'Get estimate'" \
  --label "ux,low" --body "See instaoffer-github-issues.md Issue 18."

gh issue create --repo $REPO \
  --title "[BUG] Footer Contact Us links to /how-it-works instead of contact page" \
  --label "bug,low" --body "See instaoffer-github-issues.md Issue 19."

gh issue create --repo $REPO \
  --title "[BUG] WhatsApp number is a placeholder — replace before launch" \
  --label "bug,low,dealer-flow" --body "See instaoffer-github-issues.md Issue 20."

echo "All 20 issues created."
```
