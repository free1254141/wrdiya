'use client';

import React, { useState } from 'react';
import { Property } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  X,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Building2,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Calendar,
  CheckCircle2,
  Star,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Share2,
  Check,
  Sparkles,
  PhoneCall
} from 'lucide-react';

interface PropertyDetailsModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onBookViewing?: (property: Property) => void;
  onToggleFavorite?: (property: Property) => void;
  isFavorite?: boolean;
}

export default function PropertyDetailsModal({
  property,
  isOpen,
  onClose,
  onBookViewing,
  onToggleFavorite,
  isFavorite = false,
}: PropertyDetailsModalProps) {
  const { locale, isRtl } = useLanguage();
  const isAr = locale === 'ar';

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !property) return null;

  const compound = property.compound;
  const developer = compound?.developer;
  const curr = property.currency || (isAr ? 'ج.م' : 'EGP');

  // Strictly only show real images uploaded or attached; never inject fake fallback photos
  const rawImages = (property.images || []).filter((u): u is string => typeof u === 'string' && u.trim().length > 0);
  const coverImg = property.platform !== 'SellerListing' ? compound?.cover_image : undefined;
  const galleryImages: string[] = Array.from(new Set([...rawImages, coverImg].filter(Boolean) as string[])).slice(0, 10);

  const hasImages = galleryImages.length > 0;
  const currentImage = hasImages ? (galleryImages[activeImageIdx] || galleryImages[0]) : '';

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIdx((prev) => (prev + 1) % galleryImages.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIdx((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const handleShare = () => {
    const text = `${property.title} - ${compound?.name || ''}\n${property.total_price.toLocaleString()} ${curr}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSellerListing = property.platform === 'SellerListing';
  const affiliateUrl = isSellerListing
    ? undefined
    : property.affiliate_url || (
        property.platform === 'TEKCE' 
          ? 'https://tekce.com?utm_source=taff&utm_medium=6FPC68983C'
          : 'https://launches.aqarmap.com/ar/expos/saudi-projects?utm_source=partners&utm_medium=dynamic&utm_campaign=affiliate_759279&partner_code=759279'
      );

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md transition-all ${
      isFullScreen ? 'p-0' : ''
    }`}>
      {/* Modal Container */}
      <div 
        className={`relative flex flex-col bg-white dark:bg-zinc-950 overflow-hidden shadow-2xl transition-all duration-300 ${
          isFullScreen 
            ? 'h-screen w-screen rounded-none' 
            : 'h-full sm:h-auto max-h-[94vh] w-full max-w-4xl rounded-none sm:rounded-3xl border border-slate-200 dark:border-zinc-800'
        }`}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Top Header / Bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90 z-20">
          <div className="flex items-center gap-2 min-w-0">
            <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-black text-amber-600 dark:text-amber-400">
              {property.unit_type}
            </span>
            <h3 className="truncate text-sm sm:text-base font-black text-slate-900 dark:text-white">
              {property.title}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Toggle Full Screen button */}
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
              title={isFullScreen ? (isAr ? 'تصغير' : 'Exit Fullscreen') : (isAr ? 'تكبير ملء الشاشة' : 'Full Screen')}
            >
              {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            {/* Favorite button */}
            <button
              onClick={() => onToggleFavorite && onToggleFavorite(property)}
              className={`grid h-8 w-8 place-items-center rounded-xl border transition ${
                isFavorite 
                  ? 'border-amber-500 bg-amber-500 text-black' 
                  : 'border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
              title={isAr ? 'حفظ في المفضلة' : 'Favorite'}
            >
              <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            {/* Share button */}
            <button
              onClick={handleShare}
              className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
              title={isAr ? 'نسخ الرابط' : 'Copy link'}
            >
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-rose-50 hover:text-rose-600 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
              title={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Main Visual Lightbox / Gallery */}
          {hasImages ? (
            <div className="relative aspect-[16/9] w-full bg-black select-none flex items-center justify-center overflow-hidden">
              <img
                src={currentImage}
                alt={`${property.title} - ${activeImageIdx + 1}`}
                className="h-full w-full object-contain transition-all duration-300"
              />

              {/* Navigation Arrows */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-black/90 active:scale-95"
                    title="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-black/90 active:scale-95"
                    title="Next image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              {/* Image Counter Badge */}
              <div className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1 font-mono text-xs font-bold text-white backdrop-blur-md">
                {activeImageIdx + 1} / {galleryImages.length}
              </div>

              {/* Verification Badge */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-emerald-600/90 px-3 py-1 text-xs font-bold text-white shadow-md backdrop-blur-md">
                <ShieldCheck className="h-4 w-4" />
                <span>{isAr ? 'وحدة معتمدة رسمياً' : 'Verified Listing'}</span>
              </div>
            </div>
          ) : (
            <div className="relative aspect-[16/9] w-full select-none flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-amber-50/30 dark:from-zinc-900 dark:via-zinc-900/90 dark:to-zinc-800 text-slate-500 dark:text-zinc-400 p-6 border-b border-slate-200 dark:border-zinc-800">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400 mb-3 shadow-inner">
                <Building2 className="h-8 w-8" />
              </div>
              <p className="font-bold text-sm text-slate-800 dark:text-zinc-200">
                {isAr ? 'لم يتم إرفاق صور لهذه الوحدة من المعلن' : 'No photos uploaded for this listing'}
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm text-center">
                {isAr
                  ? 'تم تسجيل كافة تفاصيل الوحدة والأسعار بدقة. يمكنك طلب معاينة مباشرة أو التواصل مع المالك.'
                  : 'All unit parameters and pricing are registered. You may request a direct viewing.'}
              </p>
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-emerald-600/90 px-3 py-1 text-xs font-bold text-white shadow-md backdrop-blur-md">
                <ShieldCheck className="h-4 w-4" />
                <span>{isAr ? 'وحدة معتمدة' : 'Verified Listing'}</span>
              </div>
            </div>
          )}

          {/* Thumbnails Strip */}
          {galleryImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto bg-slate-100 p-3 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`relative aspect-[16/10] h-14 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                    activeImageIdx === idx 
                      ? 'border-amber-500 ring-2 ring-amber-500/30' 
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Detailed Property Information */}
          <div className="p-4 sm:p-6 space-y-6">
            {/* Project & Developer Row */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400">
                  <Building2 className="h-4 w-4" />
                  <span>{compound?.name || (isAr ? 'كمبوند سكني فاخر' : 'Luxury Development')}</span>
                  <span className="text-slate-300 dark:text-zinc-700">•</span>
                  <span>{developer?.name || (isAr ? 'مطور معتمد' : 'Accredited Developer')}</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400">
                  <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>{compound?.area_name || compound?.city || (isAr ? 'موقع مميز وحيوي' : 'Prime Location')}</span>
                </div>
              </div>

              {/* Price Tag */}
              <div className="text-left rtl:text-right">
                <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500">
                  {isAr ? 'السعر الإجمالي:' : 'Total Price:'}
                </span>
                <p className="font-mono text-2xl font-black text-slate-900 dark:text-white">
                  {property.total_price.toLocaleString(isAr ? 'ar-EG' : 'en-US')} <span className="text-xs text-amber-500">{curr}</span>
                </p>
              </div>
            </div>

            {/* Financial & Installment Matrix */}
            {(property.installment_years || 0) > 0 && (property.down_payment_pct || 0) < 100 ? (
              <div className="space-y-3 rounded-2xl bg-amber-50/60 p-4 dark:bg-amber-500/5 border border-amber-500/20">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                      {isAr ? 'المقدم المطلوب:' : 'Down Payment:'}
                    </span>
                    <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">
                      {property.down_payment_pct}% ({property.down_payment_amount.toLocaleString(isAr ? 'ar-EG' : 'en-US')} {curr})
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                      {isAr ? 'القسط الشهري:' : 'Monthly Installment:'}
                    </span>
                    <p className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm sm:text-base">
                      {Math.round(property.monthly_installment).toLocaleString(isAr ? 'ar-EG' : 'en-US')} {curr}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                      {isAr ? 'القسط الربع سنوي:' : 'Quarterly Installment:'}
                    </span>
                    <p className="font-mono font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                      {Math.round(
                        property.quarterly_installment ||
                          Math.max(0, property.total_price - property.down_payment_amount) /
                            (Math.max(1, property.installment_years) * 4)
                      ).toLocaleString(isAr ? 'ar-EG' : 'en-US')}{' '}
                      {curr}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                      {isAr ? 'سنوات التقسيط والاستلام:' : 'Installment & Handover:'}
                    </span>
                    <p className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                      {property.installment_years} {isAr ? 'سنوات' : 'Years'} • {property.delivery_date}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 rounded-2xl bg-emerald-50/60 p-4 dark:bg-emerald-500/5 border border-emerald-500/20">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                    {isAr ? 'نظام الدفع المعتمد بالإعلان:' : 'Verified Payment Method:'}
                  </span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">
                    {isAr ? 'كاش فقط (لا يدعم التقسيط)' : 'Cash Only (No Installments)'}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                    {isAr ? 'موعد الاستلام:' : 'Delivery Date:'}
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                    {property.delivery_date}
                  </p>
                </div>
              </div>
            )}

            {/* Unit Specifications Grid */}
            <div className="grid grid-cols-3 gap-3 border-y border-slate-100 py-4 text-center dark:border-zinc-800">
              <div className="flex flex-col items-center gap-1">
                <Maximize className="h-5 w-5 text-amber-500" />
                <span className="font-mono text-base font-black text-slate-900 dark:text-white">
                  {property.area_sqm} م²
                </span>
                <span className="text-xs text-slate-400 dark:text-zinc-500">{isAr ? 'المساحة' : 'Area'}</span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <Bed className="h-5 w-5 text-amber-500" />
                <span className="font-mono text-base font-black text-slate-900 dark:text-white">
                  {property.bedrooms}
                </span>
                <span className="text-xs text-slate-400 dark:text-zinc-500">{isAr ? 'غرف نوم' : 'Bedrooms'}</span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <Bath className="h-5 w-5 text-amber-500" />
                <span className="font-mono text-base font-black text-slate-900 dark:text-white">
                  {property.bathrooms}
                </span>
                <span className="text-xs text-slate-400 dark:text-zinc-500">{isAr ? 'حمامات' : 'Bathrooms'}</span>
              </div>
            </div>

            {/* Finishing & Project Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                {isAr ? 'حالة التشطيب والمواصفات' : 'Finishing & Specifications'}
              </h4>
              <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
                {property.finishing_type || (isAr ? 'تشطيب الترا سوبر لوكس فندقي جاهز للاستلام والسكن الفوري، إطلالات مفتوحة على مساحات خضراء وبحيرات صناعية.' : 'Ultra Super Lux hotel-grade finishing, open views of green landscapes.')}
              </p>
            </div>

            {/* Amenities Badges */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                {isAr ? 'الخدمات والمرافق المتوفرة' : 'Amenities & Facilities'}
              </h4>
              <div className="flex flex-wrap gap-2">
                {[
                  isAr ? 'حراسة وأمن 24/7' : '24/7 Security',
                  isAr ? 'جراج خاص مغطى' : 'Private Covered Parking',
                  isAr ? 'حمامات سباحة وبحيرات' : 'Swimming Pools',
                  isAr ? 'نادي رياضي وصحي' : 'Clubhouse & Gym',
                  isAr ? 'مساحات خضراء وممشى' : 'Green Landscapes & Trails',
                  isAr ? 'منطقة تجارية ومطاعم' : 'Commercial Area'
                ].map((amenity, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{amenity}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Sticky Action Bar */}
        <div className="flex shrink-0 items-center gap-3 border-t border-slate-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 z-20">
          {/* Booking Button */}
          <button
            onClick={() => {
              onClose();
              if (onBookViewing) onBookViewing(property);
            }}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 py-3 text-xs sm:text-sm font-black text-black shadow-md transition hover:brightness-105 active:scale-[0.98]"
          >
            <Calendar className="h-4 w-4" />
            <span>{isAr ? 'طلب معاينة مجانية للوحدة' : 'Schedule Free Viewing'}</span>
          </button>

          {/* Direct Seller Contact via WhatsApp if phone exists */}
          {property.seller_phone && (
            <a
              href={`https://wa.me/${property.seller_phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs sm:text-sm font-bold text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400 transition active:scale-[0.98]"
              title={isAr ? 'تواصل مع صاحب الإعلان مباشرة عبر واتساب' : 'Chat with owner on WhatsApp'}
            >
              <PhoneCall className="h-4 w-4" />
              <span>{isAr ? 'واتساب المالك' : 'WhatsApp Owner'}</span>
            </a>
          )}

          {/* Official Partner Link (Only for Aqarmap/Tekce projects; NEVER for seller listings) */}
          {affiliateUrl && !isSellerListing && (
            <a
              href={affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs sm:text-sm font-bold text-amber-700 transition hover:bg-amber-500/20 dark:border-amber-400/30 dark:text-amber-400"
              title={isAr ? 'فتح صفحة المشروع الرسمية على منصة الشريك المعتمد' : 'Open official project page'}
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">{isAr ? 'صفحة المشروع والأسعار الرسمية' : 'Official Project Page'}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
