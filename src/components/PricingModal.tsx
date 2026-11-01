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

  // Strict Egyptian phone validation: exactly 11 digits starting with 010, 011, 012, or 015
  const cleanDigits = senderPhone.replace(/\D/g, '');
  const isValidPhone = /^01[0125]\d{8}$/.test(cleanDigits);

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(OFFICIAL_WALLET_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isValidPhone) {
      setErrorMessage(
        isAr 
          ? 'يرجى إدخال رقم هاتف مصري كامل مكون من 11 رقماً (مثال: 010XXXXXXXX)' 
          : 'Please enter a complete 11-digit Egyptian phone number (e.g. 010XXXXXXXX)'
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
          senderPhone: cleanDigits,
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
                ? `تم ربط رقم هاتفك (${cleanDigits}) بحسابك وشحن رصيدك بـ 300 استفسار بنجاح.`
                : 'Your phone has been linked and 300 queries credited to your account.'}
            </p>
            <div className="inline-flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
              <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span>{isAr ? 'جاري العودة للشات بالرصيد الجديد...' : 'Returning to chat...'}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Highlighted Destination Box: Vodafone Cash ONLY */}
            <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  {isAr ? 'حول 250 ج.م على فودافون كاش لرقم:' : 'Transfer 250 EGP via Vodafone Cash:'}
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
                  ? 'يقبل التحويل من أي محفظة كاش (فودافون كاش، أورنج كاش، اتصالات كاش، وي باي، أو المحافظ البنكية الذكية)' 
                  : 'Accepted from any cash mobile wallet (Vodafone Cash, Orange, Etisalat, WE Pay, Bank Smart Wallets)'}
              </p>
            </div>

            {/* Simple Form: Phone number only! */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {isAr ? 'رقم هاتفك / محفظتك المحول منها *' : 'Phone / Wallet number transferred from *'}
                  </label>
                  {/* Visual 11-digit Completion Counter */}
                  <span className={`text-[11px] font-mono font-bold ${
                    isValidPhone 
                      ? 'text-emerald-500' 
                      : cleanDigits.length > 0 
                        ? 'text-amber-500' 
                        : 'text-slate-400'
                  }`}>
                    {isValidPhone 
                      ? (isAr ? '✓ الرقم مكتمل (11 رقماً)' : '✓ 11 Digits Complete') 
                      : `${cleanDigits.length} / 11 ${isAr ? 'رقم' : 'digits'}`}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="tel"
                    inputMode="numeric"
                    required
                    autoFocus
                    maxLength={11}
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    placeholder="010XXXXXXXX"
                    className={`w-full rounded-xl border bg-slate-50 dark:bg-zinc-900 px-3.5 py-2.5 text-sm font-mono text-slate-900 dark:text-white transition focus:bg-white dark:focus:bg-zinc-950 focus:outline-hidden ltr:pl-9 rtl:pr-9 ${
                      isValidPhone 
                        ? 'border-emerald-500 dark:border-emerald-500 focus:border-emerald-500' 
                        : cleanDigits.length > 0 
                          ? 'border-amber-500/60 focus:border-amber-500' 
                          : 'border-slate-200 dark:border-zinc-800 focus:border-amber-500'
                    }`}
                  />
                  <Phone className={`absolute top-3 ltr:left-3 rtl:right-3 h-4 w-4 transition ${
                    isValidPhone ? 'text-emerald-500' : 'text-slate-400'
                  }`} />
                </div>

                {!isValidPhone && cleanDigits.length > 0 && (
                  <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                    {cleanDigits.length < 11 
                      ? (isAr ? `متبقي ${11 - cleanDigits.length} أرقام لتفعيل زر الدفع (يجب أن يتكون من 11 رقماً)` : `${11 - cleanDigits.length} digits left`)
                      : (isAr ? 'رقم غير صحيح: يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015' : 'Must start with 010, 011, 012 or 015')}
                  </p>
                )}
              </div>

              {/* Instant Activation Button - STRICTLY disabled until 11 valid digits */}
              <button
                type="submit"
                disabled={loading || !isValidPhone}
                className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs sm:text-sm font-black transition active:scale-[0.99] shadow-md ${
                  isValidPhone && !loading
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-black hover:brightness-105 cursor-pointer animate-pulse'
                    : 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed opacity-60 shadow-none'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{isAr ? 'جاري تفعيل باقة Pro فوراً...' : 'Activating Pro Plan...'}</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 fill-current" />
                    <span>
                      {isValidPhone 
                        ? (isAr ? 'تأكيد التحويل وتفعيل باقة Pro فوراً ⚡' : 'Confirm & Activate Pro Instantly ⚡')
                        : cleanDigits.length === 0
                          ? (isAr ? 'أدخل رقم الهاتف لتفعيل زر الدفع (11 رقماً)' : 'Enter phone to enable button')
                          : cleanDigits.length < 11
                            ? (isAr ? `اكتب باقي الرقم (متبقي ${11 - cleanDigits.length} أرقام)` : `Complete Phone (${11 - cleanDigits.length} remaining)`)
                            : (isAr ? 'رقم غير صحيح (يبدأ بـ 010 أو 011 أو 012 أو 015)' : 'Invalid prefix')}
                    </span>
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
