'use client';

import React, { useMemo, useState } from 'react';
import { Property } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { X, ArrowUpDown, Eye, Bed, Maximize } from 'lucide-react';

interface PropertiesTableModalProps {
  isOpen: boolean;
  properties: Property[];
  totalMatches?: number;
  onClose: () => void;
  onViewDetails: (property: Property) => void;
}

type SortMode = 'relevance' | 'price_asc' | 'price_desc' | 'area_desc';

const LABELS: Record<string, Record<string, string>> = {
  ar: { title: 'كل النتائج', shown: 'معروض', of: 'من', unit: 'الوحدة', location: 'الموقع', area: 'المساحة', rooms: 'غرف', price: 'السعر', down: 'المقدم', monthly: 'القسط الشهري', view: 'عرض البيانات', sort: 'ترتيب', relevance: 'الأكثر ملاءمة', priceAsc: 'السعر: الأقل', priceDesc: 'السعر: الأعلى', areaDesc: 'المساحة: الأكبر', sqm: 'م²' },
  en: { title: 'All results', shown: 'Showing', of: 'of', unit: 'Unit', location: 'Location', area: 'Area', rooms: 'Beds', price: 'Price', down: 'Down payment', monthly: 'Monthly', view: 'View details', sort: 'Sort', relevance: 'Most relevant', priceAsc: 'Price: low to high', priceDesc: 'Price: high to low', areaDesc: 'Area: largest', sqm: 'm²' },
  tr: { title: 'Tüm sonuçlar', shown: 'Gösterilen', of: '/', unit: 'Birim', location: 'Konum', area: 'Alan', rooms: 'Oda', price: 'Fiyat', down: 'Peşinat', monthly: 'Aylık', view: 'Detayları gör', sort: 'Sırala', relevance: 'En alakalı', priceAsc: 'Fiyat: artan', priceDesc: 'Fiyat: azalan', areaDesc: 'Alan: en büyük', sqm: 'm²' },
  ru: { title: 'Все результаты', shown: 'Показано', of: 'из', unit: 'Объект', location: 'Локация', area: 'Площадь', rooms: 'Комн.', price: 'Цена', down: 'Взнос', monthly: 'В месяц', view: 'Подробнее', sort: 'Сортировка', relevance: 'По релевантности', priceAsc: 'Цена: по возрастанию', priceDesc: 'Цена: по убыванию', areaDesc: 'Площадь: больше', sqm: 'м²' },
  de: { title: 'Alle Ergebnisse', shown: 'Angezeigt', of: 'von', unit: 'Objekt', location: 'Lage', area: 'Fläche', rooms: 'Zimmer', price: 'Preis', down: 'Anzahlung', monthly: 'Monatlich', view: 'Details ansehen', sort: 'Sortieren', relevance: 'Relevanz', priceAsc: 'Preis: aufsteigend', priceDesc: 'Preis: absteigend', areaDesc: 'Fläche: größte', sqm: 'm²' },
  fr: { title: 'Tous les résultats', shown: 'Affichés', of: 'sur', unit: 'Bien', location: 'Lieu', area: 'Surface', rooms: 'Ch.', price: 'Prix', down: 'Apport', monthly: 'Mensualité', view: 'Voir les détails', sort: 'Trier', relevance: 'Pertinence', priceAsc: 'Prix croissant', priceDesc: 'Prix décroissant', areaDesc: 'Surface décroissante', sqm: 'm²' },
  es: { title: 'Todos los resultados', shown: 'Mostrando', of: 'de', unit: 'Unidad', location: 'Ubicación', area: 'Superficie', rooms: 'Hab.', price: 'Precio', down: 'Entrada', monthly: 'Mensual', view: 'Ver detalles', sort: 'Ordenar', relevance: 'Relevancia', priceAsc: 'Precio: menor', priceDesc: 'Precio: mayor', areaDesc: 'Superficie: mayor', sqm: 'm²' },
};

