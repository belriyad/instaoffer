/**
 * dashboard-guard.public.spec.ts
 *
 * Issue 1 (CRITICAL): the dealer dashboard must never be reachable by an
 * anonymous visitor. Runs unauthenticated in the "public" Playwright project.
 *
 * Covers both layers of defense:
 *   1. Route guard  — visiting /dashboard (or a deep /dashboard/* page) as a
 *      guest redirects to the dealer login and never renders the dealer shell.
 *   2. Server-side  — hitting a dealer endpoint through /api/proxy without a
 *      bearer token returns 401 (and a guest token would get 403 from backend).
 */
import { test, expect } from '@playwright/test';

test.describe('Dealer dashboard access control (anonymous)', () => {
  test('GET /dashboard redirects an anonymous visitor to the dealer login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\/dealer(\?|$)/);
  });

  test('deep /dashboard/* route also redirects and preserves the return URL', async ({ page }) => {
    await page.goto('/dashboard/trade-ins/or_example');
    await expect(page).toHaveURL(/\/login\/dealer\?redirect=/);
  });

  test('proxy rejects a token-less dealer API call with 401', async ({ request }) => {
    const res = await request.get('/api/proxy/dealer/trade-ins?limit=3');
    expect(res.status()).toBe(401);
  });

  test('proxy forwards a guest token to a dealer endpoint and backend returns 403', async ({ request }) => {
    const login = await request.post('/api/proxy/auth/guest/login', { data: {} });
    expect(login.ok()).toBeTruthy();
    const { access_token } = await login.json();
    expect(access_token).toBeTruthy();

    const res = await request.get('/api/proxy/dealer/trade-ins?limit=3', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    expect(res.status()).toBe(403);
  });
});
