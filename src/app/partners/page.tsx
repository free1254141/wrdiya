'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import SubpageSidebarShell from '@/components/SubpageSidebarShell';
import B2BTrialPricingSection from '@/components/B2BTrialPricingSection';
import {
  Building2,
  Code2,
  Copy,
  Check,
  TrendingUp,
  UserCheck,
  Bot,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export default function PartnersPage() {
  const [brandName, setBrandName] = useState('شركة الأفق للتطوير العقاري');
  const [accentColor, setAccentColor] = useState('#f59e0b');
  const [whatsapp, setWhatsapp] = useState('201000000000');
  const [city, setCity] = useState('التجمع الخامس');
  const [copiedCode, setCopiedCode] = useState(false);

  const colorPresets = [
    { label: 'ذهبي', value: '#f59e0b' },
    { label: 'أخضر', value: '#10b981' },
    { label: 'أزرق', value: '#3b82f6' },
    { label: 'بنفسجي', value: '#8b5cf6' },
    { label: 'أحمر', value: '#ef4444' },
  ];

  const widgetRelativeUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (brandName.trim()) params.set('brand', brandName.trim());
    if (accentColor) params.set('color', accentColor);
    if (whatsapp.trim()) params.set('whatsapp', whatsapp.trim());
    if (city.trim()) params.set('city', city.trim());
    return `/widget?${params.toString()}`;
  }, [brandName, accentColor, whatsapp, city]);

  const widgetFullUrl = `https://www.ewanbot.com${widgetRelativeUrl}`;

  const embedCode = `<!-- Ewanbot White-Label Real Estate AI Widget -->
<iframe
  src="${widgetFullUrl}"
  title="${brandName} - المساعد العقاري الذكي"
  width="400"
  height="600"
  style="border:1px solid #27272a;border-radius:20px;box-shadow:0 20px 50px rgba(0,0,0,0.4);max-width:100%;"
  loading="lazy"
></iframe>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(embedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <SubpageSidebarShell>
    <div
      className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-black"
      dir="rtl"
    >
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md px-4 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              💼
            </div>
            <div>
              <span className="font-black text-base text-white">
                إيوان بوت <span className="text-emerald-400">للشركات B2B</span>
              </span>
              <span className="block text-[10px] text-zinc-400">
                منصة المطورين والوسطاء والبنوك
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/market-index"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 text-zinc-200 text-xs font-bold transition"
            >
              <span>📊 مؤشر الأسعار</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs sm:text-sm transition"
            >
              <span>الموقع الرئيسي</span>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3">
            <Building2 className="h-3.5 w-3.5" />
            <span>حلول البيانات والذكاء الاصطناعي لشركات العقارات</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white mb-3">
            حوّل بيانات إيوان بوت وذكاءه الاصطناعي إلى مبيعات لشركتك
          </h1>
          <p className="text-sm text-zinc-400 max-w-2xl mx-auto">
            اربط موقعك بمساعد عقاري ذكي يحمل اسم وشعار شركتك (White-Label)، أو احصل على تقارير الطلب الحقيقي وليدز مؤهلة بموافقة العميل.
          </p>
        </div>

        {/* 3 B2B Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/75 p-6">
            <div className="h-10 w-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-4">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h2 className="font-black text-base text-white mb-2">
              1. تقارير ذكاء الطلب (Demand Intelligence)
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              بيانات مجمّعة ومجهّلة من مئات المحادثات اليومية توضح الميزانيات الفعلية للعملاء، المناطق الأعلى طلباً، وفجوات العرض قبل تسعير أي مرحلة جديدة.
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/75 p-6">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-4">
              <UserCheck className="h-5 w-5" />
            </div>
            <h2 className="font-black text-base text-white mb-2">
              2. ليدز مؤهلة بموافقة العميل (Intent Score)
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              عملاء أتمّوا مقارنة الأسعار والأقساط وحصلوا على سكور جدية مرتفع (≥ 70/100) وضغطوا بموافقتهم الصريحة على طلب تواصل المطور.
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-6">
            <div className="h-10 w-10 rounded-xl bg-emerald-500 text-black flex items-center justify-center mb-4">
              <Bot className="h-5 w-5" />
            </div>
            <h2 className="font-black text-base text-white mb-2">
              3. ويدجت White-Label على موقعك
            </h2>
            <p className="text-xs text-zinc-200 leading-relaxed">
              نسخة شات بوت كاملة باسم شركتك ولونها، ترد على عملائك 24/7 وتحسب الأقساط وتحولهم لرقم الواتساب الخاص بفريق مبيعاتك.
            </p>
          </div>
        </div>

        {/* Live White-Label Widget Builder */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2">
                <Code2 className="h-5 w-5 text-emerald-400" />
                <span>منشئ ويدجت الشات بعلامة شركتك (جرّبه الآن مباشرة)</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                عدّل البيانات على اليمين، واختبر الويدجت الحي على اليسار، ثم انسخ كود التركيب لموقعك.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-bold">
              <ShieldCheck className="h-4 w-4" />
              تركيب في أقل من دقيقة
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Form & Code */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  اسم الشركة أو البروكر
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    المدينة / التركيز العقاري (اختياري)
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="مثال: التجمع الخامس"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    رقم واتساب المبيعات (بالكود الدولي)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="201000000000"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  لون العلامة التجارية
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {colorPresets.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setAccentColor(c.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                        accentColor === c.value
                          ? 'border-white bg-zinc-800 text-white'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                      }`}
                    >
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: c.value }}
                      />
                      <span>{c.label}</span>
                    </button>
                  ))}
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-8 w-10 rounded-lg bg-zinc-950 border border-zinc-800 cursor-pointer"
                  />
                </div>
              </div>

              {/* Embed Code Box */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-amber-400">
                    كود التضمين لموقعك (HTML / WordPress / Next.js):
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black transition"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>تم النسخ!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>نسخ الكود</span>
                      </>
                    )}
                  </button>
                </div>
                <pre
                  dir="ltr"
                  className="rounded-2xl border border-zinc-800 bg-black p-3.5 text-[11px] text-emerald-300 overflow-x-auto leading-relaxed"
                >
                  {embedCode}
                </pre>

                <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
                  <span>أو افتح الرابط المباشر للويدجت:</span>
                  <Link
                    href={widgetRelativeUrl}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-amber-400 hover:underline font-bold"
                  >
                    <span>فتح في نافذة مستقلة</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Live Preview Iframe */}
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-zinc-400 mb-2">
                معاينة حية تفاعلية للويدجت:
              </span>
              <div className="w-full max-w-[400px] h-[540px] rounded-3xl border-2 border-zinc-800 overflow-hidden shadow-2xl bg-black">
                <iframe
                  key={widgetRelativeUrl}
                  src={widgetRelativeUrl}
                  title="Live White-Label Widget Preview"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3-Day Free Trial + Live Pricing Estimator */}
        <B2BTrialPricingSection
          defaultCompanyName={brandName}
          defaultWhatsapp={whatsapp}
        />

        {/* Banks & Mortgage Valuation API v1 Card */}
        <div className="mt-10 rounded-3xl border border-amber-500/30 bg-zinc-900/75 p-6 sm:p-8 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                🏦 API التقييم العقاري الرسمي للبنوك وشركات التمويل (<span dir="ltr" className="text-amber-400">v1</span>)
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                نقطة اتصال برمجية سريعة لإرجاع القيمة السوقية العادلة، سعر البيع السريع، وسكور الخدمات من OpenStreetMap.
              </p>
            </div>
            <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-[11px] font-mono font-bold text-amber-300">
              Sandbox Key: ewan_sandbox_demo
            </span>
          </div>

          <pre
            dir="ltr"
            className="rounded-2xl border border-zinc-800 bg-black p-4 text-[11px] text-amber-300 overflow-x-auto leading-relaxed"
          >{`curl -X POST https://ewanbot.com/api/v1/valuate \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ewan_sandbox_demo" \\
  -d '{"location":"التجمع الخامس","area_sqm":150,"asking_price":7200000}'`}</pre>
        </div>
      </main>
    </div>
    </SubpageSidebarShell>
  );
}
