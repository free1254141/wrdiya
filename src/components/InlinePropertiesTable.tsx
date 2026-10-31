'use client';

import React, { useMemo, useState } from 'react';
import { Eye, ArrowUpDown, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { Property } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface InlinePropertiesTableProps {
  properties: Property[];
  initialCount?: number;
  onViewDetails: (property: Property) => void;
}

type SortKey = 'relevance' | 'price_asc' | 'price_desc' | 'area_desc';

export default function InlinePropertiesTable({
  properties,
  initialCount = 4,
  onViewDetails,
}: InlinePropertiesTableProps) {
  const { locale, isRtl } = useLanguage();
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
      className="mt-5 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90"
    >
      {/* Table Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-amber-500/15 text-amber-500">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
              {isRtl ? 'جدول نتائج البحث المطابقة' : 'Matching Search Results'}
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

      {/* Responsive Table */}
      <div className="overflow-x-auto">
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
                  <button
                    type="button"
                    onClick={() => onViewDetails(p)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1.5 text-[11px] font-black text-black shadow-2xs transition hover:bg-amber-400 active:scale-95"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {isRtl ? 'عرض البيانات' : 'View details'}
                  </button>
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
