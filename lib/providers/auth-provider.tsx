'use client';

import React, { createContext, useEffect, useState, useRef, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserRoleType } from '@/lib/types/database.types';

/**
 * User profile data from the users table
 */
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: UserRoleType;
}

/**
 * Auth context type with user data and auth functions
 */
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isExpert: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Fetch the current user profile from our own API route (server-side Supabase call).
 * This avoids calling Supabase directly from the browser, which can hang due to
 * anon key format issues or network restrictions.
 */
async function fetchCurrentUser(): Promise<User | null> {
  try {
    const res = await fetch('/api/auth/me', {
      // Don't cache; always get fresh user data
      cache: 'no-store',
    });

    if (!res.ok) {
      // 401 = unauthenticated, 404 = no profile — both mean no user
      return null;
    }

    const data = await res.json();
    return data as User;
  } catch (err) {
    console.error('[Auth] Failed to fetch /api/auth/me:', err);
    return null;
  }
}

/**
 * AuthProvider — manages authentication state.
 *
 * Strategy:
 * - On mount: call /api/auth/me (server-side) to get the current user.
 *   This avoids browser-side Supabase connectivity issues.
 * - Listen to Supabase onAuthStateChange for login/logout events,
 *   then re-fetch from /api/auth/me to update state.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  // Supabase client — only needed for auth events (login/logout triggering)
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    mountedRef.current = true;

    // ── Step 1: Initial load ──────────────────────────────────────────────
    const initializeAuth = async () => {
      const profile = await fetchCurrentUser();
      if (mountedRef.current) {
        setUser(profile);
        setLoading(false);
      }
    };

    initializeAuth();

    // ── Step 2: Listen for auth events (login, logout, token refresh) ─────
    // We skip INITIAL_SESSION since initializeAuth handles the initial state.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (!mountedRef.current) return;
        if (event === 'INITIAL_SESSION') return;

        // Re-fetch user from server on any auth state change
        const profile = await fetchCurrentUser();
        if (mountedRef.current) {
          setUser(profile);
          setLoading(false);
        }
      }
    );

    return () => {
      mountedRef.current = false;
      subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Logout — signs out via Supabase client, which triggers onAuthStateChange
   */
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (err) {
      console.error('[Auth] Error logging out:', err);
      throw err;
    }
  };

  const isAdmin = user?.role === 'admin';
  const isExpert = user?.role === 'expert';
  const isAuthenticated = user !== null;

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, isAdmin, isExpert, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
