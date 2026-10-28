'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  Sun, 
  Moon, 
  Globe, 
  Cpu, 
  Upload,
  FileSpreadsheet,
  Image as ImageIcon,
  Mic,
  MicOff,
  Sparkles,
  Bot,
  Zap,
  Building2,
  Users,
  Layers,
  Sliders,
  Send,
  Plus,
  Trash2,
  Check,
  AlertCircle
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  autoFilled?: boolean;
}

interface FormLine {
  id: string;
  name: string;
  code: string;
}

interface FormMachine {
  id: string;
  name: string;
  code: string;
  line: string;
  target?: string;
}

interface FormEmployee {
  name: string;
  role: 'operator' | 'supervisor' | 'maintenance' | 'admin';
  line: string;
  shift: 'morning' | 'evening' | 'night';
  stationTask?: string;
  targetQuota?: string;
}

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
  { id: '3_shifts_8h', nameAr: '3 ورديات × 8 ساعات (تغطية 24/7)', nameEn: '3 Shifts × 8 Hours (24/7 Continuous)' },
  { id: '2_shifts_12h', nameAr: '2 وردية × 12 ساعة (صباحية / مسائية)', nameEn: '2 Shifts × 12 Hours (Day / Night)' },
  { id: '1_shift_day', nameAr: 'وردية واحدة نهارية (8 ص - 5 م)', nameEn: '1 Single Day Shift (8:00 AM - 5:00 PM)' },
  { id: '4_shifts_rot', nameAr: '4 ورديات متناوبة (نظام دوري مستمر)', nameEn: '4 Rotating Shifts (24/7 Continual)' },
];

