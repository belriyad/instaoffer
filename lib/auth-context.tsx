'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, getMe, login, logout, register, guestLogin, AuthTokens } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (loginVal: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  ensureGuestToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'instaoffer_token';
const REFRESH_KEY = 'instaoffer_refresh';
const GUEST_TOKEN_KEY = 'instaoffer_guest_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      setToken(stored);
      getMe(stored)
        .then(setUser)
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_KEY);
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  function persist(tokens: AuthTokens) {
    localStorage.setItem(TOKEN_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
    setToken(tokens.access_token);
  }

  async function signIn(loginVal: string, password: string) {
    const tokens = await login({ login: loginVal, password });
    localStorage.removeItem(GUEST_TOKEN_KEY);
    persist(tokens);
    const me = await getMe(tokens.access_token);
    setUser(me);
  }

  async function signUp(email: string, password: string, fullName: string) {
    const tokens = await register({ email, password, full_name: fullName });
    localStorage.removeItem(GUEST_TOKEN_KEY);
    persist(tokens);
    const me = await getMe(tokens.access_token);
    setUser(me);
  }

  async function signOut() {
    if (token) {
      await logout(token).catch(() => {});
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(GUEST_TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  async function ensureGuestToken(): Promise<string> {
    // If user is already authenticated, use their token
    if (token) return token;

    // Reuse a cached guest token if available
    const cached = localStorage.getItem(GUEST_TOKEN_KEY);
    if (cached) return cached;

    // Otherwise fetch a new guest token and cache it
    const tokens = await guestLogin();
    localStorage.setItem(GUEST_TOKEN_KEY, tokens.access_token);
    return tokens.access_token;
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signUp, signOut, ensureGuestToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
