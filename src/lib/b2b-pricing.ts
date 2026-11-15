export type B2BServiceType = 'widget' | 'api' | 'both';

export interface B2BPricingQuote {
  tierName: string;
  monthlyPriceEgp: number;
  includedApiCalls: number;
  trialDays: number;
  pricePerExtraThousand: number;
  features: string[];
}

export function calculateB2BPricing(
  monthlyUsers: number,
  serviceType: B2BServiceType = 'both'
): B2BPricingQuote {
  const users = Math.max(100, Math.round(monthlyUsers || 1000));
  const multiplier = serviceType === 'both' ? 1 : 0.65;

  if (users <= 1000) {
    return {
      tierName: 'Starter (بداية)',
      monthlyPriceEgp: Math.round((2500 * multiplier) / 50) * 50,
      includedApiCalls: 3000,
      trialDays: 3,
      pricePerExtraThousand: 600,
      features: [
        'تجربة مجانية كاملة 3 أيام بمفتاح API فوري',
        'ويدجت الشات بعلامتك التجارية وألوانك',
        'ربط مباشر مع واتساب فريق المبيعات',
      ],
    };
  }

  if (users <= 5000) {
    return {
      tierName: 'Growth (نمو)',
      monthlyPriceEgp: Math.round((5500 * multiplier) / 50) * 50,
      includedApiCalls: 15000,
      trialDays: 3,
      pricePerExtraThousand: 500,
      features: [
        'تجربة مجانية كاملة 3 أيام بمفتاح API فوري',
        'تخصيص كامل للويدجت + توصية بمشاريعك أولاً',
        'API التقييم العقاري للوحدات + سكور OpenStreetMap',
      ],
    };
  }

  if (users <= 15000) {
    return {
      tierName: 'Scale (توسع)',
      monthlyPriceEgp: Math.round((11000 * multiplier) / 50) * 50,
      includedApiCalls: 50000,
      trialDays: 3,
      pricePerExtraThousand: 400,
      features: [
        'تجربة مجانية كاملة 3 أيام بمفتاح API فوري',
        'ربط CRM و Webhooks لحظية للعملاء المهتمين',
        'تقارير ذكاء الطلب والمناطق الأكثر بحثاً',
      ],
    };
  }

  const extraBlocks = Math.floor((users - 15000) / 5000);
  const baseEnterprise = 17500 + extraBlocks * 2500;
  return {
    tierName: 'Enterprise (مؤسسات)',
    monthlyPriceEgp: Math.round((baseEnterprise * multiplier) / 50) * 50,
    includedApiCalls: Math.max(100000, users * 4),
    trialDays: 3,
    pricePerExtraThousand: 300,
    features: [
      'تجربة مجانية كاملة 3 أيام بمفتاح API فوري',
      'SLA مضمون + دعم فني مخصص وتكامل مع البنوك',
      'بيانات السوق والمؤشرات العقارية وإفصاحات المطورين',
    ],
  };
}
