import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q')?.trim() || '';
    const filter = searchParams.get('filter') || 'all'; // 'all' | 'active' | 'deleted'

    // 1. Fetch sessions
    let query = admin
      .from('chat_sessions')
      .select('id, session_token, title, user_id, created_at, updated_at, is_deleted, deleted_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (filter === 'active') {
      query = query.eq('is_deleted', false);
    } else if (filter === 'deleted') {
      query = query.eq('is_deleted', true);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,session_token.ilike.%${search}%`);
    }

    const [sessionsRes, usersRes] = await Promise.all([
      query,
      admin.auth.admin.listUsers({ perPage: 1000 }).catch(() => ({ data: { users: [] } })),
    ]);

    if (sessionsRes.error) {
      throw sessionsRes.error;
    }

    const rawSessions = sessionsRes.data || [];
    const authUsers = (usersRes as any)?.data?.users || [];
    const usersMap = new Map<string, any>(authUsers.map((u: any) => [u.id, u]));

    // 2. Fetch message counts and latest message for each session
    const sessionIds = rawSessions.map((s) => s.id);
    let messagesMap = new Map<string, { count: number; lastMessage: string; lastRole: string; lastAt: string }>();

    if (sessionIds.length > 0) {
      const { data: messages } = await admin
        .from('chat_messages')
        .select('session_id, role, content, created_at')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: true });

      if (messages) {
        for (const msg of messages) {
          const existing = messagesMap.get(msg.session_id) || {
            count: 0,
            lastMessage: '',
            lastRole: '',
            lastAt: msg.created_at,
          };
          existing.count += 1;
          existing.lastMessage = msg.content || '';
          existing.lastRole = msg.role;
          existing.lastAt = msg.created_at;
          messagesMap.set(msg.session_id, existing);
        }
      }
    }

    const sessions = rawSessions.map((s) => {
      const msgInfo = messagesMap.get(s.id) || { count: 0, lastMessage: '', lastRole: '', lastAt: s.created_at };
      const matchedUser = s.user_id ? usersMap.get(s.user_id) : null;
      return {
        id: s.id,
        session_token: s.session_token,
        title: s.title || 'محادثة استفسار عقاري',
        user_id: s.user_id,
        user_email: matchedUser?.email || null,
        user_name: matchedUser?.user_metadata?.full_name || (matchedUser?.email ? matchedUser.email.split('@')[0] : null),
        created_at: s.created_at,
        updated_at: s.updated_at,
        is_deleted: s.is_deleted,
        message_count: msgInfo.count,
        last_message: msgInfo.lastMessage,
        last_role: msgInfo.lastRole,
        last_at: msgInfo.lastAt,
      };
    });

    return NextResponse.json({ sessions });
  } catch (err: any) {
    console.error('Admin chats list error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
