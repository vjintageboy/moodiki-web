/**
 * Session utility functions for accessing user session data
 * These functions read from cookies set by the middleware
 */

export interface UserSession {
  userId: string
  role: string
  email: string
}

/**
 * Get user session data from cookies (client-side)
 * @returns User session data or null if not authenticated
 */
export function getUserSessionFromCookies(): UserSession | null {
  if (typeof document === 'undefined') {
    return null // Server-side, use createClient instead
  }

  const cookies = document.cookie.split('; ').reduce(
    (acc, cookie) => {
      const [key, value] = cookie.split('=')
      acc[key] = decodeURIComponent(value)
      return acc
    },
    {} as Record<string, string>
  )

  const userId = cookies['user_id']
  const role = cookies['user_role']
  const email = cookies['user_email']

  if (userId && role && email) {
    return { userId, role, email }
  }

  return null
}

/**
 * Check if user has a specific role
 * @param requiredRole Role to check against
 * @returns true if user has the required role
 */
export function hasRole(requiredRole: string | string[]): boolean {
  const session = getUserSessionFromCookies()
  if (!session) return false

  if (typeof requiredRole === 'string') {
    return session.role === requiredRole
  }

  return requiredRole.includes(session.role)
}

/**
 * Check if user is admin
 * @returns true if user is admin
 */
export function isAdmin(): boolean {
  return hasRole('admin')
}

/**
 * Check if user is expert
 * @returns true if user is expert
 */
export function isExpert(): boolean {
  return hasRole('expert')
}

/**
 * Check if user is regular user
 * @returns true if user is regular user
 */
export function isRegularUser(): boolean {
  return hasRole('user')
}
