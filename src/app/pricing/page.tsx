'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Check, 
  Zap, 
  Smartphone, 
  CreditCard, 
  Copy, 
  CheckCheck, 
  ShieldCheck, 
  Building2, 
  FileSpreadsheet, 
  LineChart, 
  Clock, 
  MessageSquare,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

const OFFICIAL_WALLET_NUMBER = '01024359109';
const PRO_PRICE_EGP = 250;

const WALLET_METHODS = [
  { id: 'فودافون كاش', labelAr: 'فودافون كاش 🔴', labelEn: 'Vodafone Cash 🔴' },
  { id: 'إنستاباي (InstaPay)', labelAr: 'إنستاباي InstaPay ⚡', labelEn: 'InstaPay ⚡' },
  { id: 'أورنج كاش', labelAr: 'أورنج كاش 🟠', labelEn: 'Orange Money 🟠' },
  { id: 'اتصالات كاش', labelAr: 'اتصالات كاش 🟢', labelEn: 'Etisalat Cash 🟢' },
  { id: 'وي باي (WE Pay)', labelAr: 'وي باي WE Pay 🟣', labelEn: 'WE Pay 🟣' },
  { id: 'محفظة بنكية ذكية', labelAr: 'محفظة بنكية ذكية 🏦', labelEn: 'Bank Wallet 🏦' },
];

