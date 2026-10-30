'use client';

import React from 'react';
import { Property } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { X, Star, Calendar, Trash2, MapPin } from 'lucide-react';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: Property[];
  onRemoveFavorite: (id: string) => void;
  onBookViewing: (property: Property) => void;
}

export default function FavoritesModal({
  isOpen,
  onClose,
  favorites,
  onRemoveFavorite,
  onBookViewing
}: FavoritesModalProps) {
  const { locale, t } = useLanguage();
  const isAr = locale === 'ar';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-500/10 text-amber-500">
              <Star className="h-5 w-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {t.favoritesTitle} ({favorites.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {t.savedUnits}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {favorites.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-zinc-500">
              <Star className="mx-auto h-12 w-12 stroke-1 text-slate-300 dark:text-zinc-700 mb-2" />
              <p className="text-sm font-bold">{t.favoritesEmptyTitle}</p>
              <p className="mt-1 text-xs">{t.favoritesEmptyDesc}</p>
            </div>
          ) : (
            favorites.map((prop) => {
              const curr = prop.currency || (isAr ? 'ج.م' : 'EGP');
              return (
                <div
                  key={prop.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-amber-500/30 dark:border-zinc-800 dark:bg-zinc-800/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={prop.images?.[0] || prop.compound?.cover_image}
                      alt={prop.title}
                      className="h-16 w-16 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-black text-slate-900 dark:text-white">
                        {prop.title}
                      </h4>
                      <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        <MapPin className="h-3 w-3 text-amber-500" />
                        <span>{prop.compound?.name} • {prop.area_sqm} {t.area}</span>
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-xs">
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          {prop.total_price.toLocaleString(isAr ? 'ar-EG' : 'en-US')} {curr}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          {t.monthlyInstallment} {prop.monthly_installment.toLocaleString(isAr ? 'ar-EG' : 'en-US')} {curr}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                    <button
                      onClick={() => {
                        onClose();
                        onBookViewing(prop);
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-black hover:bg-amber-400 transition"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{t.bookViewing}</span>
                    </button>
                    <button
                      onClick={() => onRemoveFavorite(prop.id)}
                      className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-rose-600 dark:border-zinc-700 dark:bg-zinc-800"
                      title={t.remove}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
