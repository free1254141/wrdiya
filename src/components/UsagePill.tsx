'use client';

import React from 'react';
import { Zap, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface UsagePillProps {
  used: number;
  limit: number;
  plan: 'free' | 'pro' | 'guest' | 'admin';
  hasUnlockedBonus?: boolean;
  onOpenPricing: () => void;
  onOpenUnlockModal?: () => void;
}

export default function UsagePill({
  used,
  limit,
  plan,
  hasUnlockedBonus,
  onOpenPricing,
  onOpenUnlockModal,
}: UsagePillProps) {
  const { locale } = useLanguage();

  if (plan === 'admin') {
    return (
      <span className="hidden sm:flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-500">
        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
        <span>Admin: ∞</span>
      </span>
    );
  }

  if (plan === 'pro') {
    return (
      <button
        onClick={onOpenPricing}
        className="hidden sm:flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition"
        title={locale === 'ar' ? 'باقة برو مفعلة (300 استفسار شهرياً)' : 'Pro Plan Active (300 queries/month)'}
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span>Pro: {used}/{limit}</span>
      </button>
    );
  }

  const isNearLimit = used >= limit * 0.8;
  const canUnlockBonus = !hasUnlockedBonus;

  const handleClick = () => {
    if (canUnlockBonus && onOpenUnlockModal && isNearLimit) {
      onOpenUnlockModal();
    } else {
      onOpenPricing();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`hidden sm:flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold transition ${
        isNearLimit
          ? canUnlockBonus
            ? 'border-amber-500/50 bg-amber-500/15 text-amber-600 dark:text-amber-300 animate-pulse'
            : 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 animate-pulse'
          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
      }`}
      title={
        canUnlockBonus && isNearLimit
          ? (locale === 'ar' ? 'افتح 50 استشارة مجانية إضافية' : 'Unlock 50 Free Inquiries')
          : (locale === 'ar' ? 'عرض خطة الاستخدام والترقية' : 'View plans & upgrade')
      }
    >
      <Zap className={`h-3.5 w-3.5 ${isNearLimit ? (canUnlockBonus ? 'text-amber-500' : 'text-rose-500') : 'text-amber-500'}`} />
      <span>{used}/{limit}</span>
      {canUnlockBonus && isNearLimit ? (
        <span className="hidden md:inline-block rounded-md bg-amber-500/30 px-1.5 py-0.5 text-[10px] font-black text-amber-700 dark:text-amber-300">
          {locale === 'ar' ? '+50 مجاناً 🎁' : '+50 Free 🎁'}
        </span>
      ) : (
        <span className="hidden md:inline-block rounded-md bg-amber-500/20 px-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
          {locale === 'ar' ? 'ترقية' : 'Upgrade'}
        </span>
      )}
    </button>
  );
}
