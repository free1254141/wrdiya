'use client';

import React, { useEffect, useState } from 'react';
import { Machine } from '@/lib/types';
import { Locale, translations } from '@/lib/i18n';
import { AlertOctagon, CheckCircle2, Wrench, Clock, Activity, Cpu } from 'lucide-react';

interface MachineStatusHeaderProps {
  machine: Machine;
  locale: Locale;
  onSelectMachine: (id: string) => void;
  allMachines: Machine[];
}

export default function MachineStatusHeader({
  machine,
  locale,
  onSelectMachine,
  allMachines,
}: MachineStatusHeaderProps) {
  const isAr = locale === 'ar';
  const t = translations[locale];
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    if (machine.current_status !== 'running' && machine.active_downtime_start) {
      const startTime = new Date(machine.active_downtime_start).getTime();
      const updateTimer = () => {
        const diff = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
        setElapsedSeconds(diff);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedSeconds(0);
    }
  }, [machine.current_status, machine.active_downtime_start]);

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isDown = machine.current_status === 'down';
  const isMaintenance = machine.current_status === 'maintenance';

  return (
    <div className="mb-6 space-y-3">
      {/* Machines Quick Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {allMachines.map((m) => {
          const isSelected = m.id === machine.id;
          const status = m.current_status;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectMachine(m.id)}
              className={`p-3 rounded-xl border text-right rtl:text-right ltr:text-left transition flex items-center justify-between ${
                isSelected
                  ? 'border-amber-400 bg-[#121927] shadow-[3px_3px_0px_rgba(245,158,11,0.4)]'
                  : 'border-zinc-800 bg-[#0d121c] hover:border-zinc-700 hover:bg-zinc-900/60'
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-black text-white">{m.code}</span>
                  {isSelected && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                      {isAr ? 'محددة' : 'Active'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 truncate max-w-[120px] mt-0.5">
                  {isAr ? m.name.split('(')[0] : m.code + ' ' + (m.code.startsWith('EXT') ? 'Extrusion' : m.code.startsWith('INJ') ? 'Injection' : m.code.startsWith('THF') ? 'Forming' : 'Packaging')}
                </p>
              </div>

              {/* Status Indicator */}
              <div className="shrink-0">
                {status === 'running' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 block pulse-emerald" title={isAr ? 'تعمل' : 'Running'} />
                )}
                {status === 'down' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block pulse-rose" title={isAr ? 'متوقفة' : 'Down'} />
                )}
                {status === 'maintenance' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 block pulse-amber" title={isAr ? 'صيانة' : 'Maintenance'} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Machine Detail Banner */}
      <div
        className={`neobrutal-card rounded-2xl p-4 sm:p-5 border-2 transition-all relative overflow-hidden ${
          isDown
            ? 'border-rose-500/80 bg-gradient-to-r from-[#1e0a0d] via-[#150a0e] to-[#0d121c]'
            : isMaintenance
            ? 'border-amber-500/80 bg-gradient-to-r from-[#1e150a] via-[#14100a] to-[#0d121c]'
            : 'border-emerald-500/50 bg-gradient-to-r from-[#0a1811] via-[#09140f] to-[#0d121c]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${
                isDown
                  ? 'border-rose-500/50 bg-rose-500/20 text-rose-400'
                  : isMaintenance
                  ? 'border-amber-500/50 bg-amber-500/20 text-amber-400'
                  : 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {isDown ? (
                <AlertOctagon className="w-6 h-6 animate-bounce" />
              ) : isMaintenance ? (
                <Wrench className="w-6 h-6" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-white">
                  {machine.code}
                </span>
                <h2 className="text-base sm:text-lg font-black text-white">{machine.name}</h2>
              </div>
              <p className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-zinc-500" />
                <span>
                  {isDown
                    ? (isAr ? '⚠️ عطل طارئ مسجل في صالة الإنتاج' : '⚠️ Emergency Breakdown Recorded on Floor')
                    : isMaintenance
                    ? (isAr ? '🛠️ صيانة دورية مجدولة وتغيير قطع استهلاكية' : '🛠️ Scheduled PM & Consumables Replacement')
                    : (isAr ? '🟢 تعمل بكفاءة تشغيلية مستقرة 98.4%' : '🟢 Operating normally at 98.4% efficiency')}
                </span>
              </p>
            </div>
          </div>

          {/* Live Downtime Stopwatch if down */}
          {(isDown || isMaintenance) && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/80 border border-zinc-700/80">
              <Clock className="w-5 h-5 text-rose-400 animate-pulse" />
              <div>
                <span className="block text-[10px] font-bold text-zinc-400">
                  {isAr ? 'عداد التوقف الحي (Downtime):' : 'Live Downtime Timer:'}
                </span>
                <span className="font-mono text-xl sm:text-2xl font-black text-rose-400 tracking-wider">
                  {formatTimer(elapsedSeconds)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Active Downtime Reason Banner if down */}
        {isDown && machine.active_downtime_note && (
          <div className="mt-3 pt-3 border-t border-rose-500/20 flex items-center gap-2 text-xs text-rose-200">
            <span className="font-bold text-rose-400">{isAr ? 'سبب العطل المسجل:' : 'Reported Reason:'}</span>
            <span>{machine.active_downtime_note}</span>
          </div>
        )}
      </div>
    </div>
  );
}
