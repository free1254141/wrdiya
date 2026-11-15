import { NextRequest, NextResponse } from 'next/server';
import { fetchOsmLocationScore } from '@/lib/osm-location-intelligence';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const location = searchParams.get('location') || '';
  const compound = searchParams.get('compound') || '';

  const data = await fetchOsmLocationScore(location, compound);

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
    },
  });
}
