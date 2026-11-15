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
    const [eventsRes, trialsRes, apiLogsRes] = await Promise.all([
      admin
        .from('page_analytics_events')
        .select('id, session_id, page_path, event_type, referrer, metadata, created_at')
        .order('created_at', { ascending: false })
        .limit(500),
      admin
        .from('b2b_partner_trials')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
      admin
        .from('b2b_api_usage_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200),
    ]);

    const events = eventsRes.data || [];
    const trials = trialsRes.data || [];
    const apiLogs = apiLogsRes.data || [];

    const uniqueSessions = new Set(events.map((e: any) => e.session_id)).size;
    const pageCounts: Record<string, number> = {};
    for (const e of events) {
      if (e.event_type === 'pageview') {
        pageCounts[e.page_path] = (pageCounts[e.page_path] || 0) + 1;
      }
    }
    const topPages = Object.entries(pageCounts)
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 15);

    const apiByKey: Record<string, { company: string; calls: number; lastUsed: string }> = {};
    for (const log of apiLogs) {
      const k = log.api_key || 'unknown';
      if (!apiByKey[k]) {
        apiByKey[k] = {
          company: log.company_name || (k === 'ewan_sandbox_demo' ? 'Sandbox Demo' : k),
          calls: 0,
          lastUsed: log.created_at,
        };
      }
      apiByKey[k].calls += 1;
    }

    return NextResponse.json({
      success: true,
      visitors: {
        totalEvents: events.length,
        uniqueSessions,
        topPages,
        recentEvents: events.slice(0, 40),
      },
      trials: {
        total: trials.length,
        activeCount: trials.filter(
          (t: any) => t.status === 'active' && new Date(t.expires_at) > new Date()
        ).length,
        items: trials,
      },
      apiUsage: {
        totalCalls: apiLogs.length,
        byKey: Object.entries(apiByKey).map(([key, info]) => ({ key, ...info })),
        recentLogs: apiLogs.slice(0, 40),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to load B2B & visitor analytics' },
      { status: 500 }
    );
  }
}
