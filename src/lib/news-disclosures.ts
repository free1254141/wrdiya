import { createClient } from '@supabase/supabase-js';
import newsSnapshot from '@/lib/data/news-disclosures.json';

export type NewsCategory =
  | 'egx_disclosure'
  | 'nuca_policy'
  | 'macro_cbe'
  | 'developer_news';

export type NewsSentiment = 'positive' | 'neutral' | 'warning';

export interface NewsDisclosureItem {
  id?: string;
  title: string;
  source_name: string;
  url: string;
  published_at: string;
  category: NewsCategory;
  developer_name: string | null;
  egx_ticker: string | null;
  impact_sentiment: NewsSentiment;
  impact_summary: string;
  tags: string[];
}

export interface NewsQueryFilters {
  query?: string;
  developer?: string;
  category?: NewsCategory | 'all';
  sentiment?: NewsSentiment | 'all';
  limit?: number;
}

const DEVELOPERS_RULES: Array<{
  keywords: string[];
  name: string;
  ticker: string | null;
}> = [
  {
    keywords: ['طلعت مصطفى', 'tmg', 'مدينتي', 'الرحاب', 'نور', 'ذا سباين'],
    name: 'Talaat Moustafa Group (TMG)',
    ticker: 'TMGH.CA',
  },
  {
    keywords: ['بالم هيلز', 'palm hills', 'باديا'],
    name: 'Palm Hills Developments',
    ticker: 'PHDC.CA',
  },
  {
    keywords: ['مدينة مصر', 'تاج سيتي', 'سراي'],
    name: 'Madinet Masr',
    ticker: 'MASR.CA',
  },
  {
    keywords: ['إعمار مصر', 'مراسي', 'ميفيدا', 'أب تاون'],
    name: 'Emaar Misr',
    ticker: 'EMFD.CA',
  },
  {
    keywords: ['سوديك', 'sodic', 'أكتوبر بلازا', 'فيليت'],
    name: 'SODIC',
    ticker: 'OCDI.CA',
  },
  {
    keywords: ['أوراسكوم للتنمية', 'الجونة', 'o west', 'أو ويست'],
    name: 'Orascom Development Egypt',
    ticker: 'ORHD.CA',
  },
  {
    keywords: ['مصر الجديدة للإسكان', 'هليوبوليس الجديدة'],
    name: 'Heliopolis Housing',
    ticker: 'HELI.CA',
  },
  {
    keywords: ['ماونتن فيو', 'آي سيتي'],
    name: 'Mountain View',
    ticker: null,
  },
  {
    keywords: ['تطوير مصر', 'بلومفيلدز', 'فوكا باي'],
    name: 'Tatweer Misr',
    ticker: null,
  },
  {
    keywords: ['حسن علام', 'سوان ليك'],
    name: 'Hassan Allam Properties',
    ticker: null,
  },
];

const POSITIVE_WORDS = [
  'أرباح', 'ترتفع', 'نمو', 'زيادة', 'مبيعات', 'تستهدف', 'تمويل', 'طرح',
  'توقيع', 'شراكة', 'افتتاح', 'تسليم', 'توسع', 'توزيعات', 'إطلاق', 'فرصة استثمارية',
];

const WARNING_WORDS = [
  'تراجع', 'انخفاض', 'خسائر', 'نزاع', 'تأخير', 'تنازل', 'خلو منصب',
  'إلغاء', 'سحب أرض', 'تحذير', 'غرامة', 'أزمة', 'تعثر', 'شكاوى',
];

const RSS_QUERIES: Array<{ category: NewsCategory; query: string }> = [
  { category: 'egx_disclosure', query: 'طلعت مصطفى OR بالم هيلز OR مدينة مصر OR إعمار مصر إفصاح البورصة نتائج أعمال' },
  { category: 'egx_disclosure', query: 'سوديك OR أوراسكوم للتنمية OR مصر الجديدة للإسكان البورصة المصرية' },
  { category: 'nuca_policy', query: 'هيئة المجتمعات العمرانية طرح أراضي قرار وزاري مصر' },
  { category: 'macro_cbe', query: 'البنك المركزي المصري سعر الفائدة التمويل العقاري شهادات' },
  { category: 'developer_news', query: 'العاصمة الإدارية OR العلمين الجديدة OR الساحل الشمالي OR القاهرة الجديدة عقارات' },
];

function getSupabaseClient(write = false) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = write
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function classifyHeadline(title: string, fallbackCategory: NewsCategory): Omit<
  NewsDisclosureItem,
  'title' | 'source_name' | 'url' | 'published_at'
