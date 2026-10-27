'use client';

import React, { useState } from 'react';
import { ChatMessage, UserRole } from '@/lib/types';
import { Locale, translations } from '@/lib/i18n';
import { 
  Send, 
  User, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  BarChart3, 
  Clock, 
  Bot,
  MessageSquare,
  Sparkles
} from 'lucide-react';

interface ChatFeedProps {
  messages: ChatMessage[];
  locale: Locale;
  currentUserRole: UserRole;
  onSendMessage: (text: string) => void;
}

export default function ChatFeed({
  messages,
  locale,
  currentUserRole,
  onSendMessage,
}: ChatFeedProps) {
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
        return <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">المدير / AI</span>;
      case 'supervisor':
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">مشرف الوردية</span>;
      case 'maintenance':
        return <span className="bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">فريق الصيانة</span>;
      default:
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">فني التشغيل</span>;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">
            شات الوردية وصالة الإنتاج (Shift Live Feed)
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          مباشر
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.map((msg) => {
          const isAI = msg.sender_role === 'admin' && msg.type === 'ai_analyst_card';
          const isBreakdown = msg.type === 'breakdown_alert';
          const isRepair = msg.type === 'repair_log';
          const isHandover = msg.type === 'shift_handover';
          const isProduction = msg.type === 'production_summary';

          return (
            <div
              key={msg.id}
              className={`rounded-xl p-3 border transition ${
                isBreakdown
                  ? 'bg-red-950/40 border-red-500/40 text-red-100'
                  : isRepair
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100'
                  : isHandover
                  ? 'bg-amber-950/30 border-amber-500/40 text-amber-100'
                  : isProduction
                  ? 'bg-blue-950/30 border-blue-500/40 text-blue-100'
                  : 'bg-slate-950/70 border-slate-800 text-slate-200'
              }`}
            >
              {/* Message Header */}
              <div className="flex items-center justify-between gap-2 mb-1.5 text-xs">
                <div className="flex items-center gap-2">
                  {isAI ? (
                    <Bot className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span className="font-bold text-white text-xs">
                    {msg.sender_name}
                  </span>
                  {getRoleBadge(msg.sender_role)}
                </div>

                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Message Content */}
              <div className="text-xs leading-relaxed">
                {msg.content}
              </div>

              {/* Extra Meta Badges */}
              {isBreakdown && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-red-300">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>تم التوجيه الفوري لمهندس الصيانة</span>
                </div>
              )}

              {isRepair && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>الماكينة جاهزة للإنتاج الفعلي</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="اكتب رسالة سريعة في شات صالة الإنتاج..."
          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold transition shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
