'use client';

import React, { useState } from 'react';
import { X, Check, Zap, Sparkles, Shield, CreditCard, Loader2, LogIn, AlertCircle } from 'lucide-react';
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

export default function PricingModal({
  isOpen,
  onClose,
  currentPlan,
  usedCount,
  limitCount,
  onUpgradeSuccess,
  onOpenAuthModal,
}: PricingModalProps) {
  const { locale, isRtl } = useLanguage();
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isAr = locale === 'ar';

  const handlePayPalCheckout = async () => {
    // 1. Mandatory Login Guard: User MUST be authenticated to purchase Pro
    if (!user) {
      onClose();
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const authHeaders: Record<string, string> = session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {};

      // 1. Create order with PayPal
      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ plan: 'pro' }),
      });

      const order = await res.json();

      if (!order.id) {
        throw new Error(order.error || 'Failed to initiate PayPal order');
      }

      // Check if real PayPal approval redirect link exists
      const approveLink = order.links?.find((l: any) => l.rel === 'approve')?.href;
      if (approveLink) {
        // Redirect user to real PayPal hosted approval page
        window.location.href = approveLink;
        return;
      }

      // 2. Capture order directly (Sandbox / Direct API execution / Local Mock)
      const capRes = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ 
          orderId: order.id,
        }),
      });

      const result = await capRes.json();

      if (result.success || result.status === 'COMPLETED') {
        setSuccess(true);
        setTimeout(() => {
          onUpgradeSuccess('pro', result.usage?.limit || 300);
          onClose();
        }, 1500);
      } else {
        throw new Error(result.error || 'Capture verification unconfirmed');
      }
    } catch (err: any) {
      console.error('PayPal Checkout error:', err);
      setErrorMessage(
        isAr 
          ? (err.message || 'حدث خطأ أثناء معالجة الدفع عبر PayPal. يرجى المحاولة لاحقاً.')
          : (err.message || 'Payment processing error. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 sm:p-8"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 ltr:right-5 rtl:left-5 grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isAr ? 'خطط واستخدام سكنى بوت' : 'sakanybot Usage & Plans'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {isAr ? 'اختر الخطة المناسبة لاستشاراتك العقارية' : 'Choose Your Plan for Property Search'}
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
            {isAr
              ? `استهلاكك الحالي: ${usedCount} من ${limitCount} استفسار هذا الشهر`
              : `Current usage: ${usedCount} of ${limitCount} queries this month`}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Free Tier */}
          <div className={`relative rounded-2xl border p-5 transition ${
            currentPlan === 'free' 
              ? 'border-slate-300 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/40' 
              : 'border-slate-200 dark:border-zinc-800'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-black text-slate-900 dark:text-white">
                {isAr ? 'الباقة المجانية' : 'Free Plan'}
              </span>
              {currentPlan === 'free' && (
                <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {isAr ? 'نشطة حالياً' : 'Active'}
                </span>
              )}
            </div>
            <div className="mb-4">
              <span className="text-3xl font-black text-slate-900 dark:text-white">$0</span>
              <span className="text-xs text-slate-500 dark:text-zinc-400"> / {isAr ? 'شهرياً' : 'month'}</span>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-zinc-300 mb-6">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span><strong>30 {isAr ? 'استفسار شهرياً' : 'queries / month'}</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>{isAr ? 'تصفح عقارات مصر ودبي وإسبانيا وتركيا' : 'Access Egypt & Global inventory'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>{isAr ? 'حساب دقيق للأقساط والمقدم' : 'Installment & payment calculations'}</span>
              </li>
            </ul>
          </div>

          {/* Pro Tier (300 queries) */}
          <div className="relative rounded-2xl border-2 border-amber-500 bg-gradient-to-b from-amber-500/5 to-transparent p-5 shadow-lg shadow-amber-500/10 dark:border-amber-400">
            <div className="absolute -top-3 ltr:right-4 rtl:left-4 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 px-2.5 py-0.5 text-[10px] font-black text-black">
              {isAr ? 'الأكثر طلباً' : 'POPULAR'}
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span>{isAr ? 'باقة برو (Pro)' : 'Pro Plan'}</span>
              </span>
              {currentPlan === 'pro' && (
                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                  {isAr ? 'مفعلة' : 'Subscribed'}
                </span>
              )}
            </div>
            <div className="mb-4">
              <span className="text-3xl font-black text-slate-900 dark:text-white">$15</span>
              <span className="text-xs text-slate-500 dark:text-zinc-400"> / {isAr ? 'شهرياً' : 'month'}</span>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-zinc-300 mb-6">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span><strong>300 {isAr ? 'استفسار شهرياً (10 أضعاف)' : 'queries / month (10x)'}</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>{isAr ? 'أولوية الاستجابة والتحليل بالذكاء الاصطناعي' : 'Priority AI responses'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>{isAr ? 'حساب العائد الاستثماري ROI المتوقع' : 'Expected ROI & rental yield analysis'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>{isAr ? 'تنسيق مباشر مع المطورين وحجز معاينات VIP' : 'VIP direct developer viewing coordinator'}</span>
              </li>
            </ul>

            {/* Login Notice for Unauthenticated Users */}
            {!user && currentPlan !== 'pro' && (
              <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-center text-[11px] font-bold text-amber-700 dark:text-amber-300">
                <span>{isAr ? '🔒 يجب تسجيل الدخول أولاً لربط باقة Pro بحسابك' : '🔒 Log in first to link Pro subscription to your account'}</span>
              </div>
            )}

            {/* PayPal Checkout Button */}
            {currentPlan !== 'pro' && (
              <button
                onClick={handlePayPalCheckout}
                disabled={loading || success}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 py-2.5 text-xs font-black text-black shadow-md transition hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{isAr ? 'جاري الاتصال بـ PayPal...' : 'Connecting to PayPal...'}</span>
                  </>
                ) : success ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-700" />
                    <span>{isAr ? 'تمت الترقية بنجاح! (300 استفسار)' : 'Upgraded to Pro! (300 queries)'}</span>
                  </>
                ) : !user ? (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span>{isAr ? 'تسجيل الدخول للاشتراك ($15)' : 'Sign In to Upgrade ($15)'}</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    <span>{isAr ? 'الدفع الآمن بواسطة PayPal ($15)' : 'Pay Securely with PayPal ($15)'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Security Footer Note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-400 dark:text-zinc-500">
          <Shield className="h-3.5 w-3.5 text-emerald-500" />
          <span>{isAr ? 'دفع إلكتروني مشفر وآمن 100% عبر بوابة PayPal العالمية المعتمدة' : '100% secure encrypted payment via PayPal'}</span>
        </div>
      </div>
    </div>
  );
}
