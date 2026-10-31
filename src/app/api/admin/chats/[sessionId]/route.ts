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
    // 1. Fetch session details
    const { data: session, error: sessionErr } = await admin
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionErr || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // 2. Fetch session messages
    const { data: messages, error: msgErr } = await admin
      .from('chat_messages')
      .select('id, role, content, metadata, created_at, is_deleted')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (msgErr) {
      throw msgErr;
    }

    // 3. If session has a user_id, resolve user info
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

    // Permanently delete the chat session record from Supabase
    const { error: sessErr } = await admin
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);

    if (sessErr) {
      throw sessErr;
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف المحادثة ورسائلها نهائياً من قاعدة البيانات (Supabase)',
    });
  } catch (err: any) {
    console.error('Admin permanent delete chat session error:', err);
    return NextResponse.json({ error: err.message || 'فشل حذف المحادثة نهائياً' }, { status: 500 });
  }
}
