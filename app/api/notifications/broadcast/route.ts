import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, message, type = 'system', target = 'all' } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Missing title or message' },
        { status: 400 }
      );
    }

    // Build query to fetch target user IDs
    let userQuery = supabaseAdmin.from('users').select('id');

    if (target === 'users') {
      userQuery = userQuery.eq('role', 'user');
    } else if (target === 'experts') {
      userQuery = userQuery.eq('role', 'expert');
    }
    // 'all' gets no filter

    const { data: users, error: userError } = await userQuery;

    if (userError) {
      console.error('Failed to fetch users for broadcast:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch target users' },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'No target users found' },
        { status: 400 }
      );
    }

    // Create notifications for all target users
    const notifications = users.map(user => ({
      user_id: user.id,
      title,
      message,
      type,
      is_read: false,
    }));

    // Insert in batches (Supabase has limits on bulk inserts)
    const batchSize = 100;
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      const { error: insertError } = await supabaseAdmin
        .from('notifications')
        .insert(batch);

      if (insertError) {
        console.error('Failed to insert broadcast notifications:', insertError);
        return NextResponse.json(
          { error: 'Failed to send notifications' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      sentTo: users.length,
    });

  } catch (error: any) {
    console.error('Broadcast error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
