'use client';

import React, { useState } from 'react';
import { Machine, DowntimeCategory } from '@/lib/types';
import { Locale, translations } from '@/lib/i18n';
import { SpeechHandler } from '@/lib/speech';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Mic, 
  MicOff, 
  Zap, 
  Cog, 
  Box, 
  HelpCircle,
  Radio,
  Send
} from 'lucide-react';

interface OperatorBreakdownCardProps {
  machine: Machine;
  locale: Locale;
  onReportBreakdown: (category: DowntimeCategory, voiceNote: string) => void;
  onResolveBreakdown: () => void;
}

export default function OperatorBreakdownCard({
  machine,
  locale,
  onReportBreakdown,
  onResolveBreakdown,
}: OperatorBreakdownCardProps) {
  const t = translations[locale];
  const [showSelector, setShowSelector] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DowntimeCategory>('mechanical');
  const [voiceNote, setVoiceNote] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechHandler, setSpeechHandler] = useState<SpeechHandler | null>(null);

  const isDown = machine.current_status === 'down';

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
          setVoiceNote(transcript);
        },
        onError: () => setIsRecording(false),
        onEnd: () => setIsRecording(false),
      });
      setIsRecording(true);
    }
  };

  const handleConfirmBreakdown = () => {
    onReportBreakdown(selectedCategory, voiceNote);
    setShowSelector(false);
    setVoiceNote('');
    if (speechHandler) {
      speechHandler.stop();
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md mb-4">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <Radio className="w-4 h-4 text-orange-500 animate-pulse" />
          {t.operator.quick_actions}
        </span>
        <span className="text-[11px] text-slate-400 font-mono">
          {machine.code} • {machine.name}
        </span>
      </div>

      {!isDown ? (
        <div>
          {!showSelector ? (
            <button
              onClick={() => setShowSelector(true)}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-base sm:text-lg flex items-center justify-center gap-3 shadow-lg shadow-red-600/30 transition transform active:scale-95"
            >
              <AlertTriangle className="w-6 h-6 animate-bounce" />
              <span>{t.operator.report_breakdown}</span>
            </button>
          ) : (
            <div className="bg-slate-950/80 border border-red-500/30 rounded-xl p-4 space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                {t.operator.select_reason}
              </label>

              {/* 4 Quick Category Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('electrical')}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition ${
                    selectedCategory === 'electrical'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-sm'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>{t.breakdown_categories.electrical}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory('mechanical')}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition ${
                    selectedCategory === 'mechanical'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500 shadow-sm'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Cog className="w-4 h-4 text-blue-400" />
                  <span>{t.breakdown_categories.mechanical}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory('material')}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition ${
                    selectedCategory === 'material'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500 shadow-sm'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Box className="w-4 h-4 text-purple-400" />
                  <span>{t.breakdown_categories.material}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory('other')}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition ${
                    selectedCategory === 'other'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-sm'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <HelpCircle className="w-4 h-4 text-rose-400" />
                  <span>{t.breakdown_categories.other}</span>
                </button>
              </div>

              {/* Voice Dictation or Text Note */}
              <div className="relative">
                <input
                  type="text"
                  value={voiceNote}
                  onChange={(e) => setVoiceNote(e.target.value)}
                  placeholder={isRecording ? t.operator.listening : t.operator.voice_note}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-400 pr-12"
                />
                <button
                  type="button"
                  onClick={toggleRecording}
                  title="Web Speech API"
                  className={`absolute top-1.5 ltr:right-2 rtl:left-2 p-1.5 rounded-lg transition ${
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-slate-800 text-amber-400 hover:bg-slate-700'
                  }`}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmBreakdown}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition"
                >
                  <Send className="w-4 h-4" />
                  <span>{t.operator.confirm_breakdown}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSelector(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Machine is DOWN -> Big Green button to mark fixed */
        <div className="space-y-3">
          <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3 text-xs text-red-200 flex items-center justify-between">
            <div>
              <span className="font-semibold block">⚠️ عطل نشط قيد الصيانة:</span>
              <span>{machine.active_downtime_note || 'تم إشعار فريق الصيانة'}</span>
            </div>
            <span className="font-bold px-2 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/30">
              {machine.active_downtime_reason ? t.breakdown_categories[machine.active_downtime_reason] : 'عطل'}
            </span>
          </div>

          <button
            onClick={onResolveBreakdown}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-base sm:text-lg flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/30 transition transform active:scale-95"
          >
            <CheckCircle2 className="w-6 h-6 animate-pulse" />
            <span>{t.operator.mark_resolved}</span>
          </button>
        </div>
      )}
    </div>
  );
}
