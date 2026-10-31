import { NextRequest, NextResponse } from 'next/server';
import { calculateAnalyticalValuation } from '@/lib/engine/valuation-model';
import { calculatePropertyDealScore } from '@/lib/engine/deal-scoring';
import { getAllCachedProperties } from '@/lib/real-estate-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const areaSqm = Number(body.areaSqm || body.area_sqm || 0);
    const location = String(body.location || body.areaName || body.areaNameOrSlug || '').trim();

    if (!areaSqm || areaSqm < 20 || !location) {
      return NextResponse.json(
        { success: false, error: 'يرجى إدخال المساحة بالمتر المربع والمنطقة/الحي على الأقل.' },
        { status: 400 }
      );
    }

    const valuation = calculateAnalyticalValuation({
      areaSqm,
      areaNameOrSlug: location,
      bedrooms: body.bedrooms ? Number(body.bedrooms) : undefined,
      finishing: body.finishing || body.finishingType || body.finishing_type,
      floor: body.floor || body.floorLevel,
      paymentMethod: body.paymentMethod || body.payment_method || 'تقسيط',
      askingPrice: body.askingPrice || body.asking_price ? Number(body.askingPrice || body.asking_price) : undefined,
    });

    // Also calculate deal score if asking price is provided
    let dealScore = null;
    if (body.askingPrice || body.asking_price) {
      const price = Number(body.askingPrice || body.asking_price);
      dealScore = calculatePropertyDealScore({
        unitPrice: price,
        areaSqm,
        locationOrArea: location,
        installmentYears: body.installmentYears || body.installment_years || 0,
        downPaymentPct: body.downPaymentPct || body.down_payment_pct || 100,
        finishingType: body.finishing || body.finishingType,
      });
    }

    // Pull 3 closest comparable listings
    const all = await getAllCachedProperties();
    const comps = all
      .filter((p) => {
        const locMatch =
          p.compound?.city?.includes(location) ||
          p.compound?.area_name?.includes(location) ||
          p.title?.includes(location);
        const sqmDiff = Math.abs(p.area_sqm - areaSqm) / areaSqm;
        return locMatch && sqmDiff <= 0.35;
      })
      .slice(0, 3)
      .map((p) => ({
        id: p.id,
        title: p.title,
        price: p.total_price,
        formatted_price: `${p.total_price.toLocaleString()} ${p.currency}`,
        area_sqm: p.area_sqm,
        price_per_sqm: Math.round(p.total_price / (p.area_sqm || 1)),
        installment_years: p.installment_years,
        developer: p.compound?.developer?.name || 'مطور معتمد',
        deal_score: p.deal_score,
      }));

    return NextResponse.json({
      success: true,
      data: {
        valuation,
        dealScore,
        comparables: comps,
      },
    });
  } catch (error: any) {
    console.error('Valuation endpoint error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء احتساب التقييم العقاري.' },
      { status: 500 }
    );
  }
}
