'use client';

import React, { useEffect, useState } from 'react';
import { DowntimeLog, Machine } from '@/lib/types';
import { Locale } from '@/lib/i18n';
import { Wrench, AlertTriangle, Clock, Check, BellRing, Navigation, Package, CheckCircle2 } from 'lucide-react';

interface MaintenanceAlertFeedProps {
  downtimeLogs: DowntimeLog[];
  machines: Machine[];
  locale: Locale;
  onAcknowledgeAlert?: (logId: string) => void;
  onResolveAlert?: (logId: string) => void;
}

export default function MaintenanceAlertFeed({
  downtimeLogs,
  machines,
  locale,
  onAcknowledgeAlert,
  onResolveAlert,
}: MaintenanceAlertFeedProps) {
  const isAr = locale === 'ar';
  const [acknowledged, setAcknowledged] = useState<Record<string, boolean>>({});
  const [inProgress, setInProgress] = useState<Record<string, boolean>>({});
  const [requestedPart, setRequestedPart] = useState<Record<string, string>>({});
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const activeBreakdowns = downtimeLogs.filter((log) => !log.ended_at);

  const formatElapsed = (startedAt: string) => {
    const diffSec = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Maintenance Header Summary */}
      <div className="neobrutal-card rounded-2xl p-5 border-2 border-zinc-700 bg-[#0d121c]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                {isAr ? 'لوحة طوارئ وبلاغات الصيانة المباشرة' : 'Emergency Maintenance & MTTR Response'}
              </h3>
              <p className="text-xs text-zinc-400">
                {isAr ? 'متابعة زمن الاستجابة (MTTR) وسرعة استئناف تشغيل الخطوط' : 'Live MTTR response tracking and line stoppage resolution'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 pulse-rose" />
              {activeBreakdowns.length} {isAr ? 'أعطال مفتوحة' : 'Open Stoppages'}
            </span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300">
              {isAr ? 'متوسط وقت الإصلاح: 28 دقيقة' : 'Avg MTTR: 28m'}
            </span>
          </div>
        </div>

        {activeBreakdowns.length === 0 ? (
          <div className="p-6 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-emerald-300">
              {isAr ? 'صالة الإنتاج خالية من الأعطال الحالية' : 'Plant Floor Clear • Zero Active Breakdowns'}
            </h4>
            <p className="text-xs text-zinc-400 mt-1">
              {isAr ? 'جميع الماكينات الأربعة تعمل أو في الصيانة المجدولة' : 'All 4 production machines running normally or under scheduled PM'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeBreakdowns.map((log) => {
              const machine = machines.find((m) => m.id === log.machine_id);
              const isAck = acknowledged[log.id];
              const isWorking = inProgress[log.id];

              return (
                <div
                  key={log.id}
                  className="p-4 rounded-xl border-2 border-rose-500/50 bg-[#160a0d] space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-white">
                        {log.machine_code || machine?.code}
                      </span>
                      <h4 className="text-sm font-black text-white">{log.machine_name || machine?.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                        {isAr ? 'عطل طارئ' : 'Emergency'}
                      </span>
                    </div>

                    {/* Live Ticking MTTR Stopwatch */}
                    <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-zinc-950 border border-zinc-800">
                      <Clock className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                      <span className="text-[10px] text-zinc-400 font-bold">{isAr ? 'زمن التوقف:' : 'Downtime:'}</span>
                      <span className="font-mono text-xs font-black text-rose-400">
                        {formatElapsed(log.started_at)}
                      </span>
                    </div>
                  </div>

                  {/* Breakdown details */}
                  <div className="text-xs text-zinc-300 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                    <span className="font-bold text-zinc-400 block mb-0.5">
                      {isAr ? 'تفاصيل المشكلة المبلغ عنها:' : 'Reported Breakdown Details:'}
                    </span>
                    <p>{log.voice_note_text || (isAr ? 'توقف مفاجئ في الماكينة' : 'Unplanned machine stoppage')}</p>
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-zinc-400">
                      <span>{isAr ? 'المبلّغ:' : 'Reported By:'} {log.reported_by || (isAr ? 'فني التشغيل' : 'Operator')}</span>
                      <span>•</span>
                      <span>{isAr ? 'التصنيف:' : 'Category:'} {log.reason_category}</span>
                    </div>
                  </div>

                  {/* Maintenance Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {!isAck ? (
                      <button
                        type="button"
                        onClick={() => {
                          setAcknowledged((prev) => ({ ...prev, [log.id]: true }));
                          onAcknowledgeAlert?.(log.id);
                        }}
                        className="neobrutal-btn px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 transition"
                      >
                        <BellRing className="w-3.5 h-3.5" />
                        <span>{isAr ? 'استلام البلاغ والتوجه للموقع' : 'Acknowledge & Dispatch to Floor'}</span>
                      </button>
                    ) : !isWorking ? (
                      <button
                        type="button"
                        onClick={() => setInProgress((prev) => ({ ...prev, [log.id]: true }))}
                        className="neobrutal-btn px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center gap-1.5 transition"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>{isAr ? 'بدء أعمال الفحص والإصلاح' : 'Start Repair Procedures'}</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-400 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          {isAr ? 'أعمال الإصلاح جارية حالياً' : 'Repair In Progress'}
                        </span>
                      </div>
                    )}

                    {/* Spare Part Quick Request */}
                    <button
                      type="button"
                      onClick={() => {
                        const part = prompt(isAr ? 'اكتب اسم قطعة الغيار المطلوبة من المخزن (مثال: حساس ثرموكبل E-402):' : 'Enter requested spare part name:');
                        if (part) {
                          setRequestedPart((prev) => ({ ...prev, [log.id]: part }));
                          alert(isAr ? `تم إرسال طلب صرف قطعة الغيار: ${part} إلى أمين المخزن.` : `Spare part requisition for ${part} dispatched.`);
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Package className="w-3.5 h-3.5 text-amber-400" />
                      <span>{requestedPart[log.id] ? `${isAr ? 'تم طلب:' : 'Requested:'} ${requestedPart[log.id]}` : (isAr ? 'طلب قطعة غيار' : 'Request Spare Part')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preventative Maintenance Checklist */}
      <div className="neobrutal-card rounded-2xl p-5 border-2 border-zinc-700 bg-[#0d121c]">
        <h4 className="text-sm font-black text-white mb-2 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-emerald-400" />
          {isAr ? 'جدول الفحص الوقائي اليومي (Preventive Checklist)' : 'Daily Preventive Maintenance (PM) Checklist'}
        </h4>
        <div className="space-y-2 text-xs">
          <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
            <span className="text-zinc-300">
              {isAr ? 'فحص ضغط زيت الهيدروليك لماكينة الحقن INJ-02 (المعيار 140 بار)' : 'Verify INJ-02 hydraulic oil pressure (Spec: 140 bar)'}
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
              {isAr ? 'مطابق 142 بار' : 'Pass 142 bar'}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
            <span className="text-zinc-300">
              {isAr ? 'تنظيف فلاتر سحب الهواء لخط البثق EXT-01' : 'Clean air intake filters for Extrusion line EXT-01'}
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
              {isAr ? 'تم الاستبدال' : 'Replaced'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
