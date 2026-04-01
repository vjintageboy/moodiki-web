import { redirect } from '@/i18n/routing'
import { getAuthUser } from '@/lib/auth/server'
import { DashboardClientLayout } from '@/components/dashboard/dashboard-client-layout'
import { ErrorBoundary } from '@/components/error-boundary'

// Force dynamic rendering (uses headers from middleware)
export const dynamic = 'force-dynamic'

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

  if (!user || (user.role !== 'admin' && user.role !== 'expert')) {
    redirect({ href: '/unauthorized', locale })
  }

  return (
    <ErrorBoundary>
      <DashboardClientLayout>{children}</DashboardClientLayout>
    </ErrorBoundary>
  )
}

