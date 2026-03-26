import { getAuthUser } from '@/lib/auth/server'
import { DashboardClientLayout } from '@/components/dashboard/dashboard-client-layout'
import { ErrorBoundary } from '@/components/error-boundary'
import { redirect } from '@/i18n/routing'
import { setRequestLocale } from 'next-intl/server';

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
  params
}: {
  children: React.ReactNode,
  params: Promise<{locale: string}>
}) {
  const {locale} = await params;
  setRequestLocale(locale);

  // Get user from middleware header (no fetch, no DB query)
  const user = await getAuthUser()

  // Server-side redirect if not authenticated
  if (!user) {
    redirect({href: '/login', locale})
  }

  // Server-side redirect if not authorized
  if (user && user.role !== 'admin' && user.role !== 'expert') {
    redirect({href: '/unauthorized', locale})
  }

  // Render client-side interactive wrapper with error boundary
  return (
    <ErrorBoundary>
      <DashboardClientLayout>{children}</DashboardClientLayout>
    </ErrorBoundary>
  )
}
