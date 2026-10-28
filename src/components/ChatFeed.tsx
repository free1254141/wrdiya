'use client';

import React, { useState } from 'react';
import { ChatMessage, UserRole } from '@/lib/types';
import { Locale, translations } from '@/lib/i18n';
import { 
  Send, 
  Radio, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Bot
} from 'lucide-react';

interface ChatFeedProps {
  messages: ChatMessage[];
  locale: Locale;
  currentUserRole: UserRole;
  onSendMessage: (text: string) => void;
  onOpenAiCopilot?: () => void;
}

export default function ChatFeed({
  messages,
  locale,
  currentUserRole,
  onSendMessage,
  onOpenAiCopilot,
}: ChatFeedProps) {
  const isAr = locale === 'ar';
  const t = translations[locale];
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <span className="bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] px-2 py-0.5 rounded font-bold">{isAr ? '👔 مدير المصنع' : 'Manager'}</span>;
      case 'supervisor':
        return <span className="bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] px-2 py-0.5 rounded font-bold">{isAr ? '📋 مشرف وردية' : 'Supervisor'}</span>;
      case 'maintenance':
        return <span className="bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] px-2 py-0.5 rounded font-bold">{isAr ? '🛠️ صيانة' : 'Maintenance'}</span>;
      default:
        return <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded font-bold">{isAr ? '👷 تشغيل' : 'Operator'}</span>;
    }
  };

  return (
    <div className="neobrutal-card rounded-2xl p-4 sm:p-5 border-2 border-zinc-700 bg-[#0d121c] flex flex-col h-[560px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">
              {isAr ? 'بث شات صالة الإنتاج والورديات' : 'Floor Broadcast & Shift Feed'}
            </h3>
            <p className="text-[11px] text-zinc-400">
              {isAr ? 'سجل لحظي للأعطال والتنبيهات المتبادلة' : 'Real-time downtime alerts & handover notes'}
            </p>
          </div>
        </div>

        <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-emerald" />
          {isAr ? 'بث مباشر' : 'Live Stream'}
        </span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 neobrutal-grid-bg p-2 rounded-xl border border-zinc-800/80 mb-3">
        {messages.map((msg) => {
          const isBreakdown = msg.type === 'breakdown_alert';
          const isHandover = msg.type === 'shift_handover';
          const isProd = msg.type === 'production_summary';

          return (
            <div
              key={msg.id}
              className={`p-3 rounded-xl border text-xs transition ${
                isBreakdown
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-100'
                  : isHandover
                  ? 'bg-amber-950/30 border-amber-500/40 text-amber-100'
                  : isProd
                  ? 'bg-blue-950/30 border-blue-500/40 text-blue-100'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{msg.sender_name}</span>
                  {getRoleBadge(msg.sender_role)}
                </div>
                <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1" suppressHydrationWarning>
                  <Clock className="w-3 h-3 text-zinc-500" />
                  {new Date(msg.timestamp).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          );
        })}
      </div>

      {/* Quick AI Callout Banner */}
      <div className="mb-3 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-zinc-900 to-zinc-900 border border-amber-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-zinc-300 font-semibold text-[11px]">
            {isAr ? 'تحتاج تحليل عميق للأعطال أو مسودة تسليم؟' : 'Need deep downtime RCA or handover draft?'}
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenAiCopilot}
          className="text-[10px] font-bold text-amber-400 hover:text-amber-300 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition"
        >
          {isAr ? 'اسأل Wrdya AI' : 'Ask Copilot'}
        </button>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isAr ? 'اكتب رسالة عامة لصالة الإنتاج والوردية...' : 'Broadcast general message to factory floor...'}
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-amber-400"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="neobrutal-btn p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold transition shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
