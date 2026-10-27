'use client';

import React from 'react';
import { ShiftNote } from '@/lib/types';
import { Locale, translations } from '@/lib/i18n';
import { Pin, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface PinnedHandoverAlertProps {
  note?: ShiftNote | null;
  locale: Locale;
  onAcknowledge?: () => void;
}

export default function PinnedHandoverAlert({
  note,
  locale,
  onAcknowledge,
}: PinnedHandoverAlertProps) {
  const t = translations[locale];

  if (!note) return null;

  return (
    <div className="bg-gradient-to-r from-amber-950/80 via-orange-950/50 to-amber-900/40 border border-amber-500/40 rounded-2xl p-4 shadow-xl backdrop-blur-sm relative overflow-hidden mb-4">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-start gap-3 relative z-10">
        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
          <Pin className="w-5 h-5 rotate-45" />
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {t.supervisor.pinned_handover}
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                {t.note_categories[note.category]}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-amber-300/80">
              <Clock className="w-3 h-3" />
              <span>{new Date(note.created_at).toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          <p className="text-sm font-medium text-amber-100 leading-relaxed mb-2">
            {note.note_text}
          </p>

          <div className="flex items-center justify-between text-xs text-amber-400/80 pt-2 border-t border-amber-500/20">
            <span className="font-semibold">{note.supervisor_name || 'مشرف الوردية'}</span>
            {onAcknowledge && (
              <button
                onClick={onAcknowledge}
                className="flex items-center gap-1 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-xs font-medium border border-amber-500/30 transition"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>تم الاطلاع (Acknowledge)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
