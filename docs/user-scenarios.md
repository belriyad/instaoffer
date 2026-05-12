# InstaOffer — End-to-End User Scenarios

> Covers all screens wireframed in MockFlow:
> [app.mockflow.com/wire/228dc1f1a25d427a98a7f900eb015284](https://app.mockflow.com/wire/228dc1f1a25d427a98a7f900eb015284)

---

## Scenario 1 — Seller Gets an Instant Valuation

**Persona:** A private car owner in Qatar who wants to know how much their car is worth before selling.

### Steps

| # | Screen | Action | System Response |
|---|--------|--------|-----------------|
| 1 | **Home** | Lands on homepage, reads value proposition | Sees stats (1,200+ cars sold, 85+ dealers, 48hr avg sale), 4-step how-it-works section |
| 2 | **Home** | Clicks **"Get My Car's Value"** CTA | Navigates to Valuation Wizard Step 1 |
| 3 | **Valuation Step 1** | Selects **Make** from dropdown (e.g. Toyota) | Model dropdown activates |
| 4 | **Valuation Step 1** | Selects **Model** (e.g. Land Cruiser) | Auto-detected badges appear: **SUV · Petrol · Automatic** (from MODEL_DEFAULTS) |
| 5 | **Valuation Step 1** | Optionally selects **Trim** (e.g. VX.R) | Trim saved to form state |
| 6 | **Valuation Step 1** | Clicks **"Continue →"** | Navigates to Step 2 with Step 1 marked complete (✓) |
| 7 | **Valuation Step 2** | Taps a **Year tile** (e.g. 2025) | Tile highlights in navy blue |
| 8 | **Valuation Step 2** | Selects a **Mileage bucket** (e.g. 20,000–50,000 km) | Bucket pill highlights |
| 9 | **Valuation Step 2** | Picks **Condition** from 2×2 card grid (e.g. Excellent) | Card highlights with blue border |
| 10 | **Valuation Step 2** | Selects **City** chip (defaults to Doha) | Chip highlights in navy |
| 11 | **Valuation Step 2** | *(Optional)* Expands Advanced Options accordion → selects **Cylinders** (6-cyl) and **Warranty** (Under Warranty) | Accordion expands, selections saved |
| 12 | **Valuation Step 2** | Clicks **"Get My Valuation →"** | Calls `GET /ml/estimate` with all params; navigates to Results |
| 13 | **Valuation Results** | Views **AI Market Valuation card** | Sees: Low QAR 265k · **Best Estimate QAR 285k** · High QAR 310k with animated range bar |
| 14 | **Valuation Results** | Views supporting info | Time to Sell: 7–14 days · Price Trend: ▲ +2.3% |
| 15 | **Valuation Results** | Reads **privacy notice** | Informed that contact details are never shared without approval |
| 16 | **Valuation Results** | Clicks **"Submit My Car — Get Dealer Bids"** | Navigates to Submit Offer form |

**Exit paths:**
- User clicks "Re-evaluate with different details" → back to Step 2
- User closes browser → last selected variation saved in `localStorage`

---

## Scenario 2 — Seller Submits a Car for Dealer Bids

**Persona:** Same seller from Scenario 1 who is ready to list their car after seeing the valuation.

**Pre-condition:** Arrived from Valuation Results (car details pre-filled).

### Steps

| # | Screen | Action | System Response |
|---|--------|--------|-----------------|
| 1 | **Submit Offer** | Reviews pre-filled **Car Summary** card | Make / Model / Year / Mileage / Condition / City / Trim shown in read-only grid |
| 2 | **Submit Offer** | Sets **Asking Price** using the input field | Market range hints shown below: Low · Estimate · High badges |
| 3 | **Submit Offer** | *(Optional)* Uploads up to 10 car photos | Drag-and-drop zone accepts JPG/PNG up to 10 MB each |
| 4 | **Submit Offer** | Enters **Full Name** and **Phone Number** | Fields validated client-side |
| 5 | **Submit Offer** | Reviews sidebar: **8–15 expected bids** from verified dealers | Sees 3-step "what happens next" summary |
| 6 | **Submit Offer** | Clicks **"Submit for Bids"** | Offer request created; dealer notifications triggered |

**Sidebar indicators:**
- Estimated bids count (dynamic, based on market demand)
- Listing is **free** with no hidden fees

---

## Scenario 3 — New User Registration

**Persona:** First-time seller who doesn't yet have an account.

### Steps

| # | Screen | Action | System Response |
|---|--------|--------|-----------------|
| 1 | **Login / Register** | Navigates to `/login` or is redirected after hitting a protected action | Split screen: Sign In (left) + Create Account (right) |
| 2 | **Register (right panel)** | Selects **Seller** tab (default) | Form shows seller fields |
| 3 | **Register** | Fills First Name, Last Name, Phone, Email, Password | Real-time validation |
| 4 | **Register** | Clicks **"Create Free Account"** | Account created; JWT token stored in `localStorage`; redirected to home or submit-offer |

**Alternative — Dealer registration:**
- User switches to **Dealer** tab
- Additional fields appear (dealership name, CR number)
- On approval, redirected to Dealer Dashboard

---

## Scenario 4 — Returning User Sign In

**Persona:** An existing seller checking on their active offer requests.

### Steps

| # | Screen | Action | System Response |
|---|--------|--------|-----------------|
| 1 | **Login / Register** | Stays on **Sign In** panel (left) | Seller / Dealer tab toggle visible |
| 2 | **Login** | Enters email/phone + password | — |
| 3 | **Login** | Clicks **"Sign In"** | JWT stored; redirected to `/my-offers` dashboard |
| 4 | **Login** | *(Alternative)* Clicks **"Continue with Google"** | OAuth flow; same JWT outcome |

**Forgot password path:**
- Clicks "Forgot password?" → navigates to `/forgot-password` → receives reset link

---

## Scenario 5 — Dealer Views Dashboard & Places a Bid

**Persona:** A verified dealer (Ahmed) who logs in to check new listings and bid on cars.

**Pre-condition:** Logged in as dealer role.

### Steps

| # | Screen | Action | System Response |
|---|--------|--------|-----------------|
| 1 | **Dealer Dashboard** | Lands on dashboard after login | Sees personalised greeting, 4 stat cards: Active Bids (12), Bids Won (47), New Listings (8), Total Spent (QAR 2.4M) |
| 2 | **Dashboard** | Scans **"New Listings for You"** section | 3 pre-filtered listings shown (matching dealer's preferred makes/types) |
| 3 | **Dashboard** | Clicks **"Bid Now"** on Toyota Land Cruiser (QAR 285k est.) | Opens bid placement modal / navigates to listing detail |
| 4 | **Dashboard** | Enters bid amount and confirms | Bid recorded; listing moves to "My Active Bids" panel |
| 5 | **Dashboard** | Checks **"My Active Bids"** panel | Sees status badges: **Leading** (green) or **Outbid** (orange) per bid |
| 6 | **Dashboard** | Clicks on an "Outbid" listing | Prompted to raise bid or withdraw |

**Sidebar navigation available at all times:**
- Browse Listings, My Bids, Analytics, Good Deals, Margin Tool, Settings

---

## Scenario 6 — Dealer Uses the Margin Analysis (BI) Tool

**Persona:** Same dealer (Ahmed) evaluating whether a specific car is worth bidding on based on potential resale profit.

### Steps

| # | Screen | Action | System Response |
|---|--------|--------|-----------------|
| 1 | **BI Tool** | Navigates to **Margin Tool** from sidebar | Clean two-panel layout: Form (left) + Results (right) |
| 2 | **BI Tool — Form** | Selects **Make** → **Model** | Auto-detected badges appear (SUV · Petrol · Automatic) |
| 3 | **BI Tool — Form** | Selects **Year**, **Condition**, **Mileage bucket** | Fields update form state |
| 4 | **BI Tool — Form** | Selects **Cylinders** (6-cyl), **Warranty** status | Fine-tune params for accurate ML estimate |
| 5 | **BI Tool — Form** | Drags **Buy Price slider** to QAR 265,000 | Slider value shown below in large type |
| 6 | **BI Tool — Form** | Clicks **"Run Analysis"** | Calls `GET /ml/estimate`; results populate right panel |
| 7 | **BI Tool — Results** | Views **Fair Market Value** card | QAR 285,000 · Range bar QAR 265k–310k · Based on 47 similar listings |
| 8 | **BI Tool — Results** | Views **Margin Analysis** grid | Buy Price QAR 265k · Market Value QAR 285k · **Potential Margin: +QAR 20k (7.5%)** |
| 9 | **BI Tool — Results** | Views **Price Forecast** | ▲ +1.8% over 30 days — market trending upward |
| 10 | **BI Tool — Results** | Views **Time to Sell** | 7–14 days — high demand segment |
| 11 | **BI Tool** | Decides the margin is acceptable → navigates back to listing | Places bid at or below QAR 265k to protect margin |

---

## Guest / Unauthenticated Flow

**Persona:** A visitor who hasn't logged in, accessing the valuation tool.

| Step | Behaviour |
|------|-----------|
| Visits `/` | Sees full homepage, no auth required |
| Clicks "Get My Car's Value" | Proceeds through Valuation Steps 1 & 2 without login |
| Reaches Results page | Valuation shown; **guest token auto-bootstrapped** via `guestLogin()` in auth context |
| Clicks "Submit My Car" | Prompted to create account / sign in before submitting offer |

---

## Data Flow Summary

```
Seller Wizard
  Step 1 (Make/Model/Trim)
  Step 2 (Year/KM/Condition/City/Cylinders/Warranty)
      └── POST /api/proxy/ml/estimate
              ├── make, class_name, trim
              ├── manufacture_year, km
              ├── car_type, fuel_type, gear_type
              ├── cylinder_count, warranty_status
              ├── seller_type = "private"
              ├── city, condition
              └── → { estimate, confidence_range: { low, high }, time_to_sell, price_forecast }

Dealer BI Tool
  Form (same fields as Seller Wizard + buy_price)
      └── POST /api/proxy/ml/estimate (same endpoint)
              └── → same response shape
                      └── margin = estimate - buy_price
```

---

## Wireframe Screens Index

| Screen | MockFlow Page | Route |
|--------|---------------|-------|
| Home / Landing | Page 1 | `/` |
| Valuation Step 1 — Your Car | Page 2 | `/valuation` |
| Valuation Step 2 — Details | Page 3 | `/valuation` (step 2) |
| Valuation Results | Page 4 | `/valuation` (results) |
| Submit Offer Form | Page 5 | `/submit-offer` |
| Dealer Dashboard | Page 6 | `/dashboard` |
| Dealer BI Tool | Page 7 | `/dashboard/bi` (margin tool) |
| Login & Register | Page 8 | `/login` |
