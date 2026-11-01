'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  X, 
  Award, 
  PhoneCall, 
  Calendar, 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';

interface BuyerAdvisorHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBooking: () => void;
  onOpenPricing: () => void;
}

export default function BuyerAdvisorHandoverModal({
  isOpen,
  onClose,
  onOpenBooking,
  onOpenPricing,
}: BuyerAdvisorHandoverModalProps) {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  if (!isOpen) return null;

  // Dedicated advisor WhatsApp bridge
  const defaultWhatsAppMsg = encodeURIComponent(
    'مرحباً، استكملت أكثر من 50 استشارة على منصة سكنى بوت وأرغب في استشارة استشاري عقاري معتمد وتنسيق معاينة ميدانية للمشاريع المناسبة.'
  );
  // Default support phone (or configurable)
  const advisorWhatsAppUrl = `https://wa.me/201024359109?text=${defaultWhatsAppMsg}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-amber-500/40 bg-white p-6 shadow-2xl dark:border-amber-400/30 dark:bg-zinc-950 text-slate-900 dark:text-white"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 ltr:right-4 rtl:left-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-black dark:hover:bg-zinc-800 dark:hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Trophy / Achievement Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-amber-500/15 text-amber-500 border border-amber-500/40 shadow-inner">
            <Award className="h-9 w-9" />
          </div>
          <span className="inline-block rounded-full bg-amber-500/20 px-3 py-1 text-xs font-black text-amber-600 dark:text-amber-400">
            {isAr ? '🏆 استهلكت 70 استشارة عقارية اليوم!' : '🏆 70 Inquiries Completed Today!'}
          </span>
          <h2 className="text-xl sm:text-2xl font-black">
            {isAr ? 'وصلت لمرحلة اتخاذ القرار للشراء' : 'Ready for the Final Step'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
            {isAr
              ? 'جمعت كل الأرقام وخطط الأقساط والمقارنات الهامة! في هذه المرحلة، التحدث مع مستشار عقاري حقيقي يفيدك أكثر من مجرد شات نصي، ليساعدك في إتمام الصفقة بأفضل شروط.'
              : 'You have gathered comprehensive comparisons and payment schedules. Talking to a certified human advisor is now your best step to lock the deal.'}
          </p>
        </div>

        {/* 3 Real Human Advisor Advantages */}
        <div className="my-5 space-y-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-3.5 text-xs dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <span className="font-bold text-slate-700 dark:text-zinc-300">
              {isAr ? 'تنسيق معاينات ميدانية مجانية للمشاريع التي قارنتها واصطحابك لمعاينة المواقع على الطبيعة.' : 'Free on-site field visits to any shortlisted project.'}
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <span className="font-bold text-slate-700 dark:text-zinc-300">
              {isAr ? 'التفاوض المباشر مع إدارة مبيعات المطور للحصول على أعلى نسبة خصم نقدي (Cash Discount) أو أطول فترة سداد.' : 'Negotiate maximum cash discounts or extended payment terms with developers.'}
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <span className="font-bold text-slate-700 dark:text-zinc-300">
              {isAr ? 'مراجعة الموقف القانوني والتراخيص والبنود التعاقدية لضمان سلامة استثمارك مجاناً بنسبة 100%.' : 'Complete legal and contractual review at zero cost.'}
            </span>
          </div>
        </div>

        {/* Primary CTAs */}
        <div className="space-y-2.5">
          {/* 1. Direct WhatsApp with Advisor */}
          <a
            href={advisorWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm py-3 px-4 shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition"
          >
            <PhoneCall className="h-4 w-4" />
            <span>{isAr ? '💬 تواصل فوري مع مستشارك المعتمد على واتساب' : 'Chat with Certified Advisor on WhatsApp'}</span>
          </a>

          {/* 2. Schedule Free Viewing */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenBooking();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs sm:text-sm py-3 px-4 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition"
          >
            <Calendar className="h-4 w-4" />
            <span>{isAr ? '📅 طلب معاينة ميدانية مجانية للمشاريع' : 'Schedule Free Field Viewing'}</span>
          </button>
        </div>

        {/* Footer Alternative Paths (Midnight reset & Broker Plan) */}
        <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            <span>{isAr ? 'تتجدد حصتك اليومية مجاناً كل ليلة 12:00 ص' : 'Free quota resets daily at 12:00 AM'}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenPricing();
            }}
            className="flex items-center gap-1 font-bold text-amber-600 hover:underline dark:text-amber-400"
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>{isAr ? 'لو أنت وسيط عقاري: باقة البروكر (Pro)' : 'Broker / Pro Plan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
