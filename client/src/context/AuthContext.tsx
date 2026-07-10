'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, try to refresh the token (if a refresh cookie exists)
  useEffect(() => {
    const tryRefresh = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setAccessToken(data.accessToken);
          // Decode user from token payload

          // Fetch user profile
          const profileRes = await fetch(`${API_BASE}/users/me`, {
            headers: { Authorization: `Bearer ${data.accessToken}` },
            credentials: 'include',
          });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            setUser(profileData.user || profileData);
          }
        }
      } catch {
        // Silently fail — not logged in
      } finally {
        setIsLoading(false);
      }
    };
    tryRefresh();
  }, []);

  const setAuth = useCallback((u: User, token: string) => {
    setUser(u);
    setAccessToken(token);
  }, []);

  const clearAuth = useCallback(() => {
    setUser(null);
    setAccessToken(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw data;
    setUser(data.user);
    setAccessToken(data.accessToken);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
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

export { API_BASE };
