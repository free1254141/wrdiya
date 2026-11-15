import { NextRequest, NextResponse } from 'next/server';
import { calculateAnalyticalValuation } from '@/lib/engine/valuation-model';
import { calculatePropertyDealScore } from '@/lib/engine/deal-scoring';
import { fetchOsmLocationScore } from '@/lib/osm-location-intelligence';
import { EGYPT_MACRO_BENCHMARKS_2026 } from '@/lib/macro-indicators';

function isAuthorizedApiKey(req: NextRequest): { ok: boolean; tier: 'sandbox' | 'enterprise' } {
  const key = req.headers.get('x-api-key') || req.nextUrl.searchParams.get('api_key') || '';
  const prodKey = process.env.B2B_API_KEY;
  if (prodKey && key === prodKey) {
    return { ok: true, tier: 'enterprise' };
  }
  if (key === 'ewan_sandbox_demo') {
    return { ok: true, tier: 'sandbox' };
  }
  return { ok: false, tier: 'sandbox' };
}

async function runValuation(params: {
  areaSqm: number;
  location: string;
  bedrooms?: number;
  finishing?: string;
  paymentMethod?: string;
  askingPrice?: number;
  tier: 'sandbox' | 'enterprise';
}) {
  const valuation = calculateAnalyticalValuation({
    areaSqm: params.areaSqm,
    areaNameOrSlug: params.location,
    bedrooms: params.bedrooms,
    finishing: params.finishing,
    paymentMethod: params.paymentMethod || 'تقسيط',
    askingPrice: params.askingPrice,
  });

  const locationIntelligence = await fetchOsmLocationScore(params.location);

  let dealScore = null;
  if (params.askingPrice && params.askingPrice > 0) {
    dealScore = calculatePropertyDealScore({
      unitPrice: params.askingPrice,
      areaSqm: params.areaSqm,
      locationOrArea: params.location,
      installmentYears: 0,
      downPaymentPct: 100,
      finishingType: params.finishing,
    });
  }

  return {
    api_version: '1.0',
    tier: params.tier,
    currency: 'EGP',
    input: {
      location: params.location,
      area_sqm: params.areaSqm,
      payment_method: params.paymentMethod || 'تقسيط',
    },
    valuation,
    deal_score: dealScore,
    location_intelligence: {
      score: locationIntelligence.score,
      schools_count: locationIntelligence.schoolsCount,
      hospitals_count: locationIntelligence.hospitalsCount,
      malls_count: locationIntelligence.mallsCount,
      transit_count: locationIntelligence.transitCount,
      source: locationIntelligence.source,
    },
    macro_benchmarks: EGYPT_MACRO_BENCHMARKS_2026,
    timestamp: new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  const auth = isAuthorizedApiKey(req);
  if (!auth.ok) {
    return NextResponse.json(
      {
        error: 'Unauthorized. Pass x-api-key header (use "ewan_sandbox_demo" for sandbox testing).',
        docs: 'https://ewanbot.com/partners',
      },
      { status: 401 }
    );
  }

  const sp = req.nextUrl.searchParams;
  const areaSqm = Number(sp.get('area_sqm') || sp.get('areaSqm') || 0);
  const location = (sp.get('location') || sp.get('city') || '').trim();
  const askingPrice = sp.get('asking_price') ? Number(sp.get('asking_price')) : undefined;

  if (!areaSqm || areaSqm < 20 || !location) {
    return NextResponse.json(
      { error: 'Required query parameters: location and area_sqm (>= 20).' },
      { status: 400 }
    );
  }

  const payload = await runValuation({
    areaSqm,
    location,
    askingPrice,
    tier: auth.tier,
  });

  return NextResponse.json(payload);
}

export async function POST(req: NextRequest) {
  const auth = isAuthorizedApiKey(req);
  if (!auth.ok) {
    return NextResponse.json(
      {
        error: 'Unauthorized. Pass x-api-key header (use "ewan_sandbox_demo" for sandbox testing).',
        docs: 'https://ewanbot.com/partners',
      },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const areaSqm = Number(body.area_sqm || body.areaSqm || 0);
    const location = String(body.location || body.city || '').trim();

    if (!areaSqm || areaSqm < 20 || !location) {
      return NextResponse.json(
        { error: 'Required JSON fields: location and area_sqm (>= 20).' },
        { status: 400 }
      );
    }

    const payload = await runValuation({
      areaSqm,
      location,
      bedrooms: body.bedrooms ? Number(body.bedrooms) : undefined,
      finishing: body.finishing || body.finishing_type,
      paymentMethod: body.payment_method || body.paymentMethod,
      askingPrice: body.asking_price ? Number(body.asking_price) : undefined,
      tier: auth.tier,
    });

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }
}
