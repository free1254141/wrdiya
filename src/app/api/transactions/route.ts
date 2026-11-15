import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateAnalyticalValuation } from '@/lib/engine/valuation-model';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://csuifvyghfsibkrnxrby.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const location = String(body.location || '').trim();
    const compoundName = String(body.compoundName || '').trim();
    const unitType = String(body.unitType || 'شقة').trim();
    const areaSqm = Number(body.areaSqm || 0);
    const purchaseYear = Number(body.purchaseYear || 2023);
    const purchasePrice = Number(body.purchasePrice || 0);

    if (!location || areaSqm < 25 || purchasePrice < 200000) {
      return NextResponse.json(
        { error: 'يرجى إدخال المنطقة والمساحة (>= 25 م²) وسعر الشراء الحقيقي.' },
        { status: 400 }
      );
    }

    const valuation = calculateAnalyticalValuation({
      areaSqm,
      areaNameOrSlug: compoundName || location,
      paymentMethod: 'كاش',
    });

    const fairValue = valuation?.fairMarketValue?.total || Math.round(areaSqm * 42000);
    const gainEgp = fairValue - purchasePrice;
    const gainPct =
      purchasePrice > 0 ? Math.round((gainEgp / purchasePrice) * 100) : 0;

    // Store anonymized transaction signal cleanly (non-blocking)
    try {
      await supabaseAdmin.from('leads_inquiries').insert([
        {
          user_name: 'Crowdsourced Market Signal',
          phone: '0000000000',
          preferred_location: compoundName ? `${compoundName} (${location})` : location,
          preferred_unit_type: unitType,
          budget_max: purchasePrice,
          payment_method: 'صفقة فعلية',
          unit_title: `${unitType} ${areaSqm}م² (${purchaseYear})`,
          notes: `[Crowdsourced Transaction] Paid: ${purchasePrice.toLocaleString()} EGP in ${purchaseYear} | Area: ${areaSqm}m² | Est Current: ${fairValue.toLocaleString()} EGP`,
          source: 'crowdsourced_transaction',
          status: 'مؤرشف',
        },
      ]);
    } catch {
      // Non-fatal
    }

    return NextResponse.json({
      success: true,
      currentFairValue: fairValue,
      pricePerSqmNow: Math.round(fairValue / areaSqm),
      purchasePrice,
      gainEgp,
      gainPct,
      valuationRange: valuation
        ? {
            fastSale: valuation.fastSaleValue?.total,
            optimistic: valuation.optimisticCeiling?.total,
          }
        : null,
    });
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ أثناء معالجة التقييم.' },
      { status: 500 }
    );
  }
}
