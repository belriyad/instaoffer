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
  segment: 'budget' | 'premium';
  model_version: string;
  r2: number;
  mape: number;
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
}

export async function getMLEstimate(params: ValuationParams, token?: string): Promise<MLEstimate> {
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)])
  ).toString();
  return apiFetch<MLEstimate>(`/ml/estimate?${qs}`, {}, token);
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
  expires_at: string | null;
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

export async function getAllOfferRequests(token: string, params?: {
  status?: string;
  make?: string;
  city?: string;
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
  return apiFetch(`/instant-offers/requests${qs}`, {}, token);
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
    active?: boolean;
  },
  token: string
) {
  return apiFetch('/instant-offers/preferences', {
    method: 'PUT',
    body: JSON.stringify(data),
  }, token);
}

// ─── Notifications ────────────────────────────────────────────────────────────

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
