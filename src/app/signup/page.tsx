'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Factory, 
  ArrowLeft, 
  ArrowRight,
  CheckCircle2, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Globe, 
  Cpu, 
  Radio, 
  Wrench, 
  Briefcase,
  Upload,
  FileSpreadsheet,
  Image as ImageIcon,
  Mic,
  MicOff,
  Sparkles,
  Bot,
  Zap,
  Check,
  Building2,
  Users,
  Layers,
  ChevronRight,
  Sliders,
  Gauge,
  Info
} from 'lucide-react';

const INDUSTRY_OPTIONS = [
  { id: 'plastic', nameAr: 'بلاستيك وبوليمر وبثق عبوات', nameEn: 'Plastics, Polymer & Blow Molding', icon: '🧪' },
  { id: 'textile', nameAr: 'غزل ونسيج وملابس جاهزة', nameEn: 'Textiles, Spinning & Apparel', icon: '🧵' },
  { id: 'food', nameAr: 'صناعات غذائية ومشروبات ومعلبات', nameEn: 'Food, Beverage & Packaging', icon: '🥫' },
  { id: 'metal', nameAr: 'تشغيل معادن وتشكيل وميكنة CNC', nameEn: 'Metalworking, Machining & CNC', icon: '⚙️' },
  { id: 'pharma', nameAr: 'صناعات دوائية ومستحضرات طبية', nameEn: 'Pharmaceuticals & Medical Supplies', icon: '💊' },
  { id: 'electric', nameAr: 'أجهزة كهربائية ومكونات إلكترونية', nameEn: 'Electrical Appliances & Components', icon: '⚡' },
  { id: 'printing', nameAr: 'تعبئة وتغليف كرتون وطباعة روتو', nameEn: 'Packaging, Corrugated & Printing', icon: '📦' },
];

const SHIFT_MODELS = [
  { id: '3_shifts_8h', nameAr: '3 ورديات × 8 ساعات (تغطية 24 ساعة مستمرة)', nameEn: '3 Shifts × 8 Hours (24/7 Continuous)' },
  { id: '2_shifts_12h', nameAr: '2 وردية × 12 ساعة (وردية صباحية / مسائية)', nameEn: '2 Shifts × 12 Hours (Day / Night)' },
  { id: '1_shift_day', nameAr: 'وردية واحدة نهارية (8:00 ص إلى 5:00 م)', nameEn: '1 Single Day Shift (8:00 AM - 5:00 PM)' },
  { id: '4_shifts_rot', nameAr: '4 ورديات متناوبة (نظام دوري 24/7)', nameEn: '4 Rotating Shifts (4-Crew 24/7 Schedule)' },
];

