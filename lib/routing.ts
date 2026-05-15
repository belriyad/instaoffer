/**
 * routing.ts — Opportunity Type Routing Engine
 *
 * Central decision engine that maps submission context to one of the 5
 * typed opportunity queues.  Hard guardrail: **never route by button**.
 * The type is derived from page-context (URL pathname + `intent` param)
 * at submission time — it is never taken from a raw `lead_type` URL param
 * that a button could inject.
 *
 * 5 canonical opportunity types
 * ──────────────────────────────
 * seller_offer_request  → API: 'seller_offer'  → /dashboard/leads
 * urgent_sale_lead      → API: 'urgent_sale'   → /dashboard/urgent
 * trade_in_deal         → API: 'trade_in'      → /dashboard/trade-ins
 * buyer_request         → API: 'buyer_request' → /dashboard/buyer-requests
 * dealer_inquiry        → API: 'dealer_inquiry' → /dashboard/inquiries
 */

// ─── Canonical opportunity type names (human-readable) ───────────────────────

export type OpportunityType =
  | 'seller_offer_request'
  | 'urgent_sale_lead'
  | 'trade_in_deal'
  | 'buyer_request'
  | 'dealer_inquiry';

// ─── API-level lead_type values (sent to backend) ─────────────────────────────

export type ApiLeadType =
  | 'seller_offer'
  | 'urgent_sale'
  | 'trade_in'
  | 'buyer_request'
  | 'dealer_inquiry';

// ─── Intent values — carried as ?intent= URL param, never ?lead_type= ─────────

export type IntentParam =
  | 'trade_in'
  | 'urgent_sale'
  | 'buyer_request'
  | 'dealer_inquiry';

// ─── Mapping tables ───────────────────────────────────────────────────────────

/** Maps canonical type → API lead_type value */
export const OPPORTUNITY_LEAD_TYPE: Record<OpportunityType, ApiLeadType> = {
  seller_offer_request: 'seller_offer',
  urgent_sale_lead:     'urgent_sale',
  trade_in_deal:        'trade_in',
  buyer_request:        'buyer_request',
  dealer_inquiry:       'dealer_inquiry',
};

/** Maps canonical type → dealer queue page URL */
export const OPPORTUNITY_QUEUE: Record<OpportunityType, string> = {
  seller_offer_request: '/dashboard/leads',
  urgent_sale_lead:     '/dashboard/urgent',
  trade_in_deal:        '/dashboard/trade-ins',
  buyer_request:        '/dashboard/buyer-requests',
  dealer_inquiry:       '/dashboard/inquiries',
};

/** Human-readable label for each opportunity type */
export const OPPORTUNITY_LABEL: Record<OpportunityType, string> = {
  seller_offer_request: 'Seller Offer Request',
  urgent_sale_lead:     'Urgent Sale Lead',
  trade_in_deal:        'Trade-In Deal',
  buyer_request:        'Buyer Request',
  dealer_inquiry:       'Dealer Inquiry',
};

// ─── Core routing function ────────────────────────────────────────────────────

/**
 * Derives the API `lead_type` value from the flow's `intent` URL param.
 *
 * Rules:
 * - `intent=trade_in`       → 'trade_in'       (from /trade-in flow)
 * - `intent=urgent_sale`    → 'urgent_sale'     (from /urgent-sale flow)
 * - `intent=buyer_request`  → 'buyer_request'   (from /buy-request flow)
 * - `intent=dealer_inquiry` → 'dealer_inquiry'  (from /cars/[slug] flow)
 * - absent / unknown        → 'seller_offer'    (default: /submit-offer flow)
 *
 * The raw `lead_type` URL param is intentionally ignored to prevent
 * button-level routing overrides.
 */
export function resolveLeadType(intent?: string | null): ApiLeadType {
  switch (intent) {
    case 'trade_in':        return 'trade_in';
    case 'urgent_sale':     return 'urgent_sale';
    case 'buyer_request':   return 'buyer_request';
    case 'dealer_inquiry':  return 'dealer_inquiry';
    default:                return 'seller_offer';
  }
}

/**
 * Maps an API lead_type value back to the canonical OpportunityType name.
 * Useful for display purposes in queue pages.
 */
export function opportunityTypeFromLeadType(leadType: ApiLeadType): OpportunityType {
  const map: Record<ApiLeadType, OpportunityType> = {
    seller_offer:   'seller_offer_request',
    urgent_sale:    'urgent_sale_lead',
    trade_in:       'trade_in_deal',
    buyer_request:  'buyer_request',
    dealer_inquiry: 'dealer_inquiry',
  };
  return map[leadType];
}
