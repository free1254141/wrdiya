'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { X, Sparkles, Phone, User, CheckCircle2, AlertCircle, Loader2, ShieldCheck, MapPin } from 'lucide-react';

interface LeadQuotaUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlocked: (newLimit: number, newRemaining: number) => void;
}

export default function LeadQuotaUnlockModal({
  isOpen,
  onClose,
  onUnlocked,
}: LeadQuotaUnlockModalProps) {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      setError(isAr ? 'يرجى إدخال رقم هاتف أو واتساب صحيح' : 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/usage/unlock-bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          name: name.trim() || undefined,
          preferredLocation: location.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isAr ? 'تعذر فتح الرصيد، يرجى المحاولة لاحقاً' : 'Failed to unlock quota'));
      }

      setSuccess(true);
      setTimeout(() => {
        onUnlocked(data.limit, data.remaining);
        onClose();
      }, 1400);
    } catch (err: any) {
      setError(err?.message || (isAr ? 'حدث خطأ غير متوقع' : 'An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-500/40 bg-white p-6 shadow-2xl dark:border-amber-400/30 dark:bg-zinc-950 text-slate-900 dark:text-white"
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

        {success ? (
          <div className="py-8 text-center space-y-3 animate-in zoom-in-95 duration-200">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/40">
              <CheckCircle2 className="h-10 w-10 animate-bounce" />
            </div>
            <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {isAr ? 'مبروك! تم فتح 50 استشارة مجاناً 🚀' : '50 Free Queries Unlocked! 🚀'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 max-w-xs mx-auto">
              {isAr
                ? 'تم تحديث رصيدك بنجاح، يمكنك الآن مواصلة البحث والمقارنة وحساب خطط الأقساط بحرية كاملة.'
                : 'Your quota has been upgraded with 50 bonus inquiries today. Happy searching!'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Header Badge */}
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/30">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <span className="inline-block rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-700 dark:text-amber-300">
                  {isAr ? 'هدية للمشترين الجادين 🎁' : 'Serious Buyer Bonus 🎁'}
                </span>
                <h3 className="text-base sm:text-lg font-black leading-tight">
                  {isAr ? 'افتح 50 استشارة ذكية إضافية مجاناً' : 'Unlock 50 Free Inquiries'}
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              {isAr
                ? 'واضح إنك بتبحث بجدية عن صفقة عقارية مميزة. سجّل رقم هاتفك أو واتسابك لفتح 50 استشارة إضافية فوراً مع إمكانية التواصل المباشر مع استشاري عقاري معتمد.'
                : 'Looking seriously for real estate deals? Register your WhatsApp number to unlock 50 additional AI queries instantly.'}
            </p>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Inputs */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 mb-1">
                  {isAr ? 'الاسم (اختياري)' : 'Your Name (Optional)'}
                </label>
                <div className="relative">
                  <User className="absolute top-3 ltr:left-3 rtl:right-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isAr ? 'مثال: محمد أحمد' : 'e.g. John Doe'}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 text-xs font-bold text-slate-900 focus:border-amber-500 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 mb-1">
                  {isAr ? 'رقم الهاتف / الواتساب *' : 'Phone / WhatsApp *'}
                </label>
                <div className="relative">
                  <Phone className="absolute top-3 ltr:left-3 rtl:right-3 h-4 w-4 text-amber-500" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={isAr ? '010XXXXXXXX أو +20' : '+20 10X XXX XXXX'}
                    className="w-full rounded-xl border border-amber-500/40 bg-amber-500/5 py-2.5 ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 text-xs font-bold text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-hidden dark:border-amber-400/40 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-zinc-400 mb-1">
                  {isAr ? 'المنطقة الأكثر اهتماماً (اختياري)' : 'Preferred Area (Optional)'}
                </label>
                <div className="relative">
                  <MapPin className="absolute top-3 ltr:left-3 rtl:right-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={isAr ? 'مثال: التجمع الخامس، زايد، العاصمة' : 'e.g. New Cairo, Zayed'}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 text-xs font-bold text-slate-900 focus:border-amber-500 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Privacy note */}
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-zinc-400 pt-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>{isAr ? 'بياناتك في أمان تام ولا تُشارك مع أي طرف غير معتمد.' : 'Your data is strictly confidential.'}</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 py-3 text-xs font-black text-black shadow-lg shadow-amber-500/20 hover:brightness-105 active:scale-[0.98] transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isAr ? 'جاري تفعيل الـ 50 استشارة...' : 'Unlocking quota...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>{isAr ? 'تأكيد وفتح الـ 50 استشارة فوراً ⚡' : 'Unlock 50 Free Inquiries Now ⚡'}</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