export default function SignupPage() {
  const router = useRouter();
  const { registerFactory, updateFactory } = useAuth();
  const { locale, toggleLocale } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isAr = locale === 'ar';

  // Single Unified Form State
  const [factoryName, setFactoryName] = useState(isAr ? 'مصنع النيل للبلاستيك والبوليمر' : 'Nile Polymer & Plastics Plant');
  const [industry, setIndustry] = useState('plastic');
  const [shiftModel, setShiftModel] = useState('3_shifts_8h');
  const [adminName, setAdminName] = useState(isAr ? 'د. طارق فهمي' : 'Dr. Tarek Fahmy');
  const [email, setEmail] = useState('manager@wrdya.com');
  const [password, setPassword] = useState('123456');

  // Unified Lines, Machines & Employees
  const [lines, setLines] = useState<FormLine[]>([
    { id: 'L-1', name: isEnText('خط 1: تجهيز وتغذية الخامات', 'Line 1: Raw Material Feeding'), code: 'EXT-LINE' },
    { id: 'L-2', name: isEnText('خط 2: التشكيل والحقن الرئيسي', 'Line 2: Injection Molding & Press'), code: 'INJ-LINE' },
    { id: 'L-3', name: isEnText('خط 3: التعبئة والتغليف الآلي', 'Line 3: High-Speed Packaging'), code: 'PKG-LINE' },
  ]);

  const [machines, setMachines] = useState<FormMachine[]>([
    { id: 'm-1', name: isEnText('ماكينة البثق الرئيسية 01', 'Main Extruder Unit 01'), code: 'EXT-01', line: 'EXT-LINE', target: '1,400 u/h' },
    { id: 'm-2', name: isEnText('مكبس الحقن الهيدروليكي 02', 'Hydraulic Injection Press 02'), code: 'INJ-02', line: 'INJ-LINE', target: '950 u/h' },
    { id: 'm-3', name: isEnText('وحدة التشكيل الحراري 03', 'Thermal Former Unit 03'), code: 'THF-03', line: 'INJ-LINE', target: '1,100 u/h' },
    { id: 'm-4', name: isEnText('خط التعبئة والتغليف 04', 'Packaging Line 04'), code: 'PKG-04', line: 'PKG-LINE', target: '2,200 u/h' },
  ]);

  const [employees, setEmployees] = useState<FormEmployee[]>([
    { name: isEnText('م. أحمد عادل', 'Eng. Ahmed Adel'), role: 'supervisor', line: 'صالة المصنع بالكامل', shift: 'morning', stationTask: 'إشراف عام', targetQuota: '85% OEE' },
    { name: isEnText('م. محمود صقر', 'Eng. Mahmoud Saqr'), role: 'maintenance', line: 'فريق الطوارئ', shift: 'morning', stationTask: 'صيانة كهرباء و PLC' },
    { name: isEnText('حسام كمال', 'Hossam Kamal'), role: 'operator', line: 'EXT-01', shift: 'morning', stationTask: 'تلقيم الخامات', targetQuota: '1,400 كرتونة' },
    { name: isEnText('سالم الدسوقي', 'Salem El-Dessouky'), role: 'operator', line: 'INJ-02', shift: 'morning', stationTask: 'تشغيل القوالب', targetQuota: '950 قطعة' },
  ]);

  // AI Chat Assistant State
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoFillBadge, setAutoFillBadge] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: isAr 
        ? `أهلاً بك يا فندم! أنا **مساعد وردية الذكي** 🤖

أنا هنا لمساعدتك في **ملء فورم تسجيل المصنع كاملاً آلياً**:
- 📂 **ارفع شيت إكسيل أو CSV** للماكينات والعمال.
- 📸 **ارفع صورة كشف الصالة أو سبورة الورديات**.
- 🎙️ **أو تكلّم معي أو اكتب بيانات مصنعك** وسأقوم بملء الحقول وتسكين العمال فوراً أمامك!`
        : `Welcome! I am **Wrdya AI Plant Assistant** 🤖

I am here to help you **fill this entire factory registration form automatically**:
- 📂 **Upload Excel / CSV sheet** with your machines & workers.
- 📸 **Upload a photo of your roster or whiteboard**.
- 🎙️ **Or speak / type your factory details** and I will auto-fill every field in realtime!`,
      timestamp: isAr ? 'الآن' : 'Now',
    },
  ]);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const sheetInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  function isEnText(ar: string, en: string) {
    return isAr ? ar : en;
  }

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiLoading]);

  // Handle Chat Submissions & Form Auto-Population
  const handleSendChat = async (customPrompt?: string, fileData?: { type: 'sheet' | 'image'; payload: string }) => {
    const promptToSend = customPrompt || chatInput;
    if (!promptToSend && !fileData) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: promptToSend || (fileData?.type === 'sheet' ? (isAr ? '📂 تم رفع شيت إكسيل للعمال والماكينات' : '📂 Uploaded spreadsheet') : (isAr ? '📸 تم رفع صورة كشف الصالة' : '📸 Uploaded whiteboard photo')),
      timestamp: isAr ? 'الآن' : 'Now',
    };

    setChatMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setChatInput('');
    setIsAiLoading(true);
    setError(null);

    try {
      const body: any = {
        isFactoryOnboarding: true,
        locale,
        prompt: promptToSend,
        industry: INDUSTRY_OPTIONS.find((i) => i.id === industry)?.nameAr || industry,
      };

      if (fileData?.type === 'sheet') body.sheetData = fileData.payload;
      if (fileData?.type === 'image') body.image = fileData.payload;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.factorySetup) {
        // Auto-fill the form fields in realtime!
        if (data.factorySetup.lines && data.factorySetup.lines.length > 0) {
          setLines(data.factorySetup.lines);
        }
        if (data.factorySetup.machines && data.factorySetup.machines.length > 0) {
          setMachines(data.factorySetup.machines);
        }
        if (data.factorySetup.employees && data.factorySetup.employees.length > 0) {
          setEmployees(data.factorySetup.employees);
        }

        // Try extracting plant name or industry if mentioned
        const lower = (promptToSend || '').toLowerCase();
        if (lower.includes('غزل') || lower.includes('نسيج') || lower.includes('textile')) {
          setIndustry('textile');
          if (!factoryName || factoryName.includes('بلاستيك')) {
            setFactoryName(isAr ? 'مجمع الدلتا للغزل والنسيج' : 'Delta Textile & Spinning Mill');
          }
        } else if (lower.includes('غذائ') || lower.includes('food') || lower.includes('عصير') || lower.includes('أغذية')) {
          setIndustry('food');
          if (!factoryName || factoryName.includes('بلاستيك')) {
            setFactoryName(isAr ? 'شركة الأهرام للصناعات الغذائية' : 'Al-Ahram Food Processing Co.');
          }
        } else if (lower.includes('معادن') || lower.includes('تشغيل') || lower.includes('cnc') || lower.includes('metal')) {
          setIndustry('metal');
          if (!factoryName || factoryName.includes('بلاستيك')) {
            setFactoryName(isAr ? 'المصرية لتشغيل وتشكيل المعادن CNC' : 'Egyptian CNC Machining Works');
          }
        }

        setAutoFillBadge(isAr ? 'تم ملء وتحديث بيانات الفورم آلياً بنجاح! ✨' : 'Form fields auto-filled in realtime! ✨');
        setTimeout(() => setAutoFillBadge(null), 6000);
      }

      const aiReply: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply || (isAr ? 'تم استخراج البيانات وملء الفورم تلقائياً.' : 'Data extracted and form populated.'),
        timestamp: isAr ? 'الآن' : 'Now',
        autoFilled: !!data.factorySetup,
      };

      setChatMessages((prev) => [...prev, aiReply]);
    } catch (err: any) {
      console.error('Chat AI Error:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Quick Preset Handlers
  const handleApplyPreset = (sectorId: string) => {
    setIndustry(sectorId);
    const sec = INDUSTRY_OPTIONS.find((s) => s.id === sectorId);
    handleSendChat(isAr ? `املأ فورم مصنع في قطاع ${sec?.nameAr} وقم بتهيئة خطوط الإنتاج والماكينات وتسكين العمال` : `Populate factory form for ${sec?.nameEn} with production lines, machinery, and staff roster`);
  };

  // Handle Sheet / CSV File Upload
  const handleSheetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleSendChat(undefined, { type: 'sheet', payload: content || file.name });
    };
    reader.readAsText(file);
  };

  // Handle Image Upload (Photo of schedule or whiteboard)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      handleSendChat(undefined, { type: 'image', payload: base64 });
    };
    reader.readAsDataURL(file);
  };

  // Voice Recognition
  const toggleListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(isAr ? 'التعرف الصوتي غير مدعوم في هذا المتصفح' : 'Speech recognition not supported in this browser');
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
        setIsListening(false);
        handleSendChat(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Add / Remove Lines & Machines manually
  const handleAddLine = () => {
    const num = lines.length + 1;
    setLines((prev) => [...prev, { id: `L-${num}`, name: isAr ? `خط إنتاج جديد 0${num}` : `New Line 0${num}`, code: `LINE-0${num}` }]);
  };

  const handleRemoveLine = (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const handleAddEmployee = () => {
    setEmployees((prev) => [
      ...prev,
      { name: isAr ? 'عامل جديد' : 'New Worker', role: 'operator', line: lines[0]?.code || 'EXT-01', shift: 'morning', stationTask: isAr ? 'تشغيل عام' : 'General' }
    ]);
  };

  const handleRemoveEmployee = (idx: number) => {
    setEmployees((prev) => prev.filter((_, i) => i !== idx));
  };

  // Single Form Submit
  const handleUnifiedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factoryName.trim() || !adminName.trim() || !email.trim() || !password.trim()) {
      setError(isAr ? 'يرجى استكمال جميع بيانات المصنع والمدير الأساسية' : 'Please complete all required fields');
      return;
    }

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
        estimatedLines: lines.length,
        estimatedMachines: machines.length,
      });

      if (res.success && res.factory) {
        // Persist onboarded setup
        const fullSetup = {
          lines,
          machines,
          employees,
        };
        localStorage.setItem('wrdya_onboarded_setup', JSON.stringify(fullSetup));
        updateFactory({
          linesCount: lines.length,
          machinesCount: machines.length,
          staffCount: employees.length,
        });

        router.push('/');
      } else {
        setError(res.error || (isAr ? 'فشل تسجيل المصنع' : 'Failed to register factory'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#07090e] text-white p-3 sm:p-6 lg:p-8 neobrutal-grid-bg relative overflow-x-hidden ${isAr ? 'rtl' : 'ltr'}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Background Glows */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />

      {/* Header Bar */}
      <header className="max-w-7xl mx-auto flex items-center justify-between mb-6 px-2 relative z-20">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="wrdya-brand-mark w-10 h-10">
              <div className="wrdya-brand-mark__core">
                <Factory className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <span className="font-black text-lg text-white flex items-center gap-1.5">
                وردية <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">AI Industrial</span>
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link 
            href="/login" 
            className="text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            <span className="hidden sm:inline">{isAr ? 'لديك حساب مصنع بالفعل؟' : 'Already have account?'}</span>
            <span className="font-bold text-amber-400">{isAr ? 'تسجيل الدخول' : 'Sign In'}</span>
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-700 transition"
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-zinc-200" />}
          </button>

          <button
            type="button"
            onClick={toggleLocale}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-bold transition"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isAr ? 'EN' : 'عربي'}</span>
          </button>
        </div>
      </header>

      {/* Main Container: Unified Single Form & AI Assistant Grid */}
      <main className="max-w-7xl mx-auto relative z-10 space-y-6">
        
        {/* Top Banner Notice */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#0d131f] to-zinc-900 border-2 border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>{isAr ? 'فورم تسجيل المصنع الذكي الموحد' : 'Unified AI Factory Registration'}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {isAr ? 'شاشة واحدة متكاملة' : 'Single Unified Screen'}
                </span>
              </h1>
              <p className="text-xs text-zinc-300 mt-1">
                {isAr 
                  ? 'املأ بيانات مصنعك في الفورم، أو استخدم مساعد وردية الذكي في الشات لرفع شيت أو صورة أو محادثة لملء وتسكين خطوط الإنتاج والماكينات والعمال آلياً أمامك!'
                  : 'Fill the form directly or use the integrated AI Chat Assistant to upload a sheet, photo, or speak to auto-populate lines, machines, and staff!'}
              </p>
            </div>
          </div>

          {autoFillBadge && (
            <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black flex items-center gap-2 animate-bounce">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>{autoFillBadge}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* 2-Column Split: Form (Right) & AI Chat Assistant (Left) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* COLUMN 1: AI Chat Assistant (5 Cols) */}
          <div className="lg:col-span-5 neobrutal-card bg-[#0d121c] border-2 border-zinc-700 rounded-2xl p-4 sm:p-5 flex flex-col h-[760px] shadow-2xl relative">
            
            {/* Chat Assistant Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-black flex items-center justify-center font-black">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                    {isAr ? 'مساعد وردية الذكي' : 'Wrdya AI Assistant'}
                    <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-emerald" />
                  </h3>
                  <p className="text-[10px] text-zinc-400">
                    {isAr ? 'يملأ الفورم تلقائياً من الصوت، الشيتات والصور' : 'Auto-fills form from voice, sheets & photos'}
                  </p>
                </div>
              </div>

              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono">
                AI Copilot
              </span>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-3 gap-1.5 py-2.5 border-b border-zinc-800/80">
              <button
                type="button"
                onClick={() => sheetInputRef.current?.click()}
                className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-bold text-zinc-300 hover:text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
                title={isAr ? 'رفع شيت إكسيل أو CSV' : 'Upload Spreadsheet'}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAr ? 'شيت إكسيل' : 'Excel Sheet'}</span>
              </button>

              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-bold text-zinc-300 hover:text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
                title={isAr ? 'رفع صورة كشف الصالة' : 'Upload Photo'}
              >
                <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isAr ? 'صورة كشف' : 'Roster Pic'}</span>
              </button>

              <button
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  isListening ? 'bg-rose-500 text-white border-rose-400 animate-pulse' : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white'
                }`}
                title={isListening ? 'إيقاف التسجيل' : 'تحدث بالمايك'}
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-rose-400" />}
                <span>{isListening ? (isAr ? 'أستمع...' : 'Listening...') : (isAr ? 'إملاء صوتي' : 'Voice')}</span>
              </button>
            </div>

            {/* Hidden file inputs */}
            <input
              type="file"
              ref={sheetInputRef}
              accept=".csv,.xlsx,.xls,.txt"
              className="hidden"
              onChange={handleSheetUpload}
            />
            <input
              type="file"
              ref={imageInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            {/* Quick Presets Pills */}
            <div className="py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[10px]">
              <span className="text-zinc-500 font-bold shrink-0">{isAr ? 'قوالب سريعة:' : 'Quick Presets:'}</span>
              <button
                type="button"
                onClick={() => handleApplyPreset('plastic')}
                className="px-2 py-1 rounded bg-zinc-900 hover:bg-amber-400 hover:text-black border border-zinc-800 text-zinc-300 shrink-0 font-medium transition cursor-pointer"
              >
                🧪 {isAr ? 'بلاستيك وبثق' : 'Plastics'}
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('textile')}
                className="px-2 py-1 rounded bg-zinc-900 hover:bg-amber-400 hover:text-black border border-zinc-800 text-zinc-300 shrink-0 font-medium transition cursor-pointer"
              >
                🧵 {isAr ? 'غزل ونسيج' : 'Textile'}
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('food')}
                className="px-2 py-1 rounded bg-zinc-900 hover:bg-amber-400 hover:text-black border border-zinc-800 text-zinc-300 shrink-0 font-medium transition cursor-pointer"
              >
                🥫 {isAr ? 'صناعات غذائية' : 'Food'}
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('metal')}
                className="px-2 py-1 rounded bg-zinc-900 hover:bg-amber-400 hover:text-black border border-zinc-800 text-zinc-300 shrink-0 font-medium transition cursor-pointer"
              >
                ⚙️ {isAr ? 'ميكنة CNC' : 'CNC Metal'}
              </button>
            </div>

            {/* Chat Stream */}
            <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1 text-xs">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[90%] p-3 rounded-2xl leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-amber-500 text-black font-semibold rounded-br-sm'
                        : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-bl-sm'
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.text}</div>

                    {msg.autoFilled && (
                      <div className="mt-2 pt-1.5 border-t border-zinc-700/60 text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>{isAr ? 'تم تطبيق البيانات في الفورم المقابل تلقائياً' : 'Applied to form automatically'}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-zinc-500 mt-1 px-1">{msg.timestamp}</span>
                </div>
              ))}

              {isAiLoading && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs">
                  <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span>{isAr ? 'المساعد يحلل البيانات ويملأ الفورم...' : 'AI is parsing and populating form...'}</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              className="pt-2 border-t border-zinc-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={isAr ? 'تحدث للمساعد: مثلاً "عندي مصنع 3 خطوط و 8 عمال..."' : 'Speak to AI: e.g. "My factory has 3 lines and 8 staff..."'}
                className="flex-1 px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400 transition"
              />

              <button
                type="submit"
                disabled={isAiLoading || !chatInput.trim()}
                className="p-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-black disabled:opacity-40 transition cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4 rtl:rotate-180" />
              </button>
            </form>
          </div>

          {/* COLUMN 2: Unified Factory Registration Form (7 Cols) */}
          <div className="lg:col-span-7 neobrutal-card bg-[#0d121c] border-2 border-zinc-700 rounded-2xl p-6 sm:p-7 shadow-2xl">
            <form onSubmit={handleUnifiedSubmit} className="space-y-6">
              
              {/* SECTION 1: Facility Details */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <h2 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span>{isAr ? '1. بيانات المنشأة والمصنع' : '1. Factory Facility Profile'}</span>
                  </h2>
                  <span className="text-[11px] text-zinc-400 font-mono">Step 1 of 3</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center justify-between">
                      <span>{isAr ? 'اسم المصنع أو الشركة *' : 'Factory / Company Name *'}</span>
                      <span className="text-[10px] text-amber-400 font-normal">{isAr ? 'يدعم الملء الذكي' : 'AI Powered'}</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={factoryName}
                      onChange={(e) => setFactoryName(e.target.value)}
                      placeholder={isAr ? 'اسم المنشأة' : 'Plant Name'}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs sm:text-sm focus:border-amber-400 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      {isAr ? 'القطاع الصناعي *' : 'Industrial Sector *'}
                    </label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs sm:text-sm focus:border-amber-400 focus:outline-none transition"
                    >
                      {INDUSTRY_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.icon} {isAr ? opt.nameAr : opt.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-2">
                    {isAr ? 'نظام الورديات الأساسي في المصنع *' : 'Primary Shift Rotation Model *'}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SHIFT_MODELS.map((model) => (
                      <label
                        key={model.id}
                        onClick={() => setShiftModel(model.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between text-xs ${
                          shiftModel === model.id
                            ? 'border-amber-400 bg-amber-400/10 text-white font-bold'
                            : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        <span>{isAr ? model.nameAr : model.nameEn}</span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          shiftModel === model.id ? 'border-amber-400 bg-amber-400' : 'border-zinc-600'
                        }`}>
                          {shiftModel === model.id && <span className="w-1 h-1 rounded-full bg-black" />}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 2: General Manager Account */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <h2 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{isAr ? '2. حساب المدير العام / المسؤول' : '2. General Manager / Director Account'}</span>
                  </h2>
                  <span className="text-[11px] text-zinc-400 font-mono">Step 2 of 3</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      {isAr ? 'اسم المدير *' : 'Manager Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="د. طارق فهمي"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs sm:text-sm focus:border-amber-400 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                      {isAr ? 'البريد الرسمي للعمل *' : 'Work Email *'}
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="manager@plant.com"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs sm:text-sm focus:border-amber-400 focus:outline-none transition"
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
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs sm:text-sm focus:border-amber-400 focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Production Lines & Key Machines */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <h2 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    <span>{isAr ? '3. صالة الإنتاج والماكينات المسجلة' : '3. Plant Floor Lines & Machinery'}</span>
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddLine}
                      className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isAr ? 'إضافة خط' : 'Add Line'}</span>
                    </button>
                    <span className="text-[11px] text-zinc-400 font-mono">({lines.length} خطوط • {machines.length} ماكينات)</span>
                  </div>
                </div>

                {/* Lines Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {lines.map((l) => (
                    <div key={l.id} className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        <span className="truncate text-white font-medium">{l.name}</span>
                      </div>
                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(l.id)}
                          className="text-zinc-500 hover:text-rose-400 transition ml-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Machines List Preview */}
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <span className="text-[11px] text-zinc-400 font-bold block mb-2">
                    {isAr ? 'الماكينات المولدة والمجهزة للتتبع والـ OEE:' : 'Configured Machinery for OEE & Tracking:'}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {machines.map((m) => (
                      <div key={m.id} className="p-2 rounded-lg bg-zinc-800/60 border border-zinc-700/60 text-[11px] flex flex-col justify-between">
                        <span className="text-white font-bold truncate">{m.name}</span>
                        <div className="flex items-center justify-between mt-1 text-[10px] text-zinc-400">
                          <span className="font-mono bg-zinc-700/60 px-1 rounded text-amber-300">{m.code}</span>
                          <span>{m.target || '1,000 u/h'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 4: Staff Assignments / Roster */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <h2 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{isAr ? '4. كشف الموظفين وتوزيع الورديات' : '4. Initial Staff Roster'}</span>
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddEmployee}
                      className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isAr ? 'إضافة موظف' : 'Add Staff'}</span>
                    </button>
                    <span className="text-[11px] text-zinc-400 font-mono">({employees.length} مسكنين)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {employees.map((emp, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          <span>{emp.name}</span>
                          <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
                            {emp.role === 'supervisor' ? 'مشرف' : emp.role === 'maintenance' ? 'صيانة' : 'تشغيل'}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          {emp.line} • {emp.shift === 'morning' ? 'الوردية الصباحية' : 'وردية أخرى'} • {emp.stationTask || 'تشغيل عام'}
                        </p>
                      </div>

                      {employees.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveEmployee(idx)}
                          className="text-zinc-500 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Unified Submit Button */}
              <div className="pt-6 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-zinc-400 leading-relaxed text-center sm:text-right">
                  <span className="block font-bold text-zinc-300">
                    {isAr ? 'جاهز لإطلاق مصنعك الرقمي؟' : 'Ready to launch your digital plant?'}
                  </span>
                  <span>
                    {isAr ? 'سيتم حفظ كافة الماكينات والخطوط وكشف العمال ونقلك مباشرة لصالة الإنتاج.' : 'All lines, machines, and staff will be initialized into your live workspace.'}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transition cursor-pointer shrink-0"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>{isAr ? 'جاري إنشاء المصنع وتشغيل الصالة...' : 'Launching Factory...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{isAr ? '🚀 اعتماد وتسجيل المصنع وتشغيل الصالة فوراً' : '🚀 Confirm & Launch Factory Now'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

        </div>

      </main>
    </div>
  );
}
