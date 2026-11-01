'use client';

import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Zap, 
  Sparkles, 
  Shield, 
  CreditCard, 
  Loader2, 
  LogIn, 
  AlertCircle, 
  Copy, 
  CheckCheck, 
  Smartphone, 
  ArrowLeft, 
  Send 
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

const WALLET_METHODS = [
  { id: 'فودافون كاش', labelAr: 'فودافون كاش 🔴', labelEn: 'Vodafone Cash 🔴' },
  { id: 'إنستاباي (InstaPay)', labelAr: 'إنستاباي InstaPay ⚡', labelEn: 'InstaPay ⚡' },
  { id: 'أورنج كاش', labelAr: 'أورنج كاش 🟠', labelEn: 'Orange Money 🟠' },
  { id: 'اتصالات كاش', labelAr: 'اتصالات كاش 🟢', labelEn: 'Etisalat Cash 🟢' },
  { id: 'وي باي (WE Pay)', labelAr: 'وي باي WE Pay 🟣', labelEn: 'WE Pay 🟣' },
  { id: 'محفظة بنكية ذكية', labelAr: 'محفظة بنكية ذكية 🏦', labelEn: 'Bank Wallet 🏦' },
];

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
  
  const [activeTab, setActiveTab] = useState<'wallet' | 'paypal'>('wallet');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states for Wallet transfer
  const [senderPhone, setSenderPhone] = useState('');
  const [transferMethod, setTransferMethod] = useState('فودافون كاش');
  const [senderName, setSenderName] = useState((user as any)?.user_metadata?.full_name || (user as any)?.name || '');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const isAr = locale === 'ar';

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

      // Instant Pro plan activation!
      setSuccess(true);
      setTimeout(() => {
        onUpgradeSuccess('pro', data.limit || 300);
        onClose();
      }, 2500);
    } catch (err: any) {
      console.error('Wallet checkout error:', err);
      setErrorMessage(err.message || 'حدث خطأ أثناء إتمام العملية. يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalCheckout = async () => {
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

      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ plan: 'pro' }),
      });

      const order = await res.json();

      if (!order.id) {
        throw new Error(order.error || 'Failed to initiate PayPal order');
      }

      const approveLink = order.links?.find((l: any) => l.rel === 'approve')?.href;
      if (approveLink) {
        window.location.href = approveLink;
        return;
      }

      const capRes = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ orderId: order.id }),
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
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 sm:p-7"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 ltr:right-4 rtl:left-4 grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isAr ? 'ترقية فورية لباقة برو (Pro)' : 'Instant Pro Upgrade'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {isAr ? 'تفعيل باقة Pro العقارية الفورية' : 'Activate Instant Pro Membership'}
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            {isAr
              ? `احصل على 300 استفسار شهرياً، أولوية التحليل، وحسابات الـ ROI والمعاينات المباشرة.`
              : `Unlock 300 inquiries/month, priority DeepSeek analytics, ROI models, and direct viewings.`}
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
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/10 border-2 border-emerald-500 text-emerald-500 animate-bounce">
              <Check className="h-8 w-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {isAr ? '🎉 مبروك! تم تفعيل باقة Pro لحسابك فوراً' : '🎉 Pro Plan Activated Instantly!'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 max-w-md mx-auto">
              {isAr
                ? 'تم شحن رصيدك بـ 300 استفسار ذكي وإرسال إشعار التأكيد لقناة الدعم الفني. استمتع بأقوى تجربة استشارية عقارية!'
                : 'Your account is now credited with 300 queries and logged with our support dispatch. Enjoy peak real estate advisory!'}
            </p>
            <div className="inline-flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-2 text-xs font-bold text-amber-600 dark:text-amber-400">
              <Zap className="h-4 w-4 text-amber-500" />
              <span>{isAr ? 'جاري فتح الشات برصيدك الجديد...' : 'Returning to chat with new quota...'}</span>
            </div>
          </div>
        ) : (
          <>
            {/* Payment Method Selector Tabs */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <button
                type="button"
                onClick={() => setActiveTab('wallet')}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black transition ${
                  activeTab === 'wallet'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                }`}
              >
                <Smartphone className="h-4 w-4" />
                <span>{isAr ? 'محافظ كاش / إنستاباي (250 ج.م)' : 'Mobile Cash / InstaPay (250 EGP)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('paypal')}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black transition ${
                  activeTab === 'paypal'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                <span>{isAr ? 'PayPal وكروت دولية ($15)' : 'PayPal & Cards ($15)'}</span>
              </button>
            </div>

            {/* TAB 1: Mobile Wallet & InstaPay Direct Transfer */}
            {activeTab === 'wallet' && (
              <div className="space-y-5">
                {/* Highlighted Destination Box */}
                <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                        {isAr ? 'حول المبلغ (250 ج.م) للرقم المعتمد:' : 'Transfer 250 EGP to Official Wallet:'}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl sm:text-3xl font-black font-mono tracking-widest text-slate-900 dark:text-white">
                          {OFFICIAL_WALLET_NUMBER}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyNumber}
                          className="inline-flex items-center gap-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 text-xs font-black shadow-xs transition active:scale-95"
                          title="نسخ الرقم"
                        >
                          {copied ? (
                            <>
                              <CheckCheck className="h-3.5 w-3.5" />
                              <span>{isAr ? 'تم النسخ!' : 'Copied!'}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>{isAr ? 'نسخ' : 'Copy'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="text-start sm:text-end">
                      <span className="text-xs text-slate-500 dark:text-zinc-400 block">{isAr ? 'قيمة الاشتراك' : 'Price'}:</span>
                      <strong className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        {PRO_PRICE_EGP} ج.م <span className="text-xs font-normal text-slate-400">/ {isAr ? 'شهرياً' : 'mo'}</span>
                      </strong>
                    </div>
                  </div>

                  {/* Badges for Supported Wallets */}
                  <div className="mt-3.5 pt-3 border-t border-amber-500/20 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold me-1">
                      {isAr ? 'متاح التحويل من:' : 'Accepted From:'}
                    </span>
                    {WALLET_METHODS.map((m) => (
                      <span
                        key={m.id}
                        className="rounded-lg bg-white/80 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-zinc-300"
                      >
                        {isAr ? m.labelAr : m.labelEn}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Instant Activation Form */}
                <form onSubmit={handleWalletSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Sender Phone (Required) */}
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
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                      />
                    </div>

                    {/* Transfer Method Select */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                        {isAr ? 'طريقة التحويل المستخدمة' : 'Transfer Method'}
                      </label>
                      <select
                        value={transferMethod}
                        onChange={(e) => setTransferMethod(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                      >
                        {WALLET_METHODS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {isAr ? m.labelAr : m.labelEn}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Sender Name (Optional) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                        {isAr ? 'اسم صاحب التحويل (اختياري)' : 'Sender Name (Optional)'}
                      </label>
                      <input
                        type="text"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder={isAr ? 'مثال: محمد أحمد' : 'e.g. John Doe'}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                      />
                    </div>

                    {/* Transaction Ref / Notes (Optional) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                        {isAr ? 'كود العملية أو ملاحظة (اختياري)' : 'Transaction Ref / Notes (Optional)'}
                      </label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={isAr ? 'مثال: تم التحويل عبر فودافون كاش' : 'e.g. Transferred via Vodafone'}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Instant Confirmation & Activation Button */}
                  <button
                    type="submit"
                    disabled={loading || !senderPhone}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 py-3 text-xs sm:text-sm font-black text-black shadow-md transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{isAr ? 'جاري تفعيل باقة Pro فوراً...' : 'Activating Pro Plan Instantly...'}</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 fill-black" />
                        <span>{isAr ? 'تأكيد التحويل وتفعيل باقة Pro فوراً ⚡' : 'Confirm & Activate Pro Instantly ⚡'}</span>
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-center text-slate-400 dark:text-zinc-500">
                    {isAr
                      ? '⚡ التفعيل فوري: يتم فتح باقة Pro وتطبيق الـ 300 استفسار لحسابك لحظياً بمجرد الضغط، مع إشعار الإدارة بالتفاصيل للمتابعة.'
                      : '⚡ Instant Activation: Pro plan is enabled with 300 queries immediately, and our team receives real-time verification.'}
                  </p>
                </form>
              </div>
            )}

            {/* TAB 2: PayPal & International Credit Cards */}
            {activeTab === 'paypal' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 bg-slate-50/50 dark:bg-zinc-900/40">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CreditCard className="h-4 w-4 text-amber-500" />
                      <span>{isAr ? 'اشتراك Pro عبر PayPal الدولي' : 'Pro Subscription via PayPal'}</span>
                    </span>
                    <strong className="text-xl font-black text-slate-900 dark:text-white">$15 / mo</strong>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-600 dark:text-zinc-300 mb-5">
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span>300 {isAr ? 'استفسار شهرياً مع أولوية المعالجة' : 'queries/month with priority'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span>{isAr ? 'دعم كامل للكروت الائتمانية الدولية (Visa / Mastercard)' : 'Full support for international cards'}</span>
                    </li>
                  </ul>

                  {!user && (
                    <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-center text-[11px] font-bold text-amber-700 dark:text-amber-300">
                      <span>{isAr ? '🔒 يجب تسجيل الدخول أولاً لربط باقة Pro بحسابك' : '🔒 Log in first to link Pro to your account'}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handlePayPalCheckout}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 py-3 text-xs font-black text-black shadow-md transition hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{isAr ? 'جاري الاتصال بـ PayPal...' : 'Connecting to PayPal...'}</span>
                      </>
                    ) : !user ? (
                      <>
                        <LogIn className="h-4 w-4" />
                        <span>{isAr ? 'تسجيل الدخول أولاً ($15)' : 'Sign In First ($15)'}</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        <span>{isAr ? 'الدفع الآمن بواسطة PayPal ($15)' : 'Pay Securely with PayPal ($15)'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Security Footer Note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-center text-[11px] text-slate-400 dark:text-zinc-500">
          <Shield className="h-3.5 w-3.5 text-emerald-500" />
          <span>{isAr ? 'دفع آمن ومعتمد 100% — تفعيل فوري مع إشعار رسمي لقناة الدعم الفني' : '100% secure payment — instant activation & official support verification'}</span>
        </div>
      </div>
    </div>
  );
}
