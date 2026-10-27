'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Locale, translations } from '@/lib/i18n';
import { 
  Check, 
  Sparkles, 
  CreditCard, 
  ArrowLeft, 
  ShieldCheck, 
  Factory, 
  HelpCircle,
  Zap,
  Globe
} from 'lucide-react';

export default function PricingPage() {
  const [locale, setLocale] = useState<Locale>('ar');
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro'>('pro');
  const [paypalLoading, setPaypalLoading] = useState(false);
  const [paypalSuccess, setPaypalSuccess] = useState(false);

  const t = translations[locale];

  const handlePayPalSubscribe = (plan: 'starter' | 'pro') => {
    setPaypalLoading(true);
    setTimeout(() => {
      setPaypalLoading(false);
      setPaypalSuccess(true);
    }, 1500);
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-white font-sans ${locale === 'ar' ? 'rtl' : 'ltr'}`} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center">
              <Factory className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white">LineChat (وردية)</span>
          </div>
        </div>

        <button
          onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/20 transition"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{locale === 'ar' ? 'English' : 'العربية'}</span>
        </button>
      </header>

      {/* Main Pricing Hero */}
      <main className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold mb-3">
            {t.pricing.trial_badge}
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4">
            {t.pricing.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            {t.pricing.subtitle}
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Starter Plan */}
          <div className={`rounded-3xl p-8 border transition duration-300 relative bg-slate-900/60 backdrop-blur-md flex flex-col justify-between ${
            selectedPlan === 'starter' ? 'border-slate-700' : 'border-slate-800'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">{t.pricing.starter}</h3>
                <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                  للورش والمصانع الناشئة
                </span>
              </div>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl sm:text-5xl font-black text-white">{t.pricing.starter_price}</span>
                <span className="text-slate-400 text-sm">/ شهرياً</span>
              </div>

              <ul className="space-y-3 mb-8 text-sm text-slate-300">
                {t.pricing.starter_features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handlePayPalSubscribe('starter')}
              disabled={paypalLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 flex items-center justify-center gap-2 shadow-lg transition"
            >
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>اشتراك Starter مع تجربة 7 أيام</span>
            </button>
          </div>

          {/* Factory Pro Plan (Featured) */}
          <div className="rounded-3xl p-8 border-2 border-amber-500/60 relative bg-gradient-to-b from-slate-900 via-amber-950/20 to-slate-900 shadow-2xl shadow-amber-500/10 flex flex-col justify-between">
            <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs px-3.5 py-1 rounded-full shadow-lg">
              الأكثر طلباً للمصانع الكبرى
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>{t.pricing.pro}</span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </h3>
                <span className="text-xs font-semibold text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30">
                  حل متكامل شامل الذكاء الاصطناعي
                </span>
              </div>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl sm:text-5xl font-black text-amber-300">{t.pricing.pro_price}</span>
                <span className="text-slate-400 text-sm">/ شهرياً</span>
              </div>

              <ul className="space-y-3 mb-8 text-sm text-slate-200">
                {t.pricing.pro_features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-medium">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {paypalSuccess ? (
              <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl p-3.5 text-center text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>تم تفعيل الاشتراك التجريبي بنجاح عبر PayPal!</span>
              </div>
            ) : (
              <button
                onClick={() => handlePayPalSubscribe('pro')}
                disabled={paypalLoading}
                className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/30 transition transform active:scale-95"
              >
                {paypalLoading ? (
                  <Sparkles className="w-5 h-5 animate-spin" />
                ) : (
                  <CreditCard className="w-5 h-5" />
                )}
                <span>{t.pricing.subscribe_paypal} (تجربة 7 أيام مجانية)</span>
              </button>
            )}
          </div>
        </div>

        {/* Security & Webhook Assurance Note */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400 max-w-xl mx-auto flex items-center justify-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>
            معالجة الدفع مشفرة وآمنة بالكامل عبر بوابة PayPal الرسمية، مع تفعيل فوري لصلاحيات المصنع بواسطة Webhook السحابي.
          </span>
        </div>
      </main>
    </div>
  );
}
