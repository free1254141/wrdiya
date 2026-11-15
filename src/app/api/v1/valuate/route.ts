import { NextRequest, NextResponse } from 'next/server';
import { calculateAnalyticalValuation } from '@/lib/engine/valuation-model';
import { calculatePropertyDealScore } from '@/lib/engine/deal-scoring';
import { fetchOsmLocationScore } from '@/lib/osm-location-intelligence';
import { EGYPT_MACRO_BENCHMARKS_2026 } from '@/lib/macro-indicators';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

interface ApiAuthResult {
  ok: boolean;
  expired?: boolean;
  tier: 'sandbox' | 'trial' | 'enterprise';
  apiKey: string;
  companyName: string | null;
}

async function isAuthorizedApiKey(req: NextRequest): Promise<ApiAuthResult> {
  const key = (
    req.headers.get('x-api-key') ||
    req.nextUrl.searchParams.get('api_key') ||
    ''
  ).trim();
  const prodKey = process.env.B2B_API_KEY;
  if (prodKey && key === prodKey) {
    return { ok: true, tier: 'enterprise', apiKey: key, companyName: 'Enterprise Key' };
  }
  if (key === 'ewan_sandbox_demo') {
    return { ok: true, tier: 'sandbox', apiKey: key, companyName: 'Sandbox Demo' };
  }
  if (key.startsWith('ewan_trial_')) {
    const admin = getSupabaseAdmin();
    if (admin) {
      const { data } = await admin
        .from('b2b_partner_trials')
        .select('company_name, status, expires_at')
        .eq('trial_api_key', key)
        .maybeSingle();
      if (data) {
        const isExpired = new Date(data.expires_at).getTime() <= Date.now();
        if (data.status === 'active' && !isExpired) {
          return {
            ok: true,
            tier: 'trial',
            apiKey: key,
            companyName: data.company_name,
          };
        }
        return {
          ok: false,
          expired: true,
          tier: 'trial',
          apiKey: key,
          companyName: data.company_name,
        };
      }
    }
  }
  return { ok: false, tier: 'sandbox', apiKey: key || 'none', companyName: null };
}

async function logApiUsage(params: {
  apiKey: string;
  companyName: string | null;
  tier: string;
  method: string;
  statusCode: number;
  location?: string;
  areaSqm?: number;
  latencyMs: number;
}) {
  try {
    const admin = getSupabaseAdmin();
    if (!admin) return;
    await admin.from('b2b_api_usage_logs').insert({
      api_key: params.apiKey,
      company_name: params.companyName,
      tier: params.tier,
      endpoint: '/api/v1/valuate',
      method: params.method,
      status_code: params.statusCode,
      location: params.location || null,
      area_sqm: params.areaSqm || null,
      latency_ms: params.latencyMs,
    });
  } catch {
    // Non-blocking telemetry
  }
}

async function runValuation(params: {
  areaSqm: number;
  location: string;
  bedrooms?: number;
  finishing?: string;
  paymentMethod?: string;
  askingPrice?: number;
  tier: 'sandbox' | 'trial' | 'enterprise';
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
  const started = Date.now();
  const auth = await isAuthorizedApiKey(req);
  if (!auth.ok) {
    const status = auth.expired ? 403 : 401;
    await logApiUsage({
      apiKey: auth.apiKey,
      companyName: auth.companyName,
      tier: auth.tier,
      method: 'GET',
      statusCode: status,
      latencyMs: Date.now() - started,
    });
    return NextResponse.json(
      {
        error: auth.expired
          ? 'Trial API key expired (3-day limit reached). Request upgrade at https://ewanbot.com/partners'
          : 'Unauthorized. Pass x-api-key header (use "ewan_sandbox_demo" for sandbox testing or request a 3-day trial key at /partners).',
        docs: 'https://ewanbot.com/partners',
      },
      { status }
    );
  }

  const sp = req.nextUrl.searchParams;
  const areaSqm = Number(sp.get('area_sqm') || sp.get('areaSqm') || 0);
  const location = (sp.get('location') || sp.get('city') || '').trim();
  const askingPrice = sp.get('asking_price') ? Number(sp.get('asking_price')) : undefined;

  if (!areaSqm || areaSqm < 20 || !location) {
    await logApiUsage({
      apiKey: auth.apiKey,
      companyName: auth.companyName,
      tier: auth.tier,
      method: 'GET',
      statusCode: 400,
      location,
      areaSqm,
      latencyMs: Date.now() - started,
    });
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

  await logApiUsage({
    apiKey: auth.apiKey,
    companyName: auth.companyName,
    tier: auth.tier,
    method: 'GET',
    statusCode: 200,
    location,
    areaSqm,
    latencyMs: Date.now() - started,
  });

  return NextResponse.json(payload);
}

export async function POST(req: NextRequest) {
  const started = Date.now();
  const auth = await isAuthorizedApiKey(req);
  if (!auth.ok) {
    const status = auth.expired ? 403 : 401;
    await logApiUsage({
      apiKey: auth.apiKey,
      companyName: auth.companyName,
      tier: auth.tier,
      method: 'POST',
      statusCode: status,
      latencyMs: Date.now() - started,
    });
    return NextResponse.json(
      {
        error: auth.expired
          ? 'Trial API key expired (3-day limit reached). Request upgrade at https://ewanbot.com/partners'
          : 'Unauthorized. Pass x-api-key header (use "ewan_sandbox_demo" for sandbox testing or request a 3-day trial key at /partners).',
        docs: 'https://ewanbot.com/partners',
      },
      { status }
    );
  }

  try {
    const body = await req.json();
    const areaSqm = Number(body.area_sqm || body.areaSqm || 0);
    const location = String(body.location || body.city || '').trim();

    if (!areaSqm || areaSqm < 20 || !location) {
      await logApiUsage({
        apiKey: auth.apiKey,
        companyName: auth.companyName,
        tier: auth.tier,
        method: 'POST',
        statusCode: 400,
        location,
        areaSqm,
        latencyMs: Date.now() - started,
      });
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

    await logApiUsage({
      apiKey: auth.apiKey,
      companyName: auth.companyName,
      tier: auth.tier,
      method: 'POST',
      statusCode: 200,
      location,
      areaSqm,
      latencyMs: Date.now() - started,
    });

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }
}
