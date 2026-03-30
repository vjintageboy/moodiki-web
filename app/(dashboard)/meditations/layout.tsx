import { requireAdmin } from '@/lib/auth/server'

export default async function MeditationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Ensure only admins can access the meditations dashboard
  await requireAdmin()
  return children
}
