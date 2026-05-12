# InstaOffer — Decision Tree & Opportunity Flow

This document is the **authoritative reference** for how a user action maps to a backend opportunity type, which queue it surfaces in, and what data the detail page must show.

---

## 1. The Decision Tree

```
User visits /valuation
    ↓
Enters car details → ML estimate returned
    ↓
Three outcome cards presented (EstimateResult.tsx):
    ├── Maximize Value (private sale range)
    │       → CTA: "Get Dealer Offers" → /submit-offer?lead_type=seller_offer
    │       → Opportunity type: seller_offer_request
    │       → Queue: /dashboard/leads  (Seller Leads)
    │
    ├── Trade-In Value (trade-in range)
    │       → CTA: "Start Trade-In" → /trade-in?...vehicle params...
    │       → Opportunity type: trade_in_deal
    │       → Queue: /dashboard/trade-ins  (Trade-In Deals)
    │
    └── Instant Offer (instant / urgent range)
            → CTA: "Get Instant Offer" → /urgent-sale?...vehicle params...
            → Opportunity type: urgent_sale_lead
            → Queue: /dashboard/urgent  (Urgent Sellers)

User visits /cars/[slug]  (new car browsing)
    ├── "Contact Dealer" button
    │       → logs dealer_inquiry + opens WhatsApp
    │       → Opportunity type: dealer_inquiry
    │       → Queue: /dashboard/inquiries  (Direct Inquiries)
    │
    └── "Trade In My Car" button
            → /trade-in?target_car_id=...&target_name=...&target_price=...&target_dealer=...
            → Opportunity type: trade_in_deal
            → Queue: /dashboard/trade-ins

User visits /buy-request  (buyer looking for a car)
    → Opportunity type: buyer_request
    → Queue: /dashboard/buyer-requests  (Buyer Requests)
```

---

## 2. Five Opportunity Types

| Opportunity Type       | User Action                              | `lead_type` sent to API      | Dealer Queue                        | Detail Page                            |
|------------------------|------------------------------------------|------------------------------|-------------------------------------|----------------------------------------|
| `seller_offer_request` | Get Dealer Offers from valuation result  | `seller_offer`               | `/dashboard/leads`                  | `/dashboard/leads/[request_uid]`       |
| `urgent_sale_lead`     | Get Instant Offer from valuation result  | `urgent_sale`                | `/dashboard/urgent`                 | *(cards, no separate detail page)*     |
| `trade_in_deal`        | Trade In from valuation or /cars/[slug]  | `trade_in`                   | `/dashboard/trade-ins`              | `/dashboard/trade-ins/[uid]`           |
| `buyer_request`        | Post a buy request (/buy-request)        | `buyer_request`              | `/dashboard/buyer-requests`         | *(cards, no separate detail page)*     |
| `dealer_inquiry`       | Contact Dealer on /cars/[slug]           | `dealer_inquiry`             | `/dashboard/inquiries`              | *(cards with Reply/Dismiss actions)*   |

---

## 3. Queue → Detail Page Mapping

| Queue Page                        | API Call                                              | Filter                              |
|-----------------------------------|-------------------------------------------------------|-------------------------------------|
| `/dashboard/leads`                | `getDealerLeads({ lead_type: 'seller_offer' })`       | Seller offer requests only          |
| `/dashboard/leads/[request_uid]`  | `getOfferRequestDetail(request_uid)`                  | Full request + bids + market comps  |
| `/dashboard/urgent`               | `getAllOfferRequests({ sort_by: 'urgency' })`         | Client-side: `r.is_urgent === true` |
| `/dashboard/trade-ins`            | `getDealerLeads({ lead_type: 'trade_in' })`           | Trade-in leads only                 |
| `/dashboard/trade-ins/[uid]`      | `getTradeInDetail(uid)`                               | Both vehicles + estimate + proposal |
| `/dashboard/buyer-requests`       | `getDealerLeads({ lead_type: 'buyer_request' })`      | Buyer want-to-buy requests          |
| `/dashboard/inquiries`            | `getDealerLeads({ lead_type: 'dealer_inquiry' })`     | New car dealer inquiries            |

---

## 4. Status Model

All offer requests share a common status lifecycle:

```
new
 ↓
reviewing          ← dealer acknowledges
 ↓
info_requested     ← dealer requests more docs/photos (optional)
 ↓
offer_sent         ← dealer places a bid  (placeBid API)
 ↓
accepted           ← seller accepts bid   (acceptBid API)
  or
rejected           ← seller rejects / bid expires
 ↓
closed / expired
```

Trade-in deals use a parallel status model:
```
new → reviewing → proposed → accepted / rejected → closed
```

---

## 5. Validation Scenarios (A–E)

