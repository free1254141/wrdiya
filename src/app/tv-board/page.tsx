'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { initialMachines, initialDowntimeLogs } from '@/lib/supabase';
import { Machine, DowntimeLog } from '@/lib/types';
import { 
  Tv, 
  Activity, 
  AlertOctagon, 
  CheckCircle2, 
  Wrench, 
  Clock, 
  ArrowLeft, 
  Maximize2, 
  TrendingUp,
  Volume2,
  VolumeX,
  Factory
} from 'lucide-react';

export default function AndonTVBoardPage() {
  const [machines, setMachines] = useState<Machine[]>(initialMachines);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const runningCount = machines.filter((m) => m.current_status === 'running').length;
  const downCount = machines.filter((m) => m.current_status === 'down').length;
  const maintenanceCount = machines.filter((m) => m.current_status === 'maintenance').length;
  const activeAvailability = ((runningCount / machines.length) * 100).toFixed(0);

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 font-sans flex flex-col justify-between select-none">
      {/* Top TV Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
            title="العودة لشات الوردية"
          >
            <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Tv className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>شاشة الآندون الذكية لصالة الإنتاج (Andon TV Board)</span>
              <span className="text-xs bg-red-600/30 text-red-400 border border-red-500/30 px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                LIVE 4K
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              مصنع الأمل للبلاستيك والتغليف • خطوط الإنتاج والورديات
            </p>
          </div>
        </div>

        {/* Status Counters & Live Clock */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3 bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono font-bold text-sm">{runningCount} تعمل</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5 text-red-400">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <span className="font-mono font-bold text-sm">{downCount} متوقفة</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="font-mono font-bold text-sm">{maintenanceCount} صيانة</span>
            </div>
          </div>

          <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 text-center font-mono">
            <span className="text-[10px] text-slate-400 block">التوقيت المحلي</span>
            <span className="text-lg font-black text-amber-400">{currentTime}</span>
          </div>

          {/* Fullscreen & Audio controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5 text-amber-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
            >
              <Maximize2 className="w-5 h-5 text-slate-300" />
            </button>
          </div>
        </div>
      </header>

      {/* Main High-Contrast Machine Grid for Smart TVs */}
      <main className="my-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 flex-1">
        {machines.map((m) => {
          const isDown = m.current_status === 'down';
          const isMaintenance = m.current_status === 'maintenance';

          return (
            <div
              key={m.id}
              className={`rounded-3xl p-6 border-4 flex flex-col justify-between transition-all duration-500 relative overflow-hidden shadow-2xl ${
                isDown
                  ? 'bg-gradient-to-b from-red-950 via-red-900 to-black border-red-500 shadow-red-600/40 animate-pulse-subtle ring-4 ring-red-500/20'
                  : isMaintenance
                  ? 'bg-gradient-to-b from-amber-950 via-yellow-950 to-black border-amber-500 shadow-amber-500/20'
                  : 'bg-gradient-to-b from-emerald-950/80 via-slate-950 to-black border-emerald-500 shadow-emerald-500/20'
              }`}
            >
              {/* Top Card Section */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-mono text-base font-black px-3 py-1 rounded-xl bg-black/60 border border-white/10 tracking-widest text-slate-200">
                    {m.code}
                  </span>
                  <span className={`text-xs font-black uppercase px-3 py-1 rounded-full border ${
                    isDown
                      ? 'bg-red-500 text-white border-red-400 animate-bounce'
                      : isMaintenance
                      ? 'bg-amber-500/30 text-amber-300 border-amber-400'
                      : 'bg-emerald-500/30 text-emerald-300 border-emerald-400'
                  }`}>
                    {isDown ? '🔴 عطل طارئ (DOWN)' : isMaintenance ? '🟡 صيانة دورية' : '🟢 تعمل (RUNNING)'}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight mb-2">
                  {m.name}
                </h2>
              </div>

              {/* Center Status Visual */}
              <div className="my-6 text-center">
                {isDown ? (
                  <div className="space-y-3">
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-red-600/30 border-2 border-red-500 flex items-center justify-center text-red-400 animate-ping">
                      <AlertOctagon className="w-12 h-12" />
                    </div>
                    <div>
                      <span className="text-xs uppercase font-bold text-red-300 tracking-wider block">
                        مدة التوقف المستمرة:
                      </span>
                      <span className="font-mono text-3xl sm:text-4xl font-black text-white tracking-widest">
                        00:18:24
                      </span>
                    </div>
                    <p className="text-xs text-red-200 bg-black/60 p-2.5 rounded-xl border border-red-500/30">
                      {m.active_downtime_note || 'عطل كهربائي - جاري الاستجابة'}
                    </p>
                  </div>
                ) : isMaintenance ? (
                  <div className="space-y-3">
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-amber-400">
                      <Wrench className="w-12 h-12" />
                    </div>
                    <span className="text-sm font-bold text-amber-300 block">
                      صيانة دورية مجدولة
                    </span>
                    <span className="font-mono text-2xl font-bold text-white">
                      02:00:00
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <span className="text-sm font-bold text-emerald-300 block">
                      كفاءة التشغيل ممتازة
                    </span>
                    <span className="font-mono text-2xl font-bold text-emerald-400">
                      98.4% Uptime
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Quick Metric */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span>تحديث الحالة:</span>
                <span className="font-mono text-slate-200">منذ 18 دقيقة</span>
              </div>
            </div>
          );
        })}
      </main>

      {/* Bottom KPI Marquee & Factory Summary */}
      <footer className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-slate-400">معدل التوفر اللحظي: </span>
            <span className="font-mono font-black text-emerald-400 text-base">{activeAvailability}%</span>
          </div>
          <div>
            <span className="text-slate-400">معدل OEE اليومي: </span>
            <span className="font-mono font-black text-amber-400 text-base">78.5%</span>
          </div>
          <div>
            <span className="text-slate-400">إجمالي إنتاج الوردية: </span>
            <span className="font-mono font-black text-blue-400 text-base">8,050 وحدة</span>
          </div>
        </div>

        <div className="text-slate-500 font-mono text-xs">
          LineChat Andon Broadcast System v1.0 • Connected to Supabase Realtime
        </div>
      </footer>
    </div>
  );
}
