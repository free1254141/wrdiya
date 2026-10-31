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
    const [
      usersRes,
      sessionsCountRes,
      messagesCountRes,
      propertiesCountRes,
      recentSessionsRes,
    ] = await Promise.all([
      // 1. Registered users list from Supabase Auth
      admin.auth.admin.listUsers({ perPage: 1000 }).catch((e) => {
        console.warn('Could not list auth users:', e);
        return { data: { users: [] } };
      }),
      // 2. Total chat sessions
      admin.from('chat_sessions').select('*', { count: 'exact', head: true }),
      // 3. Total chat messages
      admin.from('chat_messages').select('*', { count: 'exact', head: true }),
      // 4. Total properties
      admin.from('properties').select('*', { count: 'exact', head: true }),
      // 5. Recent sessions in last 24h
      admin
        .from('chat_sessions')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    ]);

    const rawUsers = (usersRes as any)?.data?.users || [];
    const totalSessions = sessionsCountRes.count ?? 0;
    const totalMessages = messagesCountRes.count ?? 0;
    const totalProperties = propertiesCountRes.count ?? 0;
    const recentSessions24h = recentSessionsRes.count ?? 0;

    // Map registered users with their details
    const usersList = rawUsers.map((u: any) => {
      const meta = u.user_metadata || {};
      return {
        id: u.id,
        email: u.email,
        name: meta.full_name || meta.name || u.email?.split('@')[0] || 'User',
        avatar: meta.avatar_url || meta.picture || null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at || null,
        email_confirmed_at: u.email_confirmed_at || null,
        role: u.role || 'user',
      };
    });

    return NextResponse.json({
      stats: {
        totalUsers: rawUsers.length,
        totalSessions,
        totalMessages,
        totalProperties,
        recentSessions24h,
      },
      users: usersList,
    });
  } catch (err: any) {
    console.error('Admin stats error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
