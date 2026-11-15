import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pagePath = String(body.page_path || '/').slice(0, 200);
    const eventType = String(body.event_type || 'pageview').slice(0, 80);
    const sessionId = String(body.session_id || 'anon').slice(0, 120);
    const referrer = body.referrer ? String(body.referrer).slice(0, 300) : null;
    const metadata =
      body.metadata && typeof body.metadata === 'object' ? body.metadata : {};

    // Skip tracking admin's own browsing on /admin
    if (pagePath.startsWith('/admin')) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const admin = getSupabaseAdmin();
    if (admin) {
      await admin.from('page_analytics_events').insert({
        session_id: sessionId,
        page_path: pagePath,
        event_type: eventType,
        referrer,
        metadata,
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
