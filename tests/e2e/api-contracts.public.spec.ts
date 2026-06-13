/**
 * api-contracts.public.spec.ts
 *
 * Locks in the API response contracts the frontend depends on — the exact class
 * of mismatch that caused the recent seller-side bugs (field renames / shapes).
 * Runs through the real /api/proxy in the "public" project. Each test skips if
 * the account has no relevant data, but asserts the SHAPE whenever data exists.
 */
import { test, expect, type APIRequestContext } from '@playwright/test';

const SELLER = { login: process.env.SELLER_EMAIL || 'ahmed@example.com', password: process.env.SELLER_PASSWORD || 'Pass1234' };
const DEALER = { login: process.env.DEALER_EMAIL || 'qauto@dealer.com', password: process.env.DEALER_PASSWORD || 'Pass1234' };

async function login(request: APIRequestContext, creds: { login: string; password: string }): Promise<string> {
  // The login POST isn't retried by the proxy; tolerate a transient backend 503
  // under load so the contract assertions aren't masked by infra flakiness.
  let last = 0;
  for (let i = 0; i < 4; i++) {
    const res = await request.post('/api/proxy/auth/login', { data: creds });
    if (res.ok()) return (await res.json()).access_token as string;
    last = res.status();
    if (last < 500) break; // real auth error — don't retry
    await new Promise(r => setTimeout(r, 600 * (i + 1)));
  }
  throw new Error(`login ${creds.login} failed (HTTP ${last})`);
}
const auth = (t: string) => ({ headers: { Authorization: `Bearer ${t}` } });

test.describe('API contracts the frontend depends on', () => {
  test('C2: seller phone-requests response uses { phone_requests }', async ({ request }) => {
    const token = await login(request, SELLER);
    const mine = await (await request.get('/api/proxy/instant-offers/requests/mine', auth(token))).json();
    const uid = (mine.rows ?? [])[0]?.request_uid;
    test.skip(!uid, 'seller has no offer requests');
    const res = await request.get(`/api/proxy/instant-offers/requests/${uid}/phone-requests`, auth(token));
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    // Regression guard: the approval UI reads phone_requests (was res.requests → always empty).
    expect(body, 'phone-requests must expose { phone_requests }').toHaveProperty('phone_requests');
    expect(Array.isArray(body.phone_requests)).toBeTruthy();
  });

  test('C3: messages response uses { rows } with a body field', async ({ request }) => {
    const token = await login(request, SELLER);
    const mine = await (await request.get('/api/proxy/instant-offers/requests/mine', auth(token))).json();
    const uid = (mine.rows ?? [])[0]?.request_uid;
    test.skip(!uid, 'no offer request');
    const res = await request.get(`/api/proxy/instant-offers/requests/${uid}/messages`, auth(token));
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body, 'messages must expose { rows }').toHaveProperty('rows');
    expect(Array.isArray(body.rows)).toBeTruthy();
    if (body.rows.length) expect(body.rows[0], 'message has a body field').toHaveProperty('body');
  });

  test('C1: trade-in offers response uses { offers }', async ({ request }) => {
    const token = await login(request, SELLER);
    const list = await (await request.get('/api/proxy/trade-in/requests', auth(token))).json();
    const uid = (list.rows ?? [])[0]?.trade_in_uid;
    test.skip(!uid, 'no trade-ins');
    const res = await request.get(`/api/proxy/trade-in/requests/${uid}/offers`, auth(token));
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body, 'trade-in offers must expose { offers }').toHaveProperty('offers');
    expect(Array.isArray(body.offers)).toBeTruthy();
    if (body.offers.length) {
      expect(body.offers[0]).toHaveProperty('offer_uid');
      expect(body.offers[0]).toHaveProperty('offered_value_qar');
    }
  });

  test('#4: dealer open-pool leads each carry lead_type', async ({ request }) => {
    const token = await login(request, DEALER);
    const res = await request.get('/api/proxy/instant-offers/requests?limit=20', auth(token));
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('rows');
    for (const r of body.rows ?? []) expect(r, 'each lead must carry lead_type for the badge').toHaveProperty('lead_type');
  });

  test('M4: buy-request rejects a missing model (class_name required)', async ({ request }) => {
    // The form is public; the API requires class_name even though Model read as optional.
    const res = await request.post('/api/proxy/buy-requests', {
      data: { make: 'Toyota', contact_name: 'Contract Test', contact_phone: '50000000' },
    });
    expect(res.status(), 'API must 400 on missing model so the UI validation matches').toBe(400);
  });
});
