'use client';

import React, { useState, useRef, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Bot,
  Sparkles,
  Send,
  Mic,
  MicOff,
  Image as ImageIcon,
  Paperclip,
  Trash2,
  Copy,
  Check,
  Loader2,
  Zap,
  Users,
  Wrench,
  FileText,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Cpu,
  Layers,
  Clock,
  ShieldCheck,
  Download
} from 'lucide-react';
import Link from 'next/link';

interface StaffItem {
  name: string;
  role: 'operator' | 'supervisor' | 'maintenance' | 'admin' | string;
  line: string;
  shift: string;
  stationTask?: string;
  targetQuota?: string;
  supervisedSector?: string;
  radioChannel?: string;
  technicalSpecialty?: string;
  toolboxId?: string;
  operationalDivision?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  image?: string;
  rosterData?: {
    employees: StaffItem[];
    source?: string;
  };
  diagnosticData?: {
    machineCode: string;
    rootCause: string;
    actions: string[];
    priority: 'high' | 'critical' | 'medium';
  };
}

export default function CopilotPage() {
  const { locale } = useLanguage();
  const { user } = useAuth();
  const isAr = locale === 'ar';

  const [activeTab, setActiveTab] = useState<'all' | 'roster' | 'diagnostic' | 'handover' | 'oee'>('all');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: isAr
        ? `أهلاً بك في **محطة مساعد وردية الصناعي الذكي** 🤖⚡
نظام الذكاء الاصطناعي التشغيلي المتخصص لصالات الإنتاج والورديات.

يمكنني تنفيذ المهام الصناعية التالية فوراً:
1. 👥 **تسكين كشوف العمال والورديات**: ارفع صورة الكشف أو ملف إكسيل أو اكتب الأسماء وسأوزعهم بذكاء مع متطلبات كل دور.
2. 🛠️ **تشخيص الأعطال وأدلة الـ SOP**: أدخل كود العطل أو صف مشكلة الماكينة وسأعطيك بروتوكول الإصلاح السريع.
3. 📋 **صياغة مسودات تسليم الوردية**: تجميع كميات الإنتاج والأعطال الجارية لتسليم سلس للوردية التالية.
4. 📊 **تحليل الفواقد والـ OEE**: تشريح فواقد التوقف والسرعة والجودة وتقديم خطط تحسين.

اختر من النماذج الجاهزة أدناه أو اكتب استفسارك مباشرة:`
        : `Welcome to **Wrdya Industrial AI Copilot Workstation** 🤖⚡
Dedicated real-time operational intelligence for plant floors and shifts.

Capabilities available right now:
1. 👥 **Staff Roster Auto-Allocation**: Upload photo, spreadsheet screenshot, or describe shift requirements to assign crew.
2. 🛠️ **Diagnostic & Rapid SOP Guidance**: Enter machine code or breakdown symptom for immediate resolution procedure.
3. 📋 **Shift Handover Protocol**: Auto-draft comprehensive handover log for the incoming shift team.
4. 📊 **OEE & Six Big Losses Deep-Dive**: Quantify availability, speed, and quality drops.

Select a quick action below or type your inquiry:`,
      timestamp: isAr ? 'الآن' : 'Just now',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [appliedRosterSuccess, setAppliedRosterSuccess] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Voice recognition init
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = isAr ? 'ar-EG' : 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsListening(false);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
      }
    }
  }, [isAr]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert(isAr ? 'الإدخال الصوتي غير مدعوم في هذا المتصفح' : 'Speech recognition not supported in this browser');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if ((!query || !query.trim()) && !selectedImage) return;

    const userMsgId = `usr-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
      image: selectedImage || undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    const curImage = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          locale: isAr ? 'ar' : 'en',
          image: curImage || undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to reach AI service');

      const data = await res.json();
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply || (isAr ? 'تم استلام البيانات وتحليلها بنجاح.' : 'Data received and analyzed successfully.'),
        timestamp: new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
        rosterData: data.rosterData,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          text: isAr
            ? '⚠️ عذراً، تعذر الاتصال بمحرك التحليل الصناعي حالياً. يرجى المحاولة مرة أخرى.'
            : '⚠️ Apologies, could not communicate with the industrial engine. Please try again.',
          timestamp: new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyRoster = (employees: StaffItem[]) => {
    try {
      localStorage.setItem('wrdya_live_roster', JSON.stringify(employees));
      setAppliedRosterSuccess(true);
      setTimeout(() => setAppliedRosterSuccess(false), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    if (confirm(isAr ? 'هل تريد مسح سجل المحادثة الحالي؟' : 'Clear current conversation transcript?')) {
      setMessages([
        {
          id: 'welcome-reset',
          sender: 'ai',
          text: isAr ? 'تم بدء جلسة محادثة جديدة. كيف يمكنني مساعدتك؟' : 'New session started. How can I help you?',
          timestamp: isAr ? 'الآن' : 'Now',
        },
      ]);
    }
  };

  const exportTranscript = () => {
    const textContent = messages.map(m => `[${m.timestamp}] ${m.sender.toUpperCase()}:\n${m.text}\n`).join('\n---\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wrdya-copilot-transcript-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const PROMPT_TEMPLATES = [
    {
      category: 'roster',
      label: isAr ? '👥 تسكين كشف عمال وردية الصباح' : '👥 Morning Shift Crew Assignment',
      prompt: isAr
        ? 'قم بتسكين كشف عمال الوردية الصباحية: خط 1 (بثق) 4 فنيين، خط 2 (حقن) 3 فنيين ومشرف وردية وفني صيانة ميكانيكية.'
        : 'Assign morning shift crew: Line 1 (Extrusion) 4 operators, Line 2 (Injection) 3 operators, 1 supervisor, and 1 mechanical maintenance tech.',
    },
    {
      category: 'diagnostic',
      label: isAr ? '🛠️ تشخيص توقف ماكينة INJ-02' : '🛠️ Diagnose INJ-02 Hydraulic Drop',
      prompt: isAr
        ? 'ماكينة الحقن INJ-02 توقفت بسبب انخفاض ضغط الزيت الهيدروليكي وصوت صفير في المضخة. ما هو بروتوكول الفحص الفوري (SOP)؟'
        : 'Injection press INJ-02 halted with low hydraulic oil pressure alert and pump cavitation noise. Provide immediate SOP troubleshooting protocol.',
    },
    {
      category: 'handover',
      label: isAr ? '📋 صياغة مسودة تسليم الوردية' : '📋 Draft Shift Handover Protocol',
      prompt: isAr
        ? 'أريد صياغة مسودة تسليم الوردية الصباحية: حققنا 5,610 قطعة من مستهدف 6,000، توقفت ماكينة INJ-02 لمدة 42 دقيقة، وهناك صيانة وقائية مجدولة للوردية المسائية.'
        : 'Draft shift handover report: achieved 5,610 units out of 6,000 target, INJ-02 stopped for 42 minutes, and scheduled PM is pending for evening shift.',
    },
    {
      category: 'oee',
      label: isAr ? '📊 تحليل فواقد OEE ومعدل الهدر' : '📊 OEE Six Big Losses Analysis',
      prompt: isAr
        ? 'حلل لي أداء الوردية الحالية: التوافر 89.4%، الأداء 92.2%، الجودة 95.1% مع هدر 1.7%. ما هي أكبر فجوة خسارة وكيف نعوضها؟'
        : 'Analyze current shift performance: Availability 89.4%, Performance 92.2%, Quality 95.1% with 1.7% scrap. What is the biggest loss gap and remediation?',
    },
  ];

  return (
    <AppLayout
      pageTitle={isAr ? 'محطة مساعد وردية الذكي' : 'AI Industrial Copilot Workstation'}
      pageSubtitle={isAr ? 'المساعد التشغيلي الذكي لتسكين العمال، تشخيص الماكينات، وصياغة بروتوكولات التسليم' : 'Autonomous industrial copilot for shift allocation, machinery diagnostics, and handover protocols'}
      actionButton={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportTranscript}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-semibold transition"
            title={isAr ? 'تصدير المحادثة' : 'Export Transcript'}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isAr ? 'تصدير السجل' : 'Export'}</span>
          </button>
          <button
            type="button"
            onClick={clearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-rose-950/40 text-rose-400 border border-zinc-700 hover:border-rose-500/30 text-xs font-semibold transition"
            title={isAr ? 'مسح المحادثة' : 'Clear Chat'}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isAr ? 'مسح' : 'Clear'}</span>
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[650px]">
        
        {/* ============================================================== */}
        {/* LEFT/SIDEBAR: Industrial Capabilities & Telemetry Snapshot */}
        {/* ============================================================== */}
        <aside className="xl:col-span-4 flex flex-col gap-4 overflow-y-auto pr-1">
          
          {/* Active Shift Telemetry Card */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-emerald" />
                <h3 className="text-sm font-bold text-white">
                  {isAr ? 'بيانات صالة الإنتاج الحية' : 'Live Floor Telemetry'}
                </h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Shift #1
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-400 block text-[10px] mb-0.5">{isAr ? 'حالة الماكينات' : 'Machines'}</span>
                <span className="font-bold text-white flex items-center gap-1">
                  <span className="text-emerald-400">3 {isAr ? 'تعمل' : 'Run'}</span>
                  <span className="text-zinc-600">/</span>
                  <span className="text-rose-400">1 {isAr ? 'عطل' : 'Down'}</span>
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-400 block text-[10px] mb-0.5">{isAr ? 'كفاءة OEE' : 'OEE Metric'}</span>
                <span className="font-bold text-amber-400 font-mono">78.4%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-400 block text-[10px] mb-0.5">{isAr ? 'الإنتاج الفعلي' : 'Output'}</span>
                <span className="font-bold text-white font-mono">5,610 / 6,000</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-400 block text-[10px] mb-0.5">{isAr ? 'نسبة الهدر' : 'Scrap Rate'}</span>
                <span className="font-bold text-emerald-400 font-mono">1.7% <span className="text-[10px] text-zinc-500">(Target &lt;2%)</span></span>
              </div>
            </div>

            {/* Down Machine Alert Pill */}
            <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="text-rose-200 font-medium">INJ-02: {isAr ? 'توقف هيدروليكي (24 دقيقة)' : 'Hydraulic Downtime (24m)'}</span>
              </div>
              <button
                type="button"
                onClick={() => handleSendMessage(isAr ? 'ما هو التشخيص وخطوات الإصلاح الفورية لماكينة INJ-02 المتوقفة؟' : 'What is the root cause diagnosis and emergency SOP for halted INJ-02?')}
                className="text-[11px] font-bold text-rose-400 hover:text-white underline underline-offset-2"
              >
                {isAr ? 'شخّص فوراً' : 'Diagnose'}
              </button>
            </div>
          </div>

          {/* Quick Capability Actions */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-sm flex flex-col gap-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
              {isAr ? 'النماذج الصناعية السريعة' : 'Instant Industrial Templates'}
            </h3>

            {PROMPT_TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(tmpl.prompt)}
                className="w-full text-right p-3 rounded-xl bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-amber-400/50 text-xs text-zinc-200 transition group flex items-center justify-between gap-2"
              >
                <span className="font-medium group-hover:text-amber-400 transition">{tmpl.label}</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-1 transition shrink-0" />
              </button>
            ))}
          </div>

          {/* AI Industrial Engine Specs */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-zinc-900/90 to-zinc-950 border border-amber-500/20 text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-bold mb-2">
              <Zap className="w-4 h-4" />
              <span>{isAr ? 'محرك وردية الذكي فائق السرعة' : 'Wrdya Edge Engine v2.4'}</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed mb-3">
              {isAr
                ? 'يعمل المحرك على معالجة كشوف العمال، قراءة جداول الورديات، وتوليد إجراءات الصيانة القياسية محلياً دون استهلاك رصيد خارجي مع زمن استجابة أقل من 250ms.'
                : 'Processes employee rosters, spreadsheet OCR, and standard maintenance procedures locally with zero cloud token consumption and <250ms latency.'}
            </p>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono pt-2 border-t border-zinc-800">
              <span>Token Cost: 0.00 EGP</span>
              <span className="text-emerald-400">● 100% Operational</span>
            </div>
          </div>

        </aside>

        {/* ============================================================== */}
        {/* RIGHT: MAIN WORKSTATION CHAT CONSOLE */}
        {/* ============================================================== */}
        <main className="xl:col-span-8 flex flex-col rounded-2xl bg-zinc-900/90 border border-zinc-800 overflow-hidden shadow-lg">
          
          {/* Workstation Header */}
          <div className="px-5 py-3.5 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white">
                    {isAr ? 'مساعد وردية الذكي (محطة العمل)' : 'Wrdya AI Industrial Copilot'}
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    Connected
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  {isAr ? 'معالجة مباشرة للكشوف، بلاغات الأعطال، وتسليم الورديات' : 'Direct processing for rosters, machine breakdowns & handovers'}
                </p>
              </div>
            </div>

            {/* Roster Applied Banner Toast */}
            {appliedRosterSuccess && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? 'تم اعتماد الكشف وتطبيقه على صفحة العمال بنجاح!' : 'Roster applied to staff page successfully!'}</span>
                <Link href="/roster" className="underline text-white hover:text-emerald-200">
                  {isAr ? 'عرض' : 'View'}
                </Link>
              </div>
            )}
          </div>

          {/* Messages Thread */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-zinc-950/30">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? (isAr ? 'flex-row' : 'flex-row-reverse') : (isAr ? 'flex-row-reverse' : 'flex-row')} justify-end`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold ${
                    msg.sender === 'user'
                      ? 'bg-amber-500 text-zinc-950 font-black'
                      : 'bg-zinc-800 text-amber-400 border border-zinc-700'
                  }`}
                >
                  {msg.sender === 'user' ? (user?.avatar || '👤') : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed border ${
                      msg.sender === 'user'
                        ? 'bg-amber-500/10 text-zinc-100 border-amber-500/30 rounded-tr-none'
                        : 'bg-zinc-900/90 text-zinc-100 border-zinc-800 rounded-tl-none shadow-md'
                    }`}
                  >
                    {/* Attached Image Preview */}
                    {msg.image && (
                      <div className="mb-3 rounded-xl overflow-hidden border border-zinc-700 max-w-sm">
                        <img src={msg.image} alt="Uploaded industrial attachment" className="w-full h-auto max-h-48 object-cover" />
                      </div>
                    )}

                    {/* Formatted Text */}
                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {/* Auto-populated Roster Card (if returned by AI) */}
                    {msg.rosterData && msg.rosterData.employees && msg.rosterData.employees.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-zinc-800">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-amber-400" />
                            <span className="font-bold text-xs text-white">
                              {isAr ? `الكشف المقترح (${msg.rosterData.employees.length} موظف/عامل)` : `Assigned Staff (${msg.rosterData.employees.length} personnel)`}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleApplyRoster(msg.rosterData!.employees)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isAr ? 'اعتماد وتطبيق على الكشف' : 'Apply to Live Roster'}</span>
                          </button>
                        </div>

                        {/* Roster Preview Mini-Table */}
                        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/70">
                          <table className="w-full text-xs text-right">
                            <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
                              <tr>
                                <th className="p-2">{isAr ? 'الاسم' : 'Name'}</th>
                                <th className="p-2">{isAr ? 'الدور' : 'Role'}</th>
                                <th className="p-2">{isAr ? 'الخط / الماكينة' : 'Line / Station'}</th>
                                <th className="p-2">{isAr ? 'المهمة / المستهدف' : 'Task / Target'}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/60">
                              {msg.rosterData.employees.map((emp, i) => (
                                <tr key={i} className="hover:bg-zinc-800/30">
                                  <td className="p-2 font-semibold text-white">{emp.name}</td>
                                  <td className="p-2">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-amber-400 border border-zinc-700">
                                      {emp.role}
                                    </span>
                                  </td>
                                  <td className="p-2 text-zinc-300 font-mono text-[11px]">{emp.line}</td>
                                  <td className="p-2 text-zinc-400 text-[11px]">{emp.stationTask || emp.targetQuota || emp.technicalSpecialty || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Metadata & Copy action */}
                    <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-zinc-800/60 text-[11px] text-zinc-500">
                      <span>{msg.timestamp}</span>
                      <button
                        type="button"
                        onClick={() => copyMessage(msg.id, msg.text)}
                        className="flex items-center gap-1 hover:text-zinc-300 transition"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">{isAr ? 'تم النسخ' : 'Copied'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>{isAr ? 'نسخ' : 'Copy'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-amber-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>{isAr ? 'جاري تحليل البيانات الصناعية وتوليد الرد...' : 'Analyzing plant telemetry & generating response...'}</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar & Actions */}
          <div className="p-4 bg-zinc-950/80 border-t border-zinc-800 space-y-3">
            
            {/* Image Preview Thumbnail if attached */}
            {selectedImage && (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-900 border border-zinc-700 w-fit">
                <img src={selectedImage} alt="Attachment" className="w-12 h-12 object-cover rounded-lg border border-zinc-800" />
                <div className="text-xs">
                  <span className="text-zinc-200 font-bold block">{isAr ? 'تم إرفاق صورة/كشف' : 'Image attached'}</span>
                  <span className="text-[10px] text-zinc-400">{isAr ? 'جاهز للإرسال والتحليل' : 'Ready for OCR parsing'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="p-1 rounded-lg hover:bg-zinc-800 text-rose-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              {/* File upload button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.csv,.xlsx,.txt"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-amber-400 transition cursor-pointer"
                title={isAr ? 'إرفاق صورة كشف أو لوحة تحكم' : 'Attach image or sheet'}
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              {/* Voice Input button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-xl border transition cursor-pointer ${
                  isListening
                    ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-amber-400'
                }`}
                title={isAr ? 'تسجيل صوتي' : 'Voice dictation'}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  isAr
                    ? 'اكتب سؤالك، ارفع صورة الكشف، أو اطلب تشخيص الماكينة...'
                    : 'Type instruction, upload roster image, or ask for breakdown SOP...'
                }
                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 focus:border-amber-400 focus:outline-none text-sm text-white placeholder-zinc-500 transition"
              />

              {/* Send Button */}
              <button
                type="button"
                disabled={isLoading || (!input.trim() && !selectedImage)}
                onClick={() => handleSendMessage()}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-black text-sm flex items-center gap-1.5 transition shadow cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">{isAr ? 'إرسال' : 'Send'}</span>
              </button>
            </div>
          </div>

        </main>

      </div>
    </AppLayout>
  );
}
