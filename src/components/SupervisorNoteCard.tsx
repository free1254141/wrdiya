'use client';

import React, { useState } from 'react';
import { NoteCategory } from '@/lib/types';
import { Locale, translations } from '@/lib/i18n';
import { SpeechHandler } from '@/lib/speech';
import { 
  FileText, 
  Mic, 
  MicOff, 
  Pin, 
  Send, 
  Tag, 
  PackageX, 
  UserMinus, 
  BellRing, 
  Info 
} from 'lucide-react';

interface SupervisorNoteCardProps {
  locale: Locale;
  onAddNote: (category: NoteCategory, noteText: string, isPinned: boolean) => void;
}

export default function SupervisorNoteCard({
  locale,
  onAddNote,
}: SupervisorNoteCardProps) {
  const t = translations[locale];
  const [category, setCategory] = useState<NoteCategory>('handover_alert');
  const [noteText, setNoteText] = useState('');
  const [isPinned, setIsPinned] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [speechHandler, setSpeechHandler] = useState<SpeechHandler | null>(null);

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
      handler.start({
        onResult: (transcript) => {
          setNoteText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        },
        onError: () => setIsRecording(false),
        onEnd: () => setIsRecording(false),
      });
      setIsRecording(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    onAddNote(category, noteText.trim(), isPinned);
    setNoteText('');
    if (speechHandler) speechHandler.stop();
    setIsRecording(false);
  };

  const getCategoryIcon = (cat: NoteCategory) => {
    switch (cat) {
      case 'material_issue':
        return <PackageX className="w-3.5 h-3.5 text-purple-400" />;
      case 'worker_absence':
        return <UserMinus className="w-3.5 h-3.5 text-rose-400" />;
      case 'handover_alert':
        return <BellRing className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Info className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md mb-4">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">
            {t.supervisor.action_note}
          </h3>
          <span className="text-[11px] text-slate-400">
            توثيق الملاحظات والتنبيهات المباشرة بين ورديات المصنع
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Quick Tag Selector */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>تصنيف الملاحظة:</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['handover_alert', 'material_issue', 'worker_absence', 'general'] as NoteCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                  category === cat
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                {getCategoryIcon(cat)}
                <span>{t.note_categories[cat]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Note Textarea with Web Speech Voice Dictation */}
        <div className="relative">
          <textarea
            rows={3}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder={isRecording ? t.operator.listening : t.supervisor.note_placeholder}
            className="w-full bg-slate-950/80 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 leading-relaxed pr-12"
          />
          <button
            type="button"
            onClick={toggleRecording}
            title="إملاء صوتي باللغة العربية"
            className={`absolute top-2.5 ltr:right-2.5 rtl:left-2.5 p-2 rounded-xl transition ${
              isRecording
                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50'
                : 'bg-slate-800 text-amber-400 hover:bg-slate-700'
            }`}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>

        {/* Pin Checkbox & Submit */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-amber-300 select-none">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-400 bg-slate-950"
            />
            <span className="flex items-center gap-1">
              <Pin className="w-3.5 h-3.5 text-amber-400 rotate-45" />
              {t.supervisor.pin_for_next}
            </span>
          </label>

          <button
            type="submit"
            disabled={!noteText.trim()}
            className="py-2 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>{t.supervisor.save_note}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
