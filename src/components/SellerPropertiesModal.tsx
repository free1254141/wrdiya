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
import { Property, SellerFormPrefill } from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { Locale } from '@/lib/i18n';

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
  initialPrefill?: SellerFormPrefill | null;
}

const CANONICAL_UNIT_TYPES = [
  'شقة',
  'أرض',
  'فيلا مستقلة',
  'تاون هاوس',
  'دوبلكس',
  'بنتهاوس',
  'استوديو',
  'محل / تجاري',
] as const;

type CanonicalUnitType = (typeof CANONICAL_UNIT_TYPES)[number];

interface ModalCopy {
  editTitle: string;
  createTitle: string;
  listTitle: string;
  subtitle: string;
  addBtn: string;
  backToUnits: string;
  emptyTitle: string;
  emptyDesc: string;
  emptyCta: string;
  availableStatus: string;
  askingPrice: string;
  areaLabel: string;
  sqmUnit: string;
  roomsSuffix: string;
  paymentLabel: string;
  installmentYearsFmt: (y: number) => string;
  cashShort: string;
  saleNotesLabel: string;
  editBtn: string;
  viewBtn: string;
  askAiBtn: string;
  deleteTitle: string;
  unitTypeLabel: string;
  cityLabel: string;
  cityPlaceholder: string;
  defaultCity: string;
  locationLabel: string;
  locationPlaceholder: string;
  listingTitleLabel: string;
  titlePlaceholderLand: string;
  titlePlaceholderUnit: string;
  areaSqmLabel: string;
  bedroomsLabel: string;
  bathroomsLabel: string;
  finishingLabel: string;
  finishingPlaceholder: string;
  defaultFinishing: string;
  landZoningLabel: string;
  landZoningPlaceholder: string;
  totalPriceLabel: string;
  currencyLabel: string;
  currencies: { EGP: string; USD: string; AED: string; EUR: string };
  paymentMethodLabel: string;
  cashOnlyOption: string;
  installmentOption: string;
  downPaymentPctLabel: string;
  installmentYearsLabel: string;
  saleCircumstancesLabel: string;
  saleCircumstancesPlaceholder: string;
  ownerNameLabel: string;
  ownerNamePlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  handoverLabel: string;
  handoverPlaceholder: string;
  defaultHandover: string;
  photosLabel: string;
  uploadPhotosBtn: string;
  pasteImageUrlPlaceholder: string;
  cancelBtn: string;
  saveChangesBtn: string;
  publishListingBtn: string;
  feedbackUpdated: string;
  feedbackCreated: string;
  errorSaveFailed: string;
  unitTypes: Record<CanonicalUnitType, string>;
  askAiPrompt: (p: Property, unitLabel: string) => string;
}

