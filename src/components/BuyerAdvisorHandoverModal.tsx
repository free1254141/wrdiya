'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  X, 
  Award, 
  Send, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Loader2, 
  Phone, 
  User, 
  MapPin, 
  Briefcase,
  AlertCircle
} from 'lucide-react';

interface BuyerAdvisorHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBooking?: () => void;
  onOpenPricing?: () => void;
  defaultName?: string;
  defaultPhone?: string;
}

export default function BuyerAdvisorHandoverModal({
  isOpen,
  onClose,
  onOpenPricing,
  defaultName = '',
  defaultPhone = '',
}: BuyerAdvisorHandoverModalProps) {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [preferredLocation, setPreferredLocation] = useState('');
  const [preferredTime, setPreferredTime] = useState(isAr ? 'في أي وقت' : 'Anytime');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      setError(isAr ? 'يرجى إدخال رقم هاتف أو واتساب صحيح للتواصل' : 'Please enter a valid phone number');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: name.trim() || (isAr ? 'مشتري جاد (مرحلة 70 استشارة)' : 'Serious Buyer (70 Inquiries)'),
          phone: phone.trim(),
          preferredLocation: preferredLocation.trim() || undefined,
          notes: `طلب تواصل مستشار عقاري بعد استهلاك 70 استشارة. موعد الاتصال: ${preferredTime}. ملاحظات: ${notes.trim() || 'لا يوجد'}`,
          source: 'buyer_consultant_handover_70',
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || (isAr ? 'تعذر إرسال الطلب، يرجى المحاولة لاحقاً' : 'Failed to submit request'));
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || (isAr ? 'حدث خطأ أثناء إرسال الطلب' : 'An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl border border-amber-500/40 bg-white p-5 shadow-2xl dark:border-amber-400/30 dark:bg-zinc-950 text-slate-900 dark:text-white sm:p-7"
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

        {submitted ? (
          /* Success Screen: Confirmation without any admin phone displayed */
          <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/40">
              <CheckCircle2 className="h-10 w-10 animate-bounce" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {isAr ? 'تم استلام طلبك بنجاح! 🚀' : 'Request Received Successfully! 🚀'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 max-w-md mx-auto leading-relaxed">
              {isAr
                ? 'سيتواصل معك مستشارك العقاري المعتمد هاتفياً أو عبر واتساب خلال دقائق لمناقشة أفضل الصفقات وتنسيق المعاينات الميدانية بدون أي إزعاج.'
                : 'Our certified real estate consultant will reach out via phone or WhatsApp shortly to schedule free viewings and discuss developer offers.'}
            </p>
            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-zinc-900 px-4 py-2 text-xs font-bold text-slate-600 dark:text-zinc-300">
              <Clock className="h-4 w-4 text-amber-500" />
              <span>{isAr ? 'يتجدد رصيدك في الشات تلقائياً كل ليلة عند منتصف الليل' : 'Your free chat quota resets tonight at 12:00 AM'}</span>
            </div>
            <div>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs py-2.5 px-6 transition active:scale-95 shadow-md"
              >
                {isAr ? 'حسناً، العودة للشات' : 'Done, Back to Chat'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Trophy / Achievement Header */}
            <div className="text-center space-y-2 pt-1 mb-4">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/40 shadow-inner">
                <Award className="h-8 w-8" />
              </div>
              <span className="inline-block rounded-full bg-amber-500/20 px-3 py-0.5 text-xs font-black text-amber-600 dark:text-amber-400">
                {isAr ? '🏆 استهلكت 70 استشارة عقارية اليوم!' : '🏆 70 Inquiries Completed Today!'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black">
                {isAr ? 'وصلت لمرحلة اتخاذ القرار للشراء' : 'Ready for the Final Step'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                {isAr
                  ? 'جمعت كل الأرقام والمقارنات الهامة! في هذه المرحلة، اترك بياناتك وسيقوم مستشارك العقاري بالتواصل معك مباشرة لتنسيق المعاينات والتفاوض نيابة عنك.'
                  : 'You have gathered comprehensive comparisons. Leave your details and our consultant will contact you directly to arrange viewings and negotiate on your behalf.'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Contact Request Form (Customer leaves details; admin contacts them) */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Phone / WhatsApp (Required) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    {isAr ? 'رقم الهاتف أو الواتساب للتواصل *' : 'Phone / WhatsApp Number *'}
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-white ltr:pl-8 rtl:pr-8"
                    />
                    <Phone className="absolute top-2.5 ltr:left-2.5 rtl:right-2.5 h-3.5 w-3.5 text-slate-400" />
                  </div>
                </div>

                {/* Name (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    {isAr ? 'الاسم (اختياري)' : 'Name (Optional)'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={isAr ? 'مثال: أحمد محمود' : 'e.g. John Doe'}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-white ltr:pl-8 rtl:pr-8"
                    />
                    <User className="absolute top-2.5 ltr:left-2.5 rtl:right-2.5 h-3.5 w-3.5 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Preferred Area / Project */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    {isAr ? 'المنطقة أو المشروع الأكثر اهتماماً' : 'Preferred Area / Project'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={preferredLocation}
                      onChange={(e) => setPreferredLocation(e.target.value)}
                      placeholder={isAr ? 'مثال: التجمع الخامس، زايد، العاصمة' : 'e.g. New Cairo, Zayed'}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-white ltr:pl-8 rtl:pr-8"
                    />
                    <MapPin className="absolute top-2.5 ltr:left-2.5 rtl:right-2.5 h-3.5 w-3.5 text-slate-400" />
                  </div>
                </div>

                {/* Preferred Contact Time */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    {isAr ? 'أفضل وقت للتواصل معك' : 'Preferred Contact Time'}
                  </label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                  >
                    <option value={isAr ? 'في أي وقت' : 'Anytime'}>{isAr ? 'في أي وقت' : 'Anytime'}</option>
                    <option value={isAr ? 'صباحاً (10 ص - 2 م)' : 'Morning (10 AM - 2 PM)'}>{isAr ? 'صباحاً (10 ص - 2 م)' : 'Morning (10 AM - 2 PM)'}</option>
                    <option value={isAr ? 'مساءً (2 م - 8 م)' : 'Afternoon (2 PM - 8 PM)'}>{isAr ? 'مساءً (2 م - 8 م)' : 'Afternoon (2 PM - 8 PM)'}</option>
                    <option value={isAr ? 'تواصل عبر واتساب فقط' : 'WhatsApp Only'}>{isAr ? 'تواصل عبر واتساب فقط' : 'WhatsApp Only'}</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  {isAr ? 'ملاحظات إضافية أو استفسار محدد (اختياري)' : 'Specific Inquiry / Notes (Optional)'}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isAr ? 'مثال: أريد معاينة مشروع معين الأسبوع القادم' : 'e.g. Schedule a viewing next week'}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading || !phone}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 py-3 text-xs sm:text-sm font-black text-black shadow-md transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{isAr ? 'جاري إرسال الطلب...' : 'Submitting request...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>{isAr ? 'إرسال الطلب وسيتواصل معك المستشار فوراً 📩' : 'Submit & Consultant Will Contact You 📩'}</span>
                  </>
                )}
              </button>
            </form>

            {/* Trust and privacy badges */}
            <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                <span>{isAr ? 'تتجدد حصتك اليومية في الشات مجاناً كل ليلة 12:00 ص' : 'Free quota resets tonight at 12:00 AM'}</span>
              </div>

              {onOpenPricing && (
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
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
