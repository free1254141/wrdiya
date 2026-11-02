'use client';

import React, { useMemo, useState } from 'react';
import { Eye, ArrowUpDown, Building2, ChevronDown, ChevronUp, Sparkles, ExternalLink } from 'lucide-react';
import { Property } from '@/lib/types';
import { getDirectPropertyUrl, getPropertyPortalBrand } from '@/lib/property-link';
import { useLanguage } from '@/contexts/LanguageContext';

interface InlinePropertiesTableProps {
  properties: Property[];
  initialCount?: number;
  onViewDetails: (property: Property) => void;
  onSendToChat?: (property: Property) => void;
}

type SortKey = 'relevance' | 'price_asc' | 'price_desc' | 'area_desc';

export default function InlinePropertiesTable({
  properties,
  initialCount = 4,
  onViewDetails,
  onSendToChat,
}: InlinePropertiesTableProps) {
  const { locale, isRtl } = useLanguage();
  const isAr = locale === 'ar';
  const [expanded, setExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('relevance');

  const sorted = useMemo(() => {
    const copy = [...properties];
    if (sortBy === 'price_asc') copy.sort((a, b) => (a.total_price || 0) - (b.total_price || 0));
    else if (sortBy === 'price_desc') copy.sort((a, b) => (b.total_price || 0) - (a.total_price || 0));
    else if (sortBy === 'area_desc') copy.sort((a, b) => (b.area_sqm || 0) - (a.area_sqm || 0));
    return copy;
  }, [properties, sortBy]);

  if (!properties || properties.length === 0) return null;

  const visibleRows = expanded ? sorted : sorted.slice(0, initialCount);
  const hasMore = sorted.length > initialCount;

  const fmt = (n?: number) =>
    typeof n === 'number' && Number.isFinite(n)
      ? n.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: 0 })
      : '—';

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="mt-5 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-amber-500/25 dark:bg-zinc-900/95"
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-amber-500/15 text-amber-500">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
              {isRtl ? 'أبرز نتائج البحث المطابقة' : 'Matching Search Results'}
              <span className="mx-1.5 inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-black text-amber-600 dark:text-amber-400">
                {sorted.length} {isRtl ? 'نتيجة' : 'results'}
              </span>
            </h4>
          </div>
        </div>

        {/* Sort Controls */}
        {sorted.length > 1 && (
          <div className="flex flex-wrap items-center gap-1 text-[11px]">
            <span className="inline-flex items-center gap-1 text-slate-500 dark:text-zinc-400 font-semibold me-1">
              <ArrowUpDown className="h-3 w-3" />
              {isRtl ? 'ترتيب:' : 'Sort:'}
            </span>
            {([
              ['relevance', isRtl ? 'الأقرب للطلب' : 'Best match'],
              ['price_asc', isRtl ? 'الأقل سعراً' : 'Lowest price'],
              ['price_desc', isRtl ? 'الأعلى سعراً' : 'Highest price'],
              ['area_desc', isRtl ? 'الأكبر مساحة' : 'Largest area'],
            ] as [SortKey, string][]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSortBy(key)}
                className={`rounded-lg px-2 py-1 font-bold transition ${
                  sortBy === key
                    ? 'bg-amber-500 text-black'
                    : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Feed View (sm:hidden) - Super Clean & Native Look on Phones */}
      <div className="divide-y divide-slate-100 dark:divide-zinc-800/80 sm:hidden">
        {visibleRows.map((p, idx) => (
          <div
            key={p.id || idx}
            onClick={() => onViewDetails(p)}
            className="flex flex-col gap-2.5 p-3.5 transition hover:bg-amber-500/5 active:bg-amber-500/10 cursor-pointer"
          >
            <div className="flex items-start gap-3">
              {/* Thumbnail */}
              <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-700 bg-zinc-800">
                {p.images?.[0] ? (
                  <img
                    src={p.images[0]}
                    alt={p.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-xs font-bold text-amber-500">
                    🏢
                  </div>
                )}
                <span className="absolute top-1 right-1 rounded-md bg-black/75 px-1.5 py-0.5 text-[9px] font-black text-amber-400 backdrop-blur-xs">
                  #{idx + 1}
                </span>
              </div>

              {/* Main Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h5 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                    {p.title}
                  </h5>
                  {p.unit_type && (
                    <span className="shrink-0 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      {p.unit_type}
                    </span>
                  )}
                </div>

                <div className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-1">
                  {p.compound?.name || p.compound?.area_name || p.compound?.city || 'مصر'}
                </div>

                {/* Specs */}
                <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-600 dark:text-zinc-300 font-medium">
                  <span>{fmt(p.area_sqm)} {isRtl ? 'م²' : 'm²'}</span>
                  {p.bedrooms ? <span>• {p.bedrooms} {isRtl ? 'غرف' : 'bd'}</span> : null}
                  {p.bathrooms ? <span>• {p.bathrooms} {isRtl ? 'حمام' : 'ba'}</span> : null}
                </div>
              </div>
            </div>

            {/* Bottom Row: Price & Action Buttons */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-zinc-800/60">
              <div>
                <div className="font-black text-xs sm:text-sm text-amber-600 dark:text-amber-400">
                  {fmt(p.total_price)} <span className="text-[10px] font-bold">{p.currency}</span>
                </div>
                {p.monthly_installment ? (
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    {fmt(p.monthly_installment)} {p.currency}/{isRtl ? 'شهرياً' : 'mo'}
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(p);
                  }}
                  className="inline-flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-2.5 py-1 text-[11px] font-bold text-slate-800 dark:text-zinc-200 transition active:scale-95 shadow-2xs"
                >
                  <Eye className="h-3 w-3" />
                  <span>{isRtl ? 'التفاصيل' : 'Details'}</span>
                </button>
                {onSendToChat && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSendToChat(p);
                    }}
                    className="inline-flex items-center gap-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-2.5 py-1 text-[11px] font-black transition active:scale-95 shadow-2xs"
                    title={isRtl ? 'استشارة وتقييم هذه الوحدة في الشات' : 'Ask AI to evaluate this unit'}
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>{isAr ? 'تقييم' : 'AI'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Responsive Table View (hidden sm:block) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="bg-slate-100/70 text-[11px] font-bold text-slate-600 dark:bg-zinc-950/60 dark:text-zinc-400">
            <tr className="border-b border-slate-200/70 dark:border-zinc-800">
              <th className="py-2.5 px-3 text-start">#</th>
              <th className="py-2.5 px-3 text-start">{isRtl ? 'الوحدة / المشروع' : 'Unit / Project'}</th>
              <th className="py-2.5 px-3 text-start hidden sm:table-cell">{isRtl ? 'النوع' : 'Type'}</th>
              <th className="py-2.5 px-3 text-start">{isRtl ? 'المساحة والغرف' : 'Area & Beds'}</th>
              <th className="py-2.5 px-3 text-start">{isRtl ? 'السعر الإجمالي' : 'Total Price'}</th>
              <th className="py-2.5 px-3 text-start hidden md:table-cell">{isRtl ? 'المقدم والقسط' : 'Payment Plan'}</th>
              <th className="py-2.5 px-3 text-center">{isRtl ? 'بيانات الإعلان' : 'Details'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-zinc-800/70">
            {visibleRows.map((p, idx) => (
              <tr
                key={p.id || idx}
                className="transition hover:bg-amber-500/5 dark:hover:bg-amber-500/5"
              >
                <td className="py-2.5 px-3 font-black text-slate-400 dark:text-zinc-500">
                  {idx + 1}
                </td>
                <td className="py-2.5 px-3 min-w-[170px] max-w-[240px]">
                  <div className="flex items-center gap-2.5">
                    {p.images?.[0] && (
                      <img
                        src={p.images[0]}
                        alt={p.title}
                        className="h-9 w-12 shrink-0 rounded-lg object-cover border border-slate-200 dark:border-zinc-700"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                        {p.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-1">
                        {p.compound?.name || p.compound?.area_name || p.compound?.city || '—'}
                      </div>
                      {p.deal_score !== undefined && (
                        <div className="mt-0.5">
                          <span className={`inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-black text-white ${
                            p.deal_score >= 80 ? 'bg-emerald-600' :
                            p.deal_score >= 65 ? 'bg-blue-600' :
                            p.deal_score >= 50 ? 'bg-amber-600' :
                            'bg-rose-600'
                          }`}>
                            ⭐ {p.deal_score}/100 {p.deal_badge ? `• ${p.deal_badge}` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-3 hidden sm:table-cell whitespace-nowrap">
                  <span className="inline-flex rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    {p.unit_type || '—'}
                  </span>
                </td>
                <td className="py-2.5 px-3 whitespace-nowrap text-slate-700 dark:text-zinc-300 font-semibold">
                  <div>{fmt(p.area_sqm)} {isRtl ? 'م²' : 'm²'}</div>
                  <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                    {p.bedrooms ? `${p.bedrooms} ${isRtl ? 'غرف' : 'bd'}` : ''}{' '}
                    {p.bathrooms ? `• ${p.bathrooms} ${isRtl ? 'حمام' : 'ba'}` : ''}
                  </div>
                </td>
                <td className="py-2.5 px-3 whitespace-nowrap font-black text-amber-600 dark:text-amber-400">
                  {fmt(p.total_price)} <span className="text-[10px] font-bold">{p.currency}</span>
                </td>
                <td className="py-2.5 px-3 hidden md:table-cell whitespace-nowrap text-[11px] text-slate-600 dark:text-zinc-300">
                  <div>
                    {isRtl ? 'مقدم' : 'Down'} {p.down_payment_pct ?? 10}% ({fmt(p.down_payment_amount)})
                  </div>
                  <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {fmt(p.monthly_installment)} {p.currency}/{isRtl ? 'شهرياً' : 'mo'}
                    {p.installment_years ? ` • ${p.installment_years} ${isRtl ? 'سنوات' : 'yrs'}` : ''}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onViewDetails(p)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-2.5 py-1.5 text-[11px] font-bold text-slate-800 dark:text-zinc-200 shadow-2xs transition active:scale-95"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {isRtl ? 'عرض البيانات' : 'View'}
                    </button>
                    {onSendToChat && (
                      <button
                        type="button"
                        onClick={() => onSendToChat(p)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-2.5 py-1.5 text-[11px] font-black shadow-2xs transition active:scale-95"
                        title={isRtl ? 'استشارة وتقييم هذه الوحدة في الشات' : 'Ask AI to evaluate this unit'}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>{isAr ? 'تقييم بالشات' : 'Ask AI'}</span>
                      </button>
                    )}
                    {(() => {
                      const directUrl = getDirectPropertyUrl(p);
                      if (!directUrl || p.platform === 'SellerListing') return null;
                      const portalBrand = getPropertyPortalBrand(p);
                      return (
                        <a
                          href={directUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-1.5 text-[11px] font-bold shadow-2xs transition active:scale-95"
                          title={isAr ? portalBrand.buttonLabelAr : portalBrand.buttonLabelEn}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span className="hidden md:inline">{isAr ? 'الموقع ↗' : 'Link ↗'}</span>
                        </a>
                      );
                    })()}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Programmatic "Show All Search Results" button directly UNDER the table */}
      {hasMore && (
        <div className="border-t border-slate-200/80 bg-slate-50/90 px-4 py-2.5 text-center dark:border-zinc-800 dark:bg-zinc-900/90">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-1.5 text-xs font-black text-amber-600 transition hover:bg-amber-500 hover:text-black dark:text-amber-400 dark:hover:text-black"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                {isRtl ? `إخفاء باقي النتائج (عرض أول ${initialCount} فقط)` : `Show less (first ${initialCount})`}
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                {isRtl
                  ? `إظهار الكل (${sorted.length} نتيجة مطابقة لهذا البحث)`
                  : `Show all (${sorted.length} matching search results)`}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
