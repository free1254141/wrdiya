-- Seed Data for Real Estate Broker AI (عقار AI)

-- 1. Insert Top Developers
INSERT INTO public.developers (id, name, slug, logo_url, description, phone, whatsapp, reputation_score, established_year)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'مجموعة طلعت مصطفى (TMG)', 'tmg', 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=200&auto=format&fit=crop&q=80', 'أكبر مطور عقاري في مصر والشرق الأوسط، مطور مدينتي والرحاب ونور ونورث كوست.', '+201000000001', '+201000000001', 4.9, 1970),
  ('22222222-2222-2222-2222-222222222222', 'إعمار مصر (Emaar Misr)', 'emaar', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&auto=format&fit=crop&q=80', 'رائدة التطوير الفاخر ومطورة مشاريع مراسي، وميفيدا بالتجمع الخامس، وأب تاون كايرو بالمقطم.', '+201000000002', '+201000000002', 4.9, 1997),
  ('33333333-3333-3333-3333-333333333333', 'سوديك (SODIC)', 'sodic', 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=200&auto=format&fit=crop&q=80', 'إحدى كبرى شركات التطوير العقاري في غرب وشرق القاهرة والساحل الشمالي.', '+201000000003', '+201000000003', 4.8, 1996),
  ('44444444-4444-4444-4444-444444444444', 'بالم هيلز (Palm Hills)', 'palm-hills', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&auto=format&fit=crop&q=80', 'مطورة بادية بالم هيلز وبالم هيلز أكتوبر وبالتجمع الخامس، بأرقى معايير الاستدامة.', '+201000000004', '+201000000004', 4.8, 2005),
  ('55555555-5555-5555-5555-555555555555', 'ماونتن فيو (Mountain View)', 'mountain-view', 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=200&auto=format&fit=crop&q=80', 'متخصصة في بناء مجتمعات السعادة والابتكار المعماري كآي سيتي التجمع وأكتوبر وبلاجات الساحل.', '+201000000005', '+201000000005', 4.9, 2005),
  ('66666666-6666-6666-6666-666666666666', 'أورا ديفلوبرز (Ora Developers)', 'ora', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200&auto=format&fit=crop&q=80', 'شركة نجيب ساويرس ومطورة أبراج زد الشيخ زايد وزد إيست التجمع وسيلفر ساندز.', '+201000000006', '+201000000006', 4.7, 2018),
  ('77777777-7777-7777-7777-777777777777', 'مصر إيطاليا (Misr Italia)', 'misr-italia', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=200&auto=format&fit=crop&q=80', 'من أوائل وأبرز المطورين في العاصمة الإدارية بمشروع البوسكو وفينشي.', '+201000000007', '+201000000007', 4.6, 1998)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  reputation_score = EXCLUDED.reputation_score;

-- 2. Insert Iconic Compounds / Projects
INSERT INTO public.compounds_projects (id, developer_id, name, slug, city, area_name, description, amenities, delivery_year, cover_image)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 'ماونتن فيو آي سيتي (Mountain View iCity)', 'mv-icity-new-cairo', 'القاهرة', 'التجمع الخامس / القاهرة الجديدة', 'أحدث وأكبر مشاريع التجمع الخامس بتصميم 4D ليفيلز ومساحات خضراء وجزر مائية متصلة وبحيرات كريستالية.', ARRAY['سنترال بارك', 'سمارت سيتي', 'نادي رياضي كلوب هاوس', 'مدارس دولية', 'أمن وحراسة 24/7', 'تراك جري ودراجات'], 2026, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', 'بادية بالم هيلز (Badya Palm Hills)', 'badya-palm-hills', 'الجيزة', 'الشيخ زايد / 6 أكتوبر', 'أول مدينة إبداعية ذكية ومستدامة على مساحة 3000 فدان، على وصلة دهشور مباشرة.', ARRAY['جامعة دولية', '6 نوادي رياضية', 'منظومة طاقة شمسية', 'مول تجاري عالمي', 'مستشفى ومراكز طبية'], 2025, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'ميفيدا إعمار (Mivida Emaar)', 'mivida-new-cairo', 'القاهرة', 'التجمع الخامس / القاهرة الجديدة', 'مجتمع فاخر مستوحى من المعمار الكاليفورني بقلب شارع التسعين الجنوبي في التجمع الخامس.', ARRAY['مجمع أعمال متكامل', 'ميديكال سنتر', 'مدارس دولية', 'نادي رياضي', 'مطاعم وكافيهات راقية'], 2024, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop&q=80'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '77777777-7777-7777-7777-777777777777', 'البوسكو (IL Bosco New Capital)', 'il-bosco-new-capital', 'العاصمة الإدارية', 'العاصمة الإدارية الجديدة', 'مشروع بيئي فاخر في قلب الحي السكني R7 على النهر الأخضر مباشرة ومحور محمد بن زايد.', ARRAY['النهر الأخضر', 'غابات شجرية رأسية', 'نادي رياضي بمساحة 4 فدان', 'منطقة تسوق كبرى', 'كاميرات مراقبة ذكية'], 2025, 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '33333333-3333-3333-3333-333333333333', 'فيليت سوديك (Villette SODIC)', 'villette-sodic', 'القاهرة', 'التجمع الخامس / القاهرة الجديدة', 'أيقونة سوديك بالتجمع، يتضمن 4 حدائق مركزية بمفاهيم وتصاميم عالمية مميزة.', ARRAY['ذا بوكيت بارك', 'ملاعب تنس وبادل', 'كلوب هاوس على طراز منتجع', 'سبا ونادي صحي'], 2024, 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&auto=format&fit=crop&q=80'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '66666666-6666-6666-6666-666666666666', 'زد إيست (Zed East New Cairo)', 'zed-east', 'القاهرة', 'التجمع الخامس / القاهرة الجديدة', 'مشروع متكامل يضم حديقة كبرى ونادياً رياضياً عملاقاً بموقع استراتيجي على الدائري الأوسطي.', ARRAY['نادي زد الرياضي 45 فدان', 'مول تجاري ومكاتب عمل', 'حمامات سباحة وبحيرات', 'أمن وبوابات إلكترونية'], 2026, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80'),
  ('00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'مدينتي (Madinaty TMG)', 'madinaty', 'القاهرة', 'القاهرة الجديدة / شرق القاهرة', 'المدينة العالمية المتكاملة الأشهر في مصر، تسليم فوري وبنية تحتية كاملة المرافق والخدمات.', ARRAY['أوبن إير مول', 'ملاعب جولف عالمية', 'مترو وسيارات نقل داخلية', 'كرافت زون وسوق تجاري', 'مستشفى ومدارس'], 2024, 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&auto=format&fit=crop&q=80'),
  ('00000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'سودIC ويست تاون (Westown Sheikh Zayed)', 'westown-sodic', 'الجيزة', 'الشيخ زايد / 6 أكتوبر', 'من أرقى مجتمعات الشيخ زايد، متصل بطريق دهشور وهايبر وان، تشطيب كامل ومساحات مدروسة.', ARRAY['وست تاون هاب تجاري', 'مدارس بي اس اي', 'نادي لياقة بدنية', 'مساحات خضراء واسعة'], 2024, 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&auto=format&fit=crop&q=80')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  amenities = EXCLUDED.amenities;

-- 3. Insert Verified Real Estate Properties (Residential Apartments, Duplexes & Penthouses)
INSERT INTO public.properties (
  project_id, title, unit_type, bedrooms, bathrooms, area_sqm, finishing_type,
  total_price, down_payment_pct, down_payment_amount, installment_years,
  monthly_installment, quarterly_installment, maintenance_fee, delivery_date,
  status, images, featured, roi_expected_pct
)
VALUES
  -- Mountain View iCity Properties
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'شقة 3 غرف فيو سنترال بارك - ماونتن فيو آي سيتي',
    'شقة', 3, 2, 165.00, 'نصف تشطيب',
    5200000.00, 10.00, 520000.00, 8,
    48750.00, 146250.00, 416000.00, 'استلام 2026',
    'متاح', ARRAY['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=900&auto=format&fit=crop&q=80'],
    true, 16.50
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'استوديو فاخر بغرفة واحدة مع جاردن - آي سيتي التجمع',
    'استوديو', 1, 1, 75.00, 'تشطيب كامل سوبر لوكس',
    3150000.00, 10.00, 315000.00, 7,
    33750.00, 101250.00, 252000.00, 'استلام 2026',
    'متاح', ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&auto=format&fit=crop&q=80'],
    false, 18.00
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'آي فيلا رووف (iVilla Roof) مع تراس بانورامي مفتوح',
    'دوبلكس', 4, 3, 240.00, 'نصف تشطيب',
    7900000.00, 10.00, 790000.00, 8,
    74060.00, 222180.00, 632000.00, 'استلام 2026',
    'متاح', ARRAY['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&auto=format&fit=crop&q=80'],
    true, 15.20
  ),

  -- Badya Palm Hills Properties (Sheikh Zayed / October)
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'شقة فندقية غرفتين كاملة التشطيب - بادية بالم هيلز أكتوبر',
    'شقة', 2, 2, 115.00, 'تشطيب كامل سوبر لوكس بالتكييفات',
    4400000.00, 10.00, 440000.00, 8,
    41250.00, 123750.00, 352000.00, 'استلام 2025',
    'متاح', ARRAY['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&auto=format&fit=crop&q=80'],
    true, 15.00
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'تاون هاوس كورنر حديقة خاصة 180م - بادية بالم هيلز',
    'تاون هاوس', 4, 4, 215.00, 'نصف تشطيب',
    8950000.00, 10.00, 895000.00, 9,
    74580.00, 223750.00, 716000.00, 'استلام 2026',
    'متاح', ARRAY['https://images.unsplash.com/photo-1613977257363-707ba9348227?w=900&auto=format&fit=crop&q=80'],
    false, 14.00
  ),

  -- Mivida Emaar Properties (New Cairo)
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'شقة 3 غرف استلام فوري فيو بحيرة - ميفيدا إعمار التجمع',
    'شقة', 3, 3, 190.00, 'تشطيب كامل ألترا لوكس',
    9800000.00, 20.00, 1960000.00, 5,
    130660.00, 392000.00, 784000.00, 'استلام فوري 2024',
    'متاح', ARRAY['https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=900&auto=format&fit=crop&q=80'],
    true, 17.50
  ),

  -- IL Bosco New Capital Properties
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'شقة 2 نوم على النهر الأخضر مباشرة - البوسكو العاصمة',
    'شقة', 2, 2, 126.00, 'تشطيب كامل',
    3800000.00, 5.00, 190000.00, 9,
    33420.00, 100270.00, 304000.00, 'استلام 2025',
    'متاح', ARRAY['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=900&auto=format&fit=crop&q=80'],
    true, 19.00
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'بنتهاوس مع جاكوزي خاص ورووف - البوسكو العاصمة الإدارية',
    'بنتهاوس', 3, 3, 210.00, 'تشطيب كامل سوبر لوكس',
    6200000.00, 10.00, 620000.00, 8,
    58120.00, 174370.00, 496000.00, 'استلام 2025',
    'متاح', ARRAY['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&auto=format&fit=crop&q=80'],
    false, 16.80
  ),

  -- Villette SODIC (New Cairo)
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'دوبلكس جاردن خاص 120م - فيليت سوديك التجمع الخامس',
    'دوبلكس', 3, 3, 230.00, 'نصف تشطيب',
    8500000.00, 15.00, 1275000.00, 6,
    100340.00, 301040.00, 680000.00, 'استلام 2024',
    'متاح', ARRAY['https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=900&auto=format&fit=crop&q=80'],
    true, 14.50
  ),

  -- Zed East (Ora Developers - New Cairo)
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    'شقة مميزة 3 غرف فيو نادي زد الرياضي - زد إيست نجيب ساويرس',
    'شقة', 3, 3, 175.00, 'تشطيب كامل مع المطبخ والتكييفات',
    6900000.00, 10.00, 690000.00, 8,
    64680.00, 194060.00, 552000.00, 'استلام 2026',
    'متاح', ARRAY['https://images.unsplash.com/photo-1600573472591-ee6c563aaec9?w=900&auto=format&fit=crop&q=80'],
    true, 16.00
  ),

  -- Madinaty (TMG - Ready to move)
  (
    '00000000-0000-0000-0000-000000000001',
    'شقة B12 فيو بحيرات وجولف استلام فوري - مدينتي طلعت مصطفى',
    'شقة', 3, 2, 140.00, 'تشطيب شركة سوبر لوكس',
    4900000.00, 20.00, 980000.00, 7,
    46660.00, 140000.00, 392000.00, 'استلام فوري 2024',
    'متاح', ARRAY['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900&auto=format&fit=crop&q=80'],
    true, 17.00
  ),

  -- Westown Sheikh Zayed (SODIC - Sheikh Zayed)
  (
    '00000000-0000-0000-0000-000000000002',
    'شقة أرضي بحديقة 90م استلام فوري - سوديك وست تاون الشيخ زايد',
    'شقة', 3, 2, 155.00, 'تشطيب كامل ألترا مودرن',
    5800000.00, 15.00, 870000.00, 6,
    68470.00, 205410.00, 464000.00, 'استلام فوري 2024',
    'متاح', ARRAY['https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=900&auto=format&fit=crop&q=80'],
    true, 15.80
  );
