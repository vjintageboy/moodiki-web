import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    // ── 1. Auth check: only admin can call this endpoint ──────────────────
    const supabaseUser = await createServerClient();
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role from users table
    const { data: profile } = await supabaseUser
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
    }

    // ── 2. Validate body ───────────────────────────────────────────────────
    const body = await request.json();
    const { title, message, type = 'system', target = 'all' } = body;

    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Missing title or message' }, { status: 400 });
    }

    // ── 3. Use service role client to bypass RLS for bulk insert ──────────
    const isPlaceholderKey = !supabaseServiceKey || supabaseServiceKey.includes('your_supabase') || supabaseServiceKey.length < 20;

    if (isPlaceholderKey) {
      return NextResponse.json(
        { error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is not set. Please add it to .env.local from Supabase Dashboard → Settings → API.' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // ── 4. Fetch target user IDs ──────────────────────────────────────────
    let userQuery = supabaseAdmin.from('users').select('id');

    if (target === 'users') {
      userQuery = userQuery.eq('role', 'user');
    } else if (target === 'experts') {
      userQuery = userQuery.eq('role', 'expert');
    }
    // target === 'all' → no filter

    const { data: users, error: userError } = await userQuery;

    if (userError) {
      console.error('Failed to fetch users for broadcast:', userError);
      return NextResponse.json({ error: 'Failed to fetch target users' }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'No target users found' }, { status: 404 });
    }

    // ── 5. Insert notifications in batches of 100 ─────────────────────────
    const notifications = users.map(u => ({
      user_id: u.id,
      title: title.trim(),
      message: message.trim(),
      type,
      is_read: false,
      metadata: { sent_by: user.id, broadcast: true },
    }));

    const batchSize = 100;
    let totalInserted = 0;

    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      const { error: insertError } = await supabaseAdmin
        .from('notifications')
        .insert(batch);

      if (insertError) {
        console.error('Batch insert failed:', insertError);
        return NextResponse.json({ error: 'Failed to send notifications: ' + insertError.message }, { status: 500 });
      }
      totalInserted += batch.length;
    }

    return NextResponse.json({ success: true, sentTo: totalInserted });

  } catch (error: any) {
    console.error('Broadcast error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