export default function SignupPage() {
  const router = useRouter();
  const { registerFactory, updateFactory } = useAuth();
  const { locale, toggleLocale } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isAr = locale === 'ar';

  // Step 1: Factory & Manager Information
  const [step, setStep] = useState<1 | 2>(1);
  const [factoryName, setFactoryName] = useState('');
  const [industry, setIndustry] = useState('plastic');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shiftModel, setShiftModel] = useState('3_shifts_8h');
  const [estimatedLines, setEstimatedLines] = useState(3);
  const [estimatedMachines, setEstimatedMachines] = useState(6);

  // Step 2: AI Onboarding State
  const [onboardingTab, setOnboardingTab] = useState<'sheet' | 'image' | 'voice' | 'presets'>('presets');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [parsedSetup, setParsedSetup] = useState<{
    lines: Array<{ id: string; name: string; code: string }>;
    machines: Array<{ id: string; name: string; code: string; line: string; status: string; target: string }>;
    employees: Array<{ name: string; role: string; line: string; shift: string; stationTask?: string; targetQuota?: string }>;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Validate step 1 and advance to AI Onboarding Assistant
  const handleProceedToAIOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factoryName.trim() || !adminName.trim() || !email.trim() || !password.trim()) {
      setError(isAr ? 'يرجى استكمال جميع البيانات الأساسية للمصنع والإدارة' : 'Please fill all required factory and admin details');
      return;
    }
    setError(null);

    // Auto-load matching preset initially for the chosen industry
    triggerAiOnboarding('preset', industry);
    setStep(2);
  };

  // Trigger AI Onboarding API
  const triggerAiOnboarding = async (type: 'preset' | 'sheet' | 'voice' | 'image', customPayload?: any) => {
    setIsAiLoading(true);
    setError(null);
    try {
      let body: any = {
        isFactoryOnboarding: true,
        locale,
        industry: INDUSTRY_OPTIONS.find((i) => i.id === industry)?.nameAr || industry,
      };

      if (type === 'preset') {
        body.prompt = `تهيئة مصنع ${factoryName || 'جديد'} في قطاع ${industry} بعدد ${estimatedLines} خطوط إنتاج`;
      } else if (type === 'voice') {
        body.prompt = customPayload || aiPrompt || `عندي مصنع ${factoryName} به ${estimatedLines} خطوط إنتاج و${estimatedMachines} ماكينات`;
      } else if (type === 'sheet') {
        body.sheetData = customPayload || 'Lines,Machines,Workers,Shift\nLine 1,EXT-01,Ibrahim,morning\nLine 2,INJ-02,Khaled,morning';
        body.prompt = 'استخرج خطوط الإنتاج والماكينات والعمال من الشيت';
      } else if (type === 'image') {
        body.image = customPayload || 'mock_image_data';
        body.prompt = 'تحليل صورة كشف الصالة وجدول الورديات';
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.factorySetup) {
        setParsedSetup(data.factorySetup);
      }
    } catch (err: any) {
      console.error('AI Onboarding Error:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Handle Sheet / CSV File Upload
  const handleSheetFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      triggerAiOnboarding('sheet', content || file.name);
    };
    reader.readAsText(file);
  };

  // Handle Image Upload (Photo of shop floor schedule or whiteboard)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      triggerAiOnboarding('image', base64);
    };
    reader.readAsDataURL(file);
  };

  // Toggle Voice Recognition
  const toggleListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(isAr ? 'التعرف الصوتي غير مدعوم في متصفحك الحالي. يرجى استخدام متصفح حديث.' : 'Speech recognition not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = isAr ? 'ar-EG' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setAiPrompt((prev) => (prev ? prev + ' ' + transcript : transcript));
        setIsListening(false);
        triggerAiOnboarding('voice', transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Final Confirmation & Launch Factory
  const handleFinalLaunch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await registerFactory({
        factoryName,
        industry: INDUSTRY_OPTIONS.find((i) => i.id === industry)?.nameAr || industry,
        adminName,
        email,
        password,
        shiftModel,
        estimatedLines: parsedSetup ? parsedSetup.lines.length : estimatedLines,
        estimatedMachines: parsedSetup ? parsedSetup.machines.length : estimatedMachines,
      });

      if (res.success && res.factory) {
        // If the AI generated lines, machines, and staff, save them locally for the dashboard
        if (parsedSetup) {
          localStorage.setItem('wrdya_onboarded_setup', JSON.stringify(parsedSetup));
          updateFactory({
            linesCount: parsedSetup.lines.length,
            machinesCount: parsedSetup.machines.length,
            staffCount: parsedSetup.employees.length,
          });
        }
        router.push('/');
      } else {
        setError(res.error || (isAr ? 'حدث خطأ أثناء تسجيل المصنع' : 'Error registering factory'));
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
      <div className="w-full max-w-4xl flex items-center justify-between mb-4 px-2 z-20">
        <Link 
          href="/login" 
          className="text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
          <span>{isAr ? 'لديك حساب مصنع بالفعل؟ تسجيل الدخول' : 'Already have a factory account? Sign In'}</span>
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

      {/* Main Container */}
      <div className="w-full max-w-4xl relative z-10">
        {/* Progress Stepper */}
        <div className="mb-6 flex items-center justify-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            step === 1 ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-zinc-800 text-zinc-400'
          }`}>
            <Building2 className="w-4 h-4" />
            <span>1. {isAr ? 'بيانات المنشأة والمسؤول' : 'Factory & Manager Details'}</span>
          </div>

          <ChevronRight className="w-4 h-4 text-zinc-600 rtl:rotate-180" />

          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            step === 2 ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-zinc-800 text-zinc-400'
          }`}>
            <Bot className="w-4 h-4" />
            <span>2. {isAr ? 'التهيئة الذكية بالذكاء الاصطناعي' : 'AI Onboarding & Floor Setup'}</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            {error}
          </div>
        )}

        {/* STEP 1: Factory & Manager Details */}
        {step === 1 && (
          <div className="neobrutal-card p-6 sm:p-8 border-2 border-zinc-700 bg-[#0d121c] rounded-2xl shadow-2xl">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-zinc-800">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Factory className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {isAr ? 'تسجيل مصنع أو منشأة صناعية جديدة' : 'Register New Factory & Plant Account'}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  {isAr 
                    ? 'أنشئ منظومة مصنعك الرقمية. الموظفون والفنيون يتم تسكينهم وإدارتهم من داخل المنظومة.' 
                    : 'Create your digital plant workspace. Staff, supervisors, and operators are onboarded from within.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleProceedToAIOnboarding} className="space-y-6">
              {/* Section 1: Factory Info */}
              <div>
                <h2 className="text-sm font-black text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {isAr ? 'بيانات المنشأة الصناعية' : 'Industrial Facility Profile'}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      {isAr ? 'اسم المصنع أو الشركة *' : 'Factory / Company Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={factoryName}
                      onChange={(e) => setFactoryName(e.target.value)}
                      placeholder={isAr ? 'مثال: مصنع النيل للبلاستيك والعبوات' : 'e.g. Nile Polymer & Packaging Plant'}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-amber-400 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      {isAr ? 'القطاع الصناعي *' : 'Industry Sector *'}
                    </label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-amber-400 focus:outline-none transition"
                    >
                      {INDUSTRY_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.icon} {isAr ? opt.nameAr : opt.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Shift Operations Model */}
              <div>
                <h2 className="text-sm font-black text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  {isAr ? 'نظام الورديات الأساسي' : 'Shift Rotation Model'}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SHIFT_MODELS.map((model) => (
                    <label
                      key={model.id}
                      onClick={() => setShiftModel(model.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        shiftModel === model.id 
                          ? 'border-amber-400 bg-amber-400/10 text-white' 
                          : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/60 text-zinc-300'
                      }`}
                    >
                      <span className="text-xs font-semibold">{isAr ? model.nameAr : model.nameEn}</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        shiftModel === model.id ? 'border-amber-400 bg-amber-400' : 'border-zinc-600'
                      }`}>
                        {shiftModel === model.id && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Section 3: GM / Admin Profile */}
              <div>
                <h2 className="text-sm font-black text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  {isAr ? 'بيانات مدير المصنع / المسؤول الرئيسي' : 'Plant Director / Admin Account'}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      {isAr ? 'اسم المدير المسؤول *' : 'Director / Manager Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder={isAr ? 'د. طارق فهمي' : 'Dr. Tarek Fahmy'}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-amber-400 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      {isAr ? 'البريد الإلكتروني للعمل *' : 'Work Email *'}
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="director@plant.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-amber-400 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      {isAr ? 'كلمة المرور *' : 'Password *'}
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-amber-400 focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Next Step Button */}
              <div className="pt-4 flex items-center justify-between border-t border-zinc-800">
                <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                  {isAr 
                    ? 'في الخطوة التالية: سيقوم الذكاء الاصطناعي بتوليد خطوط الإنتاج والماكينات وتسكين العمال آلياً.' 
                    : 'Next step: AI will auto-populate machines, lines, and staff roster without manual typing.'}
                </span>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black font-black text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
                >
                  <span>{isAr ? 'متابعة إلى التهيئة الذكية للماكينات والعمال' : 'Proceed to AI Floor Onboarding'}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: Smart AI Plant Onboarding */}
        {step === 2 && (
          <div className="neobrutal-card p-6 sm:p-8 border-2 border-zinc-700 bg-[#0d121c] rounded-2xl shadow-2xl space-y-6">
            {/* Header banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black shadow-lg shadow-amber-500/20">
                  <Bot className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      {isAr ? 'مساعد وردية الذكي لتهيئة المصنع' : 'Wrdya AI Plant Onboarding Agent'}
                    </h2>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                      {isAr ? 'محرك ذكي نشط' : 'Active Local Engine'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                    {isAr
                      ? `مرحباً بك يا ${adminName || 'باشمهندس'}! بدلاً من كتابة الماكينات وقوائم العمال يدوياً واحداً تلو الآخر، ارفع شيت أو صورة أو تحدث وسنقوم بتهيئة المصنع كاملاً في ثوانٍ.`
                      : `Welcome ${adminName}! Instead of typing dozens of machines and staff one by one, upload a sheet, photo, or speak to auto-generate your plant floor.`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 self-start sm:self-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>{isAr ? 'تعديل بيانات المصنع' : 'Edit Factory Details'}</span>
              </button>
            </div>

            {/* Input Modality Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => setOnboardingTab('presets')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 transition ${
                  onboardingTab === 'presets'
                    ? 'border-amber-400 bg-amber-400/10 text-white shadow-md'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
                }`}
              >
                <Zap className="w-5 h-5 text-amber-400" />
                <span>{isAr ? 'قوالب قطاعك الجاهزة' : 'Industry Presets'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOnboardingTab('sheet');
                  fileInputRef.current?.click();
                }}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 transition ${
                  onboardingTab === 'sheet'
                    ? 'border-amber-400 bg-amber-400/10 text-white shadow-md'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <span>{isAr ? 'رفع شيت إكسيل / CSV' : 'Upload Spreadsheet'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOnboardingTab('image');
                  imageInputRef.current?.click();
                }}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 transition ${
                  onboardingTab === 'image'
                    ? 'border-amber-400 bg-amber-400/10 text-white shadow-md'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-5 h-5 text-cyan-400" />
                <span>{isAr ? 'رفع صورة كشف الصالة' : 'Roster Photo / Whiteboard'}</span>
              </button>

              <button
                type="button"
                onClick={() => setOnboardingTab('voice')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 transition ${
                  onboardingTab === 'voice'
                    ? 'border-amber-400 bg-amber-400/10 text-white shadow-md'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
                }`}
              >
                <Mic className="w-5 h-5 text-rose-400" />
                <span>{isAr ? 'إملاء صوتي أو محادثة' : 'Voice or Natural Text'}</span>
              </button>
            </div>

            {/* Hidden file inputs */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.xlsx,.xls,.txt"
              className="hidden"
              onChange={handleSheetFileUpload}
            />
            <input
              type="file"
              ref={imageInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            {/* Voice / Text Prompt Box if 'voice' tab is selected */}
            {onboardingTab === 'voice' && (
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                <label className="block text-xs font-bold text-zinc-300">
                  {isAr 
                    ? 'اكتب أو أملِ بيانات خطوطك وماكيناتك وعمالك بالعامية أو الفصحى:' 
                    : 'Speak or type your lines, machines, and staff in natural language:'}
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder={isAr 
                      ? 'مثال: مصنعنا به 3 خطوط: خط البثق 4 ماكينات و5 عمال، خط التشكيل 3 ماكينات و6 عمال، وخط التعبئة. المهندس محمود مسؤول صيانة، وأحمد عادل مشرف وردية صباحية.' 
                      : 'e.g. 3 lines: Extrusion has 4 machines and 5 operators, Forming has 3 machines, Packaging has 2 machines. Eng. Ahmed is supervisor...'}
                    className="w-full p-3 rounded-xl bg-[#090d14] border border-zinc-700 text-white text-xs sm:text-sm focus:border-amber-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`absolute bottom-3 end-3 p-2 rounded-xl transition ${
                      isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-zinc-800 text-zinc-300 hover:text-white'
                    }`}
                    title={isListening ? 'Stop listening' : 'Start speaking'}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => triggerAiOnboarding('voice')}
                    disabled={isAiLoading || !aiPrompt.trim()}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-black text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تحليل وتوليد صالة الإنتاج' : 'Analyze & Generate Floor'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Presets Quick Action */}
            {onboardingTab === 'presets' && (
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>
                      {isAr 
                        ? `قالب صناعي ذكي معتمد لقطاع: ${INDUSTRY_OPTIONS.find((i) => i.id === industry)?.nameAr}` 
                        : `Certified smart template for: ${INDUSTRY_OPTIONS.find((i) => i.id === industry)?.nameEn}`}
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    {isAr 
                      ? 'يحتوي على خطوط الإنتاج القياسية، ماكينات التشغيل الرئيسية، وتسكين افتراضي لفريق الصيانة والتشغيل.' 
                      : 'Includes standard production lines, primary machinery, and pre-assigned shift staff.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => triggerAiOnboarding('preset', industry)}
                  disabled={isAiLoading}
                  className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-black text-xs font-black shrink-0 transition"
                >
                  {isAiLoading ? (isAr ? 'جاري التوليد...' : 'Generating...') : (isAr ? 'توليد القالب الآن ⚡' : 'Generate Preset ⚡')}
                </button>
              </div>
            )}

            {/* Loading Indicator */}
            {isAiLoading && (
              <div className="p-8 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs sm:text-sm font-bold text-white">
                  {isAr ? 'جاري تحليل وهيكلة صالة الإنتاج وتسكين العمال بواسطة المساعد الذكي...' : 'AI is structuring plant lines, machines, and staff roster...'}
                </p>
              </div>
            )}

            {/* AI Generated Setup Preview */}
            {parsedSetup && !isAiLoading && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isAr ? 'المعاينة الحية لهيكل مصنعك المقترح' : 'Live Preview of Generated Plant Floor'}</span>
                  </h3>
                  <span className="text-xs text-zinc-400">
                    {parsedSetup.lines.length} {isAr ? 'خطوط' : 'lines'} • {parsedSetup.machines.length} {isAr ? 'ماكينات' : 'machines'} • {parsedSetup.employees.length} {isAr ? 'موظفين' : 'staff'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Lines Card */}
                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-2">
                      <Layers className="w-3.5 h-3.5" />
                      <span>{isAr ? 'خطوط الإنتاج' : 'Production Lines'}</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-zinc-300">
                      {parsedSetup.lines.map((line) => (
                        <li key={line.id} className="flex items-center gap-1.5 p-1 rounded bg-zinc-800/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          <span className="truncate">{line.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Machines Card */}
                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                    <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 mb-2">
                      <Cpu className="w-3.5 h-3.5" />
                      <span>{isAr ? 'الماكينات والمعدات' : 'Key Machinery'}</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-zinc-300">
                      {parsedSetup.machines.map((m) => (
                        <li key={m.id} className="flex items-center justify-between p-1 rounded bg-zinc-800/50">
                          <span className="truncate">{m.name}</span>
                          <span className="text-[10px] font-mono px-1 rounded bg-zinc-700 text-zinc-300">{m.code}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Workforce Card */}
                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-2">
                      <Users className="w-3.5 h-3.5" />
                      <span>{isAr ? 'كشف الموظفين والورديات' : 'Staff Assignments'}</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-zinc-300">
                      {parsedSetup.employees.slice(0, 4).map((emp, idx) => (
                        <li key={idx} className="flex items-center justify-between p-1 rounded bg-zinc-800/50">
                          <span className="truncate">{emp.name}</span>
                          <span className="text-[10px] text-zinc-400">{emp.role}</span>
                        </li>
                      ))}
                      {parsedSetup.employees.length > 4 && (
                        <li className="text-[11px] text-zinc-400 text-center">
                          +{parsedSetup.employees.length - 4} {isAr ? 'موظفين إضافيين مسكنين' : 'more staff assigned'}
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Launch Buttons */}
            <div className="pt-6 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleFinalLaunch}
                disabled={isLoading}
                className="text-xs text-zinc-400 hover:text-white transition order-2 sm:order-1"
              >
                {isAr ? 'تخطي والتهيئة اليدوية لاحقاً ➔' : 'Skip & Configure Manually Later ➔'}
              </button>

              <button
                type="button"
                onClick={handleFinalLaunch}
                disabled={isLoading}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer order-1 sm:order-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>{isAr ? 'جاري إطلاق المصنع...' : 'Launching Factory...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{isAr ? '🚀 اعتماد وتشغيل المصنع والانتقال للصالة' : '🚀 Confirm & Launch Factory Now'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
