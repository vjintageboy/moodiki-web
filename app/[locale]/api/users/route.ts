import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    // 1. Validate Admin Session
    const supabase = await createServerClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user profile to check role
    const { data: adminProfile, error: adminProfileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single();

    if (adminProfileError || !adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // 2. Parse Request Body
    const body = await request.json();
    const { email, password, full_name, role } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // 3. Initialize Admin Client (Service Role)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 4. Create User in Auth
    const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: role || 'user' }
    });

    if (createAuthError) {
      console.error('[Admin API] Auth creation error:', createAuthError);
      return NextResponse.json({ error: createAuthError.message }, { status: 500 });
    }

    const newUser = authData.user;
    if (!newUser) {
      return NextResponse.json({ error: 'Failed to create auth user' }, { status: 500 });
    }

    // 5. Create Profile in public.users
    // Note: If you have a trigger that does this automatically, you can skip this step.
    // However, based on the previous hook logic, we need to do it manually.
    const { data: profile, error: newUserProfileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: newUser.id,
        email,
        full_name,
        role: role || 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (newUserProfileError) {
      console.error('[Admin API] Profile creation error:', newUserProfileError);
      // Clean up the auth user if profile creation fails?
      // Optional: await supabaseAdmin.auth.admin.deleteUser(newUser.id);
      return NextResponse.json({ error: `User created but profile failed: ${newUserProfileError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: profile });
  } catch (err) {
    console.error('[Admin API] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
