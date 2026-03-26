import { redirect } from '@/i18n/routing'
import { setRequestLocale } from 'next-intl/server'

export default async function DashboardAlias({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  // Alias `/[locale]/dashboard` -> `/[locale]/` (your existing `(dashboard)` route group)
  redirect({ href: '/', locale })
}

