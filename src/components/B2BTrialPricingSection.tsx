'use client';

import React, { useMemo, useState } from 'react';
import {
  Rocket,
  CheckCircle2,
  KeyRound,
  Copy,
  Check,
  Users,
  Sparkles,
} from 'lucide-react';
import { B2BServiceType, calculateB2BPricing } from '@/lib/b2b-pricing';
import { trackVisitorEvent } from '@/components/PageAnalyticsTracker';

export default function B2BTrialPricingSection({
  defaultCompanyName = '',
  defaultWhatsapp = '',
}: {
  defaultCompanyName?: string;
  defaultWhatsapp?: string;
}) {
  const [companyName, setCompanyName] = useState(defaultCompanyName);
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState(defaultWhatsapp);
  const [email, setEmail] = useState('');
  const [monthlyUsers, setMonthlyUsers] = useState<number>(2500);
  const [serviceType, setServiceType] = useState<B2BServiceType>('both');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trialResult, setTrialResult] = useState<{
    company_name: string;
    trial_api_key: string;
    expires_at: string;
    trial_days: number;
    tier_name: string;
    estimated_price_egp: number;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const quote = useMemo(
    () => calculateB2BPricing(monthlyUsers, serviceType),
    [monthlyUsers, serviceType]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!companyName.trim() || !phone.trim()) {
      setError('يرجى إدخال اسم الشركة ورقم الهاتف/الواتساب.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/partners/request-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName.trim(),
          contact_name: contactName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          monthly_users: monthlyUsers,
          service_type: serviceType,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'تعذر تفعيل التجربة حالياً');
        return;
      }
      setTrialResult(data.trial);
      trackVisitorEvent('/partners', 'trial_activated', {
        company_name: companyName.trim(),
        monthly_users: monthlyUsers,
      });
    } catch {
      setError('حدث خطأ في الاتصال بالسيرفر');
    } finally {
      setSubmitting(false);
    }
  };

  const copyTrialKey = () => {
    if (!trialResult?.trial_api_key) return;
    navigator.clipboard.writeText(trialResult.trial_api_key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const fmt = (n: number) => n.toLocaleString('ar-EG');

  return (
    <section
      id="request-trial"
      className="mt-10 rounded-3xl border border-emerald-500/35 bg-gradient-to-br from-emerald-500/10 via-zinc-900/90 to-amber-500/10 p-6 sm:p-8 shadow-2xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-black text-emerald-300 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>تجربة مجانية كاملة 3 أيام • تفعيل فوري</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            احسب تسعير شركتك وفعّل تجربة 3 أيام الآن
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            اختر عدد مستخدمي الشات التقريبي شهرياً لمعرفة الباقة والتسعير، واحصل فوراً على مفتاح API تجريبي لمدة 3 أيام.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Live Pricing Calculator */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-amber-400" />
                <span>عدد مستخدمي الشات التقريبي شهرياً</span>
              </label>
              <span className="font-mono text-base font-black text-amber-400">
                {fmt(monthlyUsers)} مستخدم / شهر
              </span>
            </div>
            <input
              type="range"
              min={500}
              max={30000}
              step={500}
              value={monthlyUsers}
              onChange={(e) => setMonthlyUsers(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
              <span>500 مستخدم</span>
              <span>5,000</span>
              <span>15,000</span>
              <span>30,000+</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">
              نوع الباقة المطلوبة
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'both', label: 'البوت + API (كامل)' },
                { id: 'widget', label: 'ويدجت الشات فقط' },
                { id: 'api', label: 'API التقييم فقط' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setServiceType(opt.id as B2BServiceType)}
                  className={`rounded-xl px-2.5 py-2 text-[11px] font-bold border transition cursor-pointer ${
                    serviceType === opt.id
                      ? 'bg-amber-500 text-black border-amber-400'
                      : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quote Box */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <div className="text-[11px] text-emerald-300 font-bold">
                  الباقة المقترحة: {quote.tierName}
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                  {fmt(quote.monthlyPriceEgp)}{' '}
                  <span className="text-sm font-bold text-zinc-300">ج.م / شهر</span>
                </div>
              </div>
              <div className="text-left">
                <span className="inline-block rounded-lg bg-emerald-500 text-black px-2.5 py-1 text-[11px] font-black">
                  أول 3 أيام مجاناً
                </span>
                <div className="text-[10px] text-zinc-400 mt-1">
                  شامل {fmt(quote.includedApiCalls)} طلب API/شهر
                </div>
              </div>
            </div>
            <ul className="space-y-1.5 text-xs text-zinc-200">
              {quote.features.map((f) => (
                <li key={f} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Instant 3-Day Trial Request Form */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
          {trialResult ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-black text-base">
                <CheckCircle2 className="h-5 w-5" />
                <span>تم تفعيل التجربة المجانية لمدة 3 أيام لـ {trialResult.company_name}!</span>
              </div>

              <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-4 space-y-2">
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <KeyRound className="h-4 w-4" />
                  <span>مفتاح الـ API التجريبي الخاص بك (صالح 3 أيام):</span>
                </div>
                <div className="flex items-center justify-between gap-2 bg-black rounded-lg px-3 py-2 border border-zinc-800">
                  <code className="text-xs sm:text-sm font-mono text-emerald-400" dir="ltr">
                    {trialResult.trial_api_key}
                  </code>
                  <button
                    type="button"
                    onClick={copyTrialKey}
                    className="inline-flex items-center gap-1 rounded-md bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 text-[11px] font-bold text-white cursor-pointer"
                  >
                    {copiedKey ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedKey ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                </div>
                <div className="text-[11px] text-zinc-400">
                  ينتهي في: {new Date(trialResult.expires_at).toLocaleString('ar-EG')} • الباقة:{' '}
                  {trialResult.tier_name} ({fmt(trialResult.estimated_price_egp)} ج.م/شهر بعد التجربة)
                </div>
              </div>

              <button
                type="button"
                onClick={() => setTrialResult(null)}
                className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
              >
                إرسال طلب لشركة أخرى
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="text-sm font-black text-white mb-1">
                بيانات تفعيل التجربة الفورية (3 أيام مجاناً)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                    اسم الشركة *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="مثال: شركة الأفق للتطوير العقاري"
                    className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                    اسم المسؤول
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="أحمد محمد"
                    className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                    رقم الواتساب / الهاتف *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01000000000"
                    className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                    البريد الإلكتروني للعمل
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sales@company.com"
                    className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-rose-500/15 border border-rose-500/30 px-3 py-2 text-xs text-rose-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-black font-black text-sm py-3 transition cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <Rocket className="h-4 w-4" />
                <span>
                  {submitting
                    ? 'جاري إنشاء مفتاح التجربة...'
                    : `ابدأ تجربة 3 أيام مجاناً (${fmt(quote.monthlyPriceEgp)} ج.م/شهر بعد التجربة)`}
                </span>
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
