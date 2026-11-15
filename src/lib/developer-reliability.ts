export interface DeveloperReliabilityRecord {
  id: string;
  nameAr: string;
  nameEn: string;
  egxTicker?: string;
  solvencyTier: 'AAA' | 'AA+' | 'AA' | 'A+';
  deliveryScore: number;
  handoverTrackRecordAr: string;
  keyStrengthAr: string;
  noteAr: string;
}

export const DEVELOPER_RELIABILITY_INDEX: DeveloperReliabilityRecord[] = [
  {
    id: 'tmg',
    nameAr: 'مجموعة طلعت مصطفى القابضة',
    nameEn: 'Talaat Moustafa Group (TMG)',
    egxTicker: 'EGX: TMGH',
    solvencyTier: 'AAA',
    deliveryScore: 95,
    handoverTrackRecordAr: 'التزام تاريخي بالتسليم والإدارة المستدامة (مدينتي، الرحاب، نور، ساوث ميد)',
    keyStrengthAr: 'أكبر محفظة أراضي وإيرادات متكررة وملاءة مالية قوية ومفصح عنها بالبورصة',
    noteAr: 'إعادة البيع سريعة والطلب الإيجاري مرتفع جداً',
  },
  {
    id: 'emaar',
    nameAr: 'إعمار مصر للتنمية',
    nameEn: 'Emaar Misr',
    egxTicker: 'EGX: EMFD',
    solvencyTier: 'AAA',
    deliveryScore: 93,
    handoverTrackRecordAr: 'جودة تشطيب وتسليم مرتفعة (ميفيدا، مراسي، أب تاون كايرو، بيل في)',
    keyStrengthAr: 'سيولة نقدية ضخمة وتصنيف جودة تشغيلية أعلى من متوسط السوق',
    noteAr: 'سعر المتر أعلى من المتوسط لكنه يحفظ القيمة عند إعادة البيع',
  },
  {
    id: 'sodic',
    nameAr: 'سوديك (SODIC)',
    nameEn: 'Six of October Development & Investment',
    egxTicker: 'EGX: OCDI',
    solvencyTier: 'AA+',
    deliveryScore: 91,
    handoverTrackRecordAr: 'سجل تسليمات منضبط في شرق وغرب القاهرة والساحل (سوديك ويست، فيليت، جون)',
    keyStrengthAr: 'إدارة مجتمعات محترفة والتزام بالمواصفات المعمارية المعلنة',
    noteAr: 'مناسبة للسكن العائلي طويل الأمد',
  },
  {
    id: 'palmhills',
    nameAr: 'بالم هيلز للتعمير',
    nameEn: 'Palm Hills Developments',
    egxTicker: 'EGX: PHDC',
    solvencyTier: 'AA+',
    deliveryScore: 89,
    handoverTrackRecordAr: 'انتشار واسع وتسليمات مستمرة (بادية، بالم هيلز التجمع وأكتوبر، هاسيندا)',
    keyStrengthAr: 'نمو مبيعات تعاقدية قوية وتنوع شرائح بين السكني الفاخر والساحلي',
    noteAr: 'راجع جدول الاستلام حسب المرحلة داخل كل مشروع',
  },
  {
    id: 'orascom',
    nameAr: 'أوراسكوم للتنمية مصر (O West)',
    nameEn: 'Orascom Development Egypt',
    egxTicker: 'EGX: ORHD',
    solvencyTier: 'AA+',
    deliveryScore: 90,
    handoverTrackRecordAr: 'خبرة مدن متكاملة (الجونة، O West أكتوبر، مكادي هايتس)',
    keyStrengthAr: 'تنوع جغرافي وسياحي وتدفقات نقدية متعددة العملات',
    noteAr: 'نموذج الجونة يرفع ثقة المستثمرين في الإدارة',
  },
  {
    id: 'madinetmasr',
    nameAr: 'مدينة مصر للإسكان والتعمير',
    nameEn: 'Madinet Masr',
    egxTicker: 'EGX: MASR',
    solvencyTier: 'AA',
    deliveryScore: 86,
    handoverTrackRecordAr: 'تسليمات متتالية في شرق القاهرة (تاج سيتي، سراي)',
    keyStrengthAr: 'أسعار دخول تنافسية مقارنة بالمنافسين في نفس المحور وأراضٍ مملوكة بالكامل',
    noteAr: 'خيار شائع للباحثين عن مقدم منخفض وتقسيط طويل',
  },
  {
    id: 'mountainview',
    nameAr: 'ماونتن فيو (DMG)',
    nameEn: 'Mountain View',
    solvencyTier: 'AA',
    deliveryScore: 87,
    handoverTrackRecordAr: 'إقبال عالٍ جداً وكمبوندات عامرة بالسكان (آي سيتي التجمع وأكتوبر، لفلز، راس الحكمة)',
    keyStrengthAr: 'تصميمات مفضلة للعائلات ونشاط قوي في سوق إعادة البيع',
    noteAr: 'تحقق دائماً من تاريخ استلام المرحلة المحددة قبل التعاقد',
  },
  {
    id: 'hydepark',
    nameAr: 'هايد بارك للتطوير العقاري',
    nameEn: 'Hyde Park Developments',
    solvencyTier: 'AA',
    deliveryScore: 85,
    handoverTrackRecordAr: 'تسليمات واسعة في القاهرة الجديدة وغرب القاهرة (هايد بارك، جاردن ليكس، سي شور)',
    keyStrengthAr: 'هيكل مساهمين مؤسسي قوي ومساحات خضراء واسعة',
    noteAr: 'تفاوت أسعار كبير بين المراحل المسلمة والجديدة',
  },
];
