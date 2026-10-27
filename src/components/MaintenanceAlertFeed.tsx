'use client';

import React, { useEffect, useState } from 'react';
import { DowntimeLog, Machine } from '@/lib/types';
import { Locale, translations } from '@/lib/i18n';
import { Wrench, AlertCircle, Clock, Check, BellRing, Navigation } from 'lucide-react';

interface MaintenanceAlertFeedProps {
  downtimeLogs: DowntimeLog[];
  machines: Machine[];
  locale: Locale;
  onAcknowledgeAlert?: (logId: string) => void;
}

export default function MaintenanceAlertFeed({
  downtimeLogs,
  machines,
  locale,
  onAcknowledgeAlert,
}: MaintenanceAlertFeedProps) {
  const t = translations[locale];
  const [acknowledged, setAcknowledged] = useState<Record<string, boolean>>({});

  // Filter only unresolved downtime logs
  const activeBreakdowns = downtimeLogs.filter((log) => !log.ended_at);

  const formatElapsed = (startedAt: string) => {
    const diffSec = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  if (activeBreakdowns.length === 0) {
    return (
      <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4 text-center mb-4">
        <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2">
          <Check className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-bold text-emerald-300">
          لا توجد بلاغات أعطال نشطة حالياً
        </h4>
        <p className="text-xs text-slate-400 mt-0.5">
          جميع خطوط وماكينات المصنع تعمل بكفاءة مستقرة
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 mb-4">
      {activeBreakdowns.map((log) => {
        const machine = machines.find((m) => m.id === log.machine_id);
        const isAck = acknowledged[log.id];

        return (
          <div
            key={log.id}
            className="bg-gradient-to-r from-red-950/80 via-rose-950/60 to-slate-900 border border-red-500/40 rounded-2xl p-4 shadow-xl backdrop-blur-md relative overflow-hidden animate-pulse-subtle"
          >
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
                  <BellRing className="w-4 h-4 animate-bounce" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-red-300">
                  {t.maintenance.active_alert}
                </span>
              </div>

              {/* Stopwatch */}
              <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-red-500/30 text-xs font-mono font-bold text-red-200">
                <Clock className="w-3.5 h-3.5 text-red-400 animate-spin" />
                <span>{formatElapsed(log.started_at)}</span>
              </div>
            </div>

            {/* Machine & Problem Details */}
            <div className="mb-3">
              <div className="text-sm font-black text-white flex items-center gap-2">
                <span>{machine?.name || log.machine_name || 'ماكينة غير محددة'}</span>
                <span className="text-xs font-mono font-normal bg-red-500/20 text-red-300 px-2 py-0.5 rounded">
                  {machine?.code || log.machine_code}
                </span>
              </div>

              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="text-slate-400">التصنيف:</span>
                <span className="font-semibold text-amber-300">
                  {t.breakdown_categories[log.reason_category]}
                </span>
              </div>

              {log.voice_note_text && (
                <div className="mt-2 text-xs bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 text-slate-200 italic">
                  &ldquo;{log.voice_note_text}&rdquo;
                </div>
              )}
            </div>

            {/* Action dispatch */}
            <div className="flex items-center justify-between pt-2 border-t border-red-500/20">
              <span className="text-[11px] text-slate-400">
                {t.maintenance.technician_assigned} م. فراس (الصيانة الميكانيكية)
              </span>

              <button
                onClick={() => {
                  setAcknowledged((prev) => ({ ...prev, [log.id]: true }));
                  if (onAcknowledgeAlert) onAcknowledgeAlert(log.id);
                }}
                className={`py-1.5 px-3.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  isAck
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30'
                }`}
              >
                {isAck ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>تم الاستلام والتوجه للماكينة</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{t.maintenance.action_acknowledge}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
