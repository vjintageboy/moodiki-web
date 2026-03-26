'use client'

import React, { createContext, useEffect, useState, useRef, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserRoleType } from '@/lib/types/database.types'

/**
 * User profile data from the users table
 */
export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: UserRoleType
}

/**
 * Auth context type with user data and auth functions
 */
export interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  isExpert: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthClientProviderProps {
  children: ReactNode
  initialUser?: User | null // Server can pass initial user to avoid fetching
}

/**
 * AuthClientProvider — Minimal authentication context for Client Components
 * 
 * **Optimizations compared to legacy AuthProvider:**
 * - Accepts initialUser from server (no fetch on mount if provided)
 * - Only refetches on auth state changes (login/logout/token refresh)
 * - Does NOT call /api/auth/me on mount (middleware already authenticated)
 * 
 * **Usage:**
 * ```tsx
 * // app/layout.tsx
 * import { getAuthUser } from '@/lib/auth/server'
 * import { AuthClientProvider } from '@/lib/auth/client-context'
 * 
 * export default async function Layout({ children }) {
 *   const user = await getAuthUser()
 *   
 *   return (
 *     <AuthClientProvider initialUser={user}>
 *       {children}
 *     </AuthClientProvider>
 *   )
 * }
 * ```
 */
export function AuthClientProvider({ children, initialUser }: AuthClientProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser ?? null)
  const [loading, setLoading] = useState(!initialUser) // Only loading if no initial user
  const mountedRef = useRef(true)

  // Supabase client — only for auth events (login/logout triggering)
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    mountedRef.current = true

    // ── Listen for auth events (login, logout, token refresh) ─────────────
    // We don't fetch on mount because:
    // 1. Server provided initialUser, OR
    // 2. Middleware already authenticated (user is in headers)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return

        // On sign out, clear user immediately
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setLoading(false)
          return
        }

        // On sign in or token refresh, fetch updated profile
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            try {
              // Fetch user profile from database
              const { data: profile, error } = await supabase
                .from('users')
                .select('id, email, full_name, avatar_url, role')
                .eq('id', session.user.id)
                .single()

              if (error || !profile) {
                console.error('[AuthClient] Failed to fetch profile:', error)
                setUser(null)
              } else {
                setUser(profile as User)
              }
            } catch (err) {
              console.error('[AuthClient] Error fetching profile:', err)
              setUser(null)
            }
          }
          setLoading(false)
        }
      }
    )

    // If no initialUser was provided, do one-time fetch
    if (!initialUser) {
      const fetchUser = async () => {
        try {
          const { data: { user: authUser }, error } = await supabase.auth.getUser()
          
          if (error || !authUser) {
            setUser(null)
            setLoading(false)
            return
          }

          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('id, email, full_name, avatar_url, role')
            .eq('id', authUser.id)
            .single()

          if (profileError || !profile) {
            setUser(null)
          } else {
            setUser(profile as User)
          }
        } catch (err) {
          console.error('[AuthClient] Error fetching user:', err)
          setUser(null)
        } finally {
          setLoading(false)
        }
      }

      fetchUser()
    }

    return () => {
      mountedRef.current = false
      subscription?.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Logout — signs out via Supabase client, which triggers onAuthStateChange
   */
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
    } catch (err) {
      console.error('[AuthClient] Error logging out:', err)
      throw err
    }
  }

  const isAdmin = user?.role === 'admin'
  const isExpert = user?.role === 'expert'
  const isAuthenticated = user !== null

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, isAdmin, isExpert, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
