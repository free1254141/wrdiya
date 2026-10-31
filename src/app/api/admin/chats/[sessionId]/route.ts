import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
  }

  const { sessionId } = await params;
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '40', 10)));
    const all = searchParams.get('all') === 'true';

    // 1. Fetch session details
    const { data: session, error: sessionErr } = await admin
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionErr || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // 2. Count total messages in this session
    const { count: totalMessages } = await admin
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    // 3. Fetch messages (if not 'all', fetch the most recent 'limit' messages)
    let msgQuery = admin
      .from('chat_messages')
      .select('id, role, content, metadata, created_at, is_deleted')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (!all && (totalMessages ?? 0) > limit) {
      // Fetch only the latest 'limit' messages by taking the end slice
      const startOffset = Math.max(0, (totalMessages ?? 0) - limit);
      msgQuery = msgQuery.range(startOffset, (totalMessages ?? 0) - 1);
    }

    const { data: messages, error: msgErr } = await msgQuery;

    if (msgErr) {
      throw msgErr;
    }

    // 4. If session has a user_id, resolve user info
    let userInfo = null;
    if (session.user_id) {
      try {
        const { data: uData } = await admin.auth.admin.getUserById(session.user_id);
        if (uData?.user) {
          userInfo = {
            id: uData.user.id,
            email: uData.user.email,
            name: uData.user.user_metadata?.full_name || uData.user.email?.split('@')[0],
          };
        }
      } catch {
        // user not found
      }
    }

    return NextResponse.json({
      session: {
        ...session,
        user: userInfo,
      },
      messages: messages || [],
      totalMessages: totalMessages ?? (messages?.length || 0),
      hasMore: !all && (totalMessages ?? 0) > (messages?.length || 0),
    });
  } catch (err: any) {
    console.error('Admin get chat session error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
  }

  const { sessionId } = await params;
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }

  try {
    // Permanently delete all messages associated with this session from Supabase
    const { error: msgErr } = await admin
      .from('chat_messages')
      .delete()
      .eq('session_id', sessionId);

    if (msgErr) {
      console.warn('Error deleting chat_messages permanently:', msgErr);
    }

    // Permanently delete session row from chat_sessions
    const { error: sessionErr } = await admin
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);

    if (sessionErr) {
      throw sessionErr;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin delete chat session error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
