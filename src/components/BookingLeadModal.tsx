'use client';

import React, { useState } from 'react';
import { Property } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  X, 
  Calendar, 
  User, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  ShieldCheck 
} from 'lucide-react';

interface BookingLeadModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BookingLeadModal({
  property,
  isOpen,
  onClose,
  onSuccess
}: BookingLeadModalProps) {
  const { locale, t } = useLanguage();
  const isAr = locale === 'ar';

  const [userName, setUserName] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredTime, setPreferredTime] = useState(isAr ? 'خلال عطلة نهاية الأسبوع' : 'Weekend');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userName.trim()) {
      setError(isAr ? 'يرجى إدخال اسمك للتواصل' : 'Please enter your name');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      setError(isAr ? 'يرجى إدخال رقم هاتف صحيح للتواصل وتأكيد الحجز' : 'Please enter a valid phone number');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: userName.trim(),
          phone: phone.trim(),
          propertyId: property?.id,
          preferredLocation: property?.compound?.area_name || property?.compound?.city || 'General',
          preferredUnitType: property?.unit_type || 'Apartment',
          budgetMax: property?.total_price,
          notes: `Timing: ${preferredTime}. Notes: ${notes || 'None'}`,
          source: 'property_card_viewing'
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || (isAr ? 'تعذر تسجيل الطلب' : 'Failed to submit request'));
      }

      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || (isAr ? 'حدث خطأ في إرسال طلب المعاينة' : 'Error submitting viewing request'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {t.bookingModalTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {t.bookingModalSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
            </div>
            <h4 className="text-xl font-black text-slate-900 dark:text-white">
              {t.bookingSuccessTitle}
            </h4>
            <p className="mt-2 text-sm text-slate-600 dark:text-zinc-300">
              {t.bookingSuccessText} <span className="font-mono font-bold text-amber-600 dark:text-amber-400">({phone})</span>
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>{t.freeServiceNotice}</span>
            </div>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-2xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-amber-500 dark:text-black dark:hover:bg-amber-400"
            >
              {t.backToChat}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            {/* Selected Property Snippet */}
            {property && (
              <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 dark:border-amber-500/10">
                <img
                  src={property.images?.[0] || property.compound?.cover_image}
                  alt={property.title}
                  className="h-14 w-14 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                    {property.title}
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    {property.compound?.name} • {property.total_price.toLocaleString(isAr ? 'ar-EG' : 'en-US')} {property.currency || (isAr ? 'ج.م' : 'EGP')}
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                {t.fullName}
              </label>
              <div className="relative">
                <User className={`absolute top-3 h-4 w-4 text-slate-400 ${isAr ? 'right-3.5' : 'left-3.5'}`} />
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder={isAr ? 'مثال: أحمد عبد الله' : 'e.g. John Doe'}
                  className={`w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-white ${isAr ? 'pr-10 pl-3 text-right' : 'pl-10 pr-3 text-left'}`}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                {t.phoneLabel}
              </label>
              <div className="relative">
                <Phone className={`absolute top-3 h-4 w-4 text-slate-400 ${isAr ? 'right-3.5' : 'left-3.5'}`} />
                <input
                  type="tel"
                  required
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.phonePlaceholder}
                  className={`w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-white ${isAr ? 'pr-10 pl-3 text-right' : 'pl-10 pr-3 text-left'}`}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                {t.preferredTime}
              </label>
              <select
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-900 focus:border-amber-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                <option value={t.timeWeekend}>{t.timeWeekend}</option>
                <option value={t.timeMorning}>{t.timeMorning}</option>
                <option value={t.timeEvening}>{t.timeEvening}</option>
                <option value={t.timeAsap}>{t.timeAsap}</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                {t.notesLabel}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.notesPlaceholder}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-amber-500 focus:outline-hidden dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 py-3 text-sm font-black text-black shadow-md transition hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t.submitting}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>{t.confirmBooking}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
