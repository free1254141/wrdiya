'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, DEMO_PROFILES } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserRole } from '@/lib/types';
import { 
  Factory, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  UserCheck,
  Sun,
  Moon,
  Globe
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, loginAsDemo } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { locale, toggleLocale } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isAr = locale === 'ar';

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(isAr ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const res = await signIn(email, password);
      if (res.success) {
        router.push('/');
      } else {
        setError(res.error || (isAr ? 'فشل تسجيل الدخول. تحقق من بياناتك.' : 'Invalid credentials'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFakeAccount = (role: UserRole) => {
    const profile = DEMO_PROFILES[role];
    setEmail(profile.email);
    setPassword('123456');
    loginAsDemo(role);
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 neobrutal-grid-bg relative overflow-hidden">
      {/* Background Glows */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl animate-pulse" />

      {/* Top Floating Controls for Login: Theme & Language */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-4 px-2 z-20">
        <Link 
          href="/" 
          className="text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
          <span>{isAr ? 'العودة للرئيسية' : 'Back to Home'}</span>
        </Link>

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
            title={isAr ? 'Switch language to English' : 'التحويل للغة العربية'}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isAr ? 'English' : 'العربية'}</span>
          </button>
        </div>
      </div>

      {/* Main Auth Container */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative z-10">
        
        {/* Left Column: Industrial Plant Branding & Hero */}
        <div className="lg:col-span-5 neobrutal-card p-6 sm:p-8 flex flex-col justify-between border-2 border-zinc-700 bg-gradient-to-b from-[#0f172a] via-[#0d131f] to-[#070a12] text-white">
          <div>
            {/* Brand Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="wrdya-brand-mark w-12 h-12">
                <div className="wrdya-brand-mark__core">
                  <Factory className="w-6 h-6 text-amber-400" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  {isAr ? 'وردية' : 'Wrdya'} <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">AI Industrial</span>
                </h1>
                <p className="text-xs text-zinc-400">
                  {isAr ? 'نظام إدارة وتسكين الورديات و OEE للمصانع الذكية' : 'Shift Roster & OEE Platform for Smart Plants'}
                </p>
              </div>
            </div>

            {/* Hero Value Props */}
            <div className="space-y-4 my-8">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-zinc-200">
                    {isAr ? 'صلاحيات متغيرة لكل دور وظيفي' : 'Role-Based Dynamic Workspaces'}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {isAr 
                      ? 'فورمات وصلاحيات تتغير فوراً حسب اختيارك (عامل، مشرف، صيانة، مدير).'
                      : 'Forms and requirements change dynamically based on role.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-zinc-200">
                    {isAr ? 'مساعد وردية الذكي متوفر من أول لحظة' : 'AI Assistant Ready on First Load'}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {isAr 
                      ? 'ارفع صورة كشف العمال أو اكتب الأسماء وسيقوم بتسكين الفريق تلقائياً.'
                      : 'Upload roster photo or type names to auto-populate assignments.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-zinc-200">
                    {isAr ? 'تتبع الأعطال و OEE الحقيقي' : 'Realtime Downtime & OEE'}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {isAr 
                      ? 'تسجيل فوري بدون كتابة مع مؤقتات حية لأوقات الاستجابة والإصلاح.'
                      : 'Instant logging with live MTTR response stopwatches.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Plant Floor Live Badge */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-emerald" />
              {isAr ? 'صالة الإنتاج متصلة' : 'Factory Floor Online'}
            </span>
            <span className="font-mono text-zinc-500">v2.5.0</span>
          </div>
        </div>

        {/* Right Column: Login & Fake Accounts */}
        <div className="lg:col-span-7 neobrutal-card p-6 sm:p-8 border-2 border-zinc-700 bg-[#0d121c] flex flex-col justify-between">
          <div>
            <div className="mb-5">
              <h2 className="text-2xl font-black text-white">
                {isAr ? 'تسجيل الدخول للمصنع' : 'Plant Portal Sign In'}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                {isAr ? 'اختر حساب تجريبي فوري أو سجل ببريدك' : 'Select instant demo profile or enter credentials'}
              </p>
            </div>

            {/* Fake / Demo Accounts Section */}
            <div className="mb-6 p-4 rounded-xl bg-zinc-900/90 border border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  {isAr ? 'حسابات تجريبية جاهزة بنقرة واحدة (Fake Accounts):' : 'Instant 1-Click Fake Accounts:'}
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">
                  {isAr ? 'الباسورد: 123456' : 'Pass: 123456'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectFakeAccount('operator')}
                  className="neobrutal-btn p-2.5 rounded-xl bg-zinc-800 hover:bg-amber-500 hover:text-black text-right flex flex-col transition group border border-zinc-700"
                >
                  <span className="text-lg mb-1">{DEMO_PROFILES.operator.avatar}</span>
                  <span className="text-xs font-bold text-white group-hover:text-black">
                    {isAr ? 'عامل تشغيل' : 'Operator'}
                  </span>
                  <span className="text-[10px] text-zinc-400 group-hover:text-zinc-900 truncate">operator@wrdya.com</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectFakeAccount('supervisor')}
                  className="neobrutal-btn p-2.5 rounded-xl bg-zinc-800 hover:bg-blue-500 hover:text-black text-right flex flex-col transition group border border-zinc-700"
                >
                  <span className="text-lg mb-1">{DEMO_PROFILES.supervisor.avatar}</span>
                  <span className="text-xs font-bold text-white group-hover:text-black">
                    {isAr ? 'مشرف وردية' : 'Supervisor'}
                  </span>
                  <span className="text-[10px] text-zinc-400 group-hover:text-zinc-900 truncate">supervisor@wrdya.com</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectFakeAccount('maintenance')}
                  className="neobrutal-btn p-2.5 rounded-xl bg-zinc-800 hover:bg-emerald-500 hover:text-black text-right flex flex-col transition group border border-zinc-700"
                >
                  <span className="text-lg mb-1">{DEMO_PROFILES.maintenance.avatar}</span>
                  <span className="text-xs font-bold text-white group-hover:text-black">
                    {isAr ? 'فني صيانة' : 'Maintenance'}
                  </span>
                  <span className="text-[10px] text-zinc-400 group-hover:text-zinc-900 truncate">maintenance@wrdya.com</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectFakeAccount('admin')}
                  className="neobrutal-btn p-2.5 rounded-xl bg-zinc-800 hover:bg-purple-500 hover:text-black text-right flex flex-col transition group border border-zinc-700"
                >
                  <span className="text-lg mb-1">{DEMO_PROFILES.admin.avatar}</span>
                  <span className="text-xs font-bold text-white group-hover:text-black">
                    {isAr ? 'مدير المصنع' : 'Manager'}
                  </span>
                  <span className="text-[10px] text-zinc-400 group-hover:text-zinc-900 truncate">manager@wrdya.com</span>
                </button>
              </div>
            </div>

            <div className="relative flex py-1 items-center mb-5">
              <div className="flex-grow border-t border-zinc-800"></div>
              <span className="flex-shrink mx-4 text-xs font-semibold text-zinc-500">
                {isAr ? 'أو تسجيل الدخول اليدوي' : 'Or Manual Sign In'}
              </span>
              <div className="flex-grow border-t border-zinc-800"></div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Standard Form */}
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="supervisor@wrdya.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-400"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  {isAr ? 'كلمة المرور' : 'Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="123456"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-400"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full neobrutal-btn py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isLoading ? (isAr ? 'جاري الدخول...' : 'Signing in...') : (isAr ? 'دخول المنصة' : 'Sign In')}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <span>{isAr ? 'تسجيل حساب مصنع جديد؟' : 'Need a new plant account?'}</span>
            <Link href="/signup" className="text-amber-400 hover:underline font-bold">
              {isAr ? 'إنشاء حساب مسؤول' : 'Create Manager Account'}
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
