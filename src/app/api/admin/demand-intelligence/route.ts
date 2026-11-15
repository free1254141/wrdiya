import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { aggregateMarketDemand, calculateBuyerIntentScore } from '@/lib/demand-analytics';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
  }

  try {
    const [messagesRes, leadsRes] = await Promise.all([
      admin
        .from('chat_messages')
        .select('content')
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        .limit(600),
      admin
        .from('leads_inquiries')
        .select('id, preferred_location, preferred_unit_type, budget_max, unit_title, notes, source, created_at')
        .order('created_at', { ascending: false })
        .limit(200),
    ]);

    const userMessages = (messagesRes.data || [])
      .map((m: any) => String(m.content || ''))
      .filter(Boolean);

    const demandReport = aggregateMarketDemand(userMessages);

    const scoredLeads = (leadsRes.data || []).map((l: any) => {
      const intent = calculateBuyerIntentScore({
        text: `${l.unit_title || ''} ${l.preferred_location || ''} ${l.preferred_unit_type || ''} ${l.notes || ''}`,
        hasPhoneOptIn: true,
        budgetMax: l.budget_max,
        preferredLocation: l.preferred_location,
      });
      return {
        id: l.id,
        preferredLocation: l.preferred_location || 'غير محدد',
        preferredUnitType: l.preferred_unit_type || 'غير محدد',
        budgetMax: l.budget_max || null,
        source: l.source || 'chatbot',
        intentScore: intent.score,
        intentLabel: intent.labelAr,
        tier: intent.tier,
        createdAt: l.created_at,
      };
    });

    const hotLeadsCount = scoredLeads.filter((l: any) => l.tier === 'hot').length;
    const warmLeadsCount = scoredLeads.filter((l: any) => l.tier === 'warm').length;

    return NextResponse.json({
      success: true,
      demandReport,
      leadsSummary: {
        totalAnalyzed: scoredLeads.length,
        hotLeadsCount,
        warmLeadsCount,
        topScoredLeads: scoredLeads.sort((a: any, b: any) => b.intentScore - a.intentScore).slice(0, 15),
      },
    });
  } catch (err: any) {
    console.error('Demand intelligence error:', err);
    return NextResponse.json(
      { error: 'Failed to aggregate market demand intelligence' },
      { status: 500 }
    );
  }
}
