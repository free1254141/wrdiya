'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  initialMachines, 
  initialDowntimeLogs 
} from '@/lib/supabase';
import { Machine, DowntimeLog, DowntimeCategory } from '@/lib/types';
import { 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Mic, 
  MicOff, 
  Wrench, 
  Zap, 
  Box, 
  Activity, 
  Sparkles, 
  Check, 
  Play, 
  Flame, 
  Radio, 
  StopCircle,
  TrendingDown
} from 'lucide-react';

export default function MachinesDowntimePage() {
  const { user, factory } = useAuth();
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [machines, setMachines] = useState<Machine[]>(initialMachines);
  const [selectedMachineId, setSelectedMachineId] = useState<string>(initialMachines[1].id);
  const [downtimeLogs, setDowntimeLogs] = useState<DowntimeLog[]>(initialDowntimeLogs);

  // Rapid Breakdown Reporting Form State
  const [reportReason, setReportReason] = useState<DowntimeCategory>('electrical');
  const [voiceNote, setVoiceNote] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Live Timer for the stopped machine
  const [elapsedSeconds, setElapsedSeconds] = useState(1080); // 18 minutes

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activeMachine = machines.find((m) => m.id === selectedMachineId) || machines[0];

  // Speech Recognition
  const toggleListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(isAr ? 'التعرف الصوتي غير مدعوم في هذا المتصفح' : 'Speech recognition not supported in this browser');
      return;
    }

    if (isListening) {
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
        setVoiceNote((prev) => (prev ? prev + ' ' + transcript : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Report Machine Breakdown
  const handleReportBreakdown = () => {
    const nowIso = new Date().toISOString();
    setMachines((prev) =>
      prev.map((m) =>
        m.id === activeMachine.id
          ? {
              ...m,
              current_status: 'down',
              last_status_change: nowIso,
              active_downtime_start: nowIso,
              active_downtime_reason: reportReason,
              active_downtime_note: voiceNote || (isAr ? 'عطل مفاجئ تم الإبلاغ عنه من الصالة' : 'Sudden stoppage reported'),
            }
          : m
      )
    );

    const newLog: DowntimeLog = {
      id: `down-${Date.now()}`,
      factory_id: activeMachine.factory_id,
      machine_id: activeMachine.id,
      machine_name: activeMachine.name,
      machine_code: activeMachine.code,
      reported_by: user?.name || (isAr ? 'فني التشغيل' : 'Operator'),
      reason_category: reportReason,
      voice_note_text: voiceNote || (isAr ? 'بلاغ عطل فوري' : 'Direct breakdown alert'),
      started_at: nowIso,
      ended_at: null,
    };

    setDowntimeLogs((prev) => [newLog, ...prev]);
    setVoiceNote('');
    setElapsedSeconds(0);
    setActionSuccess(isAr ? 'تم تسجيل التوقف وإرسال إشعار فوري لمهندسي الصيانة 🔔' : 'Breakdown logged & dispatched to maintenance 🔔');
    setTimeout(() => setActionSuccess(null), 4000);
  };

  // Resolve Machine Breakdown
  const handleResolveBreakdown = () => {
    const nowIso = new Date().toISOString();
    setMachines((prev) =>
      prev.map((m) =>
        m.id === activeMachine.id
          ? {
              ...m,
              current_status: 'running',
              last_status_change: nowIso,
              active_downtime_start: undefined,
              active_downtime_reason: undefined,
              active_downtime_note: undefined,
            }
          : m
      )
    );

    setDowntimeLogs((prev) =>
      prev.map((log) =>
        log.machine_id === activeMachine.id && !log.ended_at
          ? {
              ...log,
              ended_at: nowIso,
              resolved_by: user?.name || (isAr ? 'مهندس الصيانة' : 'Engineer'),
              duration_minutes: Math.ceil(elapsedSeconds / 60),
            }
          : log
      )
    );

    setActionSuccess(isAr ? 'تم استئناف تشغيل الماكينة بنجاح وإغلاق كود العطل! 🟢' : 'Machine restored to RUNNING and downtime closed! 🟢');
    setTimeout(() => setActionSuccess(null), 4000);
  };

  return (
    <AppLayout
      pageTitle={isAr ? 'الماكينات وبلاغات الأعطال والآندون' : 'Machinery Monitoring & Andon Center'}
      pageSubtitle={isAr 
        ? 'متابعة أوقات توقف الماكينات بالثانية، تسجيل بلاغات الأعطال بالصوت، والتشخيص السريع بـ Wrdya AI' 
        : 'Realtime machine tracking, 1-click voice downtime reporting, and AI maintenance diagnostics'}
      actionButton={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (activeMachine.current_status === 'down') {
                handleResolveBreakdown();
              } else {
                handleReportBreakdown();
              }
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-md ${
              activeMachine.current_status === 'down'
                ? 'bg-emerald-400 hover:bg-emerald-500 text-black'
                : 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
            }`}
          >
            {activeMachine.current_status === 'down' ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{isAr ? 'استئناف تشغيل الماكينة 🟢' : 'Restore Machine 🟢'}</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>{isAr ? 'تسجيل عطل طارئ 🔴' : 'Report Stoppage 🔴'}</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        
        {/* Action Success Toast */}
        {actionSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg animate-bounce">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Top Machinery Status Selector Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {machines.map((m) => {
            const isSelected = m.id === selectedMachineId;
            const isDown = m.current_status === 'down';
            const isMaint = m.current_status === 'maintenance';

            return (
              <div
                key={m.id}
                onClick={() => setSelectedMachineId(m.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-500/10'
                    : 'border-zinc-800 bg-[#0d121c] hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 font-bold text-white">
                      {m.code}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      isDown 
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                        : isMaint 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isDown ? 'bg-rose-400 animate-ping' : isMaint ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                      {isDown ? (isAr ? 'عطل متوقف' : 'Stopped') : isMaint ? (isAr ? 'صيانة' : 'Maint') : (isAr ? 'تعمل' : 'Running')}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-white">{m.name}</h4>
                  <p className="text-xs text-zinc-400 mt-1">{m.line_name || (isAr ? 'خط الإنتاج الرئيسي' : 'Main Line')}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
                  <span>{isSelected ? (isAr ? 'محددة للتحكم ➔' : 'Selected') : (isAr ? 'اضغط للمعاينة' : 'Click to inspect')}</span>
                  {isDown && <span className="text-rose-400 font-mono font-bold animate-pulse">{formatTimer(elapsedSeconds)}</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Machine Focus Panel: Stopwatch + Quick Breakdown Action */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Column 1: Live Status & Stopwatch (5 Cols) */}
          <div className="lg:col-span-5 neobrutal-card bg-[#0d121c] border-2 border-zinc-700 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 font-mono">
                  {activeMachine.code} • Live Telemetry
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">{activeMachine.name}</h3>
              </div>

              <div className={`p-3 rounded-2xl border ${
                activeMachine.current_status === 'down'
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}>
                <Cpu className="w-6 h-6" />
              </div>
            </div>

            {/* Live Stopwatch Card if Down */}
            {activeMachine.current_status === 'down' ? (
              <div className="p-5 rounded-2xl bg-rose-500/10 border-2 border-rose-500/40 text-center space-y-2">
                <span className="text-xs font-bold text-rose-300 flex items-center justify-center gap-1.5 uppercase tracking-wider">
                  <Clock className="w-4 h-4 animate-spin" />
                  {isAr ? 'مؤقت التوقف الحي (Live Downtime)' : 'Active Downtime Stopwatch'}
                </span>
                <div className="text-4xl sm:text-5xl font-black text-rose-400 font-mono tracking-wider">
                  {formatTimer(elapsedSeconds)}
                </div>
                <p className="text-xs text-rose-300/80 font-medium">
                  {isAr ? 'تم استدعاء مهندس الصيانة م. محمود صقر' : 'Assigned Technician: Eng. Mahmoud Saqr'}
                </p>
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleResolveBreakdown}
                    className="w-full py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-500 text-black font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isAr ? '🟢 تم الإصلاح واستئناف التشغيل الآن' : '🟢 Resolved & Resume Production'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                <span className="text-xs font-bold text-emerald-300 flex items-center justify-center gap-1.5 uppercase tracking-wider">
                  <Activity className="w-4 h-4" />
                  {isAr ? 'الماكينة تعمل بكفاءة تامة' : 'Machine Running Smoothly'}
                </span>
                <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">
                  94.2% {isAr ? 'سرعة' : 'Speed'}
                </div>
                <p className="text-xs text-zinc-400">
                  {isAr ? 'الإنتاج بالساعة: 950 وحدة • بدون انحرافات حرارية' : 'Run rate: 950 u/h • Normal temperatures'}
                </p>
              </div>
            )}

            {/* Quick Diagnostic Insights from Wrdya AI */}
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Sparkles className="w-4 h-4" />
                <span>{isAr ? 'توصيات تشخيص Wrdya AI السريعة:' : 'AI Diagnostic Recommendation:'}</span>
              </div>
              <p className="text-zinc-300 leading-relaxed text-[11px]">
                {activeMachine.current_status === 'down'
                  ? (isAr 
                      ? '⚠️ عطل E-402: يرجى فحص حساس الثرموكبل في Zone 2 والتحقق من ضغط مياه التبريد لمنع تكتل البوليمر في الاسطوانة.' 
                      : '⚠️ Code E-402: Check Zone 2 thermocouple tension & verify cooling water pressure to avoid barrel clogging.')
                  : (isAr 
                      ? '✅ أداء مستقر: الماكينة متوافقة مع متطلبات الوردية الصباحية. افحص الفلتر بعد ساعتين.' 
                      : '✅ Stable operation: Shift targets met. Schedule quick filter inspection in 2 hours.')}
              </p>
            </div>
          </div>

          {/* Column 2: 1-Click Breakdown Logger & Voice Note (7 Cols) */}
          <div className="lg:col-span-7 neobrutal-card bg-[#0d121c] border-2 border-zinc-700 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-black text-white">
                  {isAr ? 'تسجيل بلاغ عطل فوري للماكينة (Rapid Andon Stoppage)' : '1-Click Rapid Breakdown Logger'}
                </h3>
              </div>
              <span className="text-xs text-zinc-400 font-mono">
                {activeMachine.code}
              </span>
            </div>

            {/* Category Pills */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-2">
                {isAr ? '1. حدد تصنيف سبب التوقف *' : '1. Select Stoppage Category *'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setReportReason('electrical')}
                  className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                    reportReason === 'electrical'
                      ? 'bg-amber-400 text-black border-amber-400 shadow-md'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>{isAr ? '⚡ كهربائي' : 'Electrical'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportReason('mechanical')}
                  className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                    reportReason === 'mechanical'
                      ? 'bg-amber-400 text-black border-amber-400 shadow-md'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                  <span>{isAr ? '⚙️ ميكانيكي' : 'Mechanical'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportReason('material')}
                  className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                    reportReason === 'material'
                      ? 'bg-amber-400 text-black border-amber-400 shadow-md'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                  }`}
                >
                  <Box className="w-4 h-4" />
                  <span>{isAr ? '📦 نقص خامات' : 'Raw Material'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportReason('other')}
                  className={`p-3 rounded-xl border font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                    reportReason === 'other'
                      ? 'bg-amber-400 text-black border-amber-400 shadow-md'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>{isAr ? '⚠️ سبب آخر' : 'Other Cause'}</span>
                </button>
              </div>
            </div>

            {/* Voice Dictation & Notes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-zinc-300">
                  {isAr ? '2. الملاحظة الصوتية أو النصية للعطل' : '2. Voice Note / Stoppage Details'}
                </label>
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-zinc-800 text-zinc-300 hover:text-white'
                  }`}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-rose-400" />}
                  <span>{isListening ? (isAr ? 'جارِ التسجيل...' : 'Recording...') : (isAr ? 'سجل صوتياً بالمايك' : 'Voice Dictate')}</span>
                </button>
              </div>

              <textarea
                rows={3}
                value={voiceNote}
                onChange={(e) => setVoiceNote(e.target.value)}
                placeholder={isAr ? 'تحدث بالمايك أو اكتب: مثال: "ارتفاع حرارة هيتر الحقن وتوقف الحزام الناقل فجأة"...' : 'Describe the stoppage or speak into the microphone...'}
                className="w-full p-3.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs sm:text-sm focus:border-amber-400 focus:outline-none"
              />
            </div>

            {/* Action Dispatch Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleReportBreakdown}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 transition cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>{isAr ? '🔴 إرسال بلاغ التوقف الفوري وتنبيه الصيانة والـ TV' : '🔴 Dispatch Immediate Stoppage & Alert Maintenance'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Downtime Logs Historic Feed */}
        <div className="p-5 rounded-2xl bg-[#0d121c] border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'سجل بلاغات الأعطال الحديثة للوردية' : 'Recent Shift Downtime Logs'}</span>
            </h3>
            <span className="text-xs text-zinc-500 font-mono">
              {downtimeLogs.length} {isAr ? 'بلاغات مسجلة' : 'records'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-bold">
                  <th className="py-2.5 px-3">{isAr ? 'الماكينة' : 'Machine'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'التصنيف' : 'Category'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'الملاحظة والسبب' : 'Note & Reason'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'المُبلّغ' : 'Reported By'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'وقت البدء' : 'Started'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'المدة' : 'Duration'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {downtimeLogs.map((log) => {
                  const isClosed = !!log.ended_at;

                  return (
                    <tr key={log.id} className="hover:bg-zinc-900/50 transition">
                      <td className="py-3 px-3 font-mono font-bold text-white">
                        {log.machine_code || 'INJ-02'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-semibold text-[11px]">
                          {log.reason_category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-zinc-300 max-w-xs truncate">
                        {log.voice_note_text}
                      </td>
                      <td className="py-3 px-3 text-zinc-400 font-medium">
                        {log.reported_by}
                      </td>
                      <td className="py-3 px-3 font-mono text-zinc-400 text-[11px]">
                        {new Date(log.started_at).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-400">
                        {isClosed ? `${log.duration_minutes || 25} د` : (isAr ? 'مستمر الآن' : 'Active')}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isClosed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/20 text-rose-400 animate-pulse'
                        }`}>
                          {isClosed ? (isAr ? 'تم الإصلاح' : 'Resolved') : (isAr ? 'متوقف الآن' : 'Stopped')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