export default function PricingPage() {
  const { locale, isRtl } = useLanguage();
  const { user, session } = useAuth();
  const isAr = locale === 'ar';

  const [activeTab, setActiveTab] = useState<'wallet' | 'paypal'>('wallet');
  const [copied, setCopied] = useState(false);
  const [senderPhone, setSenderPhone] = useState('');
  const [transferMethod, setTransferMethod] = useState('فودافون كاش');
  const [senderName, setSenderName] = useState(user?.name || '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(OFFICIAL_WALLET_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWalletSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const digits = senderPhone.replace(/\D/g, '');
    if (digits.length < 8) {
      setErrorMessage(
        isAr 
          ? 'يرجى إدخال رقم المحفظة أو الحساب المحول منه بشكل صحيح' 
          : 'Please enter a valid sender wallet or account number'
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
          transferMethod,
          senderName: senderName.trim(),
          notes: notes.trim(),
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
      <section className="py-12 sm:py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isAr ? 'باقة البروكر والمسوقين العقاريين (Pro)' : 'Commercial Broker Pro Plan'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            {isAr ? 'أدوات الذكاء الاصطناعي الاحترافية للبروكر' : 'Pro AI Toolkit for Real Estate Brokers'}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
            {isAr
              ? '300 استفسار شهرياً، سكور الصفقات الاستثماري، حاسبة الأقساط الدقيقة، وتصدير دراسات الأسعار لعملائك بأعلى سرعة وأولوية معالجة.'
              : '300 inquiries/month, investment deal score metrics, installment calculators, and market comparative data for your clients.'}
          </p>
        </div>
      </section>

      {/* Main Content / Checkout Box */}
      <main className="max-w-4xl mx-auto px-4 pb-16">
        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {isAr ? '300 استفسار شهرياً' : '300 Queries / Month'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              {isAr ? 'طاقة استيعابية تكفي استعلاماتك ومقارناتك اليومية مع العملاء بأولوية معالجة فورية.' : 'High capacity for daily client presentations and rapid project comparisons.'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <LineChart className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {isAr ? 'سكور الصفقات والسعر العادل' : 'Deal Scoring & AVM'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              {isAr ? 'تقييم كمي لسعر المتر، سعر البيع السريع، ومستوى ثقة التسعير لمفاوضة البائع والمشتري.' : 'Quantitative price benchmarking, liquidation valuation, and confidence scores.'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Building2 className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {isAr ? 'قاعدة بيانات 2,710 وحدة معتمدة' : '2,710 Verified Units'}
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
                  ? 'تم شحن رصيدك بـ 300 استفسار ذكي وتأكيد طلبك على قناة الدعم الفني. يمكنك الآن البدء في استخدام كافة ميزات البروكر.'
                  : 'Your account has been upgraded with 300 inquiries. Enjoy professional real estate brokerage!'}
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm py-3 px-6 shadow-md transition active:scale-95"
              >
                <span>{isAr ? 'ابدأ الاستخدام في الشات الآن 🚀' : 'Start Using Pro Chat Now 🚀'}</span>
              </Link>
            </div>
          ) : (
            <>
              {/* Payment Tabs */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('wallet')}
                  className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black transition ${
                    activeTab === 'wallet'
                      ? 'bg-amber-500 text-black shadow-md'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                  <span>{isAr ? 'تحويل محفظة كاش / إنستاباي (250 ج.م)' : 'Mobile Cash / InstaPay (250 EGP)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('paypal')}
                  className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black transition ${
                    activeTab === 'paypal'
                      ? 'bg-amber-500 text-black shadow-md'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>{isAr ? 'PayPal وكروت دولية ($15)' : 'PayPal & Cards ($15)'}</span>
                </button>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {activeTab === 'wallet' && (
                <div className="space-y-6">
                  {/* Destination Box */}
                  <div className="rounded-2xl border-2 border-amber-500/30 bg-amber-500/5 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                          {isAr ? 'حول مبلغ (250 ج.م) للرقم المعتمد:' : 'Transfer 250 EGP to Official Wallet:'}
                        </span>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-3xl font-black font-mono tracking-widest text-slate-900 dark:text-white">
                            {OFFICIAL_WALLET_NUMBER}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyNumber}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 text-xs font-black transition active:scale-95 shadow-xs"
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
                        <span className="text-xs text-slate-500 dark:text-zinc-400 block">{isAr ? 'سعر باقة البروكر' : 'Price'}:</span>
                        <strong className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                          {PRO_PRICE_EGP} ج.م <span className="text-xs font-normal text-slate-400">/ {isAr ? 'شهرياً' : 'mo'}</span>
                        </strong>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-amber-500/20 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-bold me-1">
                        {isAr ? 'يقبل التحويل من:' : 'Accepted From:'}
                      </span>
                      {WALLET_METHODS.map((m) => (
                        <span
                          key={m.id}
                          className="rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-zinc-300"
                        >
                          {isAr ? m.labelAr : m.labelEn}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Activation Form */}
                  <form onSubmit={handleWalletSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                          {isAr ? 'رقم المحفظة أو الحساب المحول منه *' : 'Sender Phone / Wallet Number *'}
                        </label>
                        <input
                          type="tel"
                          required
                          value={senderPhone}
                          onChange={(e) => setSenderPhone(e.target.value)}
                          placeholder="01XXXXXXXXX"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                          {isAr ? 'طريقة التحويل المستخدمة' : 'Transfer Method'}
                        </label>
                        <select
                          value={transferMethod}
                          onChange={(e) => setTransferMethod(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                        >
                          {WALLET_METHODS.map((m) => (
                            <option key={m.id} value={m.id}>
                              {isAr ? m.labelAr : m.labelEn}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                          {isAr ? 'اسم صاحب المحفظة / البروكر (اختياري)' : 'Sender Name (Optional)'}
                        </label>
                        <input
                          type="text"
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                          placeholder={isAr ? 'مثال: أحمد عبد الله' : 'e.g. John Doe'}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                          {isAr ? 'كود العملية أو ملاحظة (اختياري)' : 'Transaction Code / Notes (Optional)'}
                        </label>
                        <input
                          type="text"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder={isAr ? 'مثال: تم التحويل بنجاح' : 'e.g. Sent from InstaPay'}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !senderPhone}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 py-3.5 text-sm font-black text-black shadow-md transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>{isAr ? 'جاري تفعيل باقة البروكر فوراً...' : 'Activating Broker Plan...'}</span>
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 fill-black" />
                          <span>{isAr ? 'تأكيد التحويل وتفعيل باقة Pro فوراً ⚡' : 'Confirm & Activate Pro Instantly ⚡'}</span>
                        </>
                      )}
                    </button>

                    <p className="text-xs text-center text-slate-400 dark:text-zinc-500">
                      {isAr
                        ? '⚡ تفعيل فوري: يتم تحديث رصيدك بـ 300 استفسار لحظياً وإشعار الدعم الفني لمتابعة حسابك.'
                        : '⚡ Instant Activation: Your quota is updated with 300 queries immediately.'}
                    </p>
                  </form>
                </div>
              )}

              {activeTab === 'paypal' && (
                <div className="py-6 text-center space-y-4">
                  <p className="text-sm text-slate-600 dark:text-zinc-400">
                    {isAr
                      ? 'للدفع بواسطة بطاقات الائتمان الدولية (Visa / Mastercard) عبر PayPal ($15 USD)، يمكنك إتمام العملية مباشرة من داخل الشات عبر زر الترقية.'
                      : 'For international cards via PayPal ($15 USD), proceed via the chat upgrade dialog.'}
                  </p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs py-2.5 px-5 transition"
                  >
                    <span>{isAr ? 'الترقية عبر PayPal في الشات' : 'Upgrade via PayPal in Chat'}</span>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
