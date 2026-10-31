'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Property } from '@/lib/types';
import PropertyCard from './PropertyCard';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  Bot,
  Scale,
  X,
  Building2,
  RefreshCw,
  ArrowUpDown,
  CheckCircle2,
  Zap,
  Globe,
  Home,
  ChevronDown
} from 'lucide-react';

interface DirectSearchPanelProps {
  onSendToChat: (property: Property, customQuery?: string) => void;
  onCompareWithChat: (properties: Property[]) => void;
  onBookViewing: (property: Property) => void;
  onToggleFavorite: (property: Property) => void;
  onViewDetails: (property: Property) => void;
  favorites: Property[];
  onSwitchToChat: () => void;
}

type RegionKey = 'all' | 'tagamoa' | 'zayed' | 'capital' | 'coast' | 'dubai' | 'turkey' | 'spain' | 'seller';
type UnitTypeKey = 'all' | 'apartment' | 'villa' | 'townhouse' | 'chalet' | 'duplex';
type SortKey = 'relevance' | 'price_asc' | 'price_desc' | 'area_desc';

export default function DirectSearchPanel({
  onSendToChat,
  onCompareWithChat,
  onBookViewing,
  onToggleFavorite,
  onViewDetails,
  favorites,
  onSwitchToChat
}: DirectSearchPanelProps) {
  const { locale, isRtl } = useLanguage();
  const isAr = locale === 'ar';

  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<RegionKey>('all');
  const [selectedType, setSelectedType] = useState<UnitTypeKey>('all');
  const [selectedBedrooms, setSelectedBedrooms] = useState<string>('all');
  const [paymentMethod, setPaymentMethod] = useState<'all' | 'installment' | 'cash'>('all');
  const [sortBy, setSortBy] = useState<SortKey>('relevance');

  // AI Comparison Bucket (up to 3 units)
  const [comparedProperties, setComparedProperties] = useState<Property[]>([]);

  // Pagination for smooth rendering
  const [visibleCount, setVisibleCount] = useState(24);

  // 1. Fetch all properties once from cached API
  const fetchProperties = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/properties');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.properties)) {
          setAllProperties(data.properties);
        }
      }
    } catch (err) {
      console.error('Failed to load direct properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // 2. Toggle comparison
  const handleToggleCompare = (property: Property) => {
    setComparedProperties((prev) => {
      const exists = prev.some((p) => p.id === property.id);
      if (exists) {
        return prev.filter((p) => p.id !== property.id);
      }
      if (prev.length >= 3) {
        alert(isAr ? 'يمكنك مقارنة حتى 3 وحدات كحد أقصى في المرة الواحدة' : 'You can compare up to 3 units at a time');
        return prev;
      }
      return [...prev, property];
    });
  };

  // 3. Instant Zero-Latency Client Filtering
  const filteredProperties = useMemo(() => {
    let list = [...allProperties];

    // Text search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => {
        const title = (p.title || '').toLowerCase();
        const compound = (p.compound?.name || '').toLowerCase();
        const developer = (p.compound?.developer?.name || '').toLowerCase();
        const city = (p.compound?.city || '').toLowerCase();
        const area = (p.compound?.area_name || '').toLowerCase();
        const desc = (p.compound?.description || '').toLowerCase();
        return (
          title.includes(q) ||
          compound.includes(q) ||
          developer.includes(q) ||
          city.includes(q) ||
          area.includes(q) ||
          desc.includes(q)
        );
      });
    }

    // Region / Destination filter
    if (selectedRegion !== 'all') {
      list = list.filter((p) => {
        const city = (p.compound?.city || '').toLowerCase();
        const area = (p.compound?.area_name || '').toLowerCase();
        const country = (p.compound?.country || '').toLowerCase();
        const title = (p.title || '').toLowerCase();
        const platform = p.platform;

        switch (selectedRegion) {
          case 'tagamoa':
            return city.includes('قاهرة جديدة') || city.includes('new cairo') || area.includes('تجمع') || title.includes('تجمع');
          case 'zayed':
            return city.includes('زايد') || city.includes('zayed') || city.includes('أكتوبر') || city.includes('october') || area.includes('زايد');
          case 'capital':
            return city.includes('عاصمة') || city.includes('capital') || title.includes('عاصمة') || area.includes('r7') || area.includes('r8');
          case 'coast':
            return city.includes('ساحل') || area.includes('ساحل') || title.includes('ساحل') || area.includes('حكمة') || area.includes('علمين');
          case 'dubai':
            return country.includes('uae') || city.includes('دبي') || city.includes('dubai') || p.currency === 'AED';
          case 'turkey':
            return country.includes('turkey') || city.includes('إسطنبول') || city.includes('istanbul') || city.includes('أنطاليا');
          case 'spain':
            return country.includes('spain') || city.includes('مالقة') || city.includes('malaga') || city.includes('ماربيا') || p.currency === 'EUR';
          case 'seller':
            return platform === 'SellerListing';
          default:
            return true;
        }
      });
    }

    // Property Type filter
    if (selectedType !== 'all') {
      list = list.filter((p) => {
        const ut = (p.unit_type || '').toLowerCase();
        switch (selectedType) {
          case 'apartment':
            return ut.includes('شقة') || ut.includes('apartment') || ut.includes('استوديو');
          case 'villa':
            return ut.includes('فيلا') || ut.includes('villa');
          case 'townhouse':
            return ut.includes('تاون') || ut.includes('townhouse') || ut.includes('توين');
          case 'chalet':
            return ut.includes('شاليه') || ut.includes('chalet');
          case 'duplex':
            return ut.includes('دوبلكس') || ut.includes('duplex') || ut.includes('بنتهاوس');
          default:
            return true;
        }
      });
    }

    // Bedrooms filter
    if (selectedBedrooms !== 'all') {
      const beds = parseInt(selectedBedrooms, 10);
      if (beds >= 5) {
        list = list.filter((p) => (p.bedrooms || 0) >= 5);
      } else {
        list = list.filter((p) => p.bedrooms === beds);
      }
    }

    // Payment Method filter
    if (paymentMethod === 'installment') {
      list = list.filter((p) => (p.installment_years || 0) > 0 && (p.down_payment_pct || 0) < 100);
    } else if (paymentMethod === 'cash') {
      list = list.filter((p) => (p.installment_years || 0) === 0 || (p.down_payment_pct || 0) >= 100);
    }

    // Sorting
    if (sortBy === 'price_asc') {
      list.sort((a, b) => a.total_price - b.total_price);
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.total_price - a.total_price);
    } else if (sortBy === 'area_desc') {
      list.sort((a, b) => (b.area_sqm || 0) - (a.area_sqm || 0));
    }

    return list;
  }, [allProperties, searchQuery, selectedRegion, selectedType, selectedBedrooms, paymentMethod, sortBy]);

  const displayedList = filteredProperties.slice(0, visibleCount);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-black text-slate-900 dark:text-white" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Banner & Mode Switch Bar */}
      <div className="sticky top-0 z-30 border-b border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-black/95 backdrop-blur-md px-4 sm:px-6 py-3 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Title & Quota-Free Badge */}
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black shadow-md shrink-0">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black">
                  {isAr ? 'البحث المباشر السريع (Off-Agent Search)' : 'Direct Instant Search'}
                </h1>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  {isAr ? 'مجاني 100% بدون استهلاك رصيد' : '100% Free · No Quota Used'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                {isAr
                  ? `استكشف وفلتر ${allProperties.length} وحدة موثقة فورياً، وانقل أي وحدة للشات بضغطة زر.`
                  : `Browse ${allProperties.length} verified listings instantly, transfer to AI chat anytime.`}
              </p>
            </div>
          </div>

          {/* Switch to Chat AI Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={onSwitchToChat}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-2 text-xs font-bold text-amber-600 dark:text-amber-400 transition active:scale-[0.98]"
            >
              <Bot className="h-4 w-4" />
              <span>{isAr ? 'العودة لمستشار الذكاء الاصطناعي 🤖' : 'Switch to AI Broker 🤖'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto space-y-3">
          {/* Search Input + Sort Dropdown */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className={`absolute ${isRtl ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'ابحث باسم الكمبوند، المطور، المنطقة (مثال: ماونتن فيو، التجمع، زايد، دبي)...' : 'Search by compound, developer, area...'}
                className={`w-full rounded-2xl border border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 ${
                  isRtl ? 'pr-10 pl-10' : 'pl-10 pr-10'
                } py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 transition`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={`absolute ${isRtl ? 'left-3.5' : 'right-3.5'} top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white`}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Sort Selection */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-44">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="w-full rounded-2xl border border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="relevance">{isAr ? 'الأكثر مطابقة' : 'Most Relevant'}</option>
                  <option value="price_asc">{isAr ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
                  <option value="price_desc">{isAr ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
                  <option value="area_desc">{isAr ? 'المساحة: الأكبر أولاً' : 'Area: Largest First'}</option>
                </select>
              </div>

              {/* Payment filter toggle */}
              <div className="flex items-center rounded-2xl border border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 p-1">
                <button
                  onClick={() => setPaymentMethod('all')}
                  className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition ${
                    paymentMethod === 'all'
                      ? 'bg-amber-500 text-black shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  {isAr ? 'الكل' : 'All'}
                </button>
                <button
                  onClick={() => setPaymentMethod('installment')}
                  className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition ${
                    paymentMethod === 'installment'
                      ? 'bg-amber-500 text-black shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  {isAr ? 'تقسيط فقط' : 'Installments'}
                </button>
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition ${
                    paymentMethod === 'cash'
                      ? 'bg-amber-500 text-black shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  {isAr ? 'كاش فقط' : 'Cash'}
                </button>
              </div>
            </div>
          </div>

          {/* Region Quick Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-xs">
            <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 shrink-0 ml-1">
              {isAr ? 'الوجهة:' : 'Region:'}
            </span>
            {[
              { id: 'all', label: isAr ? 'كل المناطق' : 'All Regions' },
              { id: 'tagamoa', label: isAr ? '🇪🇬 التجمع الخامس' : '🇪🇬 New Cairo' },
              { id: 'zayed', label: isAr ? '🇪🇬 الشيخ زايد وأكتوبر' : '🇪🇬 Zayed & Oct' },
              { id: 'capital', label: isAr ? '🇪🇬 العاصمة الإدارية' : '🇪🇬 New Capital' },
              { id: 'coast', label: isAr ? '🇪🇬 الساحل الشمالي' : '🇪🇬 North Coast' },
              { id: 'dubai', label: isAr ? '🇦🇪 دبي والإمارات' : '🇦🇪 Dubai & UAE' },
              { id: 'turkey', label: isAr ? '🇹🇷 تركيا وإسطنبول' : '🇹🇷 Turkey' },
              { id: 'spain', label: isAr ? '🇪🇸 إسبانيا ومالقة' : '🇪🇸 Spain' },
              { id: 'seller', label: isAr ? '👤 عروض الملاك المباشرة' : '👤 Direct Owners' },
            ].map((reg) => (
              <button
                key={reg.id}
                onClick={() => setSelectedRegion(reg.id as RegionKey)}
                className={`shrink-0 rounded-full border px-3 py-1 font-bold transition ${
                  selectedRegion === reg.id
                    ? 'border-amber-500 bg-amber-500 text-black shadow-xs'
                    : 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:border-amber-400'
                }`}
              >
                {reg.label}
              </button>
            ))}
          </div>

          {/* Unit Type & Bedroom Filters */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-zinc-800/60 text-xs">
            <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 ml-1">
              {isAr ? 'النوع:' : 'Type:'}
            </span>
            {[
              { id: 'all', label: isAr ? 'الكل' : 'All' },
              { id: 'apartment', label: isAr ? 'شقق' : 'Apartments' },
              { id: 'villa', label: isAr ? 'فيلات' : 'Villas' },
              { id: 'townhouse', label: isAr ? 'تاون هاوس' : 'Townhouses' },
              { id: 'chalet', label: isAr ? 'شاليهات' : 'Chalets' },
              { id: 'duplex', label: isAr ? 'دوبلكس' : 'Duplexes' },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id as UnitTypeKey)}
                className={`rounded-lg px-2.5 py-0.5 text-[11px] font-bold transition ${
                  selectedType === type.id
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/40'
                    : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                }`}
              >
                {type.label}
              </button>
            ))}

            <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 mx-1">•</span>

            <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 ml-1">
              {isAr ? 'الغرف:' : 'Beds:'}
            </span>
            {['all', '1', '2', '3', '4', '5'].map((b) => (
              <button
                key={b}
                onClick={() => setSelectedBedrooms(b)}
                className={`rounded-lg px-2.5 py-0.5 text-[11px] font-bold transition ${
                  selectedBedrooms === b
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/40'
                    : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                }`}
              >
                {b === 'all' ? (isAr ? 'الكل' : 'All') : b === '5' ? '5+' : b}
              </button>
            ))}

            <span className="mr-auto text-[11px] font-mono text-slate-400 dark:text-zinc-500">
              {isAr ? `مطابق: ${filteredProperties.length} وحدة` : `Matches: ${filteredProperties.length}`}
            </span>
          </div>
        </div>
      </div>

      {/* Main Properties Grid */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 pb-28">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-3 text-amber-500" />
              <span>{isAr ? 'جاري تجهيز قاعدة بيانات العقارات المباشرة...' : 'Loading properties...'}</span>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="py-20 text-center max-w-md mx-auto">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/10 text-amber-500 mx-auto mb-3">
                <Search className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr ? 'لم نعثر على عقارات مطابقة لهذه المعايير' : 'No properties matched your filters'}
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                {isAr ? 'جرّب توسيع نطاق البحث أو تصفير الفلاتر، أو استشر سكنى بوت مباشرة في الشات.' : 'Try adjusting your filters or ask the AI broker in chat.'}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedRegion('all');
                    setSelectedType('all');
                    setSelectedBedrooms('all');
                    setPaymentMethod('all');
                  }}
                  className="rounded-xl border border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:border-amber-500 transition"
                >
                  {isAr ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
                </button>
                <button
                  onClick={onSwitchToChat}
                  className="rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-black transition"
                >
                  {isAr ? 'اسأل سكنى بوت 🤖' : 'Ask Skanybot 🤖'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayedList.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onBookViewing={onBookViewing}
                    onToggleFavorite={onToggleFavorite}
                    onViewDetails={onViewDetails}
                    isFavorite={favorites.some((f) => f.id === property.id)}
                    onSendToChat={onSendToChat}
                    isCompared={comparedProperties.some((c) => c.id === property.id)}
                    onToggleCompare={handleToggleCompare}
                  />
                ))}
              </div>

              {/* Load More Button for large listings */}
              {visibleCount < filteredProperties.length && (
                <div className="mt-8 text-center">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 24)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-2.5 text-xs font-bold text-slate-800 dark:text-zinc-200 hover:border-amber-500 hover:text-amber-500 transition shadow-xs"
                  >
                    <span>{isAr ? `عرض المزيد (متبقي ${filteredProperties.length - visibleCount} وحدة)` : 'Load More'}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Floating Bottom AI Comparison Dock (Appears when 1-3 units are checked for comparison) */}
      {comparedProperties.length > 0 && (
        <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 max-w-2xl w-full z-40">
          <div className="rounded-3xl border border-amber-500/50 bg-black/95 text-white shadow-2xl p-3 sm:p-4 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Units Thumbnails Strip */}
            <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500 text-black font-black shrink-0">
                <Scale className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <span>{isAr ? 'سلة المقارنة بالذكاء الاصطناعي' : 'AI Compare Bucket'}</span>
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.2 text-[10px]">
                    {comparedProperties.length}/3
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 truncate max-w-[260px] sm:max-w-[280px]">
                  {comparedProperties.map((p) => p.title).join(' • ')}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
              <button
                onClick={() => setComparedProperties([])}
                className="px-2.5 py-1.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold transition"
              >
                {isAr ? 'تفريغ' : 'Clear'}
              </button>
              <button
                onClick={() => onCompareWithChat(comparedProperties)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black px-4 py-2 text-xs font-black shadow-md hover:brightness-105 active:scale-[0.98] transition"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isAr ? '🤖 قارن الآن في الشات' : 'Compare with AI Chat'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
