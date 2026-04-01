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
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[Admin API] Missing required environment variables');
      return NextResponse.json({ 
        error: 'Server configuration error: Missing Supabase credentials. Check .env file.' 
      }, { status: 500 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
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

    // 5. Fetch Created Profile (Auto-created by Database Trigger)
    // The database trigger 'on_auth_user_created' automatically creates the profile
    // in public.users when auth user is created. We just need to fetch it.
    // Small delay to ensure trigger has completed (usually instantaneous)
    await new Promise(resolve => setTimeout(resolve, 100));

    const { data: profile, error: fetchProfileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', newUser.id)
      .single();

    if (fetchProfileError || !profile) {
      console.error('[Admin API] Profile fetch error after trigger:', fetchProfileError);
      // Trigger may have failed - this shouldn't happen but handle gracefully
      return NextResponse.json({ 
        error: 'User created in auth but profile creation failed. Check database trigger.',
        userId: newUser.id
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: profile });
  } catch (err) {
    console.error('[Admin API] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
