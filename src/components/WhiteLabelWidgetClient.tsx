'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, Sparkles, MessageCircle, Building2, Loader2 } from 'lucide-react';

interface WidgetMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  properties?: any[];
}

export default function WhiteLabelWidgetClient() {
  const searchParams = useSearchParams();

  const brand = searchParams.get('brand') || 'مستشارك العقاري الذكي';
  const color = searchParams.get('color') || '#f59e0b';
  const whatsapp = (searchParams.get('whatsapp') || '').replace(/\D/g, '');
  const city = searchParams.get('city') || '';
  const greeting =
    searchParams.get('greeting') ||
    `أهلاً بك في ${brand}! اسألني عن الأسعار أو الأقساط أو الوحدات المتاحة${city ? ` في ${city}` : ''} وسأرد عليك فوراً.`;

  const [messages, setMessages] = useState<WidgetMessage[]>([
    { id: 'welcome', role: 'assistant', content: greeting },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, loading]);

  const sendMessage = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;

    const userMsg: WidgetMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!textOverride) setInput('');
    setLoading(true);

    try {
      const contextualPrompt = city
        ? `[سياق الشريك: ${brand} - التركيز على ${city}] ${text}`
        : `[سياق الشريك: ${brand}] ${text}`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: contextualPrompt,
          locale: 'ar',
        }),
      });

      const data = await res.json();
      const replyContent =
        data.reply ||
        data.message ||
        'عذراً، حدث خطأ مؤقت. يمكنك المحاولة مرة أخرى أو التواصل مباشرة معنا.';

      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          content: replyContent,
          properties: Array.isArray(data.properties) ? data.properties.slice(0, 3) : [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: 'تعذر الاتصال حالياً. يرجى المحاولة بعد لحظات.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    city ? `أرخص شقق بالتقسيط في ${city}` : 'أفضل شقق بالتقسيط حالياً',
    'معايا مقدم 500 ألف.. أجيب إيه؟',
    'وحدات استلام فوري',
  ];

  const whatsappUrl = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(`مرحباً ${brand}، أتواصل معكم بخصوص استفسار عقاري.`)}`
    : null;

  return (
    <div
      className="flex flex-col h-screen w-full bg-zinc-950 text-zinc-100 font-sans overflow-hidden"
      dir="rtl"
    >
      {/* Branded Header */}
      <header
        className="px-4 py-3 flex items-center justify-between border-b border-zinc-800 shrink-0"
        style={{ backgroundColor: '#09090b' }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center text-black font-black shrink-0 shadow-sm"
            style={{ backgroundColor: color }}
          >
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-black text-sm text-white truncate">{brand}</h1>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              متاح الآن للرد الفوري
            </span>
          </div>
        </div>

        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black px-2.5 py-1.5 text-[11px] font-black transition shrink-0"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>واتساب</span>
          </a>
        )}
      </header>

      {/* Messages Stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === 'user' ? 'items-start' : 'items-end'}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'text-black font-bold rounded-tr-sm'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-sm'
              }`}
              style={m.role === 'user' ? { backgroundColor: color } : undefined}
            >
              {m.content}
            </div>

            {/* Inline Property Mini Cards */}
            {m.properties && m.properties.length > 0 && (
              <div className="mt-2 w-full max-w-[92%] space-y-1.5">
                {m.properties.map((p: any, i: number) => (
                  <div
                    key={p.id || i}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-2.5 text-[11px] flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">{p.title}</div>
                      <div className="text-zinc-400 truncate">
                        {p.area_sqm ? `${p.area_sqm} م²` : ''} •{' '}
                        {p.compound?.name || p.compound?.city || ''}
                      </div>
                    </div>
                    <div className="text-left shrink-0">
                      <div className="font-black" style={{ color }}>
                        {p.total_price
                          ? `${(p.total_price / 1_000_000).toFixed(2)} م`
                          : '—'}
                      </div>
                      {p.installment_years > 0 && (
                        <div className="text-[10px] text-emerald-400">
                          {p.installment_years} سنوات
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-end justify-end">
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 px-3.5 py-2 text-xs text-zinc-400 flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color }} />
              <span>جاري البحث والحساب...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      {messages.length <= 2 && (
        <div className="px-3 pb-2 flex items-center gap-1.5 overflow-x-auto scrollbar-hide shrink-0">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => sendMessage(qp)}
              className="shrink-0 rounded-full border border-zinc-800 bg-zinc-900 hover:border-zinc-600 px-2.5 py-1 text-[11px] text-zinc-300 transition"
            >
              {qp}
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="p-2.5 border-t border-zinc-800 bg-zinc-950 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="اكتب سؤالك عن الأسعار أو الأقساط..."
          className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="h-9 w-9 rounded-xl flex items-center justify-center text-black font-black disabled:opacity-50 transition shrink-0"
          style={{ backgroundColor: color }}
          aria-label="إرسال"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      {/* Subtle Powered-by */}
      <div className="py-1 text-center text-[9px] text-zinc-600 bg-black shrink-0">
        مدعوم بواسطة{' '}
        <a
          href="https://ewanbot.com/partners"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-400 hover:underline font-bold"
        >
          Ewanbot AI
        </a>
      </div>
    </div>
  );
}
