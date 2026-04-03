import type { Metadata } from 'next'
import '../globals.css'
import { Geist } from 'next/font/google'
import { cn } from '@/lib/utils'
import { Toaster } from '@/components/ui/sonner'
import { QueryProvider } from '@/lib/providers/query-provider'
import { ThemeProvider } from '@/lib/providers/theme-provider'
import { AuthClientProvider } from '@/lib/auth/client-context'
import { getAuthUser } from '@/lib/auth/server'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { notFound } from 'next/navigation'
import { LangUpdater } from '@/components/i18n/lang-updater'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Mental Health Admin Panel',
  description: 'Admin Panel for Mental Health Platform',
}

// Force dynamic rendering (uses headers from middleware)
export const dynamic = 'force-dynamic'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'en' | 'vi')) {
    notFound()
  }

  setRequestLocale(locale)

  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <LangUpdater locale={locale} />
      {children}
    </NextIntlClientProvider>
  )
}

