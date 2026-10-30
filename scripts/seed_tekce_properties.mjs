const token = process.env.SUPABASE_ACCESS_TOKEN || '';
const projectRef = 'csuifvyghfsibkrnxrby';

async function runSql(sql, label = '') {
  console.log(`Running: ${label}...`);
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  const data = await res.json();
  if (!res.ok) {
    console.error(`Error in ${label}:`, res.status, data);
    return false;
  }
  console.log(`Success ${label}:`, data);
  return true;
}

async function main() {
  const seedSql = `
    -- 1. Insert TEKCE Developer
    INSERT INTO public.developers (id, name, slug, logo_url, description, phone, whatsapp, reputation_score, established_year)
    VALUES
      ('88888888-8888-8888-8888-888888888888', 'تيكتشي العقارية الدولية (TEKCE Real Estate)', 'tekce', 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=200&auto=format&fit=crop&q=80', 'شركة عقارية عالمية رائدة تقدم استشارات وفرص استثمارية في دبي وتركيا وإسبانيا وقبرص الشمالية مع برامج الإقامة العقارية والجنسية.', '+902120000000', '+902120000000', 4.9, 2004)
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description;

    -- 2. Insert TEKCE Projects / Destinations
    INSERT INTO public.compounds_projects (id, developer_id, name, slug, country, city, area_name, platform, description, amenities, delivery_year, cover_image)
    VALUES
      ('11110000-0000-0000-0000-000000000001', '88888888-8888-8888-8888-888888888888', 'دبي كريك هاربر ومارينا (Dubai Creek & Marina TEKCE)', 'dubai-tekce', 'الإمارات', 'دبي', 'دبي مارينا / داون تاون', 'TEKCE', 'شقق استثمارية فاخرة بعائد إيجاري دولاري مرتفع، مؤهلة للإقامة الذهبية في الإمارات.', ARRAY['إطلالة بانورامية على برج خليفة ومارينا', 'حمام سباحة إنفينيتي', 'نادي صحي فاخر', 'إقامة ذهبية 10 سنوات'], 2025, 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&auto=format&fit=crop&q=80'),
      ('11110000-0000-0000-0000-000000000002', '88888888-8888-8888-8888-888888888888', 'إسطنبول البوسفور الفاخر (Istanbul Bosphorus Luxury TEKCE)', 'istanbul-tekce', 'تركيا', 'إسطنبول', 'إسطنبول الأوروبية / بيليك دوزو وساريير', 'TEKCE', 'مشاريع سكنية مؤهلة للحصول على الجنسية التركية أو الإقامة العقارية، بإطلالات مباشرة وخطط تقسيط.', ARRAY['مؤهل للجنسية التركية مباشرة', 'أمن 24/7', 'متروبوس وخدمات متكاملة', 'إطلالة بحر مرمرة'], 2024, 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200&auto=format&fit=crop&q=80'),
      ('11110000-0000-0000-0000-000000000003', '88888888-8888-8888-8888-888888888888', 'كوستا ديل سول ومالقة (Costa del Sol Malaga Spain TEKCE)', 'spain-tekce', 'إسبانيا', 'مالقة / ماربيا', 'كوستا ديل سول - إسبانيا', 'TEKCE', 'شقق وفلل فاخرة على ساحل البحر المتوسط في إسبانيا، مؤهلة للحصول على الإقامة الأوروبية الذهبية (Golden Visa).', ARRAY['فيزا شنجن الذهبية', 'إطلالة البحر المتوسط', 'ملاعب جولف عالمية', 'عائد سياحي باليورو'], 2025, 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=1200&auto=format&fit=crop&q=80')
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description;

    -- 3. Insert TEKCE Properties with Affiliate tracking code 6FPC68983C
    INSERT INTO public.properties (
      project_id, title, unit_type, bedrooms, bathrooms, area_sqm, finishing_type,
      total_price, currency, down_payment_pct, down_payment_amount, installment_years,
      monthly_installment, delivery_date, status, images, featured, roi_expected_pct,
      platform, partner_code, affiliate_url
    )
    VALUES
      -- Dubai Property
      (
        '11110000-0000-0000-0000-000000000001',
        'شقة فندقية فاخرة فيو مارينا دبي - مؤهلة للإقامة الذهبية',
        'شقة', 2, 2, 105.00, 'تشطيب كامل فاخر ومفروشة بالكامل',
        1450000.00, 'AED', 20.00, 290000.00, 5,
        19330.00, 'استلام 2025', 'متاح',
        ARRAY['https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=900&auto=format&fit=crop&q=80'],
        true, 9.50,
        'TEKCE', '6FPC68983C', 'https://tekce.com/property/dubai?utm_source=taff&utm_medium=6FPC68983C'
      ),
      -- Istanbul Property (Citizenship Eligible)
      (
        '11110000-0000-0000-0000-000000000002',
        'شقة 3 غرف في إسطنبول مناسبة للجنسية التركية واستلام فوري',
        'شقة', 3, 2, 145.00, 'تشطيب كامل سوبر ديلوكس',
        420000.00, 'USD', 30.00, 126000.00, 3,
        8160.00, 'استلام فوري 2024', 'متاح',
        ARRAY['https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=900&auto=format&fit=crop&q=80'],
        true, 8.20,
        'TEKCE', '6FPC68983C', 'https://tekce.com/property/turkey/istanbul?utm_source=taff&utm_medium=6FPC68983C'
      ),
      -- Spain / Costa del Sol (European Golden Visa)
      (
        '11110000-0000-0000-0000-000000000003',
        'شقة بإطلالة بحرية في مالقة إسبانيا - مؤهلة للإقامة الأوروبية',
        'شقة', 2, 2, 95.00, 'تشطيب أوروبي حديث بتراس واسع',
        520000.00, 'EUR', 20.00, 104000.00, 5,
        6930.00, 'استلام 2025', 'متاح',
        ARRAY['https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=900&auto=format&fit=crop&q=80'],
        true, 7.80,
        'TEKCE', '6FPC68983C', 'https://tekce.com/property/spain/malaga?utm_source=taff&utm_medium=6FPC68983C'
      );
  `;

  await runSql(seedSql, 'Seed TEKCE international destinations & properties');
}

main().catch(console.error);
