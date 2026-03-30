import { requireAdmin } from '@/lib/auth/server'

export default async function PostsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Ensure only admins can access the community posts moderation dashboard
  await requireAdmin()
  return children
}
