'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, getMe, login, logout, register, guestLogin, refreshToken, AuthTokens } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (loginVal: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, fullName: string) => Promise<User>;
  signUpDealer: (email: string, password: string, fullName: string) => Promise<User>;
  signOut: () => Promise<void>;
  ensureGuestToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY        = 'instaoffer_token';
const REFRESH_KEY      = 'instaoffer_refresh';
const GUEST_TOKEN_KEY  = 'instaoffer_guest_token';
const GUEST_REFRESH_KEY = 'instaoffer_guest_refresh';
const USER_KEY         = 'instaoffer_user'; // cached profile for instant header paint

function readCachedUser(): User | null {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(USER_KEY) : null;
    return raw ? JSON.parse(raw) as User : null;
  } catch { return null; }
}

// Refresh 5 minutes before the 1-hour expiry (i.e. every 55 minutes)
const REFRESH_INTERVAL_MS = 55 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]     = useState<User | null>(null);
  const [token, setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Schedule proactive token refresh ────────────────────────────────────────
  function scheduleRefresh(refreshTok: string, isGuest: boolean) {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(async () => {
      try {
        const tokens = await refreshToken(refreshTok);
        if (isGuest) {
          localStorage.setItem(GUEST_TOKEN_KEY, tokens.access_token);
          localStorage.setItem(GUEST_REFRESH_KEY, tokens.refresh_token);
          // Don't update the user-facing token state for guest sessions
        } else {
          localStorage.setItem(TOKEN_KEY, tokens.access_token);
          localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
          setToken(tokens.access_token);
        }
        scheduleRefresh(tokens.refresh_token, isGuest);
      } catch {
        // Refresh failed — clear session and re-init guest token
        if (!isGuest) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_KEY);
          setToken(null);
          clearUser();
        }
        initGuestToken();
      }
    }, REFRESH_INTERVAL_MS);
  }

  // ── Bootstrap guest token on startup ────────────────────────────────────────
  async function initGuestToken() {
    const cachedRefresh = localStorage.getItem(GUEST_REFRESH_KEY);
    if (cachedRefresh) {
      try {
        const tokens = await refreshToken(cachedRefresh);
        localStorage.setItem(GUEST_TOKEN_KEY, tokens.access_token);
        localStorage.setItem(GUEST_REFRESH_KEY, tokens.refresh_token);
        scheduleRefresh(tokens.refresh_token, true);
        return;
      } catch {
        // Cached refresh token expired — fall through to fresh login
        localStorage.removeItem(GUEST_TOKEN_KEY);
        localStorage.removeItem(GUEST_REFRESH_KEY);
      }
    }
    try {
      const tokens = await guestLogin();
      localStorage.setItem(GUEST_TOKEN_KEY, tokens.access_token);
      localStorage.setItem(GUEST_REFRESH_KEY, tokens.refresh_token);
      scheduleRefresh(tokens.refresh_token, true);
    } catch {
      // Guest login failed silently — will retry on next ensureGuestToken call
    }
  }

  // ── On mount: rehydrate auth session then init guest token ──────────────────
  useEffect(() => {
    const stored        = localStorage.getItem(TOKEN_KEY);
    const storedRefresh = localStorage.getItem(REFRESH_KEY);

    if (stored && storedRefresh) {
      setToken(stored);
      // Paint the header immediately from the cached profile so it never sits in
      // a loading skeleton while getMe (which can be slow on a cold backend)
      // resolves. getMe then revalidates and corrects/clears it below.
      const cached = readCachedUser();
      if (cached) { setUser(cached); setLoading(false); }
      getMe(stored)
        .then(me => {
          applyUser(me);
          scheduleRefresh(storedRefresh, false);
        })
        .catch(async () => {
          // Access token may be expired — try refreshing
          try {
            const tokens = await refreshToken(storedRefresh);
            localStorage.setItem(TOKEN_KEY, tokens.access_token);
            localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
            setToken(tokens.access_token);
            const me = await getMe(tokens.access_token);
            applyUser(me);
            scheduleRefresh(tokens.refresh_token, false);
          } catch {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESH_KEY);
            setToken(null);
            clearUser(); // never leave a stale (e.g. dealer) user when auth can't be restored
          }
        })
        .finally(() => {
          // Unblock the UI as soon as the user is resolved; the guest token is
          // only needed for unauthenticated flows, so initialise it in the
          // background instead of blocking first paint behind another request.
          setLoading(false);
          void initGuestToken();
        });
    } else {
      initGuestToken().finally(() => setLoading(false));
    }

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── User state + cache helpers ───────────────────────────────────────────────
  function applyUser(me: User) {
    setUser(me);
    try { localStorage.setItem(USER_KEY, JSON.stringify(me)); } catch { /* ignore */ }
  }
  function clearUser() {
    setUser(null);
    try { localStorage.removeItem(USER_KEY); } catch { /* ignore */ }
  }

  // ── Persist real user tokens ─────────────────────────────────────────────────
  function persist(tokens: AuthTokens) {
    localStorage.setItem(TOKEN_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
    setToken(tokens.access_token);
    scheduleRefresh(tokens.refresh_token, false);
  }

  async function signIn(loginVal: string, password: string) {
    const tokens = await login({ login: loginVal, password });
    persist(tokens);
    const me = await getMe(tokens.access_token);
    applyUser(me);
    return me;
  }

  async function signUp(email: string, password: string, fullName: string) {
    const tokens = await register({ email, password, full_name: fullName });
    persist(tokens);
    const me = await getMe(tokens.access_token);
    applyUser(me);
    return me;
  }

  async function signUpDealer(email: string, password: string, fullName: string) {
    const tokens = await register({ email, password, full_name: fullName, role: 'dealer' });
    persist(tokens);
    const me = await getMe(tokens.access_token);
    applyUser(me);
    return me;
  }

  async function signOut() {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    if (token) await logout(token).catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setToken(null);
    clearUser();
    // Reinitialise guest token so unauthenticated features keep working
    initGuestToken();
  }

  // ── ensureGuestToken: always returns a valid token ───────────────────────────
  async function ensureGuestToken(): Promise<string> {
    // Authenticated users always use their own token
    if (token) return token;

    // Return cached guest token if present
    const cached = localStorage.getItem(GUEST_TOKEN_KEY);
    if (cached) return cached;

    // No cached token — fetch a fresh one
    const tokens = await guestLogin();
    localStorage.setItem(GUEST_TOKEN_KEY, tokens.access_token);
    localStorage.setItem(GUEST_REFRESH_KEY, tokens.refresh_token);
    scheduleRefresh(tokens.refresh_token, true);
    return tokens.access_token;
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signUp, signUpDealer, signOut, ensureGuestToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