const MODAL_TRANSLATIONS: Record<Locale, ModalCopy> = {
  ar: {
    editTitle: 'تعديل بيانات الوحدة / الأرض المعروضة',
    createTitle: 'إضافة وحدة أو قطعة أرض جديدة للبيع',
    listTitle: 'وحداتي وعقاراتي المعروضة للبيع',
    subtitle: 'كل وحدة أو أرض تضيفها هنا يفهم الشات بوت ظروف بيعها ويرشحها فوراً للمشترين الجادين',
    addBtn: 'إضافة عقار / أرض للبيع',
    backToUnits: 'العودة لوحداتي',
    emptyTitle: 'لم تقم بعرض أي وحدة أو أرض للبيع بعد',
    emptyDesc: 'يمكنك إضافة شقتك أو فيلتك أو قطعة الأرض من الزر بالأسفل أو إخبار الشات مباشرة "عايز أبيع شقة أو أرض" وسيتولى الشات تسجيلها والبحث عن مشتري!',
    emptyCta: 'اعرض وحدتك أو أرضك للبيع الآن',
    availableStatus: 'متاح للبيع',
    askingPrice: 'السعر المطلوب',
    areaLabel: 'المساحة',
    sqmUnit: 'م²',
    roomsSuffix: 'غرف',
    paymentLabel: 'نظام البيع',
    installmentYearsFmt: (y) => `تقسيط ${y} سنوات`,
    cashShort: 'كاش',
    saleNotesLabel: 'ظروف البيع: ',
    editBtn: 'تعديل',
    viewBtn: 'معاينة',
    askAiBtn: 'تسويق بالشات',
    deleteTitle: 'حذف الوحدة',
    unitTypeLabel: 'نوع العقار أو الأرض *',
    cityLabel: 'المدينة / المحافظة *',
    cityPlaceholder: 'مثال: القاهرة الجديدة / الشيخ زايد / 6 أكتوبر',
    defaultCity: 'القاهرة الجديدة',
    locationLabel: 'المنطقة / الحي / الكمبوند / رقم القطعة *',
    locationPlaceholder: 'مثال: التجمع الخامس - بيت الوطن الحي الثاني',
    listingTitleLabel: 'عنوان الإعلان (يتولد تلقائياً لو تُرك فارغاً)',
    titlePlaceholderLand: 'مثال: قطعة أرض سكنية مرخصة 500 م² للبيع في بيت الوطن',
    titlePlaceholderUnit: 'مثال: شقة 165 م² سوبر لوكس 3 غرف للبيع في التجمع الخامس',
    areaSqmLabel: 'المساحة بالمتر المربع (م²) *',
    bedroomsLabel: 'عدد غرف النوم',
    bathroomsLabel: 'عدد الحمامات',
    finishingLabel: 'حالة التشطيب',
    finishingPlaceholder: 'سوبر لوكس / نصف تشطيب / طوب أحمر',
    defaultFinishing: 'تشطيب كامل',
    landZoningLabel: 'نوع الأرض والتراخيص (سكنية / تجارية / زراعية / رخصة البناء)',
    landZoningPlaceholder: 'مثال: أرض سكنية خالصة المرافق برخصة بدروم وأرضي و3 أدوار',
    totalPriceLabel: 'إجمالي السعر المطلوب *',
    currencyLabel: 'العملة',
    currencies: {
      EGP: 'EGP (جنيه مصري)',
      USD: 'USD (دولار أمريكي)',
      AED: 'AED (درهم إماراتي)',
      EUR: 'EUR (يورو)',
    },
    paymentMethodLabel: 'نظام الدفع',
    cashOnlyOption: 'كاش فقط',
    installmentOption: 'متاح تقسيط',
    downPaymentPctLabel: 'نسبة المقدم المطلوب (%)',
    installmentYearsLabel: 'عدد سنوات التقسيط',
    saleCircumstancesLabel: 'ظروف البيع وكل التفاصيل التي يهم المشتري والشات معرفتها *',
    saleCircumstancesPlaceholder: 'مثال: البيع لظروف السفر، السعر قابل للتفاوض البسيط للكاش، خالصة الثمن وليس عليها أقساط متبقية، فيو مفتوح عالحديقة، الاستلام فوري...',
    ownerNameLabel: 'اسم المالك',
    ownerNamePlaceholder: 'الاسم للتواصل',
    phoneLabel: 'رقم التليفون / الواتساب *',
    phonePlaceholder: '010xxxxxxxx',
    handoverLabel: 'موعد الاستلام',
    handoverPlaceholder: 'استلام فوري / 2026',
    defaultHandover: 'استلام فوري',
    photosLabel: 'صور الوحدة أو الأرض (اختياري)',
    uploadPhotosBtn: 'رفع صور من جهازك',
    pasteImageUrlPlaceholder: 'أو الصق رابط صورة مباشر (https://...)',
    cancelBtn: 'إلغاء',
    saveChangesBtn: 'حفظ التعديلات',
    publishListingBtn: 'نشر الوحدة في قاعدة البيانات والشات',
    feedbackUpdated: 'تم تحديث بيانات وحدتك بنجاح وأصبحت محدثة في محرك البحث والشات الذكي!',
    feedbackCreated: 'تم إضافة وحدتك للبيع بنجاح وأصبحت متاحة الآن للباحثين في الشات الذكي!',
    errorSaveFailed: 'حدث خطأ أثناء حفظ البيانات',
    unitTypes: {
      'شقة': 'شقة',
      'أرض': 'أرض',
      'فيلا مستقلة': 'فيلا مستقلة',
      'تاون هاوس': 'تاون هاوس',
      'دوبلكس': 'دوبلكس',
      'بنتهاوس': 'بنتهاوس',
      'استوديو': 'استوديو',
      'محل / تجاري': 'محل / تجاري',
    },
    askAiPrompt: (p, unitLabel) =>
      `عندي ${unitLabel} معروضة للبيع (${p.title}) بمساحة ${p.area_sqm} م² وسعر ${p.total_price.toLocaleString()} ${p.currency} في ${p.location_text || p.compound?.area_name || ''}. عايزك تساعدني نلاقي ليها مشتري مناسب وتقولي رأيك في تسعيرها.`,
  },
  en: {
    editTitle: 'Edit Listed Property / Land',
    createTitle: 'List a Property or Land for Sale',
    listTitle: 'My Properties Listed for Sale',
    subtitle: 'Every unit or land you list here is immediately matched by the AI chatbot to serious buyers',
    addBtn: 'Add Property / Land',
    backToUnits: 'Back to my units',
    emptyTitle: 'You have no listed properties yet',
    emptyDesc: 'Add your apartment, villa, or land plot using the button below, or simply tell the chatbot you want to sell your property!',
    emptyCta: 'List Your Property or Land Now',
    availableStatus: 'Available for Sale',
    askingPrice: 'Asking Price',
    areaLabel: 'Area',
    sqmUnit: 'm²',
    roomsSuffix: 'beds',
    paymentLabel: 'Payment',
    installmentYearsFmt: (y) => `${y} yrs Installments`,
    cashShort: 'Cash',
    saleNotesLabel: 'Sale notes: ',
    editBtn: 'Edit',
    viewBtn: 'View',
    askAiBtn: 'Market via AI',
    deleteTitle: 'Delete Property',
    unitTypeLabel: 'Property / Land Type *',
    cityLabel: 'City *',
    cityPlaceholder: 'e.g. New Cairo / Sheikh Zayed / Dubai',
    defaultCity: 'New Cairo',
    locationLabel: 'Area / Compound / Plot *',
    locationPlaceholder: 'e.g. Fifth Settlement - Bait Al Watan District 2',
    listingTitleLabel: 'Listing Title (auto-generated if left blank)',
    titlePlaceholderLand: 'e.g. Licensed residential land plot 500 sqm for sale in New Cairo',
    titlePlaceholderUnit: 'e.g. Super lux 165 sqm 3-bedroom apartment for sale in Fifth Settlement',
    areaSqmLabel: 'Area (sqm) *',
    bedroomsLabel: 'Bedrooms',
    bathroomsLabel: 'Bathrooms',
    finishingLabel: 'Finishing',
    finishingPlaceholder: 'Fully Finished / Semi-Finished / Core & Shell',
    defaultFinishing: 'Fully Finished',
    landZoningLabel: 'Land Zoning & Permit (Residential / Commercial / Building Permit)',
    landZoningPlaceholder: 'e.g. Residential plot with full utilities & permit for basement + G + 3 floors',
    totalPriceLabel: 'Total Asking Price *',
    currencyLabel: 'Currency',
    currencies: {
      EGP: 'EGP (Egyptian Pound)',
      USD: 'USD (US Dollar)',
      AED: 'AED (UAE Dirham)',
      EUR: 'EUR (Euro)',
    },
    paymentMethodLabel: 'Payment Method',
    cashOnlyOption: 'Cash only',
    installmentOption: 'Installments available',
    downPaymentPctLabel: 'Required Down Payment (%)',
    installmentYearsLabel: 'Installment Years',
    saleCircumstancesLabel: 'Sale Circumstances & Full Details *',
    saleCircumstancesPlaceholder: 'e.g. Selling due to relocation, price slightly negotiable for cash, fully paid with no remaining installments, open garden view, ready to move...',
    ownerNameLabel: 'Owner Name',
    ownerNamePlaceholder: 'Contact Name',
    phoneLabel: 'Phone / WhatsApp *',
    phonePlaceholder: '+20 10xxxxxxxx',
    handoverLabel: 'Handover',
    handoverPlaceholder: 'Ready to Move / 2026',
    defaultHandover: 'Ready to Move',
    photosLabel: 'Photos (Optional)',
    uploadPhotosBtn: 'Upload Photos',
    pasteImageUrlPlaceholder: 'Or paste direct image URL (https://...)',
    cancelBtn: 'Cancel',
    saveChangesBtn: 'Save Changes',
    publishListingBtn: 'Publish Listing',
    feedbackUpdated: 'Your property listing has been updated and synced with the AI search engine!',
    feedbackCreated: 'Your property has been listed for sale and is now live for buyers in the AI chatbot!',
    errorSaveFailed: 'Failed to save property details',
    unitTypes: {
      'شقة': 'Apartment',
      'أرض': 'Land / Plot',
      'فيلا مستقلة': 'Standalone Villa',
      'تاون هاوس': 'Townhouse',
      'دوبلكس': 'Duplex',
      'بنتهاوس': 'Penthouse',
      'استوديو': 'Studio',
      'محل / تجاري': 'Commercial / Shop',
    },
    askAiPrompt: (p, unitLabel) =>
      `I have a ${unitLabel} listed for sale (${p.title}), ${p.area_sqm} sqm at ${p.total_price.toLocaleString()} ${p.currency} in ${p.location_text || p.compound?.area_name || ''}. Please help me market it to serious buyers and evaluate its pricing.`,
  },
  tr: {
    editTitle: 'İlan Bilgilerini Düzenle',
    createTitle: 'Satılık Konut veya Arsa İlanı Ekle',
    listTitle: 'Satılık İlanlarım',
    subtitle: 'Buraya eklediğiniz her daire, villa veya arsa yapay zeka asistanı tarafından ciddi alıcılara तुरंत önerilir',
    addBtn: 'İlan / Arsa Ekle',
    backToUnits: 'İlanlarıma Dön',
    emptyTitle: 'Henüz satılık bir ilan eklemediniz',
    emptyDesc: 'Aşağıdaki butondan dairenizi, villanızı veya arsanızı ekleyebilir ya da sohbet botuna "Dairemi satmak istiyorum" yazabilirsiniz!',
    emptyCta: 'Gayrimenkulünüzü Şimdi Satışa Sunun',
    availableStatus: 'Satılık',
    askingPrice: 'İstenen Fiyat',
    areaLabel: 'Alan',
    sqmUnit: 'm²',
    roomsSuffix: 'oda',
    paymentLabel: 'Ödeme Planı',
    installmentYearsFmt: (y) => `${y} Yıl Taksit`,
    cashShort: 'Nakit',
    saleNotesLabel: 'Satış Notları: ',
    editBtn: 'Düzenle',
    viewBtn: 'İncele',
    askAiBtn: 'AI ile Pazarla',
    deleteTitle: 'İlanı Sil',
    unitTypeLabel: 'Gayrimenkul / Arsa Tipi *',
    cityLabel: 'Şehir *',
    cityPlaceholder: 'Örn: Yeni Kahire / İstanbul / Dubai',
    defaultCity: 'Yeni Kahire',
    locationLabel: 'Bölge / Site / Parsel *',
    locationPlaceholder: 'Örn: Beşinci Yerleşim - Bait Al Watan 2. Bölge',
    listingTitleLabel: 'İlan Başlığı (boş bırakılırsa otomatik oluşturulur)',
    titlePlaceholderLand: 'Örn: İmarlı 500 m² satılık konut arsası',
    titlePlaceholderUnit: 'Örn: 165 m² 3+1 lüks yapılı satılık daire',
    areaSqmLabel: 'Alan (m²) *',
    bedroomsLabel: 'Oda Sayısı',
    bathroomsLabel: 'Banyo Sayısı',
    finishingLabel: 'Teslim / Yapı Durumu',
    finishingPlaceholder: 'Tam Yapılı / Yarı Yapılı / Kaba İnşaat',
    defaultFinishing: 'Tam Yapılı',
    landZoningLabel: 'Arsa İmar Durumu ve Ruhsat Bilgisi',
    landZoningPlaceholder: 'Örn: Altyapısı hazır, 3 kat imarlı konut arsası',
    totalPriceLabel: 'Toplam Fiyat *',
    currencyLabel: 'Para Birimi',
    currencies: {
      EGP: 'EGP (Mısır Lirası)',
      USD: 'USD (ABD Doları)',
      AED: 'AED (BAE Dirhemi)',
      EUR: 'EUR (Euro)',
    },
    paymentMethodLabel: 'Ödeme Yöntemi',
    cashOnlyOption: 'Sadece Nakit',
    installmentOption: 'Taksit İmkanı Var',
    downPaymentPctLabel: 'Peşinat Oranı (%)',
    installmentYearsLabel: 'Taksit Süresi (Yıl)',
    saleCircumstancesLabel: 'Satış Koşulları ve Tüm Detaylar *',
    saleCircumstancesPlaceholder: 'Örn: Taşınma nedeniyle satılık, nakitte pazarlık payı var, borcu yok, bahçe manzaralı, hemen teslim...',
    ownerNameLabel: 'Mülk Sahibi Adı',
    ownerNamePlaceholder: 'İletişim Adı',
    phoneLabel: 'Telefon / WhatsApp *',
    phonePlaceholder: '+90 5xxxxxxxxx',
    handoverLabel: 'Teslim Tarihi',
    handoverPlaceholder: 'Hemen Teslim / 2026',
    defaultHandover: 'Hemen Teslim',
    photosLabel: 'Fotoğraflar (İsteğe Bağlı)',
    uploadPhotosBtn: 'Fotoğraf Yükle',
    pasteImageUrlPlaceholder: 'Veya doğrudan fotoğraf bağlantısı yapıştırın (https://...)',
    cancelBtn: 'İptal',
    saveChangesBtn: 'Değişiklikleri Kaydet',
    publishListingBtn: 'İlanı Yayınla',
    feedbackUpdated: 'İlan bilgileriniz başarıyla güncellendi ve AI arama motoruna eklendi!',
    feedbackCreated: 'İlanınız başarıyla eklendi ve şimdi AI sohbet botunda alıcılar için yayında!',
    errorSaveFailed: 'Bilgiler kaydedilirken bir hata oluştu',
    unitTypes: {
      'شقة': 'Daire',
      'أرض': 'Arsa',
      'فيلا مستقلة': 'Müstakil Villa',
      'تاون هاوس': 'Sıra Ev (Townhouse)',
      'دوبلكس': 'Dubleks',
      'بنتهاوس': 'Penthouse',
      'استوديو': 'Stüdyo',
      'محل / تجاري': 'Ticari / Dükkan',
    },
    askAiPrompt: (p, unitLabel) =>
      `Satılık bir ${unitLabel} ilanım var (${p.title}), ${p.area_sqm} m², fiyatı ${p.total_price.toLocaleString()} ${p.currency}, konum: ${p.location_text || p.compound?.area_name || ''}. Uygun alıcı bulmama ve fiyat değerlendirmesine yardımcı olur musun?`,
  },
  ru: {
    editTitle: 'Редактировать объект / участок',
    createTitle: 'Разместить объект или участок на продажу',
    listTitle: 'Мои объекты на продажу',
    subtitle: 'Каждый добавленный здесь объект или участок сразу же рекомендуется ИИ-ботом реальным покупателям',
    addBtn: 'Добавить объект / участок',
    backToUnits: 'К моим объектам',
    emptyTitle: 'У вас пока нет размещенных объектов',
    emptyDesc: 'Добавьте квартиру, виллу или участок с помощью кнопки ниже или просто напишите в чат «Хочу продать квартиру»!',
    emptyCta: 'Разместить объект сейчас',
    availableStatus: 'В продаже',
    askingPrice: 'Цена',
    areaLabel: 'Площадь',
    sqmUnit: 'м²',
    roomsSuffix: 'комн.',
    paymentLabel: 'Оплата',
    installmentYearsFmt: (y) => `Рассрочка ${y} л.`,
    cashShort: 'Наличные',
    saleNotesLabel: 'Условия продажи: ',
    editBtn: 'Изменить',
    viewBtn: 'Просмотр',
    askAiBtn: 'Продвигать через ИИ',
    deleteTitle: 'Удалить объект',
    unitTypeLabel: 'Тип недвижимости / участка *',
    cityLabel: 'Город *',
    cityPlaceholder: 'Напр.: Новый Каир / Дубай / Стамбул',
    defaultCity: 'Новый Каир',
    locationLabel: 'Район / Комплекс / Участок *',
    locationPlaceholder: 'Напр.: Пятое поселение - Бейт Аль-Ватан',
    listingTitleLabel: 'Заголовок объявления (создается автоматически, если пусто)',
    titlePlaceholderLand: 'Напр.: Жилой участок 500 м² с разрешением на строительство',
    titlePlaceholderUnit: 'Напр.: Квартира 165 м² с 3 спальнями и ремонтом люкс',
    areaSqmLabel: 'Площадь (м²) *',
    bedroomsLabel: 'Спальни',
    bathroomsLabel: 'Ванные комнаты',
    finishingLabel: 'Отделка',
    finishingPlaceholder: 'Чистовая отделка / Предчистовая / Без отделки',
    defaultFinishing: 'Чистовая отделка',
    landZoningLabel: 'Назначение земли и разрешения',
    landZoningPlaceholder: 'Напр.: ИЖС, все коммуникации, разрешение на цоколь + 3 этажа',
    totalPriceLabel: 'Общая стоимость *',
    currencyLabel: 'Валюта',
    currencies: {
      EGP: 'EGP (Египетский фунт)',
      USD: 'USD (Доллар США)',
      AED: 'AED (Дирхам ОАЭ)',
      EUR: 'EUR (Евро)',
    },
    paymentMethodLabel: 'Способ оплаты',
    cashOnlyOption: 'Только 100% оплата',
    installmentOption: 'Доступна рассрочка',
    downPaymentPctLabel: 'Первый взнос (%)',
    installmentYearsLabel: 'Срок рассрочки (лет)',
    saleCircumstancesLabel: 'Условия продажи и подробное описание *',
    saleCircumstancesPlaceholder: 'Напр.: Срочная продажа в связи с переездом, небольшой торг при 100% оплате, без обременений, вид на сад, готово к заселению...',
    ownerNameLabel: 'Имя владельца',
    ownerNamePlaceholder: 'Контактное лицо',
    phoneLabel: 'Телефон / WhatsApp *',
    phonePlaceholder: '+7 9xxxxxxxxx',
    handoverLabel: 'Срок сдачи',
    handoverPlaceholder: 'Готово к заселению / 2026',
    defaultHandover: 'Готово к заселению',
    photosLabel: 'Фотографии (необязательно)',
    uploadPhotosBtn: 'Загрузить фото',
    pasteImageUrlPlaceholder: 'Или вставьте прямую ссылку на фото (https://...)',
    cancelBtn: 'Отмена',
    saveChangesBtn: 'Сохранить изменения',
    publishListingBtn: 'Опубликовать объявление',
    feedbackUpdated: 'Данные вашего объекта успешно обновлены и синхронизированы с ИИ-чатом!',
    feedbackCreated: 'Ваш объект успешно добавлен в базу и теперь доступен покупателям в ИИ-чате!',
    errorSaveFailed: 'Ошибка при сохранении данных',
    unitTypes: {
      'شقة': 'Квартира',
      'أرض': 'Земельный участок',
      'فيلا مستقلة': 'Отдельная вилла',
      'تاون هاوس': 'Таунхаус',
      'دوبلكس': 'Дуплекс',
      'بنتهاوس': 'Пентхаус',
      'استوديو': 'Студия',
      'محل / تجاري': 'Коммерческое помещение',
    },
    askAiPrompt: (p, unitLabel) =>
      `У меня в продаже ${unitLabel} (${p.title}), площадь ${p.area_sqm} м², цена ${p.total_price.toLocaleString()} ${p.currency} в районе ${p.location_text || p.compound?.area_name || ''}. Помоги найти покупателя и оценить стоимость.`,
  },
  de: {
    editTitle: 'Immobilienangebot bearbeiten',
    createTitle: 'Immobilie oder Grundstück zum Verkauf anbieten',
    listTitle: 'Meine angebotenen Immobilien',
    subtitle: 'Jede hier eingetragene Immobilie wird vom KI-Chatbot sofort passenden Käufern vorgeschlagen',
    addBtn: 'Immobilie / Grundstück hinzufügen',
    backToUnits: 'Zurück zu meinen Einheiten',
    emptyTitle: 'Sie haben noch keine Immobilien inseriert',
    emptyDesc: 'Fügen Sie Ihre Wohnung, Villa oder Ihr Grundstück unten hinzu oder schreiben Sie einfach im Chat „Ich möchte meine Immobilie verkaufen“!',
    emptyCta: 'Immobilie jetzt inserieren',
    availableStatus: 'Verfügbar',
    askingPrice: 'Angebotspreis',
    areaLabel: 'Fläche',
    sqmUnit: 'm²',
    roomsSuffix: 'Zi.',
    paymentLabel: 'Zahlung',
    installmentYearsFmt: (y) => `${y} J. Raten`,
    cashShort: 'Barzahlung',
    saleNotesLabel: 'Verkaufsdetails: ',
    editBtn: 'Bearbeiten',
    viewBtn: 'Ansehen',
    askAiBtn: 'Mit KI vermarkten',
    deleteTitle: 'Löschen',
    unitTypeLabel: 'Immobilien- / Grundstückstyp *',
    cityLabel: 'Stadt *',
    cityPlaceholder: 'z. B. New Cairo / Dubai / Málaga',
    defaultCity: 'New Cairo',
    locationLabel: 'Gebiet / Wohnanlage / Parzelle *',
    locationPlaceholder: 'z. B. Fifth Settlement - Bait Al Watan',
    listingTitleLabel: 'Exposé-Titel (wird automatisch generiert, falls leer)',
    titlePlaceholderLand: 'z. B. Baugrundstück 500 m² mit Baugenehmigung zu verkaufen',
    titlePlaceholderUnit: 'z. B. Luxus-Wohnung 165 m², 3 Schlafzimmer in New Cairo',
    areaSqmLabel: 'Fläche (m²) *',
    bedroomsLabel: 'Schlafzimmer',
    bathroomsLabel: 'Badezimmer',
    finishingLabel: 'Ausstattung / Zustand',
    finishingPlaceholder: 'Schlüsselfertig / Teilmöbliert / Rohbau',
    defaultFinishing: 'Schlüsselfertig',
    landZoningLabel: 'Widmung & Baugenehmigung',
    landZoningPlaceholder: 'z. B. Wohnbauland voll erschlossen mit Genehmigung für UG + EG + 3 Etagen',
    totalPriceLabel: 'Gesamtpreis *',
    currencyLabel: 'Währung',
    currencies: {
      EGP: 'EGP (Ägyptisches Pfund)',
      USD: 'USD (US-Dollar)',
      AED: 'AED (VAE-Dirham)',
      EUR: 'EUR (Euro)',
    },
    paymentMethodLabel: 'Zahlungsart',
    cashOnlyOption: 'Nur Direktzahlung (Cash)',
    installmentOption: 'Ratenzahlung möglich',
    downPaymentPctLabel: 'Anzahlung (%)',
    installmentYearsLabel: 'Laufzeit (Jahre)',
    saleCircumstancesLabel: 'Verkaufsumstände & vollständige Details *',
    saleCircumstancesPlaceholder: 'z. B. Verkauf wegen Umzug, Preis bei Barzahlung leicht verhandelbar, schuldenfrei, Gartenblick, sofort bezugsfertig...',
    ownerNameLabel: 'Name des Eigentümers',
    ownerNamePlaceholder: 'Kontaktname',
    phoneLabel: 'Telefon / WhatsApp *',
    phonePlaceholder: '+49 17xxxxxxxx',
    handoverLabel: 'Übergabe',
    handoverPlaceholder: 'Sofort bezugsfertig / 2026',
    defaultHandover: 'Sofort bezugsfertig',
    photosLabel: 'Fotos (Optional)',
    uploadPhotosBtn: 'Fotos hochladen',
    pasteImageUrlPlaceholder: 'Oder direkte Bild-URL einfügen (https://...)',
    cancelBtn: 'Abbrechen',
    saveChangesBtn: 'Änderungen speichern',
    publishListingBtn: 'Inserat veröffentlichen',
    feedbackUpdated: 'Ihr Immobilienangebot wurde erfolgreich aktualisiert!',
    feedbackCreated: 'Ihre Immobilie wurde veröffentlicht und ist jetzt im KI-Chat für Käufer sichtbar!',
    errorSaveFailed: 'Fehler beim Speichern der Daten',
    unitTypes: {
      'شقة': 'Wohnung',
      'أرض': 'Grundstück',
      'فيلا مستقلة': 'Freistehende Villa',
      'تاون هاوس': 'Reihenhaus (Townhouse)',
      'دوبلكس': 'Maisonette / Duplex',
      'بنتهاوس': 'Penthouse',
      'استوديو': 'Studio',
      'محل / تجاري': 'Gewerbeimmobilie',
    },
    askAiPrompt: (p, unitLabel) =>
      `Ich biete eine ${unitLabel} zum Verkauf an (${p.title}), ${p.area_sqm} m² für ${p.total_price.toLocaleString()} ${p.currency} in ${p.location_text || p.compound?.area_name || ''}. Bitte hilf mir bei der Vermarktung und Preisbewertung.`,
  },
  fr: {
    editTitle: 'Modifier le bien mis en vente',
    createTitle: 'Mettre en vente un bien ou un terrain',
    listTitle: 'Mes biens mis en vente',
    subtitle: 'Chaque bien ou terrain ajouté ici est immédiatement proposé par le chatbot IA aux acheteurs sérieux',
    addBtn: 'Ajouter un bien / terrain',
    backToUnits: 'Retour à mes biens',
    emptyTitle: 'Vous n’avez encore aucun bien en vente',
    emptyDesc: 'Ajoutez votre appartement, villa ou terrain ci-dessous, ou dites simplement au chatbot « Je veux vendre mon bien » !',
    emptyCta: 'Mettre en vente maintenant',
    availableStatus: 'Disponible',
    askingPrice: 'Prix demandé',
    areaLabel: 'Surface',
    sqmUnit: 'm²',
    roomsSuffix: 'ch.',
    paymentLabel: 'Paiement',
    installmentYearsFmt: (y) => `Échelonné ${y} ans`,
    cashShort: 'Comptant',
    saleNotesLabel: 'Conditions de vente : ',
    editBtn: 'Modifier',
    viewBtn: 'Voir',
    askAiBtn: 'Promouvoir via IA',
    deleteTitle: 'Supprimer le bien',
    unitTypeLabel: 'Type de bien / terrain *',
    cityLabel: 'Ville *',
    cityPlaceholder: 'ex: Nouveau Caire / Dubaï / Malaga',
    defaultCity: 'Nouveau Caire',
    locationLabel: 'Quartier / Résidence / Parcelle *',
    locationPlaceholder: 'ex: Fifth Settlement - Bait Al Watan',
    listingTitleLabel: 'Titre de l’annonce (généré automatiquement si vide)',
    titlePlaceholderLand: 'ex: Terrain résidentiel constructible de 500 m² à vendre',
    titlePlaceholderUnit: 'ex: Appartement 165 m² grand standing 3 chambres à vendre',
    areaSqmLabel: 'Surface (m²) *',
    bedroomsLabel: 'Chambres',
    bathroomsLabel: 'Salles de bain',
    finishingLabel: 'Finition',
    finishingPlaceholder: 'Entièrement fini / Semi-fini / Brut',
    defaultFinishing: 'Entièrement fini',
    landZoningLabel: 'Zonage du terrain & Permis de construire',
    landZoningPlaceholder: 'ex: Terrain résidentiel viabilisé avec permis sous-sol + RDC + 3 étages',
    totalPriceLabel: 'Prix total demandé *',
    currencyLabel: 'Devise',
    currencies: {
      EGP: 'EGP (Livre égyptienne)',
      USD: 'USD (Dollar US)',
      AED: 'AED (Dirham EAU)',
      EUR: 'EUR (Euro)',
    },
    paymentMethodLabel: 'Mode de paiement',
    cashOnlyOption: 'Paiement comptant uniquement',
    installmentOption: 'Paiement échelonné possible',
    downPaymentPctLabel: 'Acompte requis (%)',
    installmentYearsLabel: 'Années d’échelonnement',
    saleCircumstancesLabel: 'Conditions de vente et détails complets *',
    saleCircumstancesPlaceholder: 'ex: Vente pour cause de départ, prix légèrement négociable au comptant, entièrement payé, vue jardin, livraison immédiate...',
    ownerNameLabel: 'Nom du propriétaire',
    ownerNamePlaceholder: 'Nom du contact',
    phoneLabel: 'Téléphone / WhatsApp *',
    phonePlaceholder: '+33 6xxxxxxxx',
    handoverLabel: 'Livraison',
    handoverPlaceholder: 'Livraison immédiate / 2026',
    defaultHandover: 'Livraison immédiate',
    photosLabel: 'Photos (Optionnel)',
    uploadPhotosBtn: 'Télécharger des photos',
    pasteImageUrlPlaceholder: 'Ou collez une URL d’image directe (https://...)',
    cancelBtn: 'Annuler',
    saveChangesBtn: 'Enregistrer',
    publishListingBtn: 'Publier l’annonce',
    feedbackUpdated: 'Votre annonce a été mise à jour avec succès dans le moteur IA !',
    feedbackCreated: 'Votre bien a été publié avec succès et est maintenant proposé aux acheteurs !',
    errorSaveFailed: 'Erreur lors de l’enregistrement',
    unitTypes: {
      'شقة': 'Appartement',
      'أرض': 'Terrain',
      'فيلا مستقلة': 'Villa individuelle',
      'تاون هاوس': 'Maison de ville (Townhouse)',
      'دوبلكس': 'Duplex',
      'بنتهاوس': 'Penthouse',
      'استوديو': 'Studio',
      'محل / تجاري': 'Local commercial',
    },
    askAiPrompt: (p, unitLabel) =>
      `J'ai un(e) ${unitLabel} en vente (${p.title}), ${p.area_sqm} m² au prix de ${p.total_price.toLocaleString()} ${p.currency} à ${p.location_text || p.compound?.area_name || ''}. Aide-moi à trouver un acheteur et à évaluer son prix.`,
  },
  es: {
    editTitle: 'Editar propiedad publicada',
    createTitle: 'Publicar propiedad o terreno en venta',
    listTitle: 'Mis propiedades en venta',
    subtitle: 'Cada propiedad o terreno que publiques aquí es recomendado de inmediato por el chatbot IA a compradores serios',
    addBtn: 'Añadir propiedad / terreno',
    backToUnits: 'Volver a mis unidades',
    emptyTitle: 'Aún no has publicado ninguna propiedad',
    emptyDesc: 'Añade tu apartamento, villa o terreno con el botón de abajo o simplemente dile al chatbot «Quiero vender mi propiedad».',
    emptyCta: 'Publicar mi propiedad ahora',
    availableStatus: 'Disponible',
    askingPrice: 'Precio solicitado',
    areaLabel: 'Superficie',
    sqmUnit: 'm²',
    roomsSuffix: 'dorm.',
    paymentLabel: 'Pago',
    installmentYearsFmt: (y) => `Plazos ${y} años`,
    cashShort: 'Contado',
    saleNotesLabel: 'Notas de venta: ',
    editBtn: 'Editar',
    viewBtn: 'Ver',
    askAiBtn: 'Promocionar con IA',
    deleteTitle: 'Eliminar propiedad',
    unitTypeLabel: 'Tipo de propiedad / terreno *',
    cityLabel: 'Ciudad *',
    cityPlaceholder: 'ej: Nuevo Cairo / Dubái / Málaga',
    defaultCity: 'Nuevo Cairo',
    locationLabel: 'Zona / Urbanización / Parcela *',
    locationPlaceholder: 'ej: Fifth Settlement - Bait Al Watan',
    listingTitleLabel: 'Título del anuncio (se genera automáticamente si se deja vacío)',
    titlePlaceholderLand: 'ej: Parcela residencial con licencia de 500 m² en venta',
    titlePlaceholderUnit: 'ej: Apartamento de lujo de 165 m² con 3 dormitorios en venta',
    areaSqmLabel: 'Superficie (m²) *',
    bedroomsLabel: 'Dormitorios',
    bathroomsLabel: 'Baños',
    finishingLabel: 'Acabados',
    finishingPlaceholder: 'Totalmente terminado / Semi-terminado / Obra gris',
    defaultFinishing: 'Totalmente terminado',
    landZoningLabel: 'Calificación del suelo y licencia de obra',
    landZoningPlaceholder: 'ej: Suelo urbano residencial con todos los servicios y licencia para sótano + PB + 3 plantas',
    totalPriceLabel: 'Precio total solicitado *',
    currencyLabel: 'Moneda',
    currencies: {
      EGP: 'EGP (Libra egipcia)',
      USD: 'USD (Dólar estadounidense)',
      AED: 'AED (Dírham EAU)',
      EUR: 'EUR (Euro)',
    },
    paymentMethodLabel: 'Método de pago',
    cashOnlyOption: 'Solo pago al contado',
    installmentOption: 'Pago a plazos disponible',
    downPaymentPctLabel: 'Entrada inicial (%)',
    installmentYearsLabel: 'Años de financiación',
    saleCircumstancesLabel: 'Condiciones de venta y detalles completos *',
    saleCircumstancesPlaceholder: 'ej: Venta por traslado, precio ligeramente negociable al contado, libre de cargas, vistas al jardín, entrega inmediata...',
    ownerNameLabel: 'Nombre del propietario',
    ownerNamePlaceholder: 'Nombre de contacto',
    phoneLabel: 'Teléfono / WhatsApp *',
    phonePlaceholder: '+34 6xxxxxxxx',
    handoverLabel: 'Entrega',
    handoverPlaceholder: 'Entrega inmediata / 2026',
    defaultHandover: 'Entrega inmediata',
    photosLabel: 'Fotos (Opcional)',
    uploadPhotosBtn: 'Subir fotos',
    pasteImageUrlPlaceholder: 'O pega una URL directa de imagen (https://...)',
    cancelBtn: 'Cancelar',
    saveChangesBtn: 'Guardar cambios',
    publishListingBtn: 'Publicar anuncio',
    feedbackUpdated: '¡Los datos de tu propiedad han sido actualizados en el buscador IA!',
    feedbackCreated: '¡Tu propiedad ha sido publicada en venta y ya está disponible para compradores en el chat IA!',
    errorSaveFailed: 'Error al guardar los datos',
    unitTypes: {
      'شقة': 'Apartamento',
      'أرض': 'Terreno / Parcela',
      'فيلا مستقلة': 'Villa independiente',
      'تاون هاوس': 'Adosado (Townhouse)',
      'دوبلكس': 'Dúplex',
      'بنتهاوس': 'Ático (Penthouse)',
      'استوديو': 'Estudio',
      'محل / تجاري': 'Local comercial',
    },
    askAiPrompt: (p, unitLabel) =>
      `Tengo un(a) ${unitLabel} en venta (${p.title}) de ${p.area_sqm} m² por ${p.total_price.toLocaleString()} ${p.currency} en ${p.location_text || p.compound?.area_name || ''}. Ayúdame a encontrar un comprador y evaluar su precio.`,
  },
};

