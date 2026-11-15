'use client';

import React, { useMemo, useState } from 'react';
import {
  Newspaper,
  RefreshCw,
  Search,
  AlertTriangle,
  TrendingUp,
  Info,
  ExternalLink,
  Building2,
} from 'lucide-react';
import type { NewsCategory, NewsDisclosureItem, NewsSentiment } from '@/lib/news-disclosures';

interface Props {
  initialItems: NewsDisclosureItem[];
  totalAvailable: number;
  byCategory: Record<string, number>;
  bySentiment: Record<string, number>;
}

const CATEGORY_LABELS: Record<NewsCategory | 'all', string> = {
  all: 'الكل',
  egx_disclosure: 'إفصاحات البورصة',
  nuca_policy: 'المجتمعات العمرانية',
  macro_cbe: 'البنك المركزي والفائدة',
  developer_news: 'أخبار المطورين والسوق',
};

const SENTIMENT_META: Record<
  NewsSentiment,
  { label: string; badgeClass: string; Icon: React.ElementType }
> = {
  positive: {
    label: 'إيجابي للسوق',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    Icon: TrendingUp,
  },
  warning: {
    label: 'تنبيه / مخاطر',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    Icon: AlertTriangle,
  },
  neutral: {
    label: 'متابعة',
    badgeClass: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    Icon: Info,
  },
};

export default function NewsDisclosuresFeed({
  initialItems,
  totalAvailable,
  byCategory,
  bySentiment,
}: Props) {
  const [items, setItems] = useState<NewsDisclosureItem[]>(initialItems);
  const [total, setTotal] = useState(totalAvailable);
  const [category, setCategory] = useState<NewsCategory | 'all'>('all');
  const [sentiment, setSentiment] = useState<NewsSentiment | 'all'>('all');
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNote, setRefreshNote] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (category !== 'all' && item.category !== category) return false;
      if (sentiment !== 'all' && item.impact_sentiment !== sentiment) return false;
      if (q) {
        const hay = `${item.title} ${item.source_name} ${item.developer_name || ''} ${item.egx_ticker || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, category, sentiment, query]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshNote(null);
    try {
      const res = await fetch('/api/news-disclosures?refresh=1&limit=60');
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setItems(data.items);
        setTotal(data.totalAvailable || data.items.length);
        setRefreshNote(
          data.refreshed
            ? `تم سحب ${data.refreshed.fetched} خبر وإفصاح وتحديث قاعدة البيانات`
            : 'تم تحديث القائمة'
        );
      }
    } catch {
      setRefreshNote('تعذر الاتصال بالمصدر حالياً');
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return iso.slice(0, 10);
    }
  };

  return (
    <section
      id="news-radar"
      className="rounded-3xl border border-amber-500/25 bg-zinc-900/75 overflow-hidden shadow-xl mb-10"
    >
      <div className="p-5 sm:p-6 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-black text-lg text-white flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-amber-400" />
            <span>رادار الأخبار وإفصاحات البورصة المصرية</span>
            <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-mono text-amber-300">
              {total} سجل حي
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            متابعة آلية لإفصاحات المطورين بالبورصة المصرية، طروحات هيئة المجتمعات العمرانية، وقرارات البنك المركزي
          </p>
        </div>

        <div className="flex items-center gap-2">
          {refreshNote && (
            <span className="text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-lg">
              {refreshNote}
            </span>
          )}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black font-black text-xs transition cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'جاري السحب...' : 'تحديث الآن'}</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 sm:p-5 bg-zinc-950/60 border-b border-zinc-800/80 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(CATEGORY_LABELS) as Array<NewsCategory | 'all'>).map((cat) => {
            const count = cat === 'all' ? total : byCategory[cat] || 0;
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  active
                    ? 'bg-amber-500 text-black border-amber-400'
                    : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {CATEGORY_LABELS[cat]} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="h-4 w-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث باسم مطور (طلعت مصطفى، بالم هيلز، أوراسكوم) أو موضوع..."
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 pr-9 pl-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/60"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {(['all', 'positive', 'warning', 'neutral'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSentiment(s)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                  sentiment === s
                    ? 'bg-zinc-200 text-black border-white'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                {s === 'all'
                  ? 'كل التأثيرات'
                  : s === 'positive'
                    ? `إيجابي (${bySentiment.positive || 0})`
                    : s === 'warning'
                      ? `تحذيرات (${bySentiment.warning || 0})`
                      : `متابعة (${bySentiment.neutral || 0})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[680px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-10 text-sm text-zinc-400">
            لا توجد أخبار مطابقة لهذا الفلتر حالياً.
          </div>
        ) : (
          filtered.slice(0, 30).map((item, idx) => {
            const meta = SENTIMENT_META[item.impact_sentiment] || SENTIMENT_META.neutral;
            const Icon = meta.Icon;
            return (
              <article
                key={item.url + idx}
                className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 hover:border-amber-500/40 transition flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${meta.badgeClass}`}
                    >
                      <Icon className="h-3 w-3" />
                      <span>{meta.label}</span>
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      {formatDate(item.published_at)} • {item.source_name}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white leading-snug mb-2">
                    {item.title}
                  </h3>

                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {item.impact_summary}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/70">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-md bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[10px] text-zinc-300">
                      {CATEGORY_LABELS[item.category] || item.category}
                    </span>
                    {item.developer_name && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                        <Building2 className="h-2.5 w-2.5" />
                        {item.developer_name}
                        {item.egx_ticker ? ` (${item.egx_ticker})` : ''}
                      </span>
                    )}
                  </div>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300"
                  >
                    <span>المصدر</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
