import { redirect } from '@/i18n/routing'
import { getAuthUser } from '@/lib/auth/server'
import { DashboardClientLayout } from '@/components/dashboard/dashboard-client-layout'
import { ErrorBoundary } from '@/components/error-boundary'

// Force dynamic rendering (uses headers from middleware)
export const dynamic = 'force-dynamic'

/**
 * Dashboard Layout - Server Component (Locale-aware)
 *
 * Optimizations:
 * - Server-side authentication check (no client-side fetch)
 * - User data from middleware (no /api/auth/me call)
 * - Locale-aware redirects via next-intl
 * - Interactive parts in DashboardClientLayout
 */
export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const user = await getAuthUser()

  if (!user) {
    redirect({ href: '/login', locale })
  }

  // After the null guard above, TypeScript still sees user as possibly null
  // because redirect() doesn't narrow the type as `never`
  const authenticatedUser = user!

  if (authenticatedUser.role !== 'admin' && authenticatedUser.role !== 'expert') {
    redirect({ href: '/unauthorized', locale })
  }

  return (
    <ErrorBoundary>
      <DashboardClientLayout>{children}</DashboardClientLayout>
    </ErrorBoundary>
  )
}

