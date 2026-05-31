// The backend runs on plain HTTP.  When accessed from the browser on an HTTPS
// page (e.g. Vercel) mixed-content rules block HTTP requests, so we route all
// browser-side calls through our own Next.js proxy at /api/proxy/[...path].
// Server-side (SSR / build-time) we call the backend directly — no restriction.
const BACKEND_URL =
  process.env.API_BASE_URL || 'http://174.165.78.29:8090/api';

// In the browser use a relative path so the request stays on the same HTTPS origin.
const BASE_URL =
  typeof window === 'undefined'
    ? BACKEND_URL          // server: direct HTTP call (no mixed-content issue)
    : '/api/proxy';        // browser: goes to our Next.js proxy route

// ─── Image proxy helper ────────────────────────────────────────────────────────
// Car listing images from external sources must go through the backend proxy.
export function imgProxyUrl(originalUrl: string): string {
  if (!originalUrl) return '';
  return `${BASE_URL}/img-proxy?url=${encodeURIComponent(originalUrl)}`;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Unknown error' }));
    // API returns { error: "..." } — but also handle FastAPI 422 { detail: [...] }
    const detail = body.detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const msg = detail
        .map((d: { msg?: string; message?: string }) => d.msg || d.message)
        .filter(Boolean)
        .join(', ');
      throw new Error(msg || `HTTP ${res.status}`);
    }
    throw new Error(body.error || body.message || body.detail || `HTTP ${res.status}`);
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export async function guestLogin(): Promise<AuthTokens> {
  return apiFetch<AuthTokens>('/auth/guest/login', { method: 'POST' });
}

export async function refreshToken(refresh: string): Promise<AuthTokens> {
  return apiFetch<AuthTokens>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refresh }),
  });
}

export async function register(data: {
  email: string;
  password: string;
  full_name: string;
  role?: string;
}): Promise<AuthTokens> {
  return apiFetch<AuthTokens>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function login(data: {
  login: string;
  password: string;
}): Promise<AuthTokens> {
  return apiFetch<AuthTokens>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function logout(token: string): Promise<void> {
  return apiFetch('/auth/logout', { method: 'POST' }, token);
}

// ─── ML Valuation ─────────────────────────────────────────────────────────────

export interface MLEstimate {
  estimated_price_qar: number;
  confidence_range: [number, number];
  segment: string;
  model_version: string;
  r2: number;
  mape: number;
  // New: which estimator produced this response
  pricing_model?: 'taxonomy' | 'classifier' | 'consensus';
  // Consensus-mode fields (when pricing_model=consensus)
  consensus_status?: 'agree' | 'diverged';
  taxonomy_estimated_price_qar?: number;
  classifier_estimated_price_qar?: number;
  estimate_gap_qar?: number;
  // Classifier-mode fields (when pricing_model=classifier)
  bucket_index?: number;
  bucket_label?: string;
  bucket_probability?: number;
}

export interface ValuationParams {
  make: string;
  class_name: string;
  manufacture_year: number;
  km: number;
  trim?: string;
  cylinder_count?: number;
  car_type?: string;
  warranty_status?: string;
  fuel_type?: string;
  gear_type?: string;
  city?: string;
  seller_type?: string;
  condition?: string;
  /** Select the estimator backend. Defaults to taxonomy. */
  pricing_model?: 'taxonomy' | 'classifier' | 'consensus';
}

export async function getMLEstimate(params: ValuationParams, token?: string): Promise<MLEstimate> {
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)])
  ).toString();
  return apiFetch<MLEstimate>(`/ml/estimate?${qs}`, {}, token);
}

export interface ForecastPoint {
  horizon: string;
  months: number;
  estimated_price_qar: number;
  change_pct: number;
}

export interface MLForecast {
  current: { estimated_price_qar: number; confidence_range: [number, number]; segment: string };
  forecast: ForecastPoint[];
  market_trend_annual_pct: number;
  annual_km_assumption: number;
  model_version: string;
  segment: string;
  r2: number;
  mape: number;
}

