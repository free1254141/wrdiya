import { NextRequest, NextResponse } from 'next/server';
import {
  NewsCategory,
  NewsSentiment,
  queryNewsDisclosures,
  refreshNewsDisclosuresLive,
} from '@/lib/news-disclosures';

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const shouldRefresh = sp.get('refresh') === '1';

    let refreshResult: { fetched: number; upserted: number } | null = null;
    if (shouldRefresh) {
      refreshResult = await refreshNewsDisclosuresLive();
    }

    const query = sp.get('q') || undefined;
    const developer = sp.get('developer') || undefined;
    const category = (sp.get('category') || 'all') as NewsCategory | 'all';
    const sentiment = (sp.get('sentiment') || 'all') as NewsSentiment | 'all';
    const limit = Number(sp.get('limit') || '24');

    const data = await queryNewsDisclosures({
      query,
      developer,
      category,
      sentiment,
      limit: Number.isFinite(limit) ? limit : 24,
    });

    return NextResponse.json({
      success: true,
      refreshed: refreshResult,
      ...data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to load news and disclosures' },
      { status: 500 }
    );
  }
}
