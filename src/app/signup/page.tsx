'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { UserRole } from '@/lib/types';
import { 
  Factory, 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Globe, 
  Cpu, 
  Radio, 
  Wrench, 
  Briefcase 
} from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { locale, toggleLocale } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isAr = locale === 'ar';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [factoryName, setFactoryName] = useState(isAr ? 'المصنع المصري للبلاستيك والبوليمر' : 'Egyptian Plastic & Polymer Plant');
  const [selectedRole, setSelectedRole] = useState<UserRole>('operator');

  // Role dynamic detail
  const [assignedLine, setAssignedLine] = useState('EXT-01');
  const [specialtyOrSector, setSpecialtyOrSector] = useState(isAr ? 'تلقيم وتغذية الخامات' : 'Raw Material Feeding');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError(isAr ? 'يرجى استكمال جميع البيانات الأساسية المطلوبة' : 'Please fill all required fields');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const res = await signUp(email, password, name, selectedRole);
      if (res.success) {
        router.push('/');
      } else {
        setError(res.error || (isAr ? 'حدث خطأ أثناء إنشاء الحساب' : 'Error creating account'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 neobrutal-grid-bg relative overflow-hidden ${isAr ? 'rtl' : 'ltr'}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Background Glows */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />

      {/* Top Floating Controls */}
      <div className="w-full max-w-xl flex items-center justify-between mb-4 px-2 z-20">
        <Link 
          href="/login" 
          className="text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
          <span>{isAr ? 'لديك حساب؟ تسجيل الدخول' : 'Already have account? Sign In'}</span>
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
            title={isAr ? 'English' : 'العربية'}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isAr ? 'English' : 'العربية'}</span>
          </button>
        </div>
      </div>

      <div className="w-full max-w-xl neobrutal-card p-6 sm:p-8 border-2 border-zinc-700 bg-[#0d121c] relative z-10 text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="wrdya-brand-mark w-10 h-10">
              <div className="wrdya-brand-mark__core">
                <Factory className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-black text-white">
                {isAr ? 'تسجيل مسؤول مصنع جديد' : 'Register Plant Account'}
              </h1>
              <p className="text-xs text-zinc-400">
                {isAr ? 'انضم لمنصة إدارة الورديات و OEE' : 'Join Wrdya AI Shift & OEE Platform'}
              </p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30">
            {isAr ? 'ترقية فورية' : 'Instant Setup'}
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              {isAr ? 'الاسم ثلاثي' : 'Full Name'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isAr ? 'مثال: م. أحمد الدسوقي' : 'e.g. John Doe'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                {isAr ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="eng.ahmed@factory.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-400"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                {isAr ? 'اسم المصنع / المنشأة' : 'Factory / Plant Name'}
              </label>
              <input
                type="text"
                value={factoryName}
                onChange={(e) => setFactoryName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              {isAr ? 'كلمة المرور' : 'Password'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-400"
              dir="ltr"
            />
          </div>

          {/* Dynamic Role Selection */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-zinc-300 mb-2">
              {isAr ? 'الدور الوظيفي المطلوب في المصنع:' : 'Assigned Plant Role:'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { role: 'operator', label: isAr ? '👷 مشغل خط' : 'Operator', icon: Cpu, color: 'text-amber-400' },
                { role: 'supervisor', label: isAr ? '📋 مشرف وردية' : 'Supervisor', icon: Radio, color: 'text-blue-400' },
                { role: 'maintenance', label: isAr ? '🛠️ فني صيانة' : 'Maintenance', icon: Wrench, color: 'text-emerald-400' },
                { role: 'admin', label: isAr ? '🏢 مدير مصنع' : 'Plant Manager', icon: Briefcase, color: 'text-purple-400' },
              ].map((item) => (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => setSelectedRole(item.role as UserRole)}
                  className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition ${
                    selectedRole === item.role
                      ? 'border-amber-400 bg-amber-500/15 font-bold shadow-md'
                      : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700 text-zinc-400'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <span className="text-xs text-white">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Field Based on Role */}
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
            <span className="text-[11px] font-bold text-amber-400 block">
              {isAr ? 'بيانات التخصيص الأولي وفقاً لدورك:' : 'Initial Assignment based on selected role:'}
            </span>

            {selectedRole === 'operator' && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-zinc-400 mb-1">{isAr ? 'الماكينة:' : 'Machine:'}</label>
                  <select
                    value={assignedLine}
                    onChange={(e) => setAssignedLine(e.target.value)}
                    className="w-full p-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white"
                  >
                    <option value="EXT-01">EXT-01 (خط البثق)</option>
                    <option value="INJ-02">INJ-02 (ماكينة الحقن)</option>
                    <option value="THF-03">THF-03 (التشكيل الحراري)</option>
                    <option value="PKG-04">PKG-04 (التعبئة والتغليف)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">{isAr ? 'المهمة:' : 'Operation:'}</label>
                  <input
                    type="text"
                    value={specialtyOrSector}
                    onChange={(e) => setSpecialtyOrSector(e.target.value)}
                    className="w-full p-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white"
                    placeholder={isAr ? 'تلقيم وتغذية' : 'Hopper Feeding'}
                  />
                </div>
              </div>
            )}

            {selectedRole === 'supervisor' && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-zinc-400 mb-1">{isAr ? 'القطاع:' : 'Sector:'}</label>
                  <input
                    type="text"
                    value={specialtyOrSector}
                    onChange={(e) => setSpecialtyOrSector(e.target.value)}
                    className="w-full p-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white"
                    placeholder={isAr ? 'صالة الإنتاج بالكامل' : 'Whole Plant'}
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">{isAr ? 'قناة اللاسلكي:' : 'Radio Channel:'}</label>
                  <input
                    type="text"
                    defaultValue="CH-01"
                    className="w-full p-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white font-mono"
                  />
                </div>
              </div>
            )}

            {selectedRole === 'maintenance' && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-zinc-400 mb-1">{isAr ? 'التخصص الهندسي:' : 'Specialty:'}</label>
                  <select
                    value={specialtyOrSector}
                    onChange={(e) => setSpecialtyOrSector(e.target.value)}
                    className="w-full p-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white"
                  >
                    <option value="كهرباء وتحكم PLC">{isAr ? 'كهرباء وتحكم PLC' : 'Electrical & PLC'}</option>
                    <option value="ميكانيكا وصيانة وقائية">{isAr ? 'ميكانيكا وصيانة وقائية' : 'Mechanical & PM'}</option>
                    <option value="هيدروليك ونيوماتيك">{isAr ? 'هيدروليك ونيوماتيك' : 'Hydraulics'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">{isAr ? 'كود العدة:' : 'Toolbox ID:'}</label>
                  <input
                    type="text"
                    defaultValue="CAL-2026-X8"
                    className="w-full p-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white font-mono"
                  />
                </div>
              </div>
            )}

            {selectedRole === 'admin' && (
              <div className="text-xs">
                <label className="block text-zinc-400 mb-1">{isAr ? 'الإدارة التشغيلية:' : 'Operational Division:'}</label>
                <input
                  type="text"
                  defaultValue={isAr ? 'إدارة العمليات الصناعية' : 'Operations Directorate'}
                  className="w-full p-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full neobrutal-btn py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {isLoading ? (isAr ? 'جاري تجهيز الحساب...' : 'Setting up account...') : (isAr ? 'إنشاء حساب والانتقال لصالة المصنع' : 'Create Account & Enter Plant')}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-center gap-1.5 text-xs text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{isAr ? 'حساب تجريبي محمي ومفعل فورياً بصلاحيات كاملة' : 'Instant active demo account with full features'}</span>
        </div>
      </div>
    </div>
  );
}