export async function getMLForecast(params: ValuationParams, token?: string): Promise<MLForecast> {
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)])
  ).toString();
  return apiFetch<MLForecast>(`/ml/forecast?${qs}`, {}, token);
}

// ─── Market Comps ─────────────────────────────────────────────────────────────

export interface OfferComps {
  count: number;
  median: number | null;
  p25: number | null;
  p75: number | null;
  min: number | null;
  max: number | null;
  avg: number | null;
  samples: {
    product_id: string;
    title: string;
    price_qar: number;
    km: number;
    manufacture_year: number;
    city: string;
    main_image_url: string;
  }[];
}

export async function getMarketComps(params: {
  make: string;
  class_name: string;
  year: number;
  km: number;
  model?: string;
}, token?: string): Promise<OfferComps> {
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)])
  ).toString();
  return apiFetch<OfferComps>(`/instant-offers/comps?${qs}`, {}, token);
}

// ─── Instant Offers ───────────────────────────────────────────────────────────

export interface OfferRequest {
  id: number;
  request_uid: string;
  customer_id: string;
  make: string;
  class_name: string;
  model: string | null;
  year: number;
  km: number;
  color: string | null;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  city: string;
  description: string | null;
  photo_urls_json: string | null;
  asking_price_qar: number | null;
  contact_name: string | null;
  contact_phone: string | null;
  status: 'open' | 'pending' | 'under_offer' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
  accepted_bid_id: number | null;
  is_urgent?: boolean;
  urgency_reason?: 'leaving_qatar' | 'need_cash' | 'upgrading' | 'other' | null;
  sell_priority?: 'speed' | 'price' | 'balanced';
  lead_type?: 'seller_offer' | 'urgent_sale' | 'trade_in' | 'buyer_request' | 'dealer_inquiry';
  vin?: string | null;
  chassis_number?: string | null;
  trust_score?: number;
  trust_badge?: 'high' | 'medium' | 'low';
  listing_completeness_pct?: number;
  trust_flags?: string[];
  opportunity_score?: number;
  deal_classification?: 'hot' | 'good' | 'watch' | 'skip';
  score_explanation?: string[];
  market_est_qar?: number | null;
  potential_margin_qar?: number | null;
  discount_pct?: number | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DealerAlert {
  id: number;
  alert_uid: string;
  dealer_id: string;
  request_id: number;
  request_uid: string;
  make: string;
  class_name: string;
  model: string | null;
  year: number;
  km: number;
  city: string;
  condition: string;
  asking_price_qar: number | null;
  is_urgent: boolean;
  urgency_reason: string | null;
  sell_priority: string;
  request_status: string;
  opportunity_score: number;
  deal_classification: 'hot' | 'good' | 'watch' | 'skip';
  market_est_qar: number | null;
  potential_margin_qar: number | null;
  score_explanation: string[];
  whatsapp_status: 'not_sent' | 'sent' | 'failed' | 'no_whatsapp_channel';
  whatsapp_message_id: string | null;
  status: string;
  sent_at: string;
  created_at: string;
  updated_at: string;
}

export interface OfferBid {
  id: number;
  bid_uid: string;
  request_id: number;
  dealer_id: string;
  amount_qar: number;
  message: string | null;
  expires_at: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';
  created_at: string;
  updated_at: string;
}

// ─── File upload ──────────────────────────────────────────────────────────────
export async function uploadFile(
  file: File,
  token: string
): Promise<{ url: string }> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip data:image/jpeg;base64, prefix
      resolve(result.split(',')[1] ?? result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return apiFetch('/uploads', {
    method: 'POST',
    body: JSON.stringify({
      filename:       file.name,
      mime_type:      file.type || 'application/octet-stream',
      content_base64: base64,
    }),
  }, token);
}

export async function createOfferRequest(
  data: {
    make: string;
    class_name: string;
    model?: string;
    year: number;
    km: number;
    color?: string;
    condition: string;
    city: string;
    description?: string;
    photo_urls_json?: string;
    asking_price_qar?: number;
    contact_name?: string;
    contact_phone?: string;
    has_inspection?: boolean;
    // Urgent seller flow — BE-#47
    is_urgent?: boolean;
    urgency_reason?: 'leaving_qatar' | 'need_cash' | 'upgrading' | 'other';
    sell_priority?: 'speed' | 'price' | 'balanced';
    // Opportunity Engine routing — BE-#75
    lead_type?: 'seller_offer' | 'urgent_sale' | 'trade_in' | 'buyer_request' | 'dealer_inquiry';
    vin?: string;
    chassis_number?: string;
  },
  token: string
): Promise<{ request: OfferRequest }> {
  return apiFetch('/instant-offers/requests', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
}

export async function getMyOfferRequests(token: string): Promise<{ rows: OfferRequest[]; total: number }> {
  return apiFetch('/instant-offers/requests/mine', {}, token);
}

export async function getOfferRequestDetail(
  uid: string,
  token: string
): Promise<OfferRequest & { bids: OfferBid[]; market_comps?: unknown }> {
  // API returns { request: {...}, bids: [...], market_comps: {...} }
  const res = await apiFetch<{
    request: OfferRequest;
    bids: OfferBid[];
    market_comps?: unknown;
  }>(`/instant-offers/requests/${uid}`, {}, token);
  return { ...res.request, bids: res.bids ?? [], market_comps: res.market_comps };
}

export async function placeBid(
  requestUid: string,
  data: { amount_qar: number; message?: string; expires_at?: string },
  token: string
): Promise<{ bid: OfferBid }> {
  return apiFetch(`/instant-offers/requests/${requestUid}/bids`, {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
}

export async function acceptBid(
  requestUid: string,
  bidUid: string,
  token: string
): Promise<void> {
  return apiFetch(`/instant-offers/requests/${requestUid}/accept-bid`, {
    method: 'POST',
    body: JSON.stringify({ bid_uid: bidUid }),
  }, token);
}

export async function rejectBid(
  requestUid: string,
  bidUid: string,
  token: string
): Promise<void> {
  return apiFetch(`/instant-offers/requests/${requestUid}/reject-bid`, {
    method: 'POST',
    body: JSON.stringify({ bid_uid: bidUid }),
  }, token);
}

export async function getMessages(requestUid: string, token: string) {
  return apiFetch(`/instant-offers/requests/${requestUid}/messages`, {}, token);
}

export async function sendMessage(
  requestUid: string,
  data: { recipient_id: string; body: string },
  token: string
) {
  return apiFetch(`/instant-offers/requests/${requestUid}/messages`, {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
}

export async function getDealerBids(token: string) {
  return apiFetch('/instant-offers/bids/mine', {}, token);
}

export async function withdrawBid(bidUid: string, token: string): Promise<{ ok: boolean }> {
  return apiFetch(`/instant-offers/bids/${bidUid}/withdraw`, { method: 'POST' }, token);
}

export async function getAllOfferRequests(token: string, params?: {
  status?: string;
  make?: string;
  city?: string;
  limit?: number;
  offset?: number;
  sort_by?: 'opportunity_score' | 'discount_pct' | 'urgency' | 'created_at';
  sort_dir?: 'asc' | 'desc';
  deal_classification?: 'hot' | 'good' | 'watch' | 'skip';
  is_urgent?: boolean;
  lead_type?: 'seller_offer' | 'urgent_sale' | 'trade_in' | 'buyer_request' | 'dealer_inquiry';
}) {
  const qs = params
    ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : '';
  return apiFetch(`/instant-offers/requests${qs}`, {}, token);
}

export async function getDealerAlerts(token: string, params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ rows: DealerAlert[]; total: number }> {
  const qs = params
    ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : '';
  return apiFetch(`/instant-offers/dealer-alerts${qs}`, {}, token);
}

export async function getDealerPreferences(token: string) {
  return apiFetch('/instant-offers/preferences', {}, token);
}

export async function setDealerPreferences(
  data: {
    makes?: string[];
    cities?: string[];
    min_year?: number;
    max_year?: number;
    max_km?: number;
    notify_push?: boolean;
    notify_whatsapp?: boolean;
    min_score_for_alert?: number;
    active?: boolean;
  },
  token: string
) {
  return apiFetch('/instant-offers/preferences', {
    method: 'PUT',
    body: JSON.stringify(data),
  }, token);
}

export async function getNotifications(userKey: string, token: string) {
  return apiFetch(`/notifications?user_key=${userKey}`, {}, token);
}

export async function markNotificationsRead(
  userKey: string,
  ids: number[],
  token: string
) {
  return apiFetch('/notifications/mark-read', {
    method: 'POST',
    body: JSON.stringify({ user_key: userKey, ids }),
  }, token);
}

// ─── Users / Profile ──────────────────────────────────────────────────────────

export interface User {
  id: string;
  role: 'guest' | 'user' | 'dealer' | 'admin';
  email: string;
  phone: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export async function getMe(token: string): Promise<User> {
  return apiFetch<User>('/me', {}, token);
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export interface UserProfile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  preferred_language: string | null;
  timezone: string | null;
  city: string | null;
}

export async function getProfile(token: string): Promise<UserProfile> {
  return apiFetch<UserProfile>('/me/profile', {}, token);
}

export async function patchProfile(
  data: Partial<Omit<UserProfile, 'user_id'>>,
  token: string
): Promise<UserProfile> {
  return apiFetch<UserProfile>('/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }, token);
}

// Swagger: POST /auth/change-password returns new AuthTokens (200)
export async function changePassword(
  data: { current_password: string; new_password: string },
  token: string
): Promise<AuthTokens> {
  return apiFetch<AuthTokens>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
}

// ─── Listings ─────────────────────────────────────────────────────────────────

export interface ListingCreate {
  // Required (swagger: required: [title, price_qar, make, class_name])
  title: string;
  price_qar: number;
  make: string;
  class_name: string;
  // Optional top-level fields matching swagger ListingCreate schema
  model?: string;
  manufacture_year?: number;
  km?: number;
  warranty_status?: string;
  cylinder_count?: number;
  seller_name?: string;
  seller_phone?: string;
  seller_whatsapp?: string;
  seller_type?: string;
  city?: string;
  description?: string;
  main_image_url?: string;
  image_urls_json?: string;
  all_image_urls_json?: string;
  // Extra vehicle attributes (trim, color, car_type, etc.) packed here
  properties_json?: string;
}

export interface Listing {
  product_id: string;
  title: string;
  price_qar: number;
  make: string;
  class_name: string;
  model: string | null;
  manufacture_year: number | null;
  km: number | null;
  city: string | null;
  description: string | null;
  seller_name: string | null;
  seller_phone: string | null;
  seller_type: string | null;
  warranty_status: string | null;
  main_image_url: string | null;
  created_at: string;
}

export interface ListingsFilters {
  search?: string;
  make?: string;
  class_name?: string;
  model?: string;
  city?: string;
  sort?: string;
  limit?: number;
  offset?: number;
  min_year?: number;
  max_year?: number;
  min_price?: number;
  max_price?: number;
  min_km?: number;
  max_km?: number;
  deals_only?: '0' | '1';
  /** Filter by urgency flag. 1=urgent only, 0=non-urgent only */
  is_urgent?: '0' | '1';
  /** Minimum urgency score 0-100 */
  min_urgency_score?: number;
  /** Filter by seller type: individual, dealer, company */
  seller_type?: string;
  /** Filter by fuel type: Petrol, Diesel, Hybrid, Electric */
  fuel_type?: string;
  /** Filter by transmission: Automatic, Manual */
  gear_type?: string;
  /** Filter by trim level */
  trim?: string;
}

export interface ListingsResponse {
  rows: Listing[];
  makes: string[];
  classes: string[];
  models: string[];
  cities: string[];
}

export async function getListings(filters: ListingsFilters = {}): Promise<ListingsResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, String(v)); });
  const qs = params.toString();
  return apiFetch(`/listings${qs ? `?${qs}` : ''}`);
}

// Swagger does not define the 201 response body shape for POST /listings.
export async function createListing(
  data: ListingCreate,
  token: string
): Promise<{ listing?: Listing } & Partial<Listing>> {
  return apiFetch('/listings', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
}

export async function getUsers(token: string): Promise<{ rows: User[] }> {
  return apiFetch('/users', {}, token);
}

export async function updateUser(
  userId: string,
  data: { role?: string; is_active?: boolean },
  token: string
) {
  return apiFetch(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }, token);
}

// ─── Phone Number Requests (FE-001) ──────────────────────────────────────────

export async function requestPhoneAccess(
  requestUid: string,
  token: string
): Promise<void> {
  return apiFetch(`/instant-offers/requests/${requestUid}/phone-request`, {
    method: 'POST',
  }, token);
}

export async function getPhoneRequests(
  requestUid: string,
  token: string
): Promise<{ requests: import('./api-types').PhoneRequest[] }> {
  return apiFetch(`/instant-offers/requests/${requestUid}/phone-requests`, {}, token);
}

export async function approvePhoneRequest(
  requestUid: string,
  dealerId: string,
  token: string
): Promise<void> {
  return apiFetch(`/instant-offers/requests/${requestUid}/phone-request/approve`, {
    method: 'POST',
    body: JSON.stringify({ dealer_id: dealerId }),
  }, token);
}

export async function rejectPhoneRequest(
  requestUid: string,
  dealerId: string,
  token: string
): Promise<void> {
  return apiFetch(`/instant-offers/requests/${requestUid}/phone-request/reject`, {
    method: 'POST',
    body: JSON.stringify({ dealer_id: dealerId }),
  }, token);
}

// ─── Dealer Subscription (FE-003) ────────────────────────────────────────────

export async function getDealerSubscription(
  token: string
): Promise<import('./api-types').DealerSubscription> {
  return apiFetch('/instant-offers/subscription', {}, token);
}

// ─── Saved Filters (FE-004) ───────────────────────────────────────────────────

export async function getSavedFilters(
  token: string
): Promise<{ filters: import('./api-types').SavedFilter[] }> {
  return apiFetch('/instant-offers/filters', {}, token);
}

export async function createSavedFilter(
  data: import('./api-types').CreateSavedFilterRequest,
  token: string
): Promise<{ filter: import('./api-types').SavedFilter }> {
  return apiFetch('/instant-offers/filters', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
}

export async function deleteSavedFilter(
  id: number,
  token: string
): Promise<void> {
  return apiFetch(`/instant-offers/filters/${id}`, {
    method: 'DELETE',
  }, token);
}

// ─── Document Visibility (FE-007) ────────────────────────────────────────────

export async function setDocumentVisibility(
  requestUid: string,
  visibility: 'all_dealers' | 'approved_only' | 'none',
  token: string
): Promise<void> {
  return apiFetch(`/instant-offers/requests/${requestUid}/document-visibility`, {
    method: 'PATCH',
    body: JSON.stringify({ document_visibility: visibility }),
  }, token);
}

// ─── Dealer Online Status (FE-008) ───────────────────────────────────────────

export async function getDealerOnlineStatus(
  dealerId: string,
  token: string
): Promise<{ is_online: boolean; last_seen: string | null }> {
  return apiFetch(`/users/${dealerId}/online-status`, {}, token);
}

// ─── Phone Approval Audit Log (FE-006) ───────────────────────────────────────

export async function getPhoneApprovalLog(
  requestUid: string,
  token: string
): Promise<{ log: { dealer_id: string; action: string; timestamp: string; ip: string }[] }> {
  return apiFetch(`/instant-offers/requests/${requestUid}/phone-approval-log`, {}, token);
}

// ─── Buy Requests (Want to Buy) ───────────────────────────────────────────────

export interface BuyRequestParams {
  make: string;
  class_name: string;
  trim?: string;
  body_type?: string;
  year_min?: number;
  year_max?: number;
  km_max?: number;
  budget_min_qar?: number;
  budget_max_qar?: number;
  city?: string;
  condition?: string;
  contact_name: string;
  contact_phone: string;
  contact_email?: string;
  notes?: string;
  estimate_qar?: number;
}

export interface BuyRequest extends BuyRequestParams {
  id: number;
  request_uid: string;
  status: 'new' | 'open' | 'responded' | 'closed';
  created_at: string;
}

export async function createBuyRequest(
  data: BuyRequestParams
): Promise<{ ok: boolean; request_uid: string }> {
  return apiFetch('/buy-requests', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getDealerBuyRequests(
  token: string,
  params?: { status?: 'new' | 'responded' | 'closed' | 'open'; make?: string; limit?: number; offset?: number }
): Promise<{ rows: BuyRequest[]; total: number }> {
  const qs = params
    ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : '';
  return apiFetch(`/dealer/buy-requests${qs}`, {}, token);
}

export interface DealerInquiry {
  uid: string;
  car_id: string;
  car_name: string;
  dealer_id: string;
  contact_name: string | null;
  contact_phone: string | null;
  message: string | null;
  status: 'new' | 'replied' | 'closed';
  created_at: string;
}

export async function createDealerInquiry(
  data: {
    car_id: string;
    car_name: string;
    dealer_id: string;
    contact_name?: string;
    contact_phone?: string;
    message?: string;
  },
  token?: string
): Promise<{ uid: string; ok: boolean }> {
  return apiFetch('/dealer-inquiry', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
}

export async function getDealerInquiries(
  token: string,
  params?: { status?: 'new' | 'replied' | 'closed'; limit?: number; offset?: number }
): Promise<{ rows: DealerInquiry[]; total: number }> {
  const qs = params
    ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : '';
  return apiFetch(`/dealer/inquiries${qs}`, {}, token);
}

// ─── Dealer acquisition intelligence ─────────────────────────────────────────

export interface DealerStats {
  open_leads: number;
  good_deals: number;
  hot_this_week: number;
  offers_sent: number;
  offers_accepted: number;
  win_rate_pct: number;
  saved_filters: number;
}

export interface GoodDealRow {
  product_id: string;
  title: string;
  manufacture_year: number;
  make: string;
  class_name: string;
  trim: string;
  km: number;
  price_qar: number;
  expected_price_qar: number | null;
  discount_pct: number;
  discount_qar: number | null;
  city: string | null;
  seller_type: string | null;
  main_image_url: string | null;
  url: string | null;
}

export interface MarginTier {
  offer_qar: number;
  gross_qar: number;
  gross_pct: number;
  roi_pct: number;
}

export interface MarginCalcResult {
  ok: boolean;
  reason?: string;
  market_est_qar?: number;
  market_low_qar?: number;
  market_high_qar?: number;
  confidence?: string;
  segment?: string;
  model_mape_pct?: number;
  fixed_costs_qar?: number;
  tiers?: { conservative: MarginTier; target: MarginTier; aggressive: MarginTier };
  your_price?: MarginTier;
}

export interface DealerLead {
  request_uid: string;
  make: string;
  class_name: string;
  trim?: string;
  year_min?: number;
  year_max?: number;
  km_max?: number;
  budget_min_qar?: number;
  budget_max_qar?: number;
  city?: string;
  condition?: string;
  notes?: string;
  estimate_qar?: number;
  created_at: string;
}

export async function getDealerStats(token: string): Promise<DealerStats> {
  return apiFetch('/dealer/stats', {}, token);
}

export async function getDealerGoodDeals(
  params: { min_discount?: number; limit?: number; offset?: number },
  token: string
): Promise<{ rows: GoodDealRow[]; total: number; threshold_pct: number }> {
  const qs = '?' + new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();
  return apiFetch(`/dealer/good-deals${qs}`, {}, token);
}

export async function getDealerMarginCalc(
  params: { make: string; class_name: string; trim?: string; year: number; km: number; buy_price?: number },
  token: string
): Promise<MarginCalcResult> {
  const qs = '?' + new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();
  return apiFetch(`/dealer/margin-calc${qs}`, {}, token);
}

export async function getDealerLeads(
  params: { limit?: number; offset?: number; lead_type?: string; status?: string },
  token: string
): Promise<{ rows: DealerLead[]; total: number }> {
  const qs = '?' + new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();
  return apiFetch(`/dealer/leads${qs}`, {}, token);
}

// ─── Wakalat — Dealer new-car inventory ──────────────────────────────────────

export interface WakalatFilterOptions {
  makes: string[];
  models: string[];
  dealers: string[];
  body_types: string[];
  transmissions: string[];
  fuel_types: string[];
  drivetrains: string[];
  price_range: { min: number; max: number };
}

export interface WakalatImage {
  url: string;
  type: 'thumbnail' | 'card' | 'detail';
}

export interface WakalatTrim {
  name: string;
  price_qar: number | null;
  features: string[];
}

export interface WakalatCarSummary {
  id: number;
  slug: string;
  car_id: string;
  make: string;
  model: string;
  year: number;
  dealer: string;
  base_price_qar: number | null;
  body_type: string;
  fuel_type: string;
  transmission: string;
  drivetrain: string;
  engine: string;
  horsepower_hp: string;
  thumbnail: string | null;
  image_count: number;
}

export interface WakalatCarDetail extends WakalatCarSummary {
  displacement_cc: string;
  torque_nm: string;
  accel_0_100_s: string;
  top_speed_kmh: string;
  fuel_consumption_l100: string;
  tank_l: string;
  battery_kwh: string;
  dimensions_mm: string;
  features_json: string[];
  image_urls_json: string[];
  trims: WakalatTrim[];
  images: WakalatImage[];
}

export interface WakalatCarList {
  total: number;
  page: number;
  per_page: number;
  pages: number;
  cars: WakalatCarSummary[];
}

export interface WakalatCarsParams {
  make?: string;
  model?: string;
  dealer?: string;
  body_type?: string;
  fuel_type?: string;
  transmission?: string;
  drivetrain?: string;
  year_min?: number;
  year_max?: number;
  price_min?: number;
  price_max?: number;
  q?: string;
  has_image?: 0 | 1;
  sort?: 'price_asc' | 'price_desc' | 'year_desc' | 'year_asc' | 'make_asc';
  page?: number;
  per_page?: number;
}

export function wakalatImageUrl(path: string): string {
  if (!path) return '';
  // path is already an API URL like /api/wakalat/images/cars/119.jpg
  if (path.startsWith('/api/')) {
    const relative = path.replace('/api/', '/');
    return `${BASE_URL}${relative}`;
  }
  return `${BASE_URL}/wakalat/images/${path}`;
}

export async function getWakalatFilters(): Promise<WakalatFilterOptions> {
  return apiFetch<WakalatFilterOptions>('/wakalat/filters');
}

export async function getWakalatCars(params?: WakalatCarsParams): Promise<WakalatCarList> {
  const qs = params
    ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== '')
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : '';
  return apiFetch<WakalatCarList>(`/wakalat/cars${qs}`);
}

export async function getWakalatCar(slug: string): Promise<{ car: WakalatCarDetail }> {
  return apiFetch<{ car: WakalatCarDetail }>(`/wakalat/cars/${slug}`);
}

// ─── ML Time-to-Sell ─────────────────────────────────────────────────────────

export interface MLTimeToSellEstimate {
  product_id?: string;
  estimated_days_to_sell: number;
  probability_by_horizon: Record<string, number>; // keys: "7","14","30","60","90"
  model_version: string;
  trained_at: string;
}

export async function getMLTimeToSell(
  params: {
    make: string;
    class_name: string;
    manufacture_year: number;
    km: number;
    price_qar?: number;
    fuel_type?: string;
    gear_type?: string;
    car_type?: string;
    city?: string;
    trim?: string;
  },
  token?: string
): Promise<MLTimeToSellEstimate> {
  const qs = '?' + new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)])
  ).toString();
  return apiFetch<MLTimeToSellEstimate>(`/ml/time-to-sell${qs}`, {}, token);
}

// ─── Trade-in requests ────────────────────────────────────────────────────────

export interface TradeInRequest {
  id?: number;
  uid?: string;
  trade_in_uid?: string;
  customer_id?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  // current car
  make: string;
  class_name: string;
  model?: string | null;
  year: number;
  km: number;
  city: string;
  condition?: string;
  color?: string | null;
  description?: string | null;
  photo_urls_json?: string | null;
  asking_price_qar?: number | null;
  outstanding_finance_qar?: number | null;
  desired_vehicle?: string | null;
  target_budget_qar?: number | null;
  // target car (dealer listing)
  target_car_id?: string;
  target_car_name?: string;
  target_price_qar?: number;
  target_dealer?: string;
  target_dealer_id?: string;
  // user contact
  contact_name?: string;
  contact_phone?: string;
  // estimates
  estimate_low_qar?: number;
  estimate_high_qar?: number;
  market_est_qar?: number | null;
  equity_est_qar?: number | null;
  asking_delta_qar?: number | null;
  difference_low_qar?: number;
  difference_high_qar?: number;
  notes?: string;
}

export interface TradeInRequestPayload {
  make: string;
  class_name: string;
  year: number;
  km: number;
  city?: string;
  model?: string;
  color?: string;
  description?: string;
  photo_urls_json?: string;
  asking_price_qar?: number;
  outstanding_finance_qar?: number;
  desired_vehicle?: string;
  target_budget_qar?: number;
  condition?: string;
  target_car_id?: string;
  target_car_name?: string;
  target_price_qar?: number;
  target_dealer_id?: string;
  contact_name?: string;
  contact_phone?: string;
  notes?: string;
}

export async function createTradeInRequest(
  payload: TradeInRequestPayload,
  token: string
): Promise<{ request: TradeInRequest }> {
  return apiFetch<{ request: TradeInRequest }>('/trade-in/requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export async function getMyTradeInRequests(
  token: string,
  params?: { status?: string; limit?: number; offset?: number }
): Promise<{ rows: TradeInRequest[]; total: number }> {
  const qs = params
    ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : '';
  return apiFetch<{ rows: TradeInRequest[]; total: number }>(`/trade-in/requests${qs}`, {}, token);
}

export async function getDealerTradeIns(
  params: { limit?: number; offset?: number; status?: string; make?: string; city?: string; min_year?: number; max_year?: number; max_km?: number },
  token: string
): Promise<{ rows: TradeInRequest[]; total: number }> {
  const qs = '?' + new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();
  return apiFetch<{ rows: TradeInRequest[]; total: number }>(`/dealer/trade-ins${qs}`, {}, token);
}

export async function getTradeInDetail(uid: string, token: string): Promise<TradeInRequest> {
  return apiFetch<TradeInRequest>(`/trade-in/requests/${uid}`, {}, token);
}

export async function submitTradeInProposal(
  uid: string,
  data: { offer_qar: number; message?: string },
  token: string
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/dealer/trade-ins/${uid}/proposal`, {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
}

export async function declineTradeIn(uid: string, token: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/dealer/trade-ins/${uid}/decline`, {
    method: 'POST',
  }, token);
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function adminGetAllRequests(token: string, params?: {
  status?: string;
  make?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const qs = params
    ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : '';
  return apiFetch(`/admin/instant-offers/requests${qs}`, {}, token);
}
