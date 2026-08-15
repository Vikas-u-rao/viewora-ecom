'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getApiBaseUrl } from '@/lib/constants';

export const API_BASE = typeof window !== 'undefined'
  ? (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
      ? `${window.location.origin}/api/v1`
      : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'))
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1');

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
}

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY_USER = 'viewora_user';
const STORAGE_KEY_TOKEN = 'viewora_access_token';

function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_USER);
    return stored ? JSON.parse(stored) : null;
  } catch {
    localStorage.removeItem(STORAGE_KEY_USER);
    return null;
  }
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_TOKEN);
    }
  }, []);

  const setAuth = useCallback((u: User, token: string) => {
    setUser(u);
    setAccessToken(token);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(u));
      localStorage.setItem(STORAGE_KEY_TOKEN, token);
    }
  }, []);

  // Validate session on mount via httpOnly cookie refresh or stored token
  useEffect(() => {
    let cancelled = false;
    const stored = getStoredUser();
    const storedToken = getStoredToken();
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(stored);
    }
    if (storedToken) {
      setAccessToken(storedToken);
    }

    const tryRefresh = async () => {
      try {
        const baseUrl = getApiBaseUrl();
        const res = await fetch(`${baseUrl}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          setAccessToken(data.accessToken);
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY_TOKEN, data.accessToken);
          }

          const profileRes = await fetch(`${baseUrl}/users/me`, {
            headers: { Authorization: `Bearer ${data.accessToken}` },
            credentials: 'include',
          });
          if (cancelled) return;
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            const profileUser = profileData.user || profileData;
            setUser(profileUser);
            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profileUser));
          }
        } else if (!storedToken) {
          clearAuth();
        }
      } catch {
        if (!storedToken) clearAuth();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    tryRefresh();
    return () => { cancelled = true; };
  }, [clearAuth]);

  const login = useCallback(async (email: string, password: string) => {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw data;
    setAuth(data.user, data.accessToken);
  }, [setAuth]);

  const logout = useCallback(async () => {
    try {
      const baseUrl = getApiBaseUrl();
      await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
    } finally {
      clearAuth();
    }
  }, [accessToken, clearAuth]);

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, logout, setAuth, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
