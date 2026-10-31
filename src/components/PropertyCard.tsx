'use client';

import React, { useState } from 'react';
import { Property } from '@/lib/types';
import { getDirectPropertyUrl } from '@/lib/property-link';
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
  Globe,
  Images,
  Calculator,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Scale,
  PhoneCall
} from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  onBookViewing?: (property: Property) => void;
  onToggleFavorite?: (property: Property) => void;
  onViewDetails?: (property: Property) => void;
  isFavorite?: boolean;
  onSendToChat?: (property: Property) => void;
  isCompared?: boolean;
  onToggleCompare?: (property: Property) => void;
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
  isFavorite = false,
  onSendToChat,
  isCompared = false,
  onToggleCompare
}: PropertyCardProps) {
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

  // Strictly grounded payment schedules
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
          ? `قسط شهري (${baseYears} سنوات • مقدم ${baseDpPct}%)`
          : `Monthly (${baseYears} Yrs • ${baseDpPct}% Down)`,
        frequencyLabel: isAr ? 'القسط الشهري' : 'Monthly',
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
          ? `قسط ربع سنوي (كل 3 شهور)`
          : `Quarterly (Every 3 Mo)`,
        frequencyLabel: isAr ? 'القسط كل 3 شهور' : 'Quarterly',
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
          ? `قسط نصف سنوي (كل 6 شهور)`
          : `Semi-Annual (Every 6 Mo)`,
        frequencyLabel: isAr ? 'القسط كل 6 شهور' : 'Semi-Annual',
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
          ? `قسط سنوي (${baseYears} سنوات)`
          : `Annual (${baseYears} Yrs)`,
        frequencyLabel: isAr ? 'القسط السنوي' : 'Annual',
        installmentsCount: baseYears,
        installmentAmount: annualVal,
        downPaymentPct: baseDpPct,
        downPaymentAmount: baseDpAmount,
        remainingAmount,
        totalPrice: basePrice,
      },
    ];
  }, [hasInstallments, basePrice, baseYears, baseDpPct, baseDpAmount, remainingAmount, baseMonthly, property.quarterly_installment, isAr]);

  const isSellerListing = property.platform === 'SellerListing';
  const hasRealImage = Boolean(property.images && property.images.length > 0 && property.images[0]);
  const coverImage = isSellerListing ? undefined : compound?.cover_image;
  const imageUrl = hasRealImage ? property.images![0] : coverImage;

  const directPropertyUrl = getDirectPropertyUrl(property);

  return (
    <div 
      onClick={() => onViewDetails && onViewDetails(property)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/50 hover:shadow-xl dark:border-zinc-800/90 dark:bg-zinc-900/95 dark:hover:border-amber-400/50 flex flex-col justify-between"
    >
      {/* 1. Property Cover Image & Overlaid Metadata */}
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
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 mb-1 shadow-xs">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
              {isAr ? 'معروض بدون صور' : 'No photos'}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 pointer-events-none" />

        {/* Top Badges Bar */}
        <div className="absolute top-2.5 right-2.5 left-2.5 flex items-center justify-between z-10">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-[11px] font-black text-black shadow-md">
              {property.unit_type}
            </span>
            {isTekce ? (
              <span className="flex items-center gap-1 rounded-full bg-sky-600/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-md backdrop-blur-xs">
                <Globe className="h-3 w-3" />
                <span>{isAr ? 'عقارات دولية' : 'International'}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-emerald-600/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-md backdrop-blur-xs">
                <ShieldCheck className="h-3 w-3" />
                <span>{isAr ? 'معارض معتمدة' : 'Verified'}</span>
              </span>
            )}
            {property.delivery_date && property.delivery_date.includes('فوري') && (
              <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                {isAr ? 'استلام فوري' : 'Ready'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onToggleCompare && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCompare(property);
                }}
                className={`grid h-7 w-7 place-items-center rounded-full backdrop-blur-md transition ${
                  isCompared
                    ? 'bg-amber-500 text-black shadow-md ring-2 ring-amber-300'
                    : 'bg-black/50 text-white hover:bg-black/80'
                }`}
                title={isAr ? (isCompared ? 'إلغاء من المقارنة' : 'إضافة للمقارنة') : 'Compare'}
              >
                <Scale className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleFavorite) onToggleFavorite(property);
              }}
              className={`grid h-7 w-7 place-items-center rounded-full backdrop-blur-md transition ${
                isFavorite 
                  ? 'bg-amber-500 text-black shadow-md' 
                  : 'bg-black/50 text-white hover:bg-black/80'
              }`}
              title={isAr ? 'حفظ في المفضلة' : 'Save'}
            >
              <Star className={`h-3.5 w-3.5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Bottom Project Name & Location Overlay */}
        <div className="absolute bottom-2.5 right-2.5 left-2.5 text-white pointer-events-none">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 truncate">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{compound?.name || (isAr ? 'مشروع سكني معتمد' : 'Verified Project')}</span>
            {developer?.name && (
              <>
                <span className="text-white/50">•</span>
                <span className="truncate text-white/80 font-normal">{developer.name}</span>
              </>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-200 truncate">
            <MapPin className="h-3 w-3 shrink-0 text-amber-400" />
            <span className="truncate">{compound?.area_name || compound?.city || (isAr ? 'موقع حيوي ممتاز' : 'Prime Location')}</span>
          </div>
        </div>
      </div>

      {/* 2. Property Card Body */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Title */}
          <h4 className="line-clamp-1 text-sm sm:text-base font-black text-slate-900 transition group-hover:text-amber-600 dark:text-zinc-100 dark:group-hover:text-amber-400" title={property.title}>
            {property.title}
          </h4>

          {/* Specs Row */}
          <div className="mt-2 flex items-center gap-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-zinc-400 border-b border-slate-100 dark:border-zinc-800/80">
            <span className="flex items-center gap-1 shrink-0">
              <Bed className="h-3.5 w-3.5 text-amber-500" />
              <span>{property.bedrooms} {isAr ? 'غرف' : 'Bed'}</span>
            </span>
            <span className="text-slate-300 dark:text-zinc-700">•</span>
            <span className="flex items-center gap-1 shrink-0">
              <Bath className="h-3.5 w-3.5 text-amber-500" />
              <span>{property.bathrooms} {isAr ? 'حمام' : 'Bath'}</span>
            </span>
            <span className="text-slate-300 dark:text-zinc-700">•</span>
            <span className="flex items-center gap-1 shrink-0">
              <Maximize2 className="h-3.5 w-3.5 text-amber-500" />
              <span dir="ltr">{property.area_sqm} {isAr ? 'م²' : 'sqm'}</span>
            </span>
            {property.finishing_type && (
              <>
                <span className="text-slate-300 dark:text-zinc-700">•</span>
                <span className="truncate text-[10px] text-zinc-400 font-normal">{property.finishing_type}</span>
              </>
            )}
          </div>

          {/* Price & Installments Box */}
          <div className="mt-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 p-2.5 border border-slate-200/70 dark:border-zinc-800">
            <div className="flex items-baseline justify-between gap-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                {isAr ? 'السعر الإجمالي:' : 'Total Price:'}
              </span>
              <span className="font-mono text-base font-black text-amber-500 dark:text-amber-400">
                {basePrice.toLocaleString(numLocale)} <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">{curr}</span>
              </span>
            </div>

            {hasInstallments ? (
              <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 dark:border-zinc-700/60 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300">
                  <span>{isAr ? 'مقدم' : 'Down'}: <strong className="text-emerald-500 font-mono font-bold">{baseDpPct}%</strong></span>
                  <span className="text-slate-300 dark:text-zinc-700">•</span>
                  <span>{isAr ? 'قسط' : 'Inst'}: <strong className="text-amber-500 font-mono font-bold">{Math.round(baseMonthly).toLocaleString(numLocale)}</strong></span>
                </div>
                <span className="text-[10px] font-bold text-zinc-400 bg-slate-200/60 dark:bg-zinc-700/60 rounded-md px-1.5 py-0.2">
                  {baseYears} {isAr ? 'سنوات' : 'yrs'}
                </span>
              </div>
            ) : (
              <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 dark:border-zinc-700/60 flex items-center justify-between text-[11px]">
                <span className="font-bold text-emerald-500">{isAr ? '✓ سداد كاش' : '✓ Full Cash'}</span>
                {property.roi_expected_pct && (
                  <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-semibold">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span>عائد {property.roi_expected_pct}%</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Collapsible Installment Breakdown */}
          {hasInstallments && (
            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setShowInstallmentPlans((prev) => !prev)}
                className="w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg border border-amber-500/25 bg-amber-500/5 hover:bg-amber-500/15 text-[11px] font-bold text-amber-600 dark:text-amber-400 transition"
              >
                <span className="flex items-center gap-1">
                  <Calculator className="h-3 w-3" />
                  <span>{isAr ? 'تفاصيل خطة الأقساط والدفعات 💰' : 'Installment Details 💰'}</span>
                </span>
                {showInstallmentPlans ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>

              {showInstallmentPlans && (
                <div className="mt-1.5 space-y-1.5 rounded-xl border border-amber-500/30 bg-slate-50 p-2 text-xs dark:bg-zinc-950">
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <div className="rounded-lg bg-white dark:bg-zinc-900 p-1.5 border border-slate-200 dark:border-zinc-800">
                      <span className="text-zinc-400 block">{isAr ? 'قيمة المقدم' : 'Down'}:</span>
                      <strong className="text-emerald-500 font-mono">{baseDpAmount.toLocaleString(numLocale)} {curr}</strong>
                    </div>
                    <div className="rounded-lg bg-white dark:bg-zinc-900 p-1.5 border border-slate-200 dark:border-zinc-800">
                      <span className="text-zinc-400 block">{isAr ? 'المتبقي أقساط' : 'Remaining'}:</span>
                      <strong className="text-amber-500 font-mono">{remainingAmount.toLocaleString(numLocale)} {curr}</strong>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    {verifiedPaymentSchedules.slice(0, 2).map((sched) => (
                      <div key={sched.id} className="flex items-center justify-between text-[10px] rounded-lg bg-white dark:bg-zinc-900 px-2 py-1 border border-slate-200 dark:border-zinc-800">
                        <span className="text-zinc-400">{sched.frequencyLabel}:</span>
                        <span className="font-mono font-bold text-amber-500">{sched.installmentAmount.toLocaleString(numLocale)} {curr}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Action Buttons & Quick Prompts */}
        <div className="mt-3 space-y-1.5" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1.5">
            {/* Primary Action: Book Viewing */}
            <button
              type="button"
              onClick={() => onBookViewing && onBookViewing(property)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs py-2 px-2 transition shadow-xs active:scale-95"
              title={isAr ? 'طلب حجز موعد معاينة ميدانية' : 'Book a viewing'}
            >
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{isAr ? 'طلب معاينة' : 'Book Visit'}</span>
            </button>

            {/* Secondary Action: View Photos & Details */}
            <button
              type="button"
              onClick={() => onViewDetails && onViewDetails(property)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 font-bold text-xs py-2 px-2 transition active:scale-95"
              title={isAr ? 'معاينة كافة الصور والتفاصيل' : 'Photos & Details'}
            >
              <Images className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{isAr ? 'معاينة الصور' : 'Photos'}</span>
            </button>

            {/* Direct Official Link Button */}
            {directPropertyUrl && (
              <a
                href={directPropertyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-8 w-8 place-items-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition shrink-0"
                title={
                  isSellerListing
                    ? (isAr ? 'تواصل مع صاحب الإعلان عبر واتساب' : 'WhatsApp Owner')
                    : (isTekce ? (isAr ? 'الموقع الرسمي' : 'Official Site') : (isAr ? 'فتح الإعلان على عقارماب' : 'View on Aqarmap'))
                }
              >
                {isSellerListing ? <PhoneCall className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
              </a>
            )}
          </div>

          {/* Bridge to AI Agent: Direct Conversation on this Property */}
          {onSendToChat && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSendToChat(property);
              }}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/15 py-1.5 px-2.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 transition active:scale-98"
              title={isAr ? 'مناقشة أو استشارة الذكاء الاصطناعي حول هذه الوحدة' : 'Discuss this unit with AI'}
            >
              <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
              <span className="truncate">{isAr ? '🤖 استشارة وتقييم هذه الوحدة في الشات' : '🤖 Discuss in Chat'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