export default function PropertiesTableModal({ isOpen, properties, totalMatches, onClose, onViewDetails }: PropertiesTableModalProps) {
  const { locale, isRtl } = useLanguage();
  const L = LABELS[locale] || LABELS.en;
  const [sort, setSort] = useState<SortMode>('relevance');

  const rows = useMemo(() => {
    const list = [...properties];
    if (sort === 'price_asc') list.sort((a, b) => a.total_price - b.total_price);
    if (sort === 'price_desc') list.sort((a, b) => b.total_price - a.total_price);
    if (sort === 'area_desc') list.sort((a, b) => (b.area_sqm || 0) - (a.area_sqm || 0));
    return list;
  }, [properties, sort]);

  if (!isOpen) return null;

  const fmt = (n?: number | null) => (n || n === 0 ? Math.round(n).toLocaleString(locale === 'ar' ? 'ar-EG' : locale) : '—');

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-6xl flex-col overflow-hidden bg-white shadow-2xl dark:bg-zinc-950 sm:h-[88vh] sm:rounded-2xl sm:border sm:border-slate-200 dark:sm:border-zinc-800"
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{L.title}</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {L.shown} {rows.length} {totalMatches && totalMatches > rows.length ? `${L.of} ${totalMatches}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-zinc-300">
              <ArrowUpDown className="h-3.5 w-3.5" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortMode)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs dark:border-zinc-800 dark:bg-zinc-900"
              >
                <option value="relevance">{L.relevance}</option>
                <option value="price_asc">{L.priceAsc}</option>
                <option value="price_desc">{L.priceDesc}</option>
                <option value="area_desc">{L.areaDesc}</option>
              </select>
            </label>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
              aria-label="close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full min-w-[760px] border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr className="text-start">
                <th className="px-3 py-2 text-start font-bold">{L.unit}</th>
                <th className="px-3 py-2 text-start font-bold">{L.location}</th>
                <th className="px-3 py-2 text-start font-bold">{L.area}</th>
                <th className="px-3 py-2 text-start font-bold">{L.rooms}</th>
                <th className="px-3 py-2 text-start font-bold">{L.price}</th>
                <th className="px-3 py-2 text-start font-bold">{L.down}</th>
                <th className="px-3 py-2 text-start font-bold">{L.monthly}</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => onViewDetails(p)}
                  className="cursor-pointer border-t border-slate-100 transition hover:bg-amber-50/60 dark:border-zinc-900 dark:hover:bg-zinc-900/70"
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2.5">
                      {p.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0]} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" loading="lazy" />
                      ) : (
                        <div className="h-12 w-16 shrink-0 rounded-lg bg-slate-200 dark:bg-zinc-800" />
                      )}
                      <div className="min-w-0">
                        <div className="line-clamp-2 max-w-[260px] font-bold text-slate-900 dark:text-zinc-100">{p.title}</div>
                        <div className="text-[10px] text-slate-400">{p.unit_type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-slate-600 dark:text-zinc-300">
                    <div className="max-w-[170px] truncate">{p.compound?.name || '—'}</div>
                    <div className="text-[10px] text-slate-400">{p.compound?.area_name || p.compound?.city || ''}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-slate-600 dark:text-zinc-300">
                    <Maximize className="me-1 inline h-3 w-3 text-slate-400" />{fmt(p.area_sqm)} {L.sqm}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-slate-600 dark:text-zinc-300">
                    <Bed className="me-1 inline h-3 w-3 text-slate-400" />{p.bedrooms ?? '—'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-extrabold text-amber-600 dark:text-amber-400">
                    {fmt(p.total_price)} {p.currency}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-slate-600 dark:text-zinc-300">
                    {p.down_payment_pct ? `${p.down_payment_pct}% · ` : ''}{fmt(p.down_payment_amount)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-slate-600 dark:text-zinc-300">
                    {fmt(p.monthly_installment)} {p.installment_years ? `· ${p.installment_years}y` : ''}
                  </td>
                  <td className="px-3 py-2 text-end">
                    <button
                      onClick={(e) => { e.stopPropagation(); onViewDetails(p); }}
                      className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1.5 text-[11px] font-bold text-black transition hover:bg-amber-400"
                    >
                      <Eye className="h-3.5 w-3.5" /> {L.view}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
