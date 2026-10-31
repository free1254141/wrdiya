import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// In-Memory cache for auth users list to prevent excessive Supabase admin calls
let cachedAuthUsers: { users: any[]; timestamp: number } | null = null;
const AUTH_USERS_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(50, Math.max(10, parseInt(searchParams.get('pageSize') || '25', 10)));
    const offset = (page - 1) * pageSize;

    // 1. Fetch sessions with pagination (Supabase range query)
    let query = admin
      .from('chat_sessions')
      .select('id, session_token, title, user_id, created_at, updated_at, is_deleted, deleted_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (filter === 'active') {
      query = query.eq('is_deleted', false);
    } else if (filter === 'deleted') {
      query = query.eq('is_deleted', true);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,session_token.ilike.%${search}%`);
    }

    // 2. Fetch or use cached auth users map
    const now = Date.now();
    let authUsers: any[] = [];
    if (cachedAuthUsers && now - cachedAuthUsers.timestamp < AUTH_USERS_CACHE_TTL) {
      authUsers = cachedAuthUsers.users;
    } else {
      try {
        const usersRes = await admin.auth.admin.listUsers({ perPage: 1000 });
        authUsers = usersRes?.data?.users || [];
        cachedAuthUsers = { users: authUsers, timestamp: now };
      } catch (err) {
        console.warn('Could not list auth users:', err);
        authUsers = cachedAuthUsers?.users || [];
      }
    }

    const sessionsRes = await query;

    if (sessionsRes.error) {
      throw sessionsRes.error;
    }

    const rawSessions = sessionsRes.data || [];
    const totalCount = sessionsRes.count ?? rawSessions.length;
    const hasMore = offset + rawSessions.length < totalCount;
    const usersMap = new Map<string, any>(authUsers.map((u: any) => [u.id, u]));

    // 3. Fetch message counts and latest message ONLY for this page of sessions
    const sessionIds = rawSessions.map((s) => s.id);
    const messagesMap = new Map<string, { count: number; lastMessage: string; lastRole: string; lastAt: string }>();

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

    return NextResponse.json({
      sessions,
      page,
      pageSize,
      totalCount,
      hasMore,
    });
  } catch (err: any) {
    console.error('Admin chats list error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
