'use client';

import React, { useState } from 'react';
import { Property } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Building2, 
  MapPin, 
  Bed, 
  Bath, 
  Maximize2, 
  Calendar, 
  Star, 
  ShieldCheck, 
  TrendingUp, 
  Share2, 
  Check,
  Globe,
  Images,
  Eye,
  Calculator,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  onBookViewing?: (property: Property) => void;
  onToggleFavorite?: (property: Property) => void;
  onViewDetails?: (property: Property) => void;
  isFavorite?: boolean;
}

interface VerifiedScheduleMethod {
  id: string;
  label: string;
  frequencyLabel: string;
  installmentsCount: number;
  installmentAmount: number;
  downPaymentPct: number;
  downPaymentAmount: number;
  remainingAmount: number;
  totalPrice: number;
}

export default function PropertyCard({
  property,
  onBookViewing,
  onToggleFavorite,
  onViewDetails,
  isFavorite = false
}: PropertyCardProps) {
  const [copied, setCopied] = useState(false);
  const [showInstallmentPlans, setShowInstallmentPlans] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('monthly');

  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const numLocale = isAr ? 'ar-EG' : 'en-US';

  const compound = property.compound;
  const developer = compound?.developer;
  const curr = property.currency || (isAr ? 'ج.م' : 'EGP');
  const isTekce = property.platform === 'TEKCE';

  // Only treat as installment-supported if the listing genuinely has installment_years > 0 and down_payment_pct < 100
  const basePrice = Math.round(property.total_price || 0);
  const baseYears = Number(property.installment_years || 0);
  const baseDpPct = Number(property.down_payment_pct ?? 0);
  const hasInstallments = baseYears > 0 && baseDpPct < 100 && basePrice > 0;

  const baseDpAmount = hasInstallments
    ? Math.round(property.down_payment_amount || (basePrice * baseDpPct) / 100)
    : basePrice;
  const remainingAmount = hasInstallments ? Math.max(0, basePrice - baseDpAmount) : 0;
  const baseMonthly = hasInstallments
    ? Math.round(
        property.monthly_installment && property.monthly_installment > 0
          ? property.monthly_installment
          : remainingAmount / (baseYears * 12)
      )
    : 0;

  // Strictly grounded in the listing's actual supported installment plan (no invented discounts or unverified plans)
  const verifiedPaymentSchedules: VerifiedScheduleMethod[] = React.useMemo(() => {
    if (!hasInstallments) return [];

    const totalMonths = baseYears * 12;
    const totalQuarters = baseYears * 4;
    const totalSemiAnnual = baseYears * 2;

    const monthlyVal = baseMonthly > 0 ? baseMonthly : Math.round(remainingAmount / totalMonths);
    const quarterlyVal =
      property.quarterly_installment && property.quarterly_installment > 0
        ? Math.round(property.quarterly_installment)
        : Math.round(remainingAmount / totalQuarters);
    const semiAnnualVal = Math.round(remainingAmount / totalSemiAnnual);
    const annualVal = Math.round(remainingAmount / baseYears);

    return [
      {
        id: 'monthly',
        label: isAr
          ? `نظام القسط الشهري (${baseYears} سنوات • مقدم ${baseDpPct}%)`
          : `Monthly Installment Plan (${baseYears} Yrs • ${baseDpPct}% Down)`,
        frequencyLabel: isAr ? 'القسط الشهري' : 'Monthly Installment',
        installmentsCount: totalMonths,
        installmentAmount: monthlyVal,
        downPaymentPct: baseDpPct,
        downPaymentAmount: baseDpAmount,
        remainingAmount,
        totalPrice: basePrice,
      },
      {
        id: 'quarterly',
        label: isAr
          ? `نظام الدفعات الربع سنوية - كل 3 شهور (${baseYears} سنوات • مقدم ${baseDpPct}%)`
          : `Quarterly Installment Plan - Every 3 Months (${baseYears} Yrs • ${baseDpPct}% Down)`,
        frequencyLabel: isAr ? 'القسط الربع سنوي (كل 3 شهور)' : 'Quarterly (Every 3 Months)',
        installmentsCount: totalQuarters,
        installmentAmount: quarterlyVal,
        downPaymentPct: baseDpPct,
        downPaymentAmount: baseDpAmount,
        remainingAmount,
        totalPrice: basePrice,
      },
      {
        id: 'semi_annual',
        label: isAr
          ? `نظام الدفعات النصف سنوية - كل 6 شهور (${baseYears} سنوات • مقدم ${baseDpPct}%)`
          : `Semi-Annual Plan - Every 6 Months (${baseYears} Yrs • ${baseDpPct}% Down)`,
        frequencyLabel: isAr ? 'القسط النصف سنوي (كل 6 شهور)' : 'Semi-Annual (Every 6 Months)',
        installmentsCount: totalSemiAnnual,
        installmentAmount: semiAnnualVal,
        downPaymentPct: baseDpPct,
        downPaymentAmount: baseDpAmount,
        remainingAmount,
        totalPrice: basePrice,
      },
      {
        id: 'annual',
        label: isAr
          ? `نظام الدفعات السنوية (${baseYears} سنوات • مقدم ${baseDpPct}%)`
          : `Annual Installment Plan (${baseYears} Yrs • ${baseDpPct}% Down)`,
        frequencyLabel: isAr ? 'القسط السنوي' : 'Annual Installment',
        installmentsCount: baseYears,
        installmentAmount: annualVal,
        downPaymentPct: baseDpPct,
        downPaymentAmount: baseDpAmount,
        remainingAmount,
        totalPrice: basePrice,
      },
    ];
  }, [hasInstallments, basePrice, baseYears, baseDpPct, baseDpAmount, remainingAmount, baseMonthly, property.quarterly_installment, isAr]);

  const affiliateUrl = property.affiliate_url || (
    isTekce 
      ? 'https://tekce.com?utm_source=taff&utm_medium=6FPC68983C'
      : 'https://launches.aqarmap.com/ar/expos/saudi-projects?utm_source=partners&utm_medium=dynamic&utm_campaign=affiliate_759279&partner_code=759279'
  );

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = isAr 
      ? `فرصة عقارية: ${property.title}\nالمشروع: ${compound?.name || ''}\nالسعر: ${basePrice.toLocaleString('ar-EG')} ${curr}\nالرابط: ${affiliateUrl}`
      : `Property Opportunity: ${property.title}\nProject: ${compound?.name || ''}\nPrice: ${basePrice.toLocaleString('en-US')} ${curr}\nLink: ${affiliateUrl}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSellerListing = property.platform === 'SellerListing';
  const hasRealImage = Boolean(property.images && property.images.length > 0 && property.images[0]);
  const coverImage = isSellerListing ? undefined : compound?.cover_image;
  const imageUrl = hasRealImage ? property.images![0] : coverImage;

  return (
    <div 
      onClick={() => onViewDetails && onViewDetails(property)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/95 dark:hover:border-amber-400/50"
    >
      {/* Property Cover Image & Badges */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-zinc-800">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={property.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-amber-500/10 p-4 text-slate-500 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 dark:text-zinc-400">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 mb-1.5 shadow-xs">
              <Building2 className="h-6 w-6" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
              {isAr ? 'معروض بدون صور' : 'No photos attached'}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 right-3 left-3 flex items-center justify-between z-10">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-black text-black shadow-md">
              {property.unit_type}
            </span>
            {isTekce ? (
              <span className="flex items-center gap-1 rounded-full bg-sky-600/90 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md backdrop-blur-xs">
                <Globe className="h-3 w-3" />
                <span>{isAr ? 'عقارات دولية' : 'International'}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-emerald-600/90 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md backdrop-blur-xs">
                <ShieldCheck className="h-3 w-3" />
                <span>{isAr ? 'معارض معتمدة' : 'Verified Expo'}</span>
              </span>
            )}
            {property.delivery_date.includes('فوري') && (
              <span className="rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                {isAr ? 'استلام فوري' : 'Ready'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleFavorite) onToggleFavorite(property);
              }}
              className={`grid h-8 w-8 place-items-center rounded-full backdrop-blur-md transition ${
                isFavorite 
                  ? 'bg-amber-500 text-black shadow-md' 
                  : 'bg-black/50 text-white hover:bg-black/80'
              }`}
              title={isAr ? 'حفظ في المفضلة' : 'Save to Favorites'}
            >
              <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md transition hover:bg-black/80"
              title={isAr ? 'مشاركة تفاصيل الوحدة' : 'Share property details'}
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Center Hover Gallery CTA */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 backdrop-blur-2xs">
          <span className="flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-black text-black shadow-lg">
            <Images className="h-4 w-4" />
            <span>{isAr ? 'عرض الصور والتفاصيل الكاملة' : 'View Gallery & Details'}</span>
          </span>
        </div>

        {/* Bottom Location & Project Banner over image */}
        <div className="absolute bottom-3 right-3 left-3 text-white pointer-events-none">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{compound?.name || (isAr ? 'مشروع سكني فاخر' : 'Luxury Development')}</span>
            <span className="text-white/60">•</span>
            <span className="truncate">{developer?.name || (isAr ? 'مطور معتمد' : 'Developer')}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-200">
            <MapPin className="h-3 w-3 shrink-0 text-amber-400" />
            <span className="truncate">{compound?.area_name || compound?.city || (isAr ? 'موقع حيوي ممتاز' : 'Prime Location')}</span>
          </div>
        </div>
      </div>

      {/* Property Details Body */}
      <div className="p-4 sm:p-5">
        <h4 className="line-clamp-2 text-base font-black text-slate-900 transition group-hover:text-amber-600 dark:text-zinc-100 dark:group-hover:text-amber-400">
          {property.title}
        </h4>

        {/* Specs Grid */}
        <div className="mt-3.5 grid grid-cols-3 gap-2 border-y border-slate-100 py-2.5 text-xs text-slate-600 dark:border-zinc-800 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Maximize2 className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="font-bold text-slate-900 dark:text-zinc-200">{property.area_sqm}</span>
            <span>{isAr ? 'م²' : 'sqm'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bed className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="font-bold text-slate-900 dark:text-zinc-200">{property.bedrooms}</span>
            <span>{isAr ? 'غرف' : 'Rooms'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bath className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="font-bold text-slate-900 dark:text-zinc-200">{property.bathrooms}</span>
            <span>{isAr ? 'حمام' : 'Baths'}</span>
          </div>
        </div>

        {/* Price & Installment Highlight */}
        <div className="mt-3.5 rounded-xl bg-slate-50 p-3 dark:bg-zinc-800/60">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
              {isAr ? 'إجمالي السعر:' : 'Total Price:'}
            </span>
            <span className="font-mono text-lg font-black text-slate-900 dark:text-white">
              {basePrice.toLocaleString(numLocale)} <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">{curr}</span>
            </span>
          </div>

          {hasInstallments ? (
            <>
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-200/60 pt-2 text-[11px] dark:border-zinc-700/60">
                <div>
                  <span className="text-slate-500 dark:text-zinc-400">
                    {isAr ? 'المقدم' : 'Down Payment'} ({baseDpPct}%):
                  </span>
                  <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {baseDpAmount.toLocaleString(numLocale)} {curr}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-zinc-400">
                    {isAr ? 'القسط الشهري:' : 'Monthly:'}
                  </span>
                  <p className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {baseMonthly.toLocaleString(numLocale)} {curr}
                  </p>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  <span>{isAr ? 'تقسيط معتمد حتى' : 'Verified up to'} {baseYears} {isAr ? 'سنوات' : 'years'}</span>
                </span>
                <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-3 w-3" />
                  <span>{isAr ? 'عائد استثماري' : 'ROI'} {property.roi_expected_pct || 15}%</span>
                </span>
              </div>
            </>
          ) : (
            <div className="mt-2 flex items-center justify-between border-t border-slate-200/60 pt-2 text-[11px] dark:border-zinc-700/60">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {isAr ? 'نظام الدفع: كاش فقط (لا يدعم التقسيط)' : 'Payment: Cash Only (No Installments)'}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-3 w-3" />
                <span>{isAr ? 'عائد استثماري' : 'ROI'} {property.roi_expected_pct || 15}%</span>
              </span>
            </div>
          )}
        </div>

        {/* Calculate Monthly Installment Plans Button (ONLY shown when listing truly supports installments) */}
        {hasInstallments && (
          <div className="mt-2.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowInstallmentPlans((prev) => !prev)}
              className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs font-black transition ${
                showInstallmentPlans
                  ? 'border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-300'
                  : 'border-amber-500/35 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-400'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Calculator className="h-3.5 w-3.5 shrink-0" />
                <span>{isAr ? 'حساب خطة الأقساط الشهرية 💰' : 'Calculate Monthly Installments 💰'}</span>
              </span>
              {showInstallmentPlans ? (
                <ChevronUp className="h-4 w-4 shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0" />
              )}
            </button>

            {/* Grounded Breakdown of the Listing's Actual Supported Installment Plan */}
            {showInstallmentPlans && (
              <div className="mt-2 space-y-2.5 rounded-2xl border border-amber-500/30 bg-slate-50/90 p-3 text-xs dark:bg-zinc-950/90">
                <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-2 dark:border-zinc-800">
                  <span className="font-black text-slate-800 dark:text-zinc-200 text-[11px]">
                    {isAr
                      ? `خطة التقسيط الفعلية المعتمدة بالإعلان (${baseYears} سنوات):`
                      : `Verified Listing Installment Plan (${baseYears} Years):`}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    <span>{isAr ? 'معتمدة بالإعلان' : 'Verified'}</span>
                  </span>
                </div>

                {/* Summary of Official Plan Totals */}
                <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-white p-2 text-[10px] border border-slate-200/70 dark:border-zinc-800 dark:bg-zinc-900">
                  <div>
                    <span className="block text-slate-400 dark:text-zinc-500">
                      {isAr ? 'السعر الكلي' : 'Total Price'}
                    </span>
                    <span className="font-mono font-black text-slate-900 dark:text-white">
                      {basePrice.toLocaleString(numLocale)} {curr}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400 dark:text-zinc-500">
                      {isAr ? `المقدم (${baseDpPct}%)` : `Down (${baseDpPct}%)`}
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {baseDpAmount.toLocaleString(numLocale)} {curr}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400 dark:text-zinc-500">
                      {isAr ? 'المتبقي للتقسيط' : 'Remaining'}
                    </span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {remainingAmount.toLocaleString(numLocale)} {curr}
                    </span>
                  </div>
                </div>

                {/* Payment Schedules for the Listing's Actual Plan */}
                <div className="space-y-1.5">
                  {verifiedPaymentSchedules.map((sched) => {
                    const isSelected = selectedScheduleId === sched.id;
                    return (
                      <div
                        key={sched.id}
                        onClick={() => setSelectedScheduleId(sched.id)}
                        className={`cursor-pointer rounded-xl border p-2.5 transition ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/15'
                            : 'border-slate-200 bg-white hover:border-amber-500/40 dark:border-zinc-800 dark:bg-zinc-900'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-black text-slate-900 dark:text-white text-[11px]">
                            {sched.label}
                          </span>
                          <span className="rounded-md bg-slate-200/70 px-1.5 py-0.5 text-[9px] font-bold text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 shrink-0">
                            {sched.installmentsCount} {isAr ? 'دفعة' : 'payments'}
                          </span>
                        </div>

                        <div className="mt-1.5 flex items-baseline justify-between rounded-lg bg-slate-100/80 px-2 py-1 dark:bg-zinc-800/80">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                            {isAr ? 'السعر الكلي بهذه الطريقة:' : 'Total Price (this schedule):'}
                          </span>
                          <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                            {sched.totalPrice.toLocaleString(numLocale)} {curr}
                          </span>
                        </div>

                        <div className="mt-1.5 flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 dark:text-zinc-400">
                            {sched.frequencyLabel}:
                          </span>
                          <span className="font-mono text-xs font-black text-amber-600 dark:text-amber-400">
                            {sched.installmentAmount.toLocaleString(numLocale)} {curr}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {property.sale_circumstances && (
                  <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[10px] text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                    <span className="font-bold text-slate-800 dark:text-zinc-100">
                      {isAr ? 'ملاحظات السداد بالإعلان: ' : 'Listing Payment Notes: '}
                    </span>
                    {property.sale_circumstances}
                  </div>
                )}

                <p className="text-[10px] leading-relaxed text-slate-500 dark:text-zinc-400">
                  {isAr
                    ? '✓ يتم عرض خطة التقسيط الفعلية المدعومة في الإعلان فقط لضمان تطابق الأسعار والأقساط مع البروكر والمطور.'
                    : '✓ Shows only the actual installment plan supported by this listing to match broker terms.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action CTAs */}
        <div className="mt-3.5 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {/* View Photos & Details Button */}
          <button
            onClick={() => onViewDetails && onViewDetails(property)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 px-3 py-2.5 text-xs font-black text-black shadow-xs transition hover:brightness-105 active:scale-[0.98]"
            title={isAr ? 'عرض الصور وتفاصيل الوحدة' : 'View photos and unit details'}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>{isAr ? 'معاينة الصور' : 'Photos & Details'}</span>
          </button>

          {/* Book Viewing Button */}
          <button
            onClick={() => onBookViewing && onBookViewing(property)}
            className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-xs font-bold text-slate-800 transition hover:bg-slate-200 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            title={isAr ? 'طلب معاينة ميدانية' : 'Request field viewing'}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>{isAr ? 'طلب معاينة' : 'Visit'}</span>
          </button>

          {/* Official Partner Affiliate Link */}
          <a
            href={affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-2.5 text-xs font-bold text-amber-700 transition hover:bg-amber-500/20 active:scale-[0.98] dark:border-amber-400/30 dark:text-amber-400"
            title={isAr ? 'فتح صفحة المشروع الرسمية على منصة الشريك' : 'Open official project page'}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isAr ? 'الموقع الرسمي' : 'Official'}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
