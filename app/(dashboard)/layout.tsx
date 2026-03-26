import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth/server'
import { DashboardClientLayout } from '@/components/dashboard/dashboard-client-layout'

// Force dynamic rendering (uses headers from middleware)
export const dynamic = 'force-dynamic'

/**
 * Dashboard Layout - Server Component
 * 
 * Optimizations:
 * - Server-side authentication check (no client-side fetch)
 * - User data from middleware (no /api/auth/me call)
 * - Redirects handled server-side
 * - Interactive parts in DashboardClientLayout
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get user from middleware header (no fetch, no DB query)
  const user = await getAuthUser()

  // Server-side redirect if not authenticated
  if (!user) {
    redirect('/login')
  }

  // Server-side redirect if not authorized
  if (user.role !== 'admin' && user.role !== 'expert') {
    redirect('/unauthorized')
  }

  // Render client-side interactive wrapper
  return <DashboardClientLayout>{children}</DashboardClientLayout>
}
