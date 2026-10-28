'use client';

import React from 'react';
import { ShiftNote } from '@/lib/types';
import { Locale } from '@/lib/i18n';
import { Pin, Check, AlertCircle, Clock } from 'lucide-react';

interface PinnedHandoverAlertProps {
  note?: ShiftNote;
  locale: Locale;
  onAcknowledge: () => void;
}

export default function PinnedHandoverAlert({
  note,
  locale,
  onAcknowledge,
}: PinnedHandoverAlertProps) {
  if (!note || !note.is_pinned_for_next_shift) return null;
  const isAr = locale === 'ar';

  return (
    <div className="mb-6 p-4 sm:p-5 rounded-2xl neobrutal-card border-2 border-amber-500/80 bg-gradient-to-r from-[#1c1407] via-[#161007] to-[#0d121c] text-white shadow-xl animate-in fade-in slide-in-from-top-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <Pin className="w-5 h-5 rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                {isAr ? 'تنبيه تسليم معلق من الوردية السابقة (Handover Alert)' : 'Pending Shift Handover Priority Alert'}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                {isAr ? 'عاجل للمتابعة' : 'Priority Action'}
              </span>
            </div>
            <p className="text-sm font-semibold text-zinc-100 leading-relaxed max-w-3xl">
              {note.note_text}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
              <span className="font-bold text-zinc-300">{note.supervisor_name || (isAr ? 'مشرف الوردية' : 'Supervisor')}</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono text-[11px]" suppressHydrationWarning>
                <Clock className="w-3 h-3 text-zinc-500" />
                {new Date(note.created_at).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onAcknowledge}
          className="neobrutal-btn px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 shrink-0 transition"
        >
          <Check className="w-4 h-4" />
          <span>{isAr ? 'تم الاطلاع والموافقة' : 'Acknowledge & Signoff'}</span>
        </button>
      </div>
    </div>
  );
}
