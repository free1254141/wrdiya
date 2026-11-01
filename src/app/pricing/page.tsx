'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Check, 
  Zap, 
  Copy, 
  CheckCheck, 
  ShieldCheck, 
  Building2, 
  LineChart, 
  Phone,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

const OFFICIAL_WALLET_NUMBER = '01024359109';
const PRO_PRICE_EGP = 250;

export default function PricingPage() {
  const { locale, isRtl } = useLanguage();
  const { session } = useAuth();
  const isAr = locale === 'ar';

  const [copied, setCopied] = useState(false);
  const [senderPhone, setSenderPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Strict Egyptian phone validation: exactly 11 digits starting with 010, 011, 012, or 015
  const cleanDigits = senderPhone.replace(/\D/g, '').slice(0, 11);
  const isValidPhone = /^01[0125]\d{8}$/.test(cleanDigits);

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(OFFICIAL_WALLET_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWalletSubmit = async (e: React.FormEvent) => {
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

      setSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء إتمام العملية. يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-lg">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500 text-black font-black text-sm">
              S
            </span>
            <span>سكنى بوت | Sakanybot</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900 transition"
          >
            {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            <span>{isAr ? 'العودة للشات' : 'Back to Chat'}</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-10 sm:py-14 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isAr ? 'باقة البروكر والمسوقين العقاريين (Pro)' : 'Commercial Broker Pro Plan'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {isAr ? 'أدوات الذكاء الاصطناعي الاحترافية للبروكر' : 'Pro AI Toolkit for Real Estate Brokers'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
            {isAr
              ? '300 استفسار شهرياً، سكور الصفقات الاستثماري، حاسبة الأقساط الدقيقة، وتصدير دراسات الأسعار لعملائك بأعلى سرعة وأولوية معالجة.'
              : '300 inquiries/month, investment deal score metrics, installment calculators, and market comparative data for your clients.'}
          </p>
        </div>
      </section>

      {/* Main Content / Checkout Box */}
      <main className="max-w-3xl mx-auto px-4 pb-16">
        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-8">
          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-1.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Zap className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {isAr ? '300 استفسار شهرياً' : '300 Queries / Month'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              {isAr ? 'طاقة استيعابية تكفي استعلاماتك ومقارناتك اليومية مع عملائك بأولوية معالجة فورية.' : 'High capacity for daily client presentations and rapid project comparisons.'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-1.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <LineChart className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {isAr ? 'سكور الصفقات والسعر العادل' : 'Deal Scoring & AVM'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              {isAr ? 'تقييم كمي لسعر المتر، سعر البيع السريع، ومستوى ثقة التسعير لمفاوضة البائع والمشتري.' : 'Quantitative price benchmarking, liquidation valuation, and confidence scores.'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-1.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Building2 className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {isAr ? '2,710 وحدة معتمدة' : '2,710 Verified Units'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              {isAr ? 'تغطية رسمية لكافة كمبوندات التجمع، زايد، العاصمة، أكتوبر، والساحل الشمالي.' : 'Full coverage across New Cairo, Zayed, New Capital, October, and North Coast.'}
            </p>
          </div>
        </div>

        {/* Pricing Card & Checkout Box */}
        <div className="rounded-3xl border-2 border-amber-500/40 bg-white dark:bg-zinc-950 p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Success Screen */}
          {success ? (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/10 border-2 border-emerald-500 text-emerald-500 animate-bounce">
                <Check className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                {isAr ? '🎉 مبروك! تم تفعيل باقة Pro فوراً لحسابك' : '🎉 Pro Plan Activated Instantly!'}
              </h2>
              <p className="text-sm text-slate-600 dark:text-zinc-300 max-w-md mx-auto">
                {isAr
                  ? 'تم ربط رقم هاتفك بحسابك وشحن رصيدك بـ 300 استفسار ذكي بنجاح. استمتع بأقوى أدوات البروكر العقاري!'
                  : 'Your phone has been linked and 300 queries added. Enjoy professional brokerage tools!'}
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm py-3 px-6 shadow-md transition active:scale-95"
              >
                <span>{isAr ? 'ابدأ الاستخدام في الشات الآن 🚀' : 'Start Using Pro Chat Now 🚀'}</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {errorMessage && (
                <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Destination Box: Vodafone Cash ONLY */}
              <div className="rounded-2xl border-2 border-amber-500/30 bg-amber-500/5 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                      {isAr ? 'حول 250 ج.م على فودافون كاش لرقم:' : 'Transfer 250 EGP via Vodafone Cash:'}
                    </span>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-3xl font-black font-mono tracking-widest text-slate-900 dark:text-white">
                        {OFFICIAL_WALLET_NUMBER}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyNumber}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-2 text-xs font-black transition active:scale-95 shadow-xs cursor-pointer"
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
                  </div>

                  <div className="text-start sm:text-end">
                    <span className="text-xs text-slate-500 dark:text-zinc-400 block">{isAr ? 'قيمة باقة البروكر' : 'Price'}:</span>
                    <strong className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {PRO_PRICE_EGP} ج.م <span className="text-xs font-normal text-slate-400">/ {isAr ? 'شهرياً' : 'mo'}</span>
                    </strong>
                  </div>
                </div>

                <p className="mt-3 pt-3 border-t border-amber-500/20 text-[11px] text-slate-500 dark:text-zinc-400 text-center">
                  {isAr 
                    ? 'يقبل التحويل من أي محفظة كاش (فودافون كاش، أورنج كاش، اتصالات كاش، وي باي، أو المحافظ البنكية الذكية).' 
                    : 'Accepted from any cash mobile wallet (Vodafone Cash, Orange, Etisalat, WE Pay, Bank Smart Wallets).'}
                </p>
              </div>

              {/* Simple Activation Form */}
              <form onSubmit={handleWalletSubmit} className="space-y-4">
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
                      className={`w-full rounded-xl border bg-slate-50 dark:bg-zinc-900 px-3.5 py-3 text-base font-mono text-slate-900 dark:text-white transition focus:bg-white dark:focus:bg-zinc-950 focus:outline-hidden ltr:pl-10 rtl:pr-10 ${
                        isValidPhone 
                          ? 'border-emerald-500 dark:border-emerald-500 focus:border-emerald-500' 
                          : cleanDigits.length > 0 
                            ? 'border-amber-500/60 focus:border-amber-500' 
                            : 'border-slate-200 dark:border-zinc-800 focus:border-amber-500'
                      }`}
                    />
                    <Phone className={`absolute top-3.5 ltr:left-3.5 rtl:right-3.5 h-4 w-4 transition ${
                      isValidPhone ? 'text-emerald-500' : 'text-slate-400'
                    }`} />
                  </div>

                  {!isValidPhone && cleanDigits.length > 0 && (
                    <p className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400">
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
                  className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black transition active:scale-[0.99] shadow-md ${
                    isValidPhone && !loading
                      ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-black hover:brightness-105 cursor-pointer animate-pulse'
                      : 'bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed opacity-60 shadow-none'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{isAr ? 'جاري تفعيل باقة البروكر فوراً...' : 'Activating Broker Plan...'}</span>
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

                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-zinc-500 text-center">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>
                    {isAr
                      ? '⚡ تفعيل فوري: يتم ربط رقم الهاتف بحسابك وشحن 300 استفسار لحظياً وإشعار فريق الدعم على تليجرام.'
                      : '⚡ Instant: Phone is linked to account and 300 queries activated immediately.'}
                  </span>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
