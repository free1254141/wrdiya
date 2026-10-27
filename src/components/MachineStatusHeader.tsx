'use client';

import React, { useEffect, useState } from 'react';
import { Machine } from '@/lib/types';
import { Locale, translations } from '@/lib/i18n';
import { QrCode, AlertOctagon, CheckCircle2, Wrench, Clock, Activity } from 'lucide-react';

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
    <div className={`rounded-2xl p-4 transition-all duration-300 border shadow-xl relative overflow-hidden mb-4 ${
      isDown 
        ? 'bg-gradient-to-r from-red-950/90 via-rose-950/70 to-red-900/50 border-red-500/50 text-white' 
        : isMaintenance
        ? 'bg-gradient-to-r from-amber-950/80 via-yellow-950/60 to-amber-900/40 border-amber-500/50 text-white'
        : 'bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-900 border-emerald-500/30 text-white'
    }`}>
      {/* Background status accent glow */}
      {isDown && (
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-red-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
        {/* Machine Selector & Info */}
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl flex items-center justify-center shrink-0 border shadow-lg ${
            isDown
              ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse'
              : isMaintenance
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
              : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
          }`}>
            {isDown ? (
              <AlertOctagon className="w-7 h-7" />
            ) : isMaintenance ? (
              <Wrench className="w-7 h-7" />
            ) : (
              <CheckCircle2 className="w-7 h-7" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <label htmlFor="machineSelect" className="text-xs text-slate-400 font-medium">
                {t.machines.select_machine}
              </label>
              <select
                id="machineSelect"
                value={machine.id}
                onChange={(e) => onSelectMachine(e.target.value)}
                className="bg-slate-800/90 text-white font-semibold text-sm rounded-lg px-2.5 py-1 border border-slate-700 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {allMachines.map((m) => (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                    {m.name} [{m.code}] {m.current_status === 'down' ? '🔴' : m.current_status === 'maintenance' ? '🟡' : '🟢'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                isDown
                  ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                  : isMaintenance
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                <Activity className="w-3 h-3" />
                {isDown
                  ? t.machines.status_down
                  : isMaintenance
                  ? t.machines.status_maintenance
                  : t.machines.status_running}
              </span>

              <span className="text-xs text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/60 font-mono">
                {machine.code}
              </span>
            </div>
          </div>
        </div>

        {/* Live Stopwatch Timer / QR Deep-link indicator */}
        <div className="flex items-center gap-3">
          {(isDown || isMaintenance) ? (
            <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-red-500/30 flex items-center gap-3">
              <Clock className="w-5 h-5 text-red-400 animate-spin" />
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-red-300 font-semibold">
                  {t.machines.live_timer}
                </span>
                <span className="font-mono text-xl sm:text-2xl font-black text-red-100 tracking-wider">
                  {formatTimer(elapsedSeconds)}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-950/40 px-3.5 py-2 rounded-xl border border-emerald-500/30 flex items-center gap-2 text-emerald-300 text-xs font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{t.machines.status_running}</span>
            </div>
          )}

          {/* Quick QR link badge */}
          <div 
            title={`QR Deep-link: ?machine_id=${machine.code}`}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center cursor-pointer transition"
          >
            <QrCode className="w-5 h-5 text-amber-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
