'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Building2,
  MapPin,
  Loader2,
  CheckCircle2,
  Eye,
  Sparkles,
  ImagePlus,
} from 'lucide-react';
import { Property } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface SellerPropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownerId: string;
  defaultSellerName?: string;
  properties: Property[];
  onRefresh: () => Promise<void>;
  onViewDetails: (property: Property) => void;
  onAskAiToMarket?: (property: Property) => void;
  initialMode?: 'list' | 'create';
  initialEditingProperty?: Property | null;
}

const UNIT_TYPES = [
  'شقة',
  'أرض',
  'فيلا مستقلة',
  'تاون هاوس',
  'دوبلكس',
  'بنتهاوس',
  'استوديو',
  'محل / تجاري',
];

export default function SellerPropertiesModal({
  isOpen,
  onClose,
  ownerId,
  defaultSellerName,
  properties,
  onRefresh,
  onViewDetails,
  onAskAiToMarket,
  initialMode = 'list',
  initialEditingProperty = null,
}: SellerPropertiesModalProps) {
  const { isRtl } = useLanguage();
  const [mode, setMode] = useState<'list' | 'form'>(initialMode === 'create' ? 'form' : 'list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form fields
  const [unitType, setUnitType] = useState('شقة');
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('القاهرة الجديدة');
  const [locationText, setLocationText] = useState('');
  const [areaSqm, setAreaSqm] = useState('150');
  const [bedrooms, setBedrooms] = useState('3');
  const [bathrooms, setBathrooms] = useState('2');
  const [finishingType, setFinishingType] = useState('تشطيب كامل');
  const [totalPrice, setTotalPrice] = useState('4500000');
  const [currency, setCurrency] = useState('EGP');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'installment'>('cash');
  const [downPaymentPct, setDownPaymentPct] = useState('20');
  const [installmentYears, setInstallmentYears] = useState('5');
  const [deliveryDate, setDeliveryDate] = useState('استلام فوري');
  const [saleCircumstances, setSaleCircumstances] = useState('');
  const [sellerName, setSellerName] = useState(defaultSellerName || '');
  const [sellerPhone, setSellerPhone] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const isLand = unitType.includes('أرض') || unitType.includes('ارض');

  useEffect(() => {
    if (!isOpen) return;
    if (initialEditingProperty) {
      startEdit(initialEditingProperty);
    } else if (initialMode === 'create') {
      startCreate();
    } else {
      setMode('list');
    }
  }, [isOpen, initialMode, initialEditingProperty]);

  const startCreate = () => {
    setEditingId(null);
    setUnitType('شقة');
    setTitle('');
    setCity('القاهرة الجديدة');
    setLocationText('');
    setAreaSqm('150');
    setBedrooms('3');
    setBathrooms('2');
    setFinishingType('تشطيب كامل');
    setTotalPrice('4500000');
    setCurrency('EGP');
    setPaymentMode('cash');
    setDownPaymentPct('20');
    setInstallmentYears('5');
    setDeliveryDate('استلام فوري');
    setSaleCircumstances('');
    setSellerName(defaultSellerName || '');
    setSellerPhone('');
    setImages([]);
    setImageUrlInput('');
    setFeedback(null);
    setMode('form');
  };

  const startEdit = (p: Property) => {
    setEditingId(p.id);
    setUnitType(p.unit_type || 'شقة');
    setTitle(p.title || '');
    setCity(p.compound?.city || 'القاهرة الجديدة');
    setLocationText(p.location_text || p.compound?.area_name || '');
    setAreaSqm(String(p.area_sqm || 150));
    setBedrooms(String(p.bedrooms ?? 3));
    setBathrooms(String(p.bathrooms ?? 2));
    setFinishingType(p.finishing_type || 'تشطيب كامل');
    setTotalPrice(String(p.total_price || 4500000));
    setCurrency(p.currency || 'EGP');
    const hasInst = (p.installment_years || 0) > 0;
    setPaymentMode(hasInst ? 'installment' : 'cash');
    setDownPaymentPct(String(p.down_payment_pct ?? (hasInst ? 20 : 100)));
    setInstallmentYears(String(p.installment_years || 5));
    setDeliveryDate(p.delivery_date || 'استلام فوري');
    setSaleCircumstances(p.sale_circumstances || '');
    setSellerName(p.seller_name || defaultSellerName || '');
    setSellerPhone(p.seller_phone || '');
    setImages(p.images || []);
    setImageUrlInput('');
    setFeedback(null);
    setMode('form');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files)
      .slice(0, 4)
      .forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxW = 900;
            const scale = Math.min(1, maxW / img.width);
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
              setImages((prev) => [...prev.slice(0, 5), dataUrl]);
            }
          };
          img.src = String(ev.target?.result || '');
        };
        reader.readAsDataURL(file);
      });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const payload = {
        id: editingId || undefined,
        owner_id: ownerId,
        unit_type: unitType,
        title: title.trim() || undefined,
        city: city.trim(),
        area_name: locationText.trim() || city.trim(),
        location_text: locationText.trim() || city.trim(),
        area_sqm: Number(areaSqm) || 100,
        bedrooms: isLand ? 0 : Number(bedrooms) || 0,
        bathrooms: isLand ? 0 : Number(bathrooms) || 0,
        finishing_type: finishingType.trim(),
        total_price: Number(totalPrice) || 1000000,
        currency,
        down_payment_pct: paymentMode === 'installment' ? Number(downPaymentPct) || 20 : 100,
        installment_years: paymentMode === 'installment' ? Number(installmentYears) || 1 : 0,
        delivery_date: deliveryDate.trim(),
        sale_circumstances: saleCircumstances.trim(),
        seller_name: sellerName.trim(),
        seller_phone: sellerPhone.trim(),
        images: imageUrlInput.trim() ? [...images, imageUrlInput.trim()] : images,
      };

      const res = await fetch('/api/seller/properties', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشل حفظ البيانات');
      }

      await onRefresh();
      setFeedback(
        editingId
          ? 'تم تحديث بيانات وحدتك بنجاح وأصبحت محدثة في محرك البحث والشات الذكي!'
          : 'تم إضافة وحدتك للبيع بنجاح وأصبحت متاحة الآن للباحثين في الشات الذكي!'
      );
      setTimeout(() => {
        setFeedback(null);
        setMode('list');
      }, 900);
    } catch (err: any) {
      setFeedback(`⚠️ ${err?.message || 'حدث خطأ أثناء الحفظ'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/seller/properties?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      await onRefresh();
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/75 p-3 sm:p-6 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-500/15 text-amber-500">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {mode === 'form'
                  ? editingId
                    ? isRtl ? 'تعديل بيانات الوحدة / الأرض المعروضة' : 'Edit Listed Property'
                    : isRtl ? 'إضافة وحدة أو قطعة أرض جديدة للبيع' : 'List a Property or Land for Sale'
                  : isRtl ? 'وحداتي وعقاراتي المعروضة للبيع' : 'My Properties Listed for Sale'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {isRtl
                  ? 'كل وحدة أو أرض تضيفها هنا يفهم الشات بوت ظروف بيعها ويرشحها فوراً للمشترين الجادين'
                  : 'Every unit or land you list here is immediately matched by the AI chatbot to serious buyers'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mode === 'list' ? (
              <button
                type="button"
                onClick={startCreate}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-black text-black transition hover:bg-amber-400"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                {isRtl ? 'إضافة عقار / أرض للبيع' : 'Add Property / Land'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode('list')}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                {isRtl ? 'العودة لوحداتي' : 'Back to my units'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {feedback && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {mode === 'list' ? (
            properties.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/10 text-amber-500">
                  <Building2 className="h-7 w-7" />
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  {isRtl ? 'لم تقم بعرض أي وحدة أو أرض للبيع بعد' : 'You have no listed properties yet'}
                </h4>
                <p className="mx-auto mt-1 max-w-md text-xs text-slate-500 dark:text-zinc-400">
                  {isRtl
                    ? 'يمكنك إضافة شقتك أو فيلتك أو قطعة الأرض من الزر بالأسفل أو إخبار الشات مباشرة "عايز أبيع شقة أو أرض" وسيتولى الشات تسجيلها والبحث عن مشتري!'
                    : 'Add your apartment, villa, or land below, or simply tell the chatbot you want to sell!'}
                </p>
                <button
                  type="button"
                  onClick={startCreate}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-2.5 text-xs font-black text-black shadow-md transition hover:bg-amber-400"
                >
                  <Plus className="h-4 w-4 stroke-[3]" />
                  {isRtl ? 'اعرض وحدتك أو أرضك للبيع الآن' : 'List Your Property or Land Now'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {properties.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-amber-500/60 dark:border-zinc-800 dark:bg-zinc-900/60"
                  >
                    <div>
                      <div className="flex items-start gap-3">
                        {p.images?.[0] && (
                          <img
                            src={p.images[0]}
                            alt={p.title}
                            className="h-16 w-20 shrink-0 rounded-xl object-cover border border-slate-200 dark:border-zinc-700"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-black text-amber-600 dark:text-amber-400">
                              {p.unit_type}
                            </span>
                            <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              {p.status || 'متاح للبيع'}
                            </span>
                          </div>
                          <h4 className="mt-1 text-sm font-black text-slate-900 dark:text-white line-clamp-1">
                            {p.title}
                          </h4>
                          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400">
                            <MapPin className="h-3 w-3 text-amber-500 shrink-0" />
                            <span className="truncate">
                              {p.location_text || p.compound?.area_name || p.compound?.city}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-2.5 text-xs dark:bg-zinc-950">
                        <div>
                          <span className="text-slate-400 text-[10px] block">{isRtl ? 'السعر المطلوب' : 'Asking Price'}</span>
                          <span className="font-black text-amber-600 dark:text-amber-400">
                            {(p.total_price || 0).toLocaleString()} {p.currency}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">{isRtl ? 'المساحة' : 'Area'}</span>
                          <span className="font-bold text-slate-800 dark:text-zinc-200">
                            {p.area_sqm} {isRtl ? 'م²' : 'm²'}
                            {p.bedrooms ? ` • ${p.bedrooms} غرف` : ''}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">{isRtl ? 'نظام البيع' : 'Payment'}</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {(p.installment_years || 0) > 0
                              ? `تقسيط ${p.installment_years} سنوات`
                              : isRtl ? 'كاش' : 'Cash'}
                          </span>
                        </div>
                      </div>

                      {p.sale_circumstances && (
                        <div className="mt-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] text-slate-600 dark:text-zinc-300 line-clamp-2">
                          <strong className="text-amber-600 dark:text-amber-400">
                            {isRtl ? 'ظروف البيع: ' : 'Sale notes: '}
                          </strong>
                          {p.sale_circumstances}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-slate-200/70 pt-3 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={() => startEdit(p)}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-black text-black transition hover:bg-amber-400"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        {isRtl ? 'تعديل' : 'Edit'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onViewDetails(p)}
                        className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {isRtl ? 'معاينة' : 'View'}
                      </button>
                      {onAskAiToMarket && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onAskAiToMarket(p);
                          }}
                          className="inline-flex items-center justify-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          {isRtl ? 'تسويق بالشات' : 'Ask AI'}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={deletingId === p.id}
                        onClick={() => handleDelete(p.id)}
                        className="inline-flex items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 p-1.5 text-rose-600 hover:bg-rose-500/20 dark:text-rose-400"
                        title={isRtl ? 'حذف الوحدة' : 'Delete'}
                      >
                        {deletingId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Add / Edit Form */
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {isRtl ? 'نوع العقار أو الأرض *' : 'Property / Land Type *'}
                  </label>
                  <select
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  >
                    {UNIT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {isRtl ? 'المدينة / المحافظة *' : 'City *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="مثال: القاهرة الجديدة / الشيخ زايد / 6 أكتوبر"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {isRtl ? 'المنطقة / الحي / الكمبوند / رقم القطعة *' : 'Area / Compound / Plot *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={locationText}
                    onChange={(e) => setLocationText(e.target.value)}
                    placeholder="مثال: التجمع الخامس - بيت الوطن الحي الثاني"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {isRtl ? 'عنوان الإعلان (يتولد تلقائياً لو تُرك فارغاً)' : 'Listing Title'}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={
                      isLand
                        ? 'مثال: قطعة أرض سكنية مرخصة 500 م² للبيع في بيت الوطن'
                        : 'مثال: شقة 165 م² سوبر لوكس 3 غرف للبيع في التجمع الخامس'
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {isRtl ? 'المساحة بالمتر المربع (م²) *' : 'Area (sqm) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min={10}
                    value={areaSqm}
                    onChange={(e) => setAreaSqm(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              {!isLand ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                      {isRtl ? 'عدد غرف النوم' : 'Bedrooms'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                      {isRtl ? 'عدد الحمامات' : 'Bathrooms'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={bathrooms}
                      onChange={(e) => setBathrooms(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                      {isRtl ? 'حالة التشطيب' : 'Finishing'}
                    </label>
                    <input
                      type="text"
                      value={finishingType}
                      onChange={(e) => setFinishingType(e.target.value)}
                      placeholder="سوبر لوكس / نصف تشطيب / طوب أحمر"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {isRtl ? 'نوع الأرض والتراخيص (سكنية / تجارية / زراعية / رخصة البناء)' : 'Land Zoning & Permit'}
                  </label>
                  <input
                    type="text"
                    value={finishingType}
                    onChange={(e) => setFinishingType(e.target.value)}
                    placeholder="مثال: أرض سكنية خالصة المرافق برخصة بدروم وأرضي و3 أدوار"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              )}

              {/* Price & Payment Terms */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {isRtl ? 'إجمالي السعر المطلوب *' : 'Total Price *'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={totalPrice}
                    onChange={(e) => setTotalPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-black text-amber-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-amber-400"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {isRtl ? 'العملة' : 'Currency'}
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  >
                    <option value="EGP">EGP (جنيه مصري)</option>
                    <option value="USD">USD (دولار)</option>
                    <option value="AED">AED (درهم إماراتي)</option>
                    <option value="EUR">EUR (يورو)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {isRtl ? 'نظام الدفع' : 'Payment Method'}
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as 'cash' | 'installment')}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  >
                    <option value="cash">{isRtl ? 'كاش' : 'Cash only'}</option>
                    <option value="installment">{isRtl ? 'متاح تقسيط' : 'Installments available'}</option>
                  </select>
                </div>
              </div>

              {paymentMode === 'installment' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                      {isRtl ? 'نسبة المقدم المطلوب (%)' : 'Down Payment (%)'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={95}
                      value={downPaymentPct}
                      onChange={(e) => setDownPaymentPct(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                      {isRtl ? 'عدد سنوات التقسيط' : 'Installment Years'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={installmentYears}
                      onChange={(e) => setInstallmentYears(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Sale Circumstances (ظروف البيع) */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                  {isRtl
                    ? 'ظروف البيع وكل التفاصيل التي يهم المشتري والشات معرفتها *'
                    : 'Sale Circumstances & Full Details *'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={saleCircumstances}
                  onChange={(e) => setSaleCircumstances(e.target.value)}
                  placeholder="مثال: البيع لظروف السفر، السعر قابل للتفاوض البسيط للكاش، خالصة الثمن وليس عليها أقساط متبقية، فيو مفتوح عالحديقة، الاستلام فوري..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>

              {/* Seller Contact & Delivery */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {isRtl ? 'اسم المالك' : 'Owner Name'}
                  </label>
                  <input
                    type="text"
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    placeholder="الاسم للتواصل"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {isRtl ? 'رقم التليفون / الواتساب *' : 'Phone / WhatsApp *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={sellerPhone}
                    onChange={(e) => setSellerPhone(e.target.value)}
                    placeholder="010xxxxxxxx"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {isRtl ? 'موعد الاستلام' : 'Handover'}
                  </label>
                  <input
                    type="text"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    placeholder="استلام فوري / 2026"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                  {isRtl ? 'صور الوحدة أو الأرض (اختياري)' : 'Photos (Optional)'}
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-amber-500/60 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-700 hover:bg-amber-500/20 dark:text-amber-300">
                    <ImagePlus className="h-4 w-4" />
                    <span>{isRtl ? 'رفع صور من جهازك' : 'Upload Photos'}</span>
                    <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                  </label>
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder={isRtl ? 'أو الصق رابط صورة مباشر (https://...)' : 'Or paste image URL'}
                    className="flex-1 min-w-[200px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
                {images.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {images.map((img, i) => (
                      <div key={i} className="relative h-14 w-20 overflow-hidden rounded-lg border border-slate-300 dark:border-zinc-700">
                        <img src={img} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-0.5 right-0.5 rounded-full bg-black/70 p-0.5 text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-zinc-800 dark:text-zinc-300"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-black text-black shadow-md transition hover:bg-amber-400 disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId
                    ? isRtl ? 'حفظ التعديلات' : 'Save Changes'
                    : isRtl ? 'نشر الوحدة في قاعدة البيانات والشات' : 'Publish Listing'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