const ALL_DEFAULT_CITIES = new Set(Object.values(MODAL_TRANSLATIONS).map((c) => c.defaultCity));
const ALL_DEFAULT_FINISHINGS = new Set(Object.values(MODAL_TRANSLATIONS).map((c) => c.defaultFinishing));
const ALL_DEFAULT_HANDOVERS = new Set(Object.values(MODAL_TRANSLATIONS).map((c) => c.defaultHandover));

function normalizeCanonicalUnitType(raw?: string): CanonicalUnitType {
  if (!raw) return 'شقة';
  const v = raw.trim().toLowerCase();
  if (v.includes('أرض') || v.includes('ارض') || v.includes('land') || v.includes('arsa') || v.includes('участ') || v.includes('grund') || v.includes('terrain') || v.includes('terreno')) {
    return 'أرض';
  }
  if (v.includes('فيلا') || v.includes('villa') || v.includes('вилл')) return 'فيلا مستقلة';
  if (v.includes('تاون') || v.includes('town') || v.includes('sıra') || v.includes('таун') || v.includes('reihen') || v.includes('adosado')) return 'تاون هاوس';
  if (v.includes('دوبلكس') || v.includes('duplex') || v.includes('dubleks') || v.includes('дуплекс') || v.includes('dúplex')) return 'دوبلكس';
  if (v.includes('بنتهاوس') || v.includes('penthouse') || v.includes('пентхаус') || v.includes('ático')) return 'بنتهاوس';
  if (v.includes('استوديو') || v.includes('studio') || v.includes('stüdyo') || v.includes('студи') || v.includes('estudio')) return 'استوديو';
  if (v.includes('محل') || v.includes('تجار') || v.includes('commercial') || v.includes('shop') || v.includes('ticari') || v.includes('коммер') || v.includes('gewerbe')) return 'محل / تجاري';
  return 'شقة';
}

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
  initialPrefill = null,
}: SellerPropertiesModalProps) {
  const { locale, isRtl } = useLanguage();
  const copy = MODAL_TRANSLATIONS[locale] || MODAL_TRANSLATIONS.en;

  const [mode, setMode] = useState<'list' | 'form'>(initialMode === 'create' ? 'form' : 'list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form fields
  const [unitType, setUnitType] = useState<CanonicalUnitType>('شقة');
  const [title, setTitle] = useState('');
  const [city, setCity] = useState(copy.defaultCity);
  const [locationText, setLocationText] = useState('');
  const [areaSqm, setAreaSqm] = useState('150');
  const [bedrooms, setBedrooms] = useState('3');
  const [bathrooms, setBathrooms] = useState('2');
  const [finishingType, setFinishingType] = useState(copy.defaultFinishing);
  const [totalPrice, setTotalPrice] = useState('4500000');
  const [currency, setCurrency] = useState('EGP');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'installment'>('cash');
  const [downPaymentPct, setDownPaymentPct] = useState('20');
  const [installmentYears, setInstallmentYears] = useState('5');
  const [deliveryDate, setDeliveryDate] = useState(copy.defaultHandover);
  const [saleCircumstances, setSaleCircumstances] = useState('');
  const [sellerName, setSellerName] = useState(defaultSellerName || '');
  const [sellerPhone, setSellerPhone] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const isLand = unitType === 'أرض';

  const translateUnitType = (raw?: string): string => {
    const canonical = normalizeCanonicalUnitType(raw);
    return copy.unitTypes[canonical] || raw || copy.unitTypes['شقة'];
  };

  const translateStatus = (raw?: string): string => {
    if (!raw || raw === 'متاح' || raw === 'متاح للبيع') return copy.availableStatus;
    return raw;
  };

  // Sync default values when locale changes while in create mode (if untouched by user)
  useEffect(() => {
    if (!editingId) {
      setCity((prev) => (!prev || ALL_DEFAULT_CITIES.has(prev) ? copy.defaultCity : prev));
      setFinishingType((prev) => (!prev || ALL_DEFAULT_FINISHINGS.has(prev) ? copy.defaultFinishing : prev));
      setDeliveryDate((prev) => (!prev || ALL_DEFAULT_HANDOVERS.has(prev) ? copy.defaultHandover : prev));
    }
  }, [locale, editingId, copy.defaultCity, copy.defaultFinishing, copy.defaultHandover]);

  useEffect(() => {
    if (!isOpen) return;
    if (initialEditingProperty) {
      startEdit(initialEditingProperty);
    } else if (initialMode === 'create' || initialPrefill) {
      startCreate(initialPrefill);
    } else {
      setMode('list');
    }
  }, [isOpen, initialMode, initialEditingProperty, initialPrefill]);

  const startCreate = (prefill?: SellerFormPrefill | null) => {
    setEditingId(null);
    setUnitType(normalizeCanonicalUnitType(prefill?.unit_type));
    setTitle(prefill?.title || '');
    setCity(prefill?.city || copy.defaultCity);
    setLocationText(prefill?.location_text || '');
    setAreaSqm(prefill?.area_sqm ? String(prefill.area_sqm) : '150');
    setBedrooms(prefill?.bedrooms !== undefined ? String(prefill.bedrooms) : '3');
    setBathrooms(prefill?.bathrooms !== undefined ? String(prefill.bathrooms) : '2');
    setFinishingType(prefill?.finishing_type || copy.defaultFinishing);
    setTotalPrice(prefill?.total_price ? String(prefill.total_price) : '4500000');
    setCurrency(prefill?.currency || 'EGP');
    setPaymentMode(prefill?.payment_mode || ((prefill?.installment_years || 0) > 0 ? 'installment' : 'cash'));
    setDownPaymentPct(prefill?.down_payment_pct !== undefined ? String(prefill.down_payment_pct) : '20');
    setInstallmentYears(prefill?.installment_years !== undefined ? String(prefill.installment_years) : '5');
    setDeliveryDate(prefill?.delivery_date || copy.defaultHandover);
    setSaleCircumstances(prefill?.sale_circumstances || '');
    setSellerName(prefill?.seller_name || defaultSellerName || '');
    setSellerPhone(prefill?.seller_phone || '');
    setImages([]);
    setImageUrlInput('');
    setFeedback(null);
    setMode('form');
  };

  const startEdit = (p: Property) => {
    setEditingId(p.id);
    setUnitType(normalizeCanonicalUnitType(p.unit_type));
    setTitle(p.title || '');
    setCity(p.compound?.city || copy.defaultCity);
    setLocationText(p.location_text || p.compound?.area_name || '');
    setAreaSqm(String(p.area_sqm || 150));
    setBedrooms(String(p.bedrooms ?? 3));
    setBathrooms(String(p.bathrooms ?? 2));
    setFinishingType(p.finishing_type || copy.defaultFinishing);
    setTotalPrice(String(p.total_price || 4500000));
    setCurrency(p.currency || 'EGP');
    const hasInst = (p.installment_years || 0) > 0;
    setPaymentMode(hasInst ? 'installment' : 'cash');
    setDownPaymentPct(String(p.down_payment_pct ?? (hasInst ? 20 : 100)));
    setInstallmentYears(String(p.installment_years || 5));
    setDeliveryDate(p.delivery_date || copy.defaultHandover);
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
        throw new Error(err.error || copy.errorSaveFailed);
      }

      await onRefresh();
      setFeedback(editingId ? copy.feedbackUpdated : copy.feedbackCreated);
      setTimeout(() => {
        setFeedback(null);
        setMode('list');
      }, 900);
    } catch (err: any) {
      setFeedback(`⚠️ ${err?.message || copy.errorSaveFailed}`);
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
                    ? copy.editTitle
                    : copy.createTitle
                  : copy.listTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {copy.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mode === 'list' ? (
              <button
                type="button"
                onClick={() => startCreate(null)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-black text-black transition hover:bg-amber-400"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                {copy.addBtn}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode('list')}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                {copy.backToUnits}
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
                  {copy.emptyTitle}
                </h4>
                <p className="mx-auto mt-1 max-w-md text-xs text-slate-500 dark:text-zinc-400">
                  {copy.emptyDesc}
                </p>
                <button
                  type="button"
                  onClick={() => startCreate(null)}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-2.5 text-xs font-black text-black shadow-md transition hover:bg-amber-400"
                >
                  <Plus className="h-4 w-4 stroke-[3]" />
                  {copy.emptyCta}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {properties.map((p) => {
                  const unitLabel = translateUnitType(p.unit_type);
                  return (
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
                                {unitLabel}
                              </span>
                              <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                {translateStatus(p.status)}
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
                            <span className="text-slate-400 text-[10px] block">{copy.askingPrice}</span>
                            <span className="font-black text-amber-600 dark:text-amber-400">
                              {(p.total_price || 0).toLocaleString()} {p.currency}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">{copy.areaLabel}</span>
                            <span className="font-bold text-slate-800 dark:text-zinc-200">
                              {p.area_sqm} {copy.sqmUnit}
                              {p.bedrooms ? ` • ${p.bedrooms} ${copy.roomsSuffix}` : ''}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">{copy.paymentLabel}</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {(p.installment_years || 0) > 0
                                ? copy.installmentYearsFmt(p.installment_years)
                                : copy.cashShort}
                            </span>
                          </div>
                        </div>

                        {p.sale_circumstances && (
                          <div className="mt-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] text-slate-600 dark:text-zinc-300 line-clamp-2">
                            <strong className="text-amber-600 dark:text-amber-400">
                              {copy.saleNotesLabel}
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
                          {copy.editBtn}
                        </button>
                        <button
                          type="button"
                          onClick={() => onViewDetails(p)}
                          className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {copy.viewBtn}
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
                            {copy.askAiBtn}
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={deletingId === p.id}
                          onClick={() => handleDelete(p.id)}
                          className="inline-flex items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 p-1.5 text-rose-600 hover:bg-rose-500/20 dark:text-rose-400"
                          title={copy.deleteTitle}
                        >
                          {deletingId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Add / Edit Form */
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {copy.unitTypeLabel}
                  </label>
                  <select
                    value={unitType}
                    onChange={(e) => setUnitType(e.target.value as CanonicalUnitType)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  >
                    {CANONICAL_UNIT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {copy.unitTypes[t]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {copy.cityLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={copy.cityPlaceholder}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {copy.locationLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={locationText}
                    onChange={(e) => setLocationText(e.target.value)}
                    placeholder={copy.locationPlaceholder}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {copy.listingTitleLabel}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={isLand ? copy.titlePlaceholderLand : copy.titlePlaceholderUnit}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {copy.areaSqmLabel}
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
                      {copy.bedroomsLabel}
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
                      {copy.bathroomsLabel}
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
                      {copy.finishingLabel}
                    </label>
                    <input
                      type="text"
                      value={finishingType}
                      onChange={(e) => setFinishingType(e.target.value)}
                      placeholder={copy.finishingPlaceholder}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {copy.landZoningLabel}
                  </label>
                  <input
                    type="text"
                    value={finishingType}
                    onChange={(e) => setFinishingType(e.target.value)}
                    placeholder={copy.landZoningPlaceholder}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              )}

              {/* Price & Payment Terms */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {copy.totalPriceLabel}
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
                    {copy.currencyLabel}
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  >
                    <option value="EGP">{copy.currencies.EGP}</option>
                    <option value="USD">{copy.currencies.USD}</option>
                    <option value="AED">{copy.currencies.AED}</option>
                    <option value="EUR">{copy.currencies.EUR}</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {copy.paymentMethodLabel}
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as 'cash' | 'installment')}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  >
                    <option value="cash">{copy.cashOnlyOption}</option>
                    <option value="installment">{copy.installmentOption}</option>
                  </select>
                </div>
              </div>

              {paymentMode === 'installment' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                      {copy.downPaymentPctLabel}
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
                      {copy.installmentYearsLabel}
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

              {/* Sale Circumstances */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                  {copy.saleCircumstancesLabel}
                </label>
                <textarea
                  rows={3}
                  required
                  value={saleCircumstances}
                  onChange={(e) => setSaleCircumstances(e.target.value)}
                  placeholder={copy.saleCircumstancesPlaceholder}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>

              {/* Seller Contact & Delivery */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {copy.ownerNameLabel}
                  </label>
                  <input
                    type="text"
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    placeholder={copy.ownerNamePlaceholder}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {copy.phoneLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={sellerPhone}
                    onChange={(e) => setSellerPhone(e.target.value)}
                    placeholder={copy.phonePlaceholder}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                    {copy.handoverLabel}
                  </label>
                  <input
                    type="text"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    placeholder={copy.handoverPlaceholder}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                  {copy.photosLabel}
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-amber-500/60 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-700 hover:bg-amber-500/20 dark:text-amber-300">
                    <ImagePlus className="h-4 w-4" />
                    <span>{copy.uploadPhotosBtn}</span>
                    <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                  </label>
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder={copy.pasteImageUrlPlaceholder}
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
                  {copy.cancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-black text-black shadow-md transition hover:bg-amber-400 disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? copy.saveChangesBtn : copy.publishListingBtn}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
