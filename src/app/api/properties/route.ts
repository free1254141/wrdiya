import { NextRequest, NextResponse } from 'next/server';
import { getAllCachedProperties } from '@/lib/real-estate-engine';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    const properties = await getAllCachedProperties(forceRefresh);

    return NextResponse.json(
      {
        success: true,
        total: properties.length,
        properties,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
        },
      }
    );
  } catch (err: any) {
    console.error('Failed to load public properties list:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to load properties' },
      { status: 500 }
    );
  }
}
