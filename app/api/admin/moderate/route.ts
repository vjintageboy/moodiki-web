import { NextResponse } from 'next/server';
import { analyzeContent } from '@/lib/gemini';
import { createClient } from '@supabase/supabase-js';

// Setup admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { postId, content } = body;

    if (!postId || !content) {
      return NextResponse.json(
        { error: 'Missing postId or content' },
        { status: 400 }
      );
    }

    // Call Gemini API
    const moderationResult = await analyzeContent(content);

    // If flagged by AI, update the database
    if (moderationResult.isToxic) {
      const { error: updateError } = await supabaseAdmin
        .from('posts')
        .update({ flagged: true })
        .eq('id', postId);

      if (updateError) {
        console.error('Failed to update flagged status:', updateError);
        return NextResponse.json(
          { error: 'Content analyzed but failed to update status' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      moderated: true,
      result: moderationResult
    });

  } catch (err: any) {
    console.error('Moderation error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
