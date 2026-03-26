import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/auth/me
 *
 * Server-side endpoint to fetch the current authenticated user's profile.
 * The client calls this instead of calling Supabase directly, which avoids
 * browser-side connectivity issues with the Supabase anon key.
 *
 * Returns:
 * - 200 { id, email, full_name, avatar_url, role } if authenticated + profile found
 * - 401 { error: 'Unauthenticated' } if no valid session
 * - 404 { error: 'Profile not found' } if auth user exists but no DB profile
 * - 500 { error: 'Internal server error' } on unexpected errors
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Verify auth session server-side (uses cookies, never browser-side key issues)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }

    // Fetch user profile from users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, full_name, avatar_url, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('[/api/auth/me] Profile fetch error:', profileError?.message)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (err) {
    console.error('[/api/auth/me] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
