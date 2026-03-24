/**
 * Server-side session utilities for accessing user session data
 * These functions use the Supabase server client
 */

import { createClient } from '@/lib/supabase/server'

export interface UserSessionData {
  id: string
  email: string
  role: 'admin' | 'expert' | 'user'
  full_name: string | null
  avatar_url: string | null
}

/**
 * Get current user session data (server-side)
 * @returns User session data or null if not authenticated
 */
export async function getCurrentUserSession(): Promise<UserSessionData | null> {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    // Fetch user role and details from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role, full_name, avatar_url')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return null
    }

    return {
      id: userData.id,
      email: userData.email,
      role: userData.role as 'admin' | 'expert' | 'user',
      full_name: userData.full_name,
      avatar_url: userData.avatar_url,
    }
  } catch (error) {
    console.error('Error getting user session:', error)
    return null
  }
}

/**
 * Get user role (server-side)
 * @returns User role or null if not authenticated
 */
export async function getUserRole(): Promise<string | null> {
  const session = await getCurrentUserSession()
  return session?.role || null
}

/**
 * Check if user has access to dashboard (admin or expert)
 * @returns true if user has dashboard access
 */
export async function hasDashboardAccess(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'admin' || role === 'expert'
}

/**
 * Check if user is admin (server-side)
 * @returns true if user is admin
 */
export async function isUserAdmin(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'admin'
}

/**
 * Check if user is expert (server-side)
 * @returns true if user is expert
 */
export async function isUserExpert(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'expert'
}
