'use client';

import React, { useState } from 'react';
import { NoteCategory } from '@/lib/types';
import { Locale, translations } from '@/lib/i18n';
import { SpeechHandler } from '@/lib/speech';
import { MessageSquarePlus, Pin, Mic, MicOff, Send, Check } from 'lucide-react';

interface SupervisorNoteCardProps {
  locale: Locale;
  onAddNote: (category: NoteCategory, noteText: string, isPinned: boolean) => void;
}

export default function SupervisorNoteCard({
  locale,
  onAddNote,
}: SupervisorNoteCardProps) {
  const isAr = locale === 'ar';
  const t = translations[locale];
  const [selectedCategory, setSelectedCategory] = useState<NoteCategory>('handover_alert');
  const [noteText, setNoteText] = useState('');
  const [isPinned, setIsPinned] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [speechHandler, setSpeechHandler] = useState<SpeechHandler | null>(null);
  const [successNotice, setSuccessNotice] = useState(false);

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
          onResult: (transcript: string) => {
            setNoteText((prev) => (prev ? `${prev} ${transcript}` : transcript));
          },
          onError: () => setIsRecording(false),
          onEnd: () => setIsRecording(false),
        });
        setIsRecording(true);
      } else {
        alert(isAr ? 'التعرف الصوتي غير مدعوم في هذا المتصفح' : 'Speech recognition not supported in this browser');
      }
    }
  };

  const handlePostNote = () => {
    if (!noteText.trim()) return;
    onAddNote(selectedCategory, noteText.trim(), isPinned);
    setNoteText('');
    setSuccessNotice(true);
    setTimeout(() => setSuccessNotice(false), 2500);
  };

  return (
    <div className="neobrutal-card rounded-2xl p-5 border-2 border-zinc-700 bg-[#0d121c]">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
          <MessageSquarePlus className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white">
            {isAr ? 'إضافة ملاحظة وتنبيه تسليم الوردية (Shift Handover)' : 'Shift Handover Note & Priority Alert'}
          </h3>
          <p className="text-xs text-zinc-400">
            {isAr ? 'توثيق الملاحظات الهامة للمشرف التالي أو إدارة المصنع' : 'Record critical instructions for incoming supervisor & management'}
          </p>
        </div>
      </div>

      <div className="space-y-3.5">
        {/* Category selector */}
        <div>
          <label className="block text-xs font-bold text-zinc-300 mb-1.5">
            {isAr ? 'تصنيف الملاحظة:' : 'Note Category:'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(
              [
                ['handover_alert', isAr ? '📌 تنبيه تسليم وردية' : '📌 Handover Alert'],
                ['material_issue', isAr ? '📦 مشكلة خامات' : '📦 Raw Material Issue'],
                ['worker_absence', isAr ? '👥 غياب عمالة' : '👥 Worker Absence'],
                ['general', isAr ? '📝 ملاحظة عامة' : '📝 General Note'],
              ] as const
            ).map(([catKey, label]) => (
              <button
                key={catKey}
                type="button"
                onClick={() => setSelectedCategory(catKey as NoteCategory)}
                className={`p-2 rounded-xl border text-xs font-bold text-right rtl:text-right ltr:text-left transition ${
                  selectedCategory === catKey
                    ? 'border-amber-400 bg-amber-500/20 text-white'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Note textarea */}
        <div>
          <label className="block text-xs font-bold text-zinc-300 mb-1.5">
            {isAr ? 'نص الملاحظة:' : 'Note Content:'}
          </label>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={3}
            placeholder={
              isRecording
                ? (isAr ? 'جارِ الاستماع لصوتك وتسجيل الملاحظة...' : 'Listening to voice...')
                : (isAr ? 'اكتب تفاصيل التنبيه أو اضغط على الميكروفون للتحدث صوتياً...' : 'Type alert details or click mic to dictate...')
            }
            className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Controls bar: Voice recording + Pin to next shift toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                isRecording
                  ? 'bg-rose-500 text-white border-rose-400 pulse-rose'
                  : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white'
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isRecording ? (isAr ? 'إيقاف التسجيل' : 'Stop') : (isAr ? 'تسجيل صوتي' : 'Voice')}</span>
            </button>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-300">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500"
              />
              <span className="flex items-center gap-1 text-amber-400">
                <Pin className="w-3.5 h-3.5" />
                {isAr ? 'تثبيت كتنبيه بارز للوردية القادمة' : 'Pin as Top Alert for Next Shift'}
              </span>
            </label>
          </div>

          <button
            type="button"
            onClick={handlePostNote}
            disabled={!noteText.trim()}
            className="neobrutal-btn px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-black text-xs flex items-center gap-1.5 transition"
          >
            {successNotice ? (
              <>
                <Check className="w-4 h-4" />
                <span>{isAr ? 'تم النشر بنجاح!' : 'Posted!'}</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{isAr ? 'نشر وتعميم الملاحظة' : 'Broadcast Shift Note'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
