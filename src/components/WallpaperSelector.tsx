'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sparkles } from 'lucide-react';

export type ChatWallpaper = 'architectural' | 'watermelon' | 'arabesque' | 'none' | 'whatsapp';

interface WallpaperSelectorProps {
  currentWallpaper: ChatWallpaper;
  onSelectWallpaper: (wp: ChatWallpaper) => void;
  isRtl?: boolean;
}

export const WallpaperSelector: React.FC<WallpaperSelectorProps> = ({
  currentWallpaper,
  onSelectWallpaper,
  isRtl = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const options: { id: ChatWallpaper; title: string; subtitle: string; icon: string; badge?: string }[] = [
    {
      id: 'architectural',
      title: isRtl ? 'نقوش معمارية وهندسية' : 'Architectural Blueprint',
      subtitle: isRtl ? 'تصاميم ورسومات عقارية فاخرة ومريحة للعين' : 'Luxury architectural sketches & blueprints',
      icon: '🏛️',
      badge: isRtl ? 'فاخر' : 'Luxury',
    },
    {
      id: 'watermelon',
      title: isRtl ? 'تراث وتضامن فلسطيني 🍉' : 'Palestine Heritage 🍉',
      subtitle: isRtl ? 'رموز العزة والتطريز والزيتون والبطيخ' : 'Olive branch, Tatreez & solidarity',
      icon: '🍉',
      badge: '🇵🇸',
    },
    {
      id: 'arabesque',
      title: isRtl ? 'أرابيسك هندسي راقي' : 'Arabesque Geometric',
      subtitle: isRtl ? 'زخارف ونقوش هندسية إسلامية متناسقة' : 'Harmonious Islamic geometric patterns',
      icon: '✨',
      badge: isRtl ? 'جديد' : 'New',
    },
    {
      id: 'none',
      title: isRtl ? 'بدون نقوش (شاشة نقية)' : 'Clean Minimalist',
      subtitle: isRtl ? 'خلفية صامتة ومريحة للتركيز' : 'Solid distraction-free background',
      icon: '🌙',
    },
  ];

  // Map legacy 'whatsapp' to 'architectural' for display & matching
  const normalizedWallpaper = currentWallpaper === 'whatsapp' ? 'architectural' : currentWallpaper;
  const currentOption = options.find((o) => o.id === normalizedWallpaper) || options[0];

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger Button in Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 rounded-xl border px-2 sm:px-2.5 py-1 text-xs font-bold transition shadow-2xs whitespace-nowrap ${
          isOpen
            ? 'border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400'
            : 'border-slate-200/80 bg-slate-50/90 text-slate-700 hover:border-amber-400 hover:bg-white dark:border-zinc-800/80 dark:bg-zinc-900/90 dark:text-zinc-200 dark:hover:bg-zinc-800'
        }`}
        title={isRtl ? 'تغيير ورق حائط وخلفية الشات' : 'Change Chat Wallpaper'}
      >
        <span className="text-sm leading-none">{currentOption.icon}</span>
        <span className="hidden sm:inline font-medium">
          {normalizedWallpaper === 'architectural'
            ? (isRtl ? 'نقوش معمارية' : 'Architectural')
            : normalizedWallpaper === 'watermelon'
            ? (isRtl ? 'تراث فلسطيني 🍉' : 'Palestine 🍉')
            : normalizedWallpaper === 'arabesque'
            ? (isRtl ? 'أرابيسك راقي' : 'Arabesque')
            : (isRtl ? 'ورق حائط الشات' : 'Wallpaper')}
        </span>
        <Palette className="h-3 w-3 opacity-60 ml-0.5" />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 w-72 rounded-2xl border border-slate-200/90 bg-white/95 p-2 shadow-2xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/95 z-50 animate-in fade-in zoom-in-95 ${
            isRtl ? 'left-0 sm:left-auto sm:right-0' : 'right-0 sm:right-auto sm:left-0'
          }`}
        >
          <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-amber-500" />
              <span>{isRtl ? 'ورق حائط وخلفية الشات' : 'Chat Wallpaper'}</span>
            </span>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
              v2.0
            </span>
          </div>

          <div className="space-y-1.5 p-1 pt-2">
            {options.map((opt) => {
              const isSelected = normalizedWallpaper === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onSelectWallpaper(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 rounded-xl p-2.5 text-right transition ${
                    isSelected
                      ? 'border border-amber-500/50 bg-amber-500/10 text-slate-900 dark:text-white shadow-2xs'
                      : 'hover:bg-slate-100 dark:hover:bg-zinc-800/70 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-lg shadow-2xs ${
                        isSelected
                          ? 'bg-amber-500 text-black shadow-xs'
                          : 'bg-slate-100 dark:bg-zinc-800'
                      }`}
                    >
                      {opt.icon}
                    </div>
                    <div className="min-w-0 text-right">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold leading-tight line-clamp-1">
                          {opt.title}
                        </span>
                        {opt.badge && (
                          <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-black text-emerald-600 dark:text-emerald-400">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-zinc-400 leading-tight mt-0.5">
                        {opt.subtitle}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-500 text-black">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick tip footer */}
          <div className="mt-2 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-950/60 text-[10px] text-slate-500 dark:text-zinc-400 border border-slate-100 dark:border-zinc-800/60 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
            <span>
              {isRtl
                ? 'يتم حفظ اختيارك تلقائياً لجلساتك القادمة'
                : 'Your wallpaper choice is saved automatically'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WallpaperSelector;
