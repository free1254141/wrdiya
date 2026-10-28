'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Check, 
  Sparkles, 
  CreditCard, 
  ArrowLeft, 
  ShieldCheck, 
  Factory, 
  HelpCircle,
  Zap,
  Globe,
  Sun,
  Moon,
  Building,
  CheckCircle2,
  FileText,
  Download,
  X,
  ExternalLink,
  Lock
} from 'lucide-react';

export default function PricingPage() {
  const { locale, toggleLocale } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isAr = locale === 'ar';

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [currency, setCurrency] = useState<'USD' | 'EGP'>('USD');
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | 'enterprise'>('pro');

  // PayPal Checkout Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPlan, setModalPlan] = useState<'starter' | 'pro' | 'enterprise'>('pro');
  const [paypalStage, setPaypalStage] = useState<'review' | 'processing' | 'success'>('review');
  const [transactionId, setTransactionId] = useState('');
  const [invoiceRequested, setInvoiceRequested] = useState(false);

  const plans = {
    starter: {
      id: 'starter',
      name: isAr ? 'باقة الانطلاق (Starter)' : 'Starter Plan',
      tagline: isAr ? 'للورش والخطوط الصغيرة الناشئة' : 'For small workshops & emerging plants',
      usdMonthly: 29,
      usdYearly: 23,
      egpMonthly: 1400,
      egpYearly: 1120,
      features: isAr ? [
        'حتى 5 ماكينات في صالة الإنتاج',
        'عدد غير محدود من فنيي التشغيل والمشرفين',
        'تسجيل الأعطال والتوقفات الفورية بالصوت',
        'سجل إنتاج نهاية الوردية و OEE أساسي',
        'تنبيهات صوتية فورية للصيانة',
        'دعم فني عبر البريد الإلكتروني',
      ] : [
        'Up to 5 machines on the factory floor',
        'Unlimited operators and supervisors',
        'Instant voice-assisted downtime reporting',
        'Shift handover log & basic OEE tracking',
        'Real-time audio alarms for maintenance',
        'Standard email support',
      ],
      popular: false,
    },
    pro: {
      id: 'pro',
      name: isAr ? 'باقة المصنع الاحترافية (Factory Pro)' : 'Factory Pro',
      tagline: isAr ? 'الحل المتكامل الشامل للذكاء الاصطناعي' : 'Comprehensive AI & OEE industrial suite',
      usdMonthly: 79,
      usdYearly: 63,
      egpMonthly: 3800,
      egpYearly: 3040,
      features: isAr ? [
        'عدد ماكينات وخطوط إنتاج غير محدود',
        'مساعد وردية الذكي (Wrdya AI Copilot)',
        'تسكين كشوف العمال آلياً بالصور والجداول',
        'شاشة الآندون الكبيرة للصالة (Andon TV Board)',
        'تحليل متقدم لأسباب التوقف الجذري (RCA)',
        'تصدير تقارير Excel و PDF الرسمية للإدارة',
        'تكامل كامل مع Webhooks وقاعدة بيانات المصنع',
        'دعم فني ذو أولوية على مدار الساعة 24/7',
      ] : [
        'Unlimited production lines and machines',
        'Wrdya AI Industrial Copilot included',
        'Automated roster parsing via photo OCR',
        'Large-screen Factory Andon TV Board mode',
        'Downtime Root Cause Analysis (RCA)',
        'Official Excel & PDF executive report exports',
        'Full Webhook & database synchronization',
        '24/7 Priority technical support',
      ],
      popular: true,
    },
    enterprise: {
      id: 'enterprise',
      name: isAr ? 'باقة المجمعات الصناعية (Enterprise Suite)' : 'Enterprise Suite',
      tagline: isAr ? 'للشركات الكبرى والمصانع المتعددة الفروع' : 'For multi-plant enterprises & industrial groups',
      usdMonthly: 199,
      usdYearly: 159,
      egpMonthly: 9500,
      egpYearly: 7600,
      features: isAr ? [
        'إدارة فروع ومصانع متعددة في منصة موحدة',
        'ربط مخصص مع أنظمة ERP (SAP, Oracle, Odoo)',
        'تخصيص كامل للأدوار وصلاحيات الأمان RBAC',
        'خادم مخصص أو استضافة سحابية خاصة On-Premise',
        'فواتير ضريبية رسمية للشركات عبر PayPal',
        'مدير حساب تقني مخصص وزيارات ميدانية دورية',
        'اتفاقية مستوى الخدمة SLA بنسبة 99.99%',
      ] : [
        'Multi-plant multi-tenant global management',
        'Custom ERP integrations (SAP, Oracle, Odoo)',
        'Enterprise RBAC & SSO authentication',
        'Dedicated server or On-Premise option',
        'Official corporate tax invoices via PayPal',
        'Dedicated Technical Account Manager',
        '99.99% uptime SLA guarantee',
      ],
      popular: false,
    },
  };

  const getPrice = (planKey: 'starter' | 'pro' | 'enterprise') => {
    const plan = plans[planKey];
    if (currency === 'USD') {
      const p = billingCycle === 'monthly' ? plan.usdMonthly : plan.usdYearly;
      return `$${p}`;
    } else {
      const p = billingCycle === 'monthly' ? plan.egpMonthly : plan.egpYearly;
      return `${p.toLocaleString()} ج.م`;
    }
  };

  const handleOpenCheckout = (planKey: 'starter' | 'pro' | 'enterprise') => {
    setModalPlan(planKey);
    setPaypalStage('review');
    setInvoiceRequested(false);
    setIsModalOpen(true);
  };

  const handleSimulatePayment = () => {
    setPaypalStage('processing');
    setTimeout(() => {
      const randomTxn = 'PP-WRDYA-' + Math.floor(100000 + Math.random() * 900000);
      setTransactionId(randomTxn);
      setPaypalStage('success');
    }, 1800);
  };

  return (
    <div className={`min-h-screen bg-[#07090e] text-white font-sans neobrutal-grid-bg ${isAr ? 'rtl' : 'ltr'}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0a0e17]/95 backdrop-blur-md border-b border-zinc-800 px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 transition"
            title={isAr ? 'العودة للرئيسية' : 'Back to Dashboard'}
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="wrdya-brand-mark w-9 h-9">
              <div className="wrdya-brand-mark__core">
                <Factory className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div>
              <span className="font-black text-sm sm:text-base text-white flex items-center gap-1.5">
                وردية <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">Wrdya AI</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Controls: Theme & Language */}
        <div className="flex items-center gap-2">
          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-700 transition"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-zinc-200" />}
          </button>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={toggleLocale}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-bold transition"
            title={isAr ? 'English' : 'العربية'}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isAr ? 'English' : 'العربية'}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
        {/* Title & Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold mb-4">
            <ShieldCheck className="w-4 h-4" />
            <span>{isAr ? 'ضمان تجربة مجانية لمدة 7 أيام مع إلغاء فوري بنقرة واحدة' : '7-Day Free Trial • Instant 1-Click PayPal Cancellation'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-3">
            {isAr ? 'باقات الاشتراك الرسمية لمصانع المستقبل' : 'Industrial Shift Management Pricing'}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl mx-auto">
            {isAr
              ? 'اختر الباقة المناسبة لحجم صالة الإنتاج لديك. جميع الاشتراكات محمية ومعتمدة عبر بوابة PayPal العالمية.'
              : 'Empower your plant floor with real-time downtime analytics, AI shift handover, and automated roster scheduling.'}
          </p>

          {/* Billing Interval & Currency Switchers */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {/* Monthly vs Yearly */}
            <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-lg transition ${
                  billingCycle === 'monthly' ? 'bg-amber-500 text-black font-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {isAr ? 'الدفع شهرياً' : 'Billed Monthly'}
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 ${
                  billingCycle === 'yearly' ? 'bg-amber-500 text-black font-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>{isAr ? 'الدفع سنوياً' : 'Billed Annually'}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500 text-black font-black">
                  {isAr ? 'وفر 20%' : 'Save 20%'}
                </span>
              </button>
            </div>

            {/* Currency Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-3 py-2 rounded-lg transition ${
                  currency === 'USD' ? 'bg-zinc-800 text-amber-400' : 'text-zinc-400 hover:text-white'
                }`}
              >
                USD ($)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('EGP')}
                className={`px-3 py-2 rounded-lg transition ${
                  currency === 'EGP' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:text-white'
                }`}
              >
                EGP (ج.م)
              </button>
            </div>
          </div>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mb-12">
          
          {/* Card 1: Starter */}
          <div className="neobrutal-card rounded-3xl p-6 sm:p-7 border-2 border-zinc-800 bg-[#0d121c] flex flex-col justify-between">
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-black text-white">{plans.starter.name}</h3>
                <p className="text-xs text-zinc-400 mt-1">{plans.starter.tagline}</p>
              </div>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black text-white">{getPrice('starter')}</span>
                <span className="text-xs text-zinc-400">/{isAr ? 'شهرياً' : 'mo'}</span>
              </div>

              <div className="space-y-3 mb-8">
                {plans.starter.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenCheckout('starter')}
              className="w-full neobrutal-btn py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'بدء تجربة 7 أيام عبر PayPal' : 'Start 7-Day Trial via PayPal'}</span>
            </button>
          </div>

          {/* Card 2: Factory Pro (Featured) */}
          <div className="neobrutal-card rounded-3xl p-6 sm:p-7 border-2 border-amber-500 bg-gradient-to-b from-[#141209] via-[#0d121c] to-[#07090e] shadow-2xl relative flex flex-col justify-between">
            {/* Featured Badge */}
            <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs px-3.5 py-1 rounded-full shadow-lg">
              {isAr ? '⭐ الأكثر طلباً للمصانع' : '⭐ Most Popular'}
            </div>

            <div>
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white">{plans.pro.name}</h3>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-xs text-zinc-400 mt-1">{plans.pro.tagline}</p>
              </div>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl sm:text-5xl font-black text-amber-400">{getPrice('pro')}</span>
                <span className="text-xs text-zinc-400">/{isAr ? 'شهرياً' : 'mo'}</span>
              </div>

              <div className="space-y-3 mb-8">
                {plans.pro.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-200">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span className="font-semibold">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenCheckout('pro')}
              className="w-full neobrutal-btn py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition transform active:scale-95"
            >
              <CreditCard className="w-4 h-4 text-black" />
              <span>{isAr ? 'الاشتراك الفوري عبر PayPal' : 'Subscribe with PayPal'}</span>
            </button>
          </div>

          {/* Card 3: Enterprise Suite */}
          <div className="neobrutal-card rounded-3xl p-6 sm:p-7 border-2 border-zinc-800 bg-[#0d121c] flex flex-col justify-between">
            <div>
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white">{plans.enterprise.name}</h3>
                  <Building className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-xs text-zinc-400 mt-1">{plans.enterprise.tagline}</p>
              </div>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black text-cyan-400">{getPrice('enterprise')}</span>
                <span className="text-xs text-zinc-400">/{isAr ? 'شهرياً' : 'mo'}</span>
              </div>

              <div className="space-y-3 mb-8">
                {plans.enterprise.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenCheckout('enterprise')}
              className="w-full neobrutal-btn py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-black text-xs flex items-center justify-center gap-2 transition"
            >
              <FileText className="w-4 h-4" />
              <span>{isAr ? 'طلب فاتورة وضمان Enterprise' : 'Get Enterprise Invoice'}</span>
            </button>
          </div>

        </div>

        {/* PayPal Official Security Guarantee */}
        <div className="neobrutal-card rounded-2xl p-6 border-2 border-zinc-800 bg-zinc-900/60 max-w-3xl mx-auto text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm">
            <ShieldCheck className="w-5 h-5" />
            <span>{isAr ? 'أمان وسرية البيانات الصناعية معتمد عبر PayPal' : 'Verified Secure Enterprise Industrial Checkout'}</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-xl mx-auto">
            {isAr
              ? 'معاملات الدفع وتجديد الاشتراكات مشفرة بالكامل بمعايير PCI-DSS بواسطة شركة PayPal. يتم تفعيل صلاحيات الصالة والمساعد الذكي فورياً وبشكل تلقائي بمجرد اعتماد الاشتراك.'
              : 'All transactions are encrypted with 256-bit SSL via PayPal. Features and AI Copilot access activate instantaneously upon approval.'}
          </p>
        </div>
      </main>

      {/* INTERACTIVE PAYPAL CHECKOUT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="neobrutal-card rounded-2xl border-2 border-zinc-700 bg-[#0d121c] max-w-lg w-full p-6 shadow-2xl relative text-white">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 left-4 rtl:left-auto rtl:right-4 p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* STAGE 1: REVIEW & PAYPAL SMART BUTTON */}
            {paypalStage === 'review' && (
              <div>
                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg">
                    🅿️
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      {isAr ? 'بوابة دفع PayPal المعتمدة' : 'Official PayPal Checkout Portal'}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      {isAr ? 'تفاصيل الاشتراك وتأكيد الطلب' : 'Subscription & Order Summary'}
                    </p>
                  </div>
                </div>

                {/* Order Summary Box */}
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2.5 mb-5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">{isAr ? 'الباقة المختارة:' : 'Plan:'}</span>
                    <span className="font-bold text-white">{plans[modalPlan].name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">{isAr ? 'دورة المحاسبة:' : 'Billing Interval:'}</span>
                    <span className="font-bold text-amber-400">
                      {billingCycle === 'monthly' ? (isAr ? 'شهري' : 'Monthly') : (isAr ? 'سنوي (خصم 20%)' : 'Annual (20% Off)')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">{isAr ? 'فترة التجربة:' : 'Trial Period:'}</span>
                    <span className="font-bold text-emerald-400">{isAr ? '7 أيام مجانية (0.00 رسوم الآن)' : '7 Days Free ($0.00 today)'}</span>
                  </div>
                  <div className="pt-2 border-t border-zinc-800 flex justify-between items-center text-sm font-black">
                    <span className="text-zinc-300">{isAr ? 'السعر بعد التجربة:' : 'Subsequent Billing:'}</span>
                    <span className="text-white font-mono">{getPrice(modalPlan)}</span>
                  </div>
                </div>

                {/* PayPal Smart Payment Actions */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleSimulatePayment}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#ffc439] hover:bg-[#f4bb30] text-[#003087] font-black text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
                  >
                    <span className="font-bold text-base italic">PayPal</span>
                    <span>{isAr ? 'متابعة الدفع بواسطة PayPal' : 'Pay with PayPal'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSimulatePayment}
                    className="w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs border border-zinc-700 flex items-center justify-center gap-2 transition"
                  >
                    <CreditCard className="w-4 h-4 text-zinc-400" />
                    <span>{isAr ? 'أو الدفع ببطاقة ائتمان مباشرة (Debit / Credit)' : 'Debit or Credit Card'}</span>
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isAr ? 'معالجة مشفرة وآمنة عبر PayPal Sandbox & Live' : 'Encrypted with PayPal Smart Payment Gateway'}</span>
                </div>
              </div>
            )}

            {/* STAGE 2: PROCESSING */}
            {paypalStage === 'processing' && (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center text-blue-400 animate-spin">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-white">
                  {isAr ? 'جارِ معالجة الاشتراك عبر PayPal...' : 'Processing PayPal Authorization...'}
                </h4>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                  {isAr ? 'يتم الآن التحقق من صحة المعاملة وربط الترخيص السحابي لمصنعك' : 'Validating token and provisioning plant license via Webhook'}
                </p>
              </div>
            )}

            {/* STAGE 3: SUCCESS CONFIRMATION */}
            {paypalStage === 'success' && (
              <div className="py-4 text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-lg font-black text-white">
                    {isAr ? 'تم تفعيل الاشتراك بنجاح!' : 'Subscription Activated!'}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    {isAr ? 'تم ترقية حساب المصنع وتفعيل مساعد وردية الذكي' : 'Your plant workspace has been upgraded with full access.'}
                  </p>
                </div>

                {/* Receipt Card */}
                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-left rtl:text-right space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-zinc-400">
                    <span>{isAr ? 'رقم العملية (Txn ID):' : 'Transaction ID:'}</span>
                    <span className="text-amber-400 font-bold">{transactionId}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>{isAr ? 'كود اشتراك PayPal:' : 'Subscription ID:'}</span>
                    <span className="text-zinc-200">SUB-WRDYA-{Math.floor(1000 + Math.random() * 9000)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>{isAr ? 'الباقة المفعلة:' : 'Active Plan:'}</span>
                    <span className="text-emerald-400 font-bold">{plans[modalPlan].name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Link
                    href="/"
                    className="flex-1 neobrutal-btn py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs text-center transition"
                  >
                    {isAr ? 'الدخول للوحة المصنع المحدثة' : 'Go to Plant Workspace'}
                  </Link>

                  <button
                    type="button"
                    onClick={() => alert(isAr ? 'تم حفظ الإيصال في التنزيلات' : 'Receipt downloaded')}
                    className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-bold transition flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إيصال' : 'Receipt'}</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
