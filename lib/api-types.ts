/**
 * api-types.ts
 *
 * Extended / upcoming API types for features gated on backend issues
 * BE-002 through BE-005. These types are derived from the swagger.yaml,
 * existing api.ts shapes, and issue specs so that feature branches can
 * reference them before the backend lands.
 */

// ─── FE-002: Pending status (BE-002) ─────────────────────────────────────────

/**
 * Full set of offer-request statuses including the new `pending` value
 * added in BE-002 (bid accepted, awaiting finalisation).
 */
export type OfferRequestStatus =
  | 'open'
  | 'pending'       // NEW – bid accepted, awaiting finalisation
  | 'under_offer'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'cancelled';

/** Badge display config for every offer-request status. */
export const OFFER_REQUEST_STATUS_CONFIG: Record<
  OfferRequestStatus,
  { label: string; badgeClass: string }
> = {
  open:        { label: 'Open',        badgeClass: 'bg-blue-50 text-blue-700' },
  pending:     { label: 'Under Offer', badgeClass: 'bg-amber-50 text-amber-700' },
  under_offer: { label: 'Offer Received', badgeClass: 'bg-orange-50 text-orange-700' },
  accepted:    { label: 'Accepted',    badgeClass: 'bg-green-50 text-green-700' },
  rejected:    { label: 'Rejected',    badgeClass: 'bg-red-50 text-red-700' },
  expired:     { label: 'Expired',     badgeClass: 'bg-gray-100 text-gray-500' },
  cancelled:   { label: 'Cancelled',   badgeClass: 'bg-gray-100 text-gray-500' },
};

/** Returns true when bidding should be disabled on an offer request. */
export function isBiddingClosed(status: OfferRequestStatus): boolean {
  return status === 'pending' || status === 'accepted' || status === 'rejected' || status === 'expired' || status === 'cancelled';
}

// ─── FE-003: Dealer Subscription (BE-003) ────────────────────────────────────

/**
 * Response shape for GET /api/proxy/instant-offers/subscription
 */
export interface DealerSubscription {
  is_active: boolean;
  plan_name: string;
  price_qar: number;
  /** ISO-8601 date string, null if no active sub */
  expires_at: string | null;
  /** ISO-8601 date string when the subscription started */
  started_at: string | null;
}

/** Placeholder value while the subscription fetch is in-flight. */
export type SubscriptionLoadState = 'loading' | 'active' | 'inactive' | 'error';

// ─── FE-004: Saved Filter Presets (BE-004) ────────────────────────────────────

/**
 * A saved dealer filter preset.
 * POST  /api/proxy/instant-offers/filters  — create
 * GET   /api/proxy/instant-offers/filters  — list
 * DELETE /api/proxy/instant-offers/filters/:id — delete
 */
export interface SavedFilter {
  id: number;
  name: string;
  /** Number of current open leads matching this filter */
  match_count: number;
  filters: SavedFilterCriteria;
  created_at: string;
}

export interface SavedFilterCriteria {
  makes?: string[];
  cities?: string[];
  min_year?: number;
  max_year?: number;
  max_km?: number;
  conditions?: string[];
  min_price_qar?: number;
  max_price_qar?: number;
}

/** Request body for creating a saved filter */
export interface CreateSavedFilterRequest {
  name: string;
  filters: SavedFilterCriteria;
}

// ─── FE-005: Bid Expiry (BE-005) ──────────────────────────────────────────────

/**
 * Extended bid shape that includes the expiry fields added in BE-005.
 * Extends the base OfferBid from api.ts — `expires_at` was already
 * present; `is_expired` is new.
 */
export interface BidWithExpiry {
  id: number;
  bid_uid: string;
  request_id: number;
  dealer_id: string;
  amount_qar: number;
  message: string | null;
  /** ISO-8601 datetime, null if no expiry was set */
  expires_at: string | null;
  /** Computed server-side — true when expires_at is in the past */
  is_expired: boolean;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';
  created_at: string;
  updated_at: string;
}

/**
 * Formats a future datetime as a human-readable countdown string.
 * Returns null if `expiresAt` is null, in the past, or unparseable.
 *
 * Example: "Expires in 2h 30m"
 */
export function formatBidExpiry(expiresAt: string | null): string | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return null;

  const totalMinutes = Math.floor(diff / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) return `Expires in ${hours}h ${minutes}m`;
  if (hours > 0) return `Expires in ${hours}h`;
  return `Expires in ${minutes}m`;
}

/**
 * Returns true when a bid should be displayed as expired / non-actionable.
 */
export function isBidExpired(bid: Pick<BidWithExpiry, 'is_expired' | 'status' | 'expires_at'>): boolean {
  if (bid.is_expired) return true;
  if (bid.status === 'expired') return true;
  if (bid.expires_at && new Date(bid.expires_at).getTime() < Date.now()) return true;
  return false;
}

// ─── FE-001 / FE-006–009: Phone request (BE-001) — types reserved ─────────────

/**
 * Phone-number access request (BE-001).
 * Kept here as a placeholder so that FE-001, FE-006–009 can import when ready.
 */
export interface PhoneRequest {
  id: number;
  request_uid: string;
  dealer_id: string;
  customer_id: string;
  offer_request_uid: string;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  updated_at: string;
}
