'use client';

import React, { useState } from 'react';
import { Property } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Building2, 
  MapPin, 
  Bed, 
  Bath, 
  Maximize2, 
  Calendar, 
  MessageCircle, 
  Star, 
  ShieldCheck, 
  TrendingUp, 
  Share2, 
  Check,
  ExternalLink,
  Globe
} from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  onBookViewing?: (property: Property) => void;
  onToggleFavorite?: (property: Property) => void;
  isFavorite?: boolean;
}

export default function PropertyCard({
  property,
  onBookViewing,
  onToggleFavorite,
  isFavorite = false
}: PropertyCardProps) {
  const [copied, setCopied] = useState(false);
  const { locale, t } = useLanguage();
  const isAr = locale === 'ar';

  const compound = property.compound;
  const developer = compound?.developer;
  const curr = property.currency || (isAr ? 'ج.م' : 'EGP');
  const isTekce = property.platform === 'TEKCE';
  
  // Safe affiliate tracking link (code is inside the URL query, NOT displayed to user)
  const affiliateUrl = property.affiliate_url || (
    isTekce 
      ? 'https://tekce.com?utm_source=taff&utm_medium=6FPC68983C'
      : 'https://launches.aqarmap.com/ar/expos/saudi-projects?utm_source=partners&utm_medium=dynamic&utm_campaign=affiliate_759279&partner_code=759279'
  );

  const handleShare = () => {
    const text = isAr 
      ? `فرصة عقارية: ${property.title}\nالمشروع: ${compound?.name || ''}\nالسعر: ${property.total_price.toLocaleString('ar-EG')} ${curr}\nالرابط: ${affiliateUrl}`
      : `Property Opportunity: ${property.title}\nProject: ${compound?.name || ''}\nPrice: ${property.total_price.toLocaleString('en-US')} ${curr}\nLink: ${affiliateUrl}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappMsg = encodeURIComponent(
    isAr 
      ? `مرحباً، أود الاستفسار وحجز موعد معاينة للوحدة: ${property.title} في مشروع ${compound?.name || ''} بسعر ${property.total_price.toLocaleString('ar-EG')} ${curr}`
      : `Hello, I'd like to inquire and schedule a viewing for: ${property.title} in project ${compound?.name || ''} priced at ${property.total_price.toLocaleString('en-US')} ${curr}`
  );
  const whatsappUrl = `https://wa.me/201000000000?text=${whatsappMsg}`;

  const imageUrl = property.images && property.images.length > 0 
    ? property.images[0] 
    : compound?.cover_image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80';

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/95 dark:hover:border-amber-400/40">
      {/* Property Cover Image & Badges */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-zinc-800">
        <img
          src={imageUrl}
          alt={property.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 right-3 left-3 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-black text-black shadow-md">
              {property.unit_type}
            </span>
            {isTekce ? (
              <span className="flex items-center gap-1 rounded-full bg-sky-600/90 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md backdrop-blur-xs">
                <Globe className="h-3 w-3" />
                <span>{isAr ? 'عقارات دولية' : 'International'}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-emerald-600/90 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md backdrop-blur-xs">
                <ShieldCheck className="h-3 w-3" />
                <span>{isAr ? 'معارض معتمدة' : 'Verified Expo'}</span>
              </span>
            )}
            {property.delivery_date.includes('فوري') && (
              <span className="rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                {t.immediateDelivery}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onToggleFavorite && onToggleFavorite(property)}
              className={`grid h-8 w-8 place-items-center rounded-full backdrop-blur-md transition ${
                isFavorite 
                  ? 'bg-amber-500 text-black shadow-md' 
                  : 'bg-black/50 text-white hover:bg-black/80'
              }`}
              title={isAr ? 'حفظ في المفضلة' : 'Save to Favorites'}
            >
              <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md transition hover:bg-black/80"
              title={isAr ? 'مشاركة تفاصيل الوحدة' : 'Share property details'}
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Bottom Location & Project Banner over image */}
        <div className="absolute bottom-3 right-3 left-3 text-white">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
            <Building2 className="h-3.5 w-3.5" />
            <span>{compound?.name || (isAr ? 'مشروع سكني فاخر' : 'Luxury Development')}</span>
            <span className="text-white/60">•</span>
            <span>{developer?.name || (isAr ? 'مطور معتمد' : 'Developer')}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-200">
            <MapPin className="h-3 w-3 shrink-0 text-amber-400" />
            <span className="truncate">{compound?.area_name || compound?.city || (isAr ? 'موقع حيوي ممتاز' : 'Prime Location')}</span>
          </div>
        </div>
      </div>

      {/* Property Details Body */}
      <div className="p-4 sm:p-5">
        <h4 className="line-clamp-2 text-base font-black text-slate-900 transition group-hover:text-amber-600 dark:text-zinc-100 dark:group-hover:text-amber-400">
          {property.title}
        </h4>

        {/* Specs Grid */}
        <div className="mt-3.5 grid grid-cols-3 gap-2 border-y border-slate-100 py-2.5 text-xs text-slate-600 dark:border-zinc-800 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Maximize2 className="h-4 w-4 text-amber-500" />
            <span className="font-bold text-slate-900 dark:text-zinc-200">{property.area_sqm}</span>
            <span>{t.area}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bed className="h-4 w-4 text-amber-500" />
            <span className="font-bold text-slate-900 dark:text-zinc-200">{property.bedrooms}</span>
            <span>{t.rooms}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bath className="h-4 w-4 text-amber-500" />
            <span className="font-bold text-slate-900 dark:text-zinc-200">{property.bathrooms}</span>
            <span>{t.baths}</span>
          </div>
        </div>

        {/* Price & Installment Highlight */}
        <div className="mt-3.5 rounded-xl bg-slate-50 p-3 dark:bg-zinc-800/60">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">{t.totalPrice}</span>
            <span className="font-mono text-lg font-black text-slate-900 dark:text-white">
              {property.total_price.toLocaleString(isAr ? 'ar-EG' : 'en-US')} <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">{curr}</span>
            </span>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-200/60 pt-2 text-[11px] dark:border-zinc-700/60">
            <div>
              <span className="text-slate-500 dark:text-zinc-400">{t.downPayment} ({property.down_payment_pct}%):</span>
              <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {property.down_payment_amount.toLocaleString(isAr ? 'ar-EG' : 'en-US')} {curr}
              </p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-zinc-400">{t.monthlyInstallment}</span>
              <p className="font-mono font-bold text-amber-600 dark:text-amber-400">
                {property.monthly_installment.toLocaleString(isAr ? 'ar-EG' : 'en-US')} {curr}
              </p>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-slate-400" />
              <span>{t.installmentsUpTo} {property.installment_years} {t.years}</span>
            </span>
            <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-3 w-3" />
              <span>{t.expectedRoi} {property.roi_expected_pct || 15}%</span>
            </span>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="mt-4 flex items-center gap-2">
          {/* Direct Link (carries partner affiliate params seamlessly) */}
          <a
            href={affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 px-3 py-2.5 text-xs font-black text-black shadow-sm transition hover:brightness-105 active:scale-[0.98]"
            title={isAr ? 'تصفح التفاصيل الرسمية وحجز الوحدة' : 'View full details & book unit'}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>{t.viewDetailsLink}</span>
          </a>

          {/* Lead Booking Modal Button */}
          <button
            onClick={() => onBookViewing && onBookViewing(property)}
            className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-xs font-bold text-slate-800 transition hover:bg-slate-200 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            title={isAr ? 'طلب معاينة ميدانية' : 'Request field viewing'}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isAr ? 'معاينة' : 'Visit'}</span>
          </button>

          {/* WhatsApp Direct Link */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-2.5 text-xs font-bold text-emerald-600 transition hover:bg-emerald-500/20 active:scale-[0.98] dark:text-emerald-400"
            title={isAr ? 'تواصل مباشر عبر واتساب' : 'Direct WhatsApp'}
          >
            <MessageCircle className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
