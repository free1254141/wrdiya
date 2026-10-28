'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Bot, 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  X, 
  Maximize2, 
  Minimize2, 
  Copy, 
  Check, 
  Loader2, 
  Zap, 
  Activity, 
  Image as ImageIcon,
  Users,
  CheckCircle2,
  FileText,
  Sliders,
  Radio,
  Wrench,
  Briefcase
} from 'lucide-react';

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

interface ChatItem {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  senderName?: string;
  senderRole?: string;
  category?: string;
  image?: string;
  rosterData?: {
    employees: StaffItem[];
    source?: string;
  };
}

export default function WrdyaCopilotWidget() {
  const pathname = usePathname();
  const { user, activeRole } = useAuth();
  const { locale } = useLanguage();
  const { theme } = useTheme();
  const isAr = locale === 'ar';

  // Do not show floating widget on the dedicated unified signup page or dedicated copilot workstation
  if (pathname === '/signup' || pathname === '/copilot') {
    return null;
  }

  // Auto-open on initial load as requested: "عايز الشات بوت يظهر من اول لحظه"
  const [isOpen, setIsOpen] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatItem[]>([
    {
      id: 'welcome-01',
      sender: 'ai',
      text: isAr ? `مرحباً بك! أنا **مساعد وردية الذكي** 🤖

جاهز لمساعدتك فوراً في **تسكين كشوف الموظفين والعمال** على خطوط الإنتاج والورديات:
- 📸 **ارفع صورة كشف العمال أو جدول الشيفتات** وسأملأ لك الفورم تلقائياً.
- ✍️ **أو اكتب الأسماء والماكينات هنا** وسأقوم بتوزيعهم وتحديد متطلبات كل دور.
- 📋 **أو يمكنك ملء الفورم بنفسك يدوياً** بالضغط على "ملء يدوي للفورم".

كيف تفضل إدخال بيانات فريق العمل؟` : `Welcome! I am **Wrdya AI Industrial Copilot** 🤖

Ready to assist with **staff shift assignment and factory operations**:
- 📸 **Upload roster photo or spreadsheet screenshot** to auto-populate assignments.
- ✍️ **Or type names and machines here** to assign lines and dynamic requirements.
- 📋 **Or fill the form manually** by clicking "Manual Form".

How would you like to enter staff assignments?`,
      timestamp: 'الآن',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmedRoster, setConfirmedRoster] = useState<StaffItem[] | null>(null);

  // Sync welcome message when language changes
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome-01') {
        return [{
          id: 'welcome-01',
          sender: 'ai',
          text: isAr ? `مرحباً بك! أنا **مساعد وردية الذكي** 🤖

جاهز لمساعدتك فوراً في **تسكين كشوف الموظفين والعمال** على خطوط الإنتاج والورديات:
- 📸 **ارفع صورة كشف العمال أو جدول الشيفتات** وسأملأ لك الفورم تلقائياً.
- ✍️ **أو اكتب الأسماء والماكينات هنا** وسأقوم بتوزيعهم وتحديد متطلبات كل دور.
- 📋 **أو يمكنك ملء الفورم بنفسك يدوياً** بالضغط على "ملء يدوي للفورم".

كيف تفضل إدخال بيانات فريق العمل؟` : `Welcome! I am **Wrdya AI Industrial Copilot** 🤖

Ready to assist with **staff shift assignment and factory operations**:
- 📸 **Upload roster photo or spreadsheet screenshot** to auto-populate assignments.
- ✍️ **Or type names and machines here** to assign lines and dynamic requirements.
- 📋 **Or fill the form manually** by clicking "Manual Form".

How would you like to enter staff assignments?`,
          timestamp: isAr ? 'الآن' : 'Now',
        }];
      }
      return prev;
    });
  }, [isAr]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const QUICK_PROMPTS = isAr ? [
    { text: '👥 تسكين كشف عمال الوردية', tag: 'تسكين' },
    { text: '🔍 ما سبب توقف ماكينة الحقن INJ-02؟', tag: 'عطل' },
    { text: '📊 ما هو تقرير OEE ومعدل الهدر اليوم؟', tag: 'إنتاج' },
    { text: '📋 صغ لي مسودة تسليم الوردية', tag: 'تسليم' },
  ] : [
    { text: '👥 Assign shift workers roster', tag: 'roster' },
    { text: '🔍 Diagnose INJ-02 machine downtime', tag: 'breakdown' },
    { text: '📊 Show today OEE & scrap report', tag: 'oee' },
    { text: '📋 Draft shift handover log', tag: 'handover' },
  ];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, scrollToBottom]);

  // Voice recognition (Speech-to-Text)
  const toggleListening = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(isAr ? 'التعرف الصوتي غير مدعوم في متصفحك الحالي. يرجى استخدام Google Chrome أو Edge.' : 'Speech recognition is not supported in this browser. Please use Chrome or Edge.');
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

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? prev + ' ' + transcript : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query && !selectedImage) return;
    if (isLoading) return;

    const userMessage: ChatItem = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: query || (isAr ? '📸 تم إرسال صورة كشف الموظفين لتحليله وتسكين العمال...' : '📸 Sent staff roster image for analysis and assignment...'),
      image: selectedImage || undefined,
      senderName: user?.name || (isAr ? 'مسؤول المصنع' : 'Plant Staff'),
      senderRole: activeRole,
      timestamp: new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    const imagePayload = selectedImage;
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          image: imagePayload,
          locale: locale || 'ar',
          messages: messages.concat(userMessage),
        }),
      });

      const data = await res.json();
      const replyText = data.reply || (isAr ? 'تم استلام البيانات بنجاح.' : 'Data received successfully.');

      const aiMessage: ChatItem = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
        category: data.category,
        rosterData: data.rosterData,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      const fallbackAi: ChatItem = {
        id: 'ai-err-' + Date.now(),
        sender: 'ai',
        text: isAr ? 'تعذر الاتصال بمركز معالجة البيانات المحلي. يرجى المحاولة مرة أخرى.' : 'Error connecting to local engine. Please retry.',
        timestamp: new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackAi]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmRoster = (employees: StaffItem[]) => {
    setConfirmedRoster(employees);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('wrdya-roster-updated', {
          detail: employees,
        })
      );
    }

    const confirmNote: ChatItem = {
      id: 'conf-' + Date.now(),
      sender: 'ai',
      text: isAr 
        ? `✅ **تم اعتماد وتسكين الفريق بنجاح!** تم تحديث جدول الوردية بـ **${employees.length} موظفين** وتوزيعهم على خطوط الإنتاج والمهام.`
        : `✅ **Roster Approved & Confirmed!** Updated the active roster with **${employees.length} staff members** across production lines.`,
      timestamp: new Date().toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, confirmNote]);
  };

  const handleOpenManualForm = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wrdya-open-manual-roster'));
    }
    // Also scroll down or collapse slightly
    setIsOpen(false);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      {/* Hidden file input for uploading employee roster image */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageSelect}
        accept="image/*"
        className="hidden"
      />

      {/* Floating Trigger Launcher Button - ON THE RIGHT (اليمين) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="wrdya-brand-mark w-14 h-14 cursor-pointer hover:scale-105 active:scale-95 transition shadow-2xl relative group"
            title={isAr ? 'فتح مساعد وردية الذكي (Wrdya Copilot)' : 'Open Wrdya AI Copilot'}
          >
            <div className="wrdya-brand-mark__core">
              <Bot className="w-7 h-7 text-amber-400 group-hover:rotate-12 transition duration-300" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-black">
              1
            </span>
          </button>
        </div>
      )}

      {/* Floating Chat Modal / Drawer - ON THE RIGHT (اليمين) */}
      {isOpen && (
        <div
          className={`fixed z-[9999] transition-all duration-300 ${
            isExpanded
              ? 'inset-3 sm:inset-6 max-w-5xl mx-auto'
              : 'bottom-4 right-4 left-4 sm:left-auto sm:w-[480px] h-[640px] max-h-[92vh]'
          } flex flex-col rounded-2xl neobrutal-card border-2 border-zinc-700 bg-[#0b0f17] shadow-2xl overflow-hidden`}
        >
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-zinc-800 bg-[#0d121c] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="wrdya-brand-mark w-10 h-10 shrink-0">
                <div className="wrdya-brand-mark__core">
                  <Bot className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white">
                    {isAr ? 'مساعد وردية الذكي' : 'Wrdya AI Copilot'}
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-emerald" />
                    {isAr ? 'جاهز بالصالة' : 'Floor Online'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                  <Users className="w-3 h-3 text-cyan-400" />
                  {isAr ? 'تسكين الموظفين آلياً • تحليل الأعطال و OEE' : 'Automated Roster • Downtime & OEE'}
                </p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-1 text-zinc-400">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden sm:block p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 hover:text-white transition"
                title={isExpanded ? (isAr ? 'استعادة الحجم' : 'Restore size') : (isAr ? 'تكبير الشاشة' : 'Expand')}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg border border-zinc-800 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/40 transition"
                title={isAr ? 'تصغير الشات' : 'Close Copilot'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Options Bar */}
          <div className="p-2 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between gap-2 text-xs">
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              {isAr ? 'خيارات إدخال الموظفين:' : 'Staff Assignment Options:'}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-amber-500 hover:text-black border border-zinc-700 text-zinc-200 text-[11px] font-bold transition flex items-center gap-1"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{isAr ? 'رفع صورة كشف' : 'Upload Image'}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenManualForm}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-cyan-500 hover:text-black border border-zinc-700 text-zinc-200 text-[11px] font-bold transition flex items-center gap-1"
                title={isAr ? 'ملء الفورم يدوياً بنفسك' : 'Manual form entry'}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{isAr ? 'ملء يدوي للفورم' : 'Manual Form'}</span>
              </button>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="p-2 border-b border-zinc-800/80 bg-zinc-900/60 overflow-x-auto flex items-center gap-2 no-scrollbar">
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(prompt.text)}
                className="shrink-0 text-xs px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition"
              >
                {prompt.text}
              </button>
            ))}
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 neobrutal-grid-bg">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* Sender Metadata */}
                <div className="flex items-center gap-1.5 mb-1 text-[10px] text-zinc-400 px-1" suppressHydrationWarning>
                  {msg.sender === 'user' ? (
                    <>
                      <span className="font-bold text-zinc-300">{msg.senderName}</span>
                      <span className="px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                        {msg.senderRole}
                      </span>
                    </>
                  ) : (
                    <span className="font-bold text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Wrdya Assistant
                    </span>
                  )}
                  <span suppressHydrationWarning>• {msg.timestamp}</span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`relative group max-w-[92%] p-3.5 rounded-2xl border text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-amber-500 text-black font-semibold border-amber-400 rounded-bl-sm shadow-md'
                      : 'ai-bubble bg-zinc-900/95 text-zinc-100 border-zinc-700 rounded-br-sm shadow-lg'
                  }`}
                >
                  {/* Image attachment if sent */}
                  {msg.image && (
                    <div className="mb-2.5 rounded-lg overflow-hidden border border-zinc-700 max-h-48">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={msg.image} alt="Uploaded Roster" className="w-full object-cover" />
                    </div>
                  )}

                  {/* Text Content */}
                  <div className="whitespace-pre-wrap font-sans space-y-2">
                    {msg.text.split('\n\n').map((para, idx) => (
                      <p key={idx}>{para}</p>
                    ))}
                  </div>

                  {/* Extracted Roster Confirmation Card with dynamic role parameters */}
                  {msg.rosterData && msg.rosterData.employees.length > 0 && (
                    <div className="mt-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isAr ? 'كشف الموظفين المستخرج بالمتطلبات الوظيفية:' : 'Extracted Staff Roster with Role Parameters:'}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {msg.rosterData.employees.length} {isAr ? 'موظف' : 'staff'}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        {msg.rosterData.employees.map((emp, i) => (
                          <div
                            key={i}
                            className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex flex-wrap items-center justify-between gap-2"
                          >
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{emp.name}</span>
                                <span className="text-[10px] font-mono text-amber-400">[{emp.line}]</span>
                              </div>
                              <div className="text-[11px] text-zinc-400 mt-0.5">
                                {emp.role === 'supervisor' ? (
                                  <span className="text-blue-400 flex items-center gap-1">
                                    <Radio className="w-3 h-3" /> {emp.supervisedSector || (isAr ? 'إشراف عام' : 'Supervision')}
                                  </span>
                                ) : emp.role === 'maintenance' ? (
                                  <span className="text-emerald-400 flex items-center gap-1">
                                    <Wrench className="w-3 h-3" /> {emp.technicalSpecialty || (isAr ? 'صيانة طوارئ' : 'Maintenance')}
                                  </span>
                                ) : emp.role === 'admin' ? (
                                  <span className="text-purple-400 flex items-center gap-1">
                                    <Briefcase className="w-3 h-3" /> {emp.operationalDivision || (isAr ? 'إدارة المصنع' : 'Operations')}
                                  </span>
                                ) : (
                                  <span className="text-zinc-300">
                                    {emp.stationTask || (isAr ? 'تشغيل وتغذية خط' : 'Machine operation')} • {emp.targetQuota || '1,200'}
                                  </span>
                                )}
                              </div>
                            </div>

                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                              {emp.shift === 'morning' ? (isAr ? 'صباحية' : 'Morning') : emp.shift === 'evening' ? (isAr ? 'مسائية' : 'Evening') : (isAr ? 'ليلية' : 'Night')}
                            </span>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleConfirmRoster(msg.rosterData!.employees)}
                        className="w-full neobrutal-btn py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center justify-center gap-1.5 transition mt-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isAr ? 'اعتماد وتسكين الكشف في جدول الوردية فوراً' : 'Confirm & Apply Roster to Plant'}</span>
                      </button>
                    </div>
                  )}

                  {/* Actions Bar on AI message */}
                  {msg.sender === 'ai' && (
                    <div className="mt-3 pt-2 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="flex items-center gap-1 hover:text-white transition"
                        title={isAr ? 'نسخ النص' : 'Copy text'}
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 text-[10px]">{isAr ? 'تم النسخ' : 'Copied'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[10px]">{isAr ? 'نسخ التقرير' : 'Copy'}</span>
                          </>
                        )}
                      </button>
                      <span className="text-[9px] text-zinc-500 font-mono">Wrdya AI Engine</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex flex-col items-start space-y-1">
                <span className="text-[10px] text-amber-400 font-bold px-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 animate-spin" /> {isAr ? 'جاري التحليل واستخراج البيانات محلياً...' : 'Analyzing & extracting roster locally...'}
                </span>
                <div className="p-3.5 rounded-2xl rounded-br-sm bg-zinc-900 border border-zinc-700 flex items-center gap-2 text-xs text-zinc-300">
                  <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                  <span>{isAr ? 'المساعد يقرأ كشف الموظفين ويحدد متطلبات كل دور على الخطوط...' : 'Reading staff roster and configuring role assignments...'}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Image Preview if selected */}
          {selectedImage && (
            <div className="px-3 py-2 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-amber-500">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <span className="text-xs text-zinc-300 font-bold">{isAr ? 'تم اختيار صورة الكشف للتحليل' : 'Roster photo ready for analysis'}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="text-xs text-rose-400 hover:text-rose-300 font-bold"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 bg-[#0d121c] border-t border-zinc-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* Image Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl border bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-amber-400 hover:border-amber-400 transition"
                title={isAr ? 'رفع صورة كشف حضور أو جدول ورديات' : 'Upload roster photo'}
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              {/* Mic Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-xl border transition ${
                  isListening
                    ? 'bg-rose-500 text-white border-rose-400 pulse-rose'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white hover:border-zinc-500'
                }`}
                title={isListening ? (isAr ? 'جارِ الاستماع... اضغط للإيقاف' : 'Listening... click to stop') : (isAr ? 'تحدث صوتياً' : 'Voice input')}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? (isAr ? 'تحدث الآن...' : 'Listening...') : (isAr ? 'اكتب كشف الموظفين أو اسأل عن الأعطال و OEE...' : 'Type staff roster or ask about OEE/downtime...')}
                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={(!input.trim() && !selectedImage) || isLoading}
                className="neobrutal-btn p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold transition flex items-center justify-center shrink-0"
                title={isAr ? 'إرسال' : 'Send'}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] text-zinc-500">
              <span>{isAr ? 'ارفع صورة كشف أو اكتب العمال • ومساعد وردية سيسكنهم تلقائياً' : 'Upload photo or type staff • AI assigns lines automatically'}</span>
              <span>{isAr ? 'اضغط Enter للإرسال' : 'Press Enter'}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
