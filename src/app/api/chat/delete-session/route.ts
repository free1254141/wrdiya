import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://csuifvyghfsibkrnxrby.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = body.sessionId || body.session_id;

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId);
    const deletedTimestamp = new Date().toISOString();

    // SOFT DELETE: We NEVER delete rows completely from Supabase.
    // Instead we flag is_deleted = true and deleted_at = timestamp
    // This allows the admin / broker to audit past customer inquiries and leads.
    let targetId = sessionId;

    if (isUuid) {
      await supabaseAdmin
        .from('chat_sessions')
        .update({ is_deleted: true, deleted_at: deletedTimestamp })
        .eq('id', sessionId);
    } else {
      const { data } = await supabaseAdmin
        .from('chat_sessions')
        .select('id')
        .eq('session_token', sessionId)
        .maybeSingle();

      if (data) {
        targetId = data.id;
        await supabaseAdmin
          .from('chat_sessions')
          .update({ is_deleted: true, deleted_at: deletedTimestamp })
          .eq('id', data.id);
      }
    }

    // Soft delete associated messages
    if (targetId) {
      await supabaseAdmin
        .from('chat_messages')
        .update({ is_deleted: true })
        .eq('session_id', targetId);
    }

    return NextResponse.json({
      success: true,
      message: 'Session soft-deleted from client view; preserved in Supabase for review.',
      sessionId,
      deleted_at: deletedTimestamp,
    });

  } catch (error: any) {
    console.error('Soft Delete Session Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to soft delete session' }, { status: 500 });
  }
}
