'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, getMe, login, logout, register, guestLogin, refreshToken, AuthTokens } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (loginVal: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signUpDealer: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  ensureGuestToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY        = 'instaoffer_token';
const REFRESH_KEY      = 'instaoffer_refresh';
const GUEST_TOKEN_KEY  = 'instaoffer_guest_token';
const GUEST_REFRESH_KEY = 'instaoffer_guest_refresh';

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
          setUser(null);
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
      getMe(stored)
        .then(me => {
          setUser(me);
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
            setUser(me);
            scheduleRefresh(tokens.refresh_token, false);
          } catch {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESH_KEY);
            setToken(null);
          }
        })
        .finally(async () => {
          await initGuestToken();
          setLoading(false);
        });
    } else {
      initGuestToken().finally(() => setLoading(false));
    }

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setUser(me);
  }

  async function signUp(email: string, password: string, fullName: string) {
    const tokens = await register({ email, password, full_name: fullName });
    persist(tokens);
    const me = await getMe(tokens.access_token);
    setUser(me);
  }

  async function signUpDealer(email: string, password: string, fullName: string) {
    const tokens = await register({ email, password, full_name: fullName, role: 'dealer' });
    persist(tokens);
    const me = await getMe(tokens.access_token);
    setUser(me);
  }

  async function signOut() {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    if (token) await logout(token).catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setToken(null);
    setUser(null);
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
