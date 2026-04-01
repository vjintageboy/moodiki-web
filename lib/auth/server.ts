import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { UserRoleType } from '@/lib/types/database.types'

/**
 * User context passed from middleware
 */
export interface UserContext {
  id: string
  email: string
  role: UserRoleType
}

/**
 * Read user context from middleware header
 * 
 * The middleware sets the `x-user-context` header with base64-encoded user data.
 * This allows Server Components and API routes to access authenticated user
 * without refetching from database.
 * 
 * @returns User context if authenticated, null otherwise
 * 
 * @example
 * ```tsx
 * // In a Server Component
 * export default async function MyPage() {
 *   const user = await getAuthUser();
 *   if (!user) redirect('/login');
 *   
 *   return <div>Welcome, {user.email}</div>;
 * }
 * ```
 */
export async function getAuthUser(): Promise<UserContext | null> {
  try {
    const headersList = await headers()
    const userContextHeader = headersList.get('x-user-context')

    if (!userContextHeader) {
      return null
    }

    // Decode base64 JSON
    const decoded = Buffer.from(userContextHeader, 'base64').toString('utf-8')
    const userContext: UserContext = JSON.parse(decoded)

    return userContext
  } catch (err) {
    console.error('[getAuthUser] Failed to parse user context:', err)
    return null
  }
}

/**
 * Require authentication - throws if not authenticated
 * 
 * Use this in Server Components or API routes that require authentication.
 * Will throw an error if user is not authenticated, which Next.js will
 * handle by redirecting to the error page or returning 401.
 * 
 * @returns Authenticated user context
 * @throws Error if not authenticated
 * 
 * @example
 * ```tsx
 * // In a Server Component
 * export default async function ProfilePage() {
 *   const user = await requireAuth();
 *   // user is guaranteed to be defined here
 *   return <div>Your email: {user.email}</div>;
 * }
 * ```
 */
export async function requireAuth(): Promise<UserContext> {
  const user = await getAuthUser()

  if (!user) {
    // Thay thế throw Error bằng redirect
    redirect('/login')
  }

  return user
}

/**
 * Require admin role - throws if not authenticated or not admin
 * 
 * Use this in Server Components or API routes that require admin access.
 * 
 * @returns Authenticated admin user context
 * @throws Error if not authenticated or not admin
 * 
 * @example
 * ```tsx
 * // In an admin-only Server Component
 * export default async function AdminPanel() {
 *   const admin = await requireAdmin();
 *   return <div>Admin: {admin.email}</div>;
 * }
 * ```
 */
export async function requireAdmin(): Promise<UserContext> {
  const user = await requireAuth()

  if (user.role !== 'admin') {
    // Chuyển về trang báo lỗi không có quyền
    redirect('/unauthorized')
  }

  return user
}

/**
 * Require specific role(s) - throws if not authenticated or role doesn't match
 * 
 * Generic role checker that works with any role(s).
 * 
 * @param allowedRoles - Single role or array of allowed roles
 * @returns Authenticated user context with required role
 * @throws Error if not authenticated or role not allowed
 * 
 * @example
 * ```tsx
 * // In a Server Component that only experts and admins can access
 * export default async function ExpertPanel() {
 *   const user = await requireRole(['admin', 'expert']);
 *   return <div>Welcome, {user.email}</div>;
 * }
 * ```
 */
export async function requireRole(
  allowedRoles: UserRoleType | UserRoleType[]
): Promise<UserContext> {
  const user = await requireAuth()
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]

  if (!roles.includes(user.role)) {
    // Chuyển về trang báo lỗi không có quyền
    redirect('/unauthorized')
  }

  return user
}

/**
 * Check if current user has specific role
 * 
 * Non-throwing version that returns boolean. Useful for conditional rendering.
 * 
 * @param role - Role to check
 * @returns True if user is authenticated and has the specified role
 * 
 * @example
 * ```tsx
 * export default async function Dashboard() {
 *   const user = await getAuthUser();
 *   const isAdmin = await hasRole('admin');
 *   
 *   return (
 *     <div>
 *       <h1>Dashboard</h1>
 *       {isAdmin && <AdminControls />}
 *     </div>
 *   );
 * }
 * ```
 */
export async function hasRole(role: UserRoleType): Promise<boolean> {
  const user = await getAuthUser()
  return user?.role === role
}

/**
 * Check if current user is admin
 * 
 * Convenience function for checking admin role.
 * 
 * @returns True if user is authenticated and is admin
 * 
 * @example
 * ```tsx
 * export default async function Page() {
 *   const isAdmin = await isAdmin();
 *   return <div>{isAdmin ? 'Admin View' : 'User View'}</div>;
 * }
 * ```
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole('admin')
}

/**
 * Check if current user is expert
 * 
 * Convenience function for checking expert role.
 * 
 * @returns True if user is authenticated and is expert
 */
export async function isExpert(): Promise<boolean> {
  return hasRole('expert')
}
