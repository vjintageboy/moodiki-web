import { Suspense } from 'react'
import { requireAuth } from '@/lib/auth/server'
import { AdminDashboard } from '@/components/dashboard/admin-dashboard'
import { ExpertDashboard } from '@/components/dashboard/expert-dashboard'
import { getDashboardStats } from '@/lib/queries/dashboard'

// Force dynamic rendering (fetches from database)
export const dynamic = 'force-dynamic'

// Revalidate every 5 minutes
export const revalidate = 300

/**
 * Dashboard Home Page - Server Component
 * 
 * Optimizations:
 * - Server-side auth check (no client fetch)
 * - Fetches data server-side for admins
 * - Uses React Suspense for streaming
 */
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';

export default async function DashboardPage({ params }: { params: Promise<{locale: string}> }) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Dashboard');

  // Get authenticated user (throws if not authenticated)
  const user = await requireAuth()

  // Show admin dashboard for admins
  if (user.role === 'admin') {
    // Prefetch stats server-side
    const stats = await getDashboardStats()
    return <AdminDashboard stats={stats} />
  }

  // Show expert dashboard for experts
  if (user.role === 'expert') {
    return <ExpertDashboard expertId={user.id} />
  }

  // Fallback (should not reach here due to middleware)
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>
    </div>
  )
}

// Loading state for Suspense
export function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    </div>
  )
}
