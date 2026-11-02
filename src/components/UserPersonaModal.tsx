'use client';

import React from 'react';
import { Home, Tag, Briefcase, CheckCircle2, Sparkles, X, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export type UserPersona = 'buyer' | 'seller' | 'broker';

interface UserPersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPersona: (persona: UserPersona) => void;
  onOpenPricing?: () => void;
  userName?: string | null;
}

export default function UserPersonaModal({
  isOpen,
  onClose,
  onSelectPersona,
  onOpenPricing,
  userName,
}: UserPersonaModalProps) {
  const { locale, isRtl } = useLanguage();

  if (!isOpen) return null;

  const isAr = locale === 'ar';

  const personas: {
    id: UserPersona;
    icon: React.ElementType;
    title: string;
    badge: string;
    desc: string;
    accentColor: string;
    borderHover: string;
    bgAccent: string;
    badgeColor: string;
  }[] = [
    {
      id: 'buyer',
      icon: Home,
      title: isAr ? 'مشتري / باحث عن عقار' : 'Buyer / Property Seeker',
      badge: isAr ? 'شراء واستثمار' : 'Buying & Investment',
      desc: isAr
        ? 'أبحث عن شقة، فيلا، أو شاليه للشراء (كاش أو تقسيط مريح) بأفضل سعر رسمي في السوق.'
        : 'Looking to buy an apartment, villa, or chalet with fair prices and best installment plans.',
      accentColor: 'text-amber-500',
      borderHover: 'hover:border-amber-500 hover:shadow-amber-500/10',
      bgAccent: 'group-hover:bg-amber-500/10 text-amber-600 dark:text-amber-400',
      badgeColor: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    {
      id: 'seller',
      icon: Tag,
      title: isAr ? 'بائع / صاحب عقار' : 'Seller / Property Owner',
      badge: isAr ? 'تسعير وعرض للبيع' : 'Valuation & Listing',
      desc: isAr
        ? 'أملك وحدة أو أرض وأريد تقييم سعرها العادل بالذكاء الاصطناعي (AVM) وعرضها لمشترين جادين.'
        : 'I own a property or land and want fair AI valuation and direct connection to qualified buyers.',
      accentColor: 'text-emerald-500',
      borderHover: 'hover:border-emerald-500 hover:shadow-emerald-500/10',
      bgAccent: 'group-hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      badgeColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'broker',
      icon: Briefcase,
      title: isAr ? 'سمسار / بروكر عقاري' : 'Broker / Real Estate Agent',
      badge: isAr ? 'أدوات وسكور الصفقات' : 'Pro Tools & Deal Scoring',
      desc: isAr
        ? 'وسيط عقاري أو مسوق؛ أبحث عن سكور الصفقات، حاسبة الأقساط الدقيقة، ومقارنة مشاريع مصر.'
        : 'Real estate broker or agent seeking deal score metrics, installment math, and project analysis.',
      accentColor: 'text-blue-500',
      borderHover: 'hover:border-blue-500 hover:shadow-blue-500/10',
      bgAccent: 'group-hover:bg-blue-500/10 text-blue-600 dark:text-blue-400',
      badgeColor: 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 sm:p-7"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 ltr:right-4 rtl:left-4 grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 mb-2.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isAr ? 'تخصيص تجربتك في سكنى بوت' : 'Tailor Your Experience'}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {userName
              ? (isAr ? `أهلاً بك يا ${userName} 👋 كيف تحب أن نساعدك اليوم؟` : `Welcome, ${userName} 👋 How can we assist you today?`)
              : (isAr ? 'أهلاً بك 👋 كيف تحب أن نساعدك اليوم؟' : 'Welcome 👋 How can we assist you today?')}
          </h2>

          <p className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
            {isAr
              ? 'اختر صفتك لنقوم بتوجيه ردود وتحليلات سكنى بوت بما يناسب هدفك بدقة:'
              : 'Select your role so Ewanbot can tailor recommendations and analysis to your goals:'}
          </p>
        </div>

        {/* Persona Options Grid */}
        <div className="space-y-3">
          {personas.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => {
                  onSelectPersona(p.id);
                  onClose();
                  if (p.id === 'broker' && onOpenPricing) {
                    onOpenPricing();
                  }
                }}
                className={`group w-full flex items-center justify-between gap-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 dark:border-zinc-800 dark:bg-zinc-900/40 p-4 text-start transition duration-150 shadow-2xs hover:bg-white dark:hover:bg-zinc-900 ${p.borderHover} hover:scale-[1.01] active:scale-[0.99]`}
              >
                <div className="flex items-start gap-3">
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/80 shadow-2xs transition ${p.bgAccent}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {p.title}
                      </span>
                      <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${p.badgeColor}`}>
                        {p.badge}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-500 dark:text-zinc-400">
                      {p.desc}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 ltr:rotate-0 rtl:rotate-180 text-slate-400 group-hover:text-amber-500 transition">
                  <ChevronRight className="h-5 w-5" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Subtle Footnote */}
        <p className="mt-5 text-center text-[10px] text-slate-400 dark:text-zinc-500">
          {isAr
            ? '💡 يمكنك تغيير اختيارك في أي وقت لاحقاً؛ سكنى بوت يتكيف دائماً مع احتياجك الفعلي.'
            : '💡 You can switch anytime; Ewanbot adapts intelligently to your ongoing queries.'}
        </p>
      </div>
    </div>
  );
}