### Scenario A — Seller requests offers (standard flow)
1. User completes `/valuation` → sees estimate.
2. Clicks "Get Dealer Offers" → `/submit-offer?lead_type=seller_offer`.
3. `createOfferRequest({ lead_type: 'seller_offer', ... })` posted.
4. Lead appears in `/dashboard/leads` (filtered `lead_type=seller_offer`).
5. Dealer opens `/dashboard/leads/[request_uid]` → places bid.
6. Seller sees bid in `/my-offers/[uid]`.

### Scenario B — Urgent sale
1. User clicks "Get Instant Offer" → `/urgent-sale` (pre-filled with vehicle params).
2. Completes 4-step flow with evidence photos.
3. `createOfferRequest({ lead_type: 'urgent_sale', is_urgent: true, ... })` posted.
4. Appears in `/dashboard/urgent` sorted by urgency score.

### Scenario C — Trade-in from valuation
1. User clicks "Start Trade-In" → `/trade-in?...vehicle params...`.
2. Steps through trade-in form with target vehicle context.
3. Trade-in request posted → appears in `/dashboard/trade-ins`.
4. Dealer opens `/dashboard/trade-ins/[uid]` → sees both vehicles + estimate + sends proposal.

### Scenario D — Buy request
1. Logged-in buyer visits `/buy-request` (optionally pre-filled from valuation).
2. Fills make/model/year/km/budget → `createBuyRequest()` posted.
3. Appears in `/dashboard/buyer-requests` for dealers with matching inventory.

### Scenario E — Dealer inquiry from car listing
1. User browses `/cars/[slug]` and clicks "Contact Dealer".
2. WhatsApp opens immediately (no blocking).
3. Fire-and-forget: `createOfferRequest({ lead_type: 'dealer_inquiry', ... })` posted in background.
4. Appears in `/dashboard/inquiries` for relevant dealer.

---

## 6. Context Carry-Through

All flows pass vehicle context via URL query params to avoid redundant re-entry:

| Source Page          | Destination               | Params Passed                                              |
|----------------------|---------------------------|------------------------------------------------------------|
| `/valuation` result  | `/submit-offer`           | `make`, `class_name`, `year`, `km`, `city`, `estimate`    |
| `/valuation` result  | `/trade-in`               | `make`, `class_name`, `year`, `km`, `city`, `estimate`    |
| `/valuation` result  | `/urgent-sale`            | `make`, `class_name`, `year`, `km`, `city`                |
| `/cars/[slug]`       | `/trade-in`               | `target_car_id`, `target_name`, `target_price`, `target_dealer` |
| `/buy-request`       | *(self)*                  | `make`, `class_name`, `year`, `km`, `condition`, `estimate`, `low`, `high` |

---

## 7. Auth Guards & Redirect Preservation

Pages that require authentication redirect to login with the `?redirect=` param so users return to their destination after sign-in:

```ts
router.push('/login?redirect=' + encodeURIComponent(pathname));
```

Affected pages:
- `/my-offers/[uid]`
- `/messages/[uid]`

The `/login` page reads `?redirect=` and redirects there after successful sign-in (defaults to `/my-offers` if not set).

---

## 8. Implementation Files Reference

| Feature                          | File                                                          |
|----------------------------------|---------------------------------------------------------------|
| Valuation entry                  | `app/valuation/page.tsx`                                      |
| Valuation outcomes (3 cards)     | `app/valuation/EstimateResult.tsx`                            |
| Seller offer submission          | `app/submit-offer/page.tsx`                                   |
| Urgent sale flow                 | `app/urgent-sale/page.tsx`                                    |
| Trade-in flow                    | `app/trade-in/page.tsx`                                       |
| Buy request                      | `app/buy-request/page.tsx`                                    |
| New car detail + dealer inquiry  | `app/cars/[slug]/page.tsx`                                    |
| Seller offer detail              | `app/my-offers/[uid]/page.tsx`                                |
| Dealer: Seller Leads queue       | `app/dashboard/leads/page.tsx`                                |
| Dealer: Seller Lead detail       | `app/dashboard/leads/[request_uid]/page.tsx`                  |
| Dealer: Urgent Sellers           | `app/dashboard/urgent/page.tsx`                               |
| Dealer: Trade-In queue           | `app/dashboard/trade-ins/page.tsx`                            |
| Dealer: Trade-In detail          | `app/dashboard/trade-ins/[uid]/page.tsx`                      |
| Dealer: Buyer Requests           | `app/dashboard/buyer-requests/page.tsx`                       |
| Dealer: Direct Inquiries         | `app/dashboard/inquiries/page.tsx`                            |
| API layer                        | `lib/api.ts`                                                  |
| Auth context                     | `lib/auth-context.tsx`                                        |
| Mixed-content proxy              | `app/api/proxy/[...path]/route.ts`                            |