> {
  const lower = title.toLowerCase();
  let devName: string | null = null;
  let ticker: string | null = null;
  for (const rule of DEVELOPERS_RULES) {
    if (rule.keywords.some((k) => lower.includes(k.toLowerCase()))) {
      devName = rule.name;
      ticker = rule.ticker;
      break;
    }
  }

  let category: NewsCategory = fallbackCategory;
  if (['البنك المركزي', 'الفائدة', 'التضخم', 'التمويل العقاري', 'شهادات'].some((w) => title.includes(w))) {
    category = 'macro_cbe';
  } else if (['المجتمعات العمرانية', 'قرار وزاري', 'طرح أراضي', 'سحب أرض', 'تخصيص أرض'].some((w) => title.includes(w))) {
    category = 'nuca_policy';
  } else if (ticker || ['إفصاح', 'البورصة', 'أرباح', 'نتائج أعمال', 'قوائم مالية'].some((w) => title.includes(w))) {
    category = 'egx_disclosure';
  }

  const posHits = POSITIVE_WORDS.filter((w) => title.includes(w)).length;
  const negHits = WARNING_WORDS.filter((w) => title.includes(w)).length;
  let impact_sentiment: NewsSentiment = 'neutral';
  let impact_summary = 'متابعة دورية لحركة السوق والسياسات العقارية المصرية.';

  if (negHits > posHits) {
    impact_sentiment = 'warning';
    impact_summary =
      'تنبيه مهم للمشتري والمستثمر: يُنصح بمراجعة تفاصيل الخبر وشروط العقد أو موقف التسليم قبل اتخاذ قرار الشراء.';
  } else if (posHits > 0) {
    impact_sentiment = 'positive';
    impact_summary =
      'مؤشر إيجابي يدعم ثقة السوق أو الملاءة المالية والتوسعات الجارية، مما يعزز جاذبية الاستثمار.';
  }

  const tags: string[] = [category];
  if (devName) tags.push(devName);
  if (ticker) tags.push(ticker);

  return {
    category,
    developer_name: devName,
    egx_ticker: ticker,
    impact_sentiment,
    impact_summary,
    tags,
  };
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

export async function refreshNewsDisclosuresLive(): Promise<{
  fetched: number;
  upserted: number;
}> {
  const seenUrls = new Set<string>();
  const collected: NewsDisclosureItem[] = [];

  await Promise.all(
    RSS_QUERIES.map(async ({ category, query }) => {
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ar&gl=EG&ceid=EG:ar`;
      try {
        const res = await fetch(rssUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          next: { revalidate: 0 },
        });
        if (!res.ok) return;
        const xml = await res.text();
        const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
        for (const block of itemMatches) {
          const rawTitle = decodeXmlEntities(block.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
          const link = decodeXmlEntities(block.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '');
          const pubRaw = decodeXmlEntities(block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '');
          const sourceTag = decodeXmlEntities(block.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || '');

          if (!rawTitle || !link || seenUrls.has(link)) continue;
          seenUrls.add(link);

          let title = rawTitle;
          let source_name = sourceTag;
          const sepIdx = rawTitle.lastIndexOf(' - ');
          if (sepIdx > 0) {
            title = rawTitle.slice(0, sepIdx).trim();
            if (!source_name) source_name = rawTitle.slice(sepIdx + 3).trim();
          }

          const parsedDate = pubRaw ? new Date(pubRaw) : new Date();
          const published_at = Number.isNaN(parsedDate.getTime())
            ? new Date().toISOString()
            : parsedDate.toISOString();

          collected.push({
            title,
            source_name: source_name || 'مصدر إخباري مصري',
            url: link,
            published_at,
            ...classifyHeadline(title, category),
          });
        }
      } catch {
        // Ignore transient network errors for individual RSS queries
      }
    })
  );

  let upserted = 0;
  const supa = getSupabaseClient(true);
  if (supa && collected.length > 0) {
    const { error } = await supa
      .from('market_news_disclosures')
      .upsert(collected, { onConflict: 'url' });
    if (!error) {
      upserted = collected.length;
    }
  }

  return { fetched: collected.length, upserted };
}

function filterItems(items: NewsDisclosureItem[], filters: NewsQueryFilters): NewsDisclosureItem[] {
  const q = (filters.query || '').trim().toLowerCase();
  const dev = (filters.developer || '').trim().toLowerCase();
  const cat = filters.category && filters.category !== 'all' ? filters.category : null;
  const sent = filters.sentiment && filters.sentiment !== 'all' ? filters.sentiment : null;
  const limit = Math.min(Math.max(filters.limit || 20, 1), 100);

  return items
    .filter((item) => {
      if (cat && item.category !== cat) return false;
      if (sent && item.impact_sentiment !== sent) return false;
      if (dev) {
        const hay = `${item.developer_name || ''} ${item.egx_ticker || ''} ${item.title}`.toLowerCase();
        if (!hay.includes(dev)) return false;
      }
      if (q) {
        const hay = `${item.title} ${item.source_name} ${item.developer_name || ''} ${item.impact_summary}`.toLowerCase();
        const terms = q.split(/\s+/).filter((t) => t.length > 1);
        if (terms.length > 0 && !terms.some((t) => hay.includes(t))) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, limit);
}

export async function queryNewsDisclosures(
  filters: NewsQueryFilters = {}
): Promise<{
  items: NewsDisclosureItem[];
  totalAvailable: number;
  byCategory: Record<string, number>;
  bySentiment: Record<string, number>;
}> {
  let all: NewsDisclosureItem[] = [];

  const supa = getSupabaseClient(false);
  if (supa) {
    try {
      const { data, error } = await supa
        .from('market_news_disclosures')
        .select('id,title,source_name,url,published_at,category,developer_name,egx_ticker,impact_sentiment,impact_summary,tags')
        .order('published_at', { ascending: false })
        .limit(150);
      if (!error && Array.isArray(data) && data.length > 0) {
        all = data as NewsDisclosureItem[];
      }
    } catch {
      // Fall back to static JSON snapshot
    }
  }

  if (all.length === 0) {
    all = newsSnapshot as NewsDisclosureItem[];
  }

  const byCategory: Record<string, number> = {};
  const bySentiment: Record<string, number> = {};
  for (const item of all) {
    byCategory[item.category] = (byCategory[item.category] || 0) + 1;
    bySentiment[item.impact_sentiment] = (bySentiment[item.impact_sentiment] || 0) + 1;
  }

  return {
    items: filterItems(all, filters),
    totalAvailable: all.length,
    byCategory,
    bySentiment,
  };
}
