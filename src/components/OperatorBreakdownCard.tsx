'use client';

import React, { useState } from 'react';
import { Machine, DowntimeCategory } from '@/lib/types';
import { Locale, translations } from '@/lib/i18n';
import { SpeechHandler } from '@/lib/speech';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Mic, 
  MicOff, 
  Zap, 
  Cog, 
  Box, 
  HelpCircle,
  Plus,
  Minus,
  CheckSquare,
  Sparkles,
  Send
} from 'lucide-react';

interface OperatorBreakdownCardProps {
  machine: Machine;
  locale: Locale;
  onReportBreakdown: (category: DowntimeCategory, voiceNote: string) => void;
  onResolveBreakdown: () => void;
}

export default function OperatorBreakdownCard({
  machine,
  locale,
  onReportBreakdown,
  onResolveBreakdown,
}: OperatorBreakdownCardProps) {
  const isAr = locale === 'ar';
  const t = translations[locale];
  const [selectedCategory, setSelectedCategory] = useState<DowntimeCategory>('electrical');
  const [voiceNote, setVoiceNote] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechHandler, setSpeechHandler] = useState<SpeechHandler | null>(null);

  // Live Unit Counter State for the Operator
  const [goodCount, setGoodCount] = useState(1420);
  const [scrapCount, setScrapCount] = useState(18);
  const targetCount = 1800;

  // Handover checklist
  const [checklist, setChecklist] = useState({
    cleanStation: true,
    toolsDelivered: true,
    batchVerified: false,
  });

  const isDown = machine.current_status === 'down';

  const toggleRecording = () => {
    let handler = speechHandler;
    if (!handler) {
      handler = new SpeechHandler(locale);
      setSpeechHandler(handler);
    }

    if (isRecording) {
      handler.stop();
      setIsRecording(false);
    } else {
      handler.setLanguage(locale);
      if (handler.isSupported) {
        handler.start({
          onResult: (text: string) => {
            setVoiceNote((prev) => (prev ? `${prev} ${text}` : text));
          },
          onError: () => setIsRecording(false),
          onEnd: () => setIsRecording(false),
        });
        setIsRecording(true);
      } else {
        alert(t.operator.mic_unsupported);
      }
    }
  };

  const handleConfirmReport = () => {
    onReportBreakdown(selectedCategory, voiceNote);
    setVoiceNote('');
  };

  const totalProduced = goodCount + scrapCount;
  const scrapRate = totalProduced > 0 ? ((scrapCount / totalProduced) * 100).toFixed(1) : '0';
  const completionPercent = Math.min(100, Math.round((goodCount / targetCount) * 100));

  return (
    <div className="space-y-5">
      {/* 1. Machine Downtime Action Card */}
      <div className="neobrutal-card rounded-2xl p-5 border-2 border-zinc-700 bg-[#0d121c]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                {isAr ? 'إجراءات توقف الماكينة الطارئة (Downtime)' : 'Emergency Downtime Logging'}
              </h3>
              <p className="text-xs text-zinc-400">
                {isAr ? 'سجل التوقف فوراً بدون كتابة لإشعار الصيانة والمشرف' : 'Log stoppage instantly with zero typing to alert maintenance'}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
            {machine.code}
          </span>
        </div>

        {isDown ? (
          /* Active Breakdown - Resolve Action */
          <div className="p-4 rounded-xl border-2 border-rose-500/60 bg-rose-500/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 animate-bounce" />
                {isAr ? 'الماكينة مسجلة كمتوقفة حالياً' : 'Machine Currently Marked as Stopped'}
              </span>
              <span className="text-xs text-zinc-300 font-semibold">
                {isAr ? 'فريق الصيانة في الموقع' : 'Maintenance Team On-Site'}
              </span>
            </div>
            <p className="text-xs text-zinc-300">
              {machine.active_downtime_note || (isAr ? 'عطل كهربائي طارئ في حساسات الحرارة' : 'Electrical thermocouple failure')}
            </p>
            <button
              type="button"
              onClick={onResolveBreakdown}
              className="w-full neobrutal-btn py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm flex items-center justify-center gap-2 transition"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isAr ? 'تم الإصلاح بالكامل وإعادة تشغيل الماكينة' : 'Breakdown Resolved • Resume Normal Operation'}</span>
            </button>
          </div>
        ) : (
          /* Normal State - Report Breakdown */
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-2">
                {isAr ? 'اختر سبب التوقف:' : 'Select Downtime Cause:'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('electrical')}
                  className={`p-2.5 rounded-xl border text-right rtl:text-right ltr:text-left transition flex items-center gap-2 ${
                    selectedCategory === 'electrical'
                      ? 'border-amber-400 bg-amber-500/20 text-white font-bold'
                      : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-xs">{isAr ? '⚡ كهربائي' : '⚡ Electrical'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory('mechanical')}
                  className={`p-2.5 rounded-xl border text-right rtl:text-right ltr:text-left transition flex items-center gap-2 ${
                    selectedCategory === 'mechanical'
                      ? 'border-blue-400 bg-blue-500/20 text-white font-bold'
                      : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <Cog className="w-4 h-4 text-blue-400" />
                  <span className="text-xs">{isAr ? '⚙️ ميكانيكي' : '⚙️ Mechanical'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory('material')}
                  className={`p-2.5 rounded-xl border text-right rtl:text-right ltr:text-left transition flex items-center gap-2 ${
                    selectedCategory === 'material'
                      ? 'border-emerald-400 bg-emerald-500/20 text-white font-bold'
                      : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <Box className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs">{isAr ? '📦 خامات' : '📦 Raw Material'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory('other')}
                  className={`p-2.5 rounded-xl border text-right rtl:text-right ltr:text-left transition flex items-center gap-2 ${
                    selectedCategory === 'other'
                      ? 'border-purple-400 bg-purple-500/20 text-white font-bold'
                      : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <HelpCircle className="w-4 h-4 text-purple-400" />
                  <span className="text-xs">{isAr ? '⚠️ سبب آخر' : '⚠️ Other / Quality'}</span>
                </button>
              </div>
            </div>

            {/* Voice or Text Note */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                {isAr ? 'ملاحظة سريعة أو تسجيل صوتي (اختياري):' : 'Voice Dictation or Quick Note (Optional):'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={voiceNote}
                  onChange={(e) => setVoiceNote(e.target.value)}
                  placeholder={isRecording ? (isAr ? 'جارِ الاستماع لصوتك...' : 'Listening...') : (isAr ? 'اكتب أو اضغط على الميكروفون للتحدث...' : 'Type note or click mic to speak...')}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`p-2.5 rounded-xl border transition ${
                    isRecording
                      ? 'bg-rose-500 text-white border-rose-400 pulse-rose'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white'
                  }`}
                  title={isAr ? 'تسجيل صوتي' : 'Voice input'}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Big Trigger Red Button */}
            <button
              type="button"
              onClick={handleConfirmReport}
              className="w-full neobrutal-btn py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg transition"
            >
              <AlertTriangle className="w-5 h-5" />
              <span>{isAr ? '🔴 تسجيل توقف الماكينة فوراً وإشعار الصيانة' : '🔴 Trigger Machine Downtime & Alert Maintenance'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Live Operator Production Counter */}
      <div className="neobrutal-card rounded-2xl p-5 border-2 border-zinc-700 bg-[#0d121c]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                {isAr ? 'عداد الإنتاج اللحظي للوردية' : 'Live Shift Production Counter'}
              </h3>
              <p className="text-xs text-zinc-400">
                {isAr ? 'تحديث القطع المطابقة والهدر بضغطة زر' : '1-Click Good & Scrap Unit Logging'}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-400 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
            {isAr ? `الهدف: ${targetCount} قطعة` : `Target: ${targetCount} units`}
          </span>
        </div>

        {/* Counters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Good Units Counter */}
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <span className="text-xs font-bold text-zinc-400">{isAr ? 'الوحدات المطابقة (Good Units)' : 'Good Conforming Units'}</span>
            <div className="flex items-center justify-between mt-2">
              <span className="font-mono text-3xl font-black text-emerald-400">{goodCount}</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setGoodCount((c) => Math.max(0, c - 1))}
                  className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-bold text-sm"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setGoodCount((c) => c + 1)}
                  className="w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center font-bold text-sm"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => setGoodCount((c) => c + 10)}
                  className="px-2 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-bold text-xs"
                >
                  +10
                </button>
                <button
                  type="button"
                  onClick={() => setGoodCount((c) => c + 50)}
                  className="px-2 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-bold text-xs"
                >
                  +50
                </button>
              </div>
            </div>
          </div>

          {/* Scrap Units Counter */}
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400">{isAr ? 'الهدر / السكراب (Scrap Units)' : 'Scrap / Reject Units'}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                {isAr ? `نسبة الهدر: ${scrapRate}%` : `Scrap Rate: ${scrapRate}%`}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="font-mono text-3xl font-black text-rose-400">{scrapCount}</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setScrapCount((c) => Math.max(0, c - 1))}
                  className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-bold text-sm"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setScrapCount((c) => c + 1)}
                  className="w-8 h-8 rounded-lg bg-rose-500 hover:bg-rose-400 text-white flex items-center justify-center font-bold text-sm"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => setScrapCount((c) => c + 5)}
                  className="px-2 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-bold text-xs"
                >
                  +5
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
            <span>{isAr ? 'نسبة إنجاز خطة الوردية:' : 'Shift Target Completion:'}</span>
            <span className="font-mono font-bold text-white">{completionPercent}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Handover Checklist */}
      <div className="neobrutal-card rounded-2xl p-5 border-2 border-zinc-700 bg-[#0d121c]">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold">
            3
          </div>
          <div>
            <h3 className="text-sm font-black text-white">
              {isAr ? 'قائمة تسليم مشغل الخط (Handover Checklist)' : 'Operator Handover Checklist'}
            </h3>
            <p className="text-xs text-zinc-400">
              {isAr ? 'تأكيد الجاهزية قبل مغادرة مكان العمل' : 'Verify workplace readiness before leaving shift'}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <label className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer">
            <input
              type="checkbox"
              checked={checklist.cleanStation}
              onChange={(e) => setChecklist({ ...checklist, cleanStation: e.target.checked })}
              className="w-4 h-4 rounded text-amber-500"
            />
            <span className="text-zinc-200">
              {isAr ? 'نظافة منطقة العمل وإخلاء مخلفات القص حول الماكينة' : 'Clean workstation and remove sprue trim around machine'}
            </span>
          </label>

          <label className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer">
            <input
              type="checkbox"
              checked={checklist.toolsDelivered}
              onChange={(e) => setChecklist({ ...checklist, toolsDelivered: e.target.checked })}
              className="w-4 h-4 rounded text-amber-500"
            />
            <span className="text-zinc-200">
              {isAr ? 'تسليم أدوات القياس والكاليبر لمشغل الوردية القادمة' : 'Hand over digital calipers and micrometers to next operator'}
            </span>
          </label>

          <label className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer">
            <input
              type="checkbox"
              checked={checklist.batchVerified}
              onChange={(e) => setChecklist({ ...checklist, batchVerified: e.target.checked })}
              className="w-4 h-4 rounded text-amber-500"
            />
            <span className="text-zinc-200">
              {isAr ? 'التنبيه على خامات البوليمر دفعة #889 المسلمة' : 'Flag raw material polymer batch #889 status to incoming shift'}
            </span>
          </label>
        </div>
      </div>

    </div>
  );
}
