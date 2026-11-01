'use client';

import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Zap, 
  Sparkles, 
  ShieldCheck, 
  Loader2, 
  AlertCircle, 
  Copy, 
  CheckCheck, 
  Phone
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: 'free' | 'pro';
  usedCount: number;
  limitCount: number;
  onUpgradeSuccess: (newPlan: 'pro', newLimit: number) => void;
  onOpenAuthModal?: () => void;
}

const OFFICIAL_WALLET_NUMBER = '01024359109';
const PRO_PRICE_EGP = 250;

export default function PricingModal({
  isOpen,
  onClose,
  onUpgradeSuccess,
}: PricingModalProps) {
  const { locale, isRtl } = useLanguage();
  const { session } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [senderPhone, setSenderPhone] = useState('');

  if (!isOpen) return null;

  const isAr = locale === 'ar';

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(OFFICIAL_WALLET_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const digits = senderPhone.replace(/\D/g, '');
    if (digits.length < 8) {
      setErrorMessage(
        isAr 
          ? 'يرجى إدخال رقم هاتفك أو محفظتك التي قمت بالتحويل منها' 
          : 'Please enter your phone or wallet number'
      );
      return;
    }

    setLoading(true);

    try {
      const authHeaders: Record<string, string> = session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {};

      const res = await fetch('/api/payment/wallet-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          senderPhone: senderPhone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'حدث خطأ أثناء معالجة الطلب');
      }

      // Pro plan activated immediately!
      setSuccess(true);
      setTimeout(() => {
        onUpgradeSuccess('pro', data.limit || 300);
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Wallet checkout error:', err);
      setErrorMessage(err.message || 'حدث خطأ أثناء إتمام العملية. يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-500/40 bg-white p-6 shadow-2xl dark:border-amber-400/30 dark:bg-zinc-950 sm:p-7 text-slate-900 dark:text-white"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 ltr:right-4 rtl:left-4 grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isAr ? 'ترقية فورية لباقة Pro' : 'Instant Pro Upgrade'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {isAr ? 'تفعيل باقة Pro العقارية' : 'Activate Pro Membership'}
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            {isAr
              ? '300 استفسار شهرياً، أولوية التحليل، سكور الصفقات، وحسابات الـ ROI.'
              : '300 queries/month, priority AI, deal scoring, and ROI calculations.'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Modal Screen */}
        {success ? (
          <div className="py-6 text-center space-y-3 animate-in zoom-in-95 duration-200">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/10 border-2 border-emerald-500 text-emerald-500 animate-bounce">
              <Check className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {isAr ? '🎉 مبروك! تم تفعيل باقة Pro فوراً' : '🎉 Pro Plan Activated!'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-300 max-w-xs mx-auto">
              {isAr
                ? `تم ربط رقم هاتفك بحسابك وشحن رصيدك بـ 300 استفسار بنجاح.`
                : 'Your phone has been linked and 300 queries credited to your account.'}
            </p>
            <div className="inline-flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
              <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span>{isAr ? 'جاري العودة للشات بالرصيد الجديد...' : 'Returning to chat...'}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Highlighted Destination Box */}
            <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  {isAr ? 'حول 250 ج.م كاش أو إنستاباي لرقم:' : 'Transfer 250 EGP to Official Wallet:'}
                </span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {PRO_PRICE_EGP} ج.م / {isAr ? 'شهر' : 'mo'}
                </span>
              </div>

              {/* Number with 1-click copy */}
              <div className="flex items-center justify-between gap-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-2.5">
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-widest text-slate-900 dark:text-white px-1">
                  {OFFICIAL_WALLET_NUMBER}
                </span>
                <button
                  type="button"
                  onClick={handleCopyNumber}
                  className="inline-flex items-center gap-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-2 text-xs font-black shadow-xs transition active:scale-95 shrink-0"
                >
                  {copied ? (
                    <>
                      <CheckCheck className="h-4 w-4" />
                      <span>{isAr ? 'تم النسخ!' : 'Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>{isAr ? 'نسخ' : 'Copy'}</span>
                    </>
                  )}
                </button>
              </div>

              <p className="mt-2 text-[10px] text-slate-500 dark:text-zinc-400 text-center">
                {isAr 
                  ? 'متاح التحويل من: فودافون كاش، إنستاباي (InstaPay)، أورنج، اتصالات، وي باي، والمحافظ البنكية' 
                  : 'Accepted from Vodafone Cash, InstaPay, Orange, Etisalat, WE Pay, and Bank Wallets'}
              </p>
            </div>

            {/* Simple Form: Phone number only! */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                  {isAr ? 'اكتب رقم هاتفك أو محفظتك التي قمت بالتحويل منها *' : 'Enter the phone or wallet number you transferred from *'}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    autoFocus
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white focus:border-amber-500 focus:bg-white dark:focus:bg-zinc-950 focus:outline-hidden ltr:pl-9 rtl:pr-9"
                  />
                  <Phone className="absolute top-3 ltr:left-3 rtl:right-3 h-4 w-4 text-slate-400" />
                </div>
              </div>

              {/* Instant Activation Button */}
              <button
                type="submit"
                disabled={loading || !senderPhone}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 py-3 text-xs sm:text-sm font-black text-black shadow-md transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{isAr ? 'جاري تفعيل باقة Pro فوراً...' : 'Activating Pro Plan...'}</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 fill-black" />
                    <span>{isAr ? 'تأكيد التحويل وتفعيل باقة Pro فوراً ⚡' : 'Confirm & Activate Pro Instantly ⚡'}</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 dark:text-zinc-500 text-center">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>
                  {isAr
                    ? 'يتم ربط رقم هاتفك بحسابك وتفعيل الـ 300 استفسار لحظياً مع إشعار فريق الدعم على تليجرام.'
                    : 'Your phone will be linked to your account with 300 queries enabled instantly.'}
                </span>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
