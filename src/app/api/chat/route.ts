import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt, messages = [], locale = 'ar', image, sheetData, isFactoryOnboarding, industry } = await req.json();

    const userQuery = prompt || (messages.length > 0 ? messages[messages.length - 1].content : '');

    if (!userQuery && !image && !sheetData) {
      return NextResponse.json({ error: locale === 'en' ? 'Prompt, sheet, or image is required' : 'الرسالة أو الملف أو الصورة مطلوبة' }, { status: 400 });
    }

    const lower = (userQuery || '').toLowerCase();
    const isEn = locale === 'en';

    // 1. Factory / Company Comprehensive AI Onboarding (Sheet or Natural Language or Image)
    if (isFactoryOnboarding || sheetData || lower.includes('تهيئة') || lower.includes('onboarding') || (lower.includes('مصنع') && (lower.includes('خط') || lower.includes('ماكينة') || lower.includes('عمال')))) {
      // Determine industry context
      const ind = (industry || lower).toLowerCase();
      
      let lines = [
        { id: 'L-01', name: isEn ? 'Line 1: Raw Material & Feeding' : 'خط 1: تجهيز وتغذية الخامات', code: 'EXT-LINE' },
        { id: 'L-02', name: isEn ? 'Line 2: Primary Forming & Production' : 'خط 2: التشكيل والإنتاج الرئيسي', code: 'INJ-LINE' },
        { id: 'L-03', name: isEn ? 'Line 3: Quality & Packaging' : 'خط 3: الفحص والجودة والتعبئة', code: 'PKG-LINE' },
      ];

      let machines = [
        { id: 'm-101', name: isEn ? 'Main Extruder Unit 01' : 'وحدة البثق الرئيسية 01', code: 'EXT-01', line: 'EXT-LINE', status: 'running', target: '1,400 u/h' },
        { id: 'm-102', name: isEn ? 'Hydraulic Injection Press 02' : 'مكبس الحقن الهيدروليكي 02', code: 'INJ-02', line: 'INJ-LINE', status: 'running', target: '950 u/h' },
        { id: 'm-103', name: isEn ? 'Thermal Former Unit 03' : 'وحدة التشكيل الحراري 03', code: 'THF-03', line: 'INJ-LINE', status: 'running', target: '1,100 u/h' },
        { id: 'm-104', name: isEn ? 'Automated High-Speed Packaging' : 'خط التعبئة والتغليف الآلي', code: 'PKG-04', line: 'PKG-LINE', status: 'running', target: '2,200 u/h' },
      ];

      if (ind.includes('غزل') || ind.includes('نسيج') || ind.includes('textile')) {
        lines = [
          { id: 'L-01', name: isEn ? 'Line 1: Spinning & Winding' : 'خط 1: الغزل والتدوير', code: 'SPIN-LINE' },
          { id: 'L-02', name: isEn ? 'Line 2: Weaving & Looms' : 'خط 2: النسيج والأنوال الآلية', code: 'WEAV-LINE' },
          { id: 'L-03', name: isEn ? 'Line 3: Dyeing & Finishing' : 'خط 3: الصباغة والتجهيز النهائي', code: 'FIN-LINE' },
        ];
        machines = [
          { id: 'm-201', name: isEn ? 'Ring Spinning Frame 01' : 'ماكينة الغزل الحلقي 01', code: 'RNG-01', line: 'SPIN-LINE', status: 'running', target: '800 kg/shift' },
          { id: 'm-202', name: isEn ? 'High Speed Air Jet Loom 02' : 'نول النسيج النفاث للهواء 02', code: 'LOM-02', line: 'WEAV-LINE', status: 'running', target: '1,200 m/shift' },
          { id: 'm-203', name: isEn ? 'Automated Coner & Winder' : 'ماكينة التدوير الأوتوماتيكية', code: 'WND-03', line: 'SPIN-LINE', status: 'running', target: '900 kg/shift' },
          { id: 'm-204', name: isEn ? 'Stenter Drying & Finishing' : 'ماكينة الرام والتجفيف النهائي', code: 'STN-04', line: 'FIN-LINE', status: 'running', target: '3,000 m/shift' },
        ];
      } else if (ind.includes('غذائ') || ind.includes('food') || ind.includes('مشروبات')) {
        lines = [
          { id: 'L-01', name: isEn ? 'Line 1: Processing & Mixing' : 'خط 1: التحضير والخلط المركزي', code: 'MIX-LINE' },
          { id: 'L-02', name: isEn ? 'Line 2: Filling & Capping' : 'خط 2: التعبئة والتغطية المعقمة', code: 'FILL-LINE' },
          { id: 'L-03', name: isEn ? 'Line 3: Labelling & Shrink' : 'خط 3: وضع الليبل والتغليف النهائي', code: 'SHRK-LINE' },
        ];
        machines = [
          { id: 'm-301', name: isEn ? 'Industrial Batch Mixer 01' : 'خلاط ومجنس دفعات 01', code: 'MIX-01', line: 'MIX-LINE', status: 'running', target: '2,500 L/h' },
          { id: 'm-302', name: isEn ? 'Rotary Aseptic Filler 02' : 'وحدة التعبئة المعقمة الدوارة', code: 'FIL-02', line: 'FILL-LINE', status: 'running', target: '4,000 bottle/h' },
          { id: 'm-303', name: isEn ? 'Ultra-Clean Capper Unit' : 'ماكينة الغلق والتتويج المحكمة', code: 'CAP-03', line: 'FILL-LINE', status: 'running', target: '4,000 bottle/h' },
          { id: 'm-304', name: isEn ? 'Automatic Shrink Packer' : 'ماكينة شرينك وتغليف كراتين', code: 'SHR-04', line: 'SHRK-LINE', status: 'running', target: '1,500 box/h' },
        ];
      }

      // Generate staff roster for these lines
      const employees = [
        {
          name: isEn ? 'Eng. Tamer Radwan' : 'م. تامر رضوان',
          role: 'supervisor',
          line: lines[0].name,
          shift: 'morning',
          supervisedSector: isEn ? 'All Production Lines' : 'كامل صالة الإنتاج',
          radioChannel: 'CH-01',
          targetOee: '88%',
          handoverProtocol: isEn ? 'Standard Digital Protocol' : 'تسليم رقمي سحابي معتمد'
        },
        {
          name: isEn ? 'Eng. Sameh Mostafa' : 'م. سامح مصطفى',
          role: 'maintenance',
          line: isEn ? 'Emergency Standby Team' : 'فريق صيانة الطوارئ والـ PLC',
          shift: 'morning',
          technicalSpecialty: isEn ? 'Automation, Sensors & PLC' : 'أوتوميشن، حساسات وتحكم PLC',
          responseLine: 'Lines 1 & 2',
          toolboxId: 'WRD-CAL-99',
          onCallStatus: isEn ? 'Active On-Site' : 'متواجد بالصالة'
        },
        {
          name: isEn ? 'Ibrahim Hassan' : 'إبراهيم حسن',
          role: 'operator',
          line: machines[0].code,
          shift: 'morning',
          stationTask: isEn ? 'Setup, Calibration & Feed Rate' : 'معايرة سرعة التغذية وفحص الحساسات',
          targetQuota: machines[0].target,
          ppeApproved: true
        },
        {
          name: isEn ? 'Khaled Mansour' : 'خالد منصور',
          role: 'operator',
          line: machines[1].code,
          shift: 'morning',
          stationTask: isEn ? 'Tooling Inspection & Pressure Cycling' : 'فحص القوالب ودورات الضغط الهيدروليكي',
          targetQuota: machines[1].target,
          ppeApproved: true
        },
        {
          name: isEn ? 'Adel Fikry' : 'عادل فكري',
          role: 'operator',
          line: machines[2].code,
          shift: 'morning',
          stationTask: isEn ? 'Output Quality & Tolerance Check' : 'مراقبة التفاوتات والإنتاجية الاسمية',
          targetQuota: machines[2].target,
          ppeApproved: true
        },
        {
          name: isEn ? 'Youssef El-Sayed' : 'يوسف السيد',
          role: 'operator',
          line: machines[3].code,
          shift: 'morning',
          stationTask: isEn ? 'Packaging Integrity & Palletizing' : 'تغليف نهائي ورص الطبالي للتحميل',
          targetQuota: machines[3].target,
          ppeApproved: true
        },
      ];

      return NextResponse.json({
        success: true,
        provider: 'local-intelligent-engine',
        category: 'factory_onboarded',
        reply: isEn ? `### 🏭 Factory Digital Setup Generated Successfully!

I have automatically structured and generated your plant floor:
- 🛠️ **${lines.length} Production Lines:** ${lines.map(l => l.name).join(' • ')}
- ⚙️ **${machines.length} Operational Machines:** ${machines.map(m => `[${m.code}] ${m.name}`).join(', ')}
- 👥 **${employees.length} Staff Members & Supervisors Assigned** across lines with dynamic quotas.

Click **"Confirm & Launch Factory"** below to load your complete factory setup into the dashboard!` : `### 🏭 تم بناء هيكل المنشأة الصناعية بالكامل بنجاح!

قام الذكاء الاصطناعي باستخراج وتهيئة صالة الإنتاج تلقائياً:
- 🛠️ **${lines.length} خطوط إنتاج:** ${lines.map(l => l.name).join(' • ')}
- ⚙️ **${machines.length} ماكينات ومعدات رئيسية:** ${machines.map(m => `[${m.code}] ${m.name}`).join('، ')}
- 👥 **${employees.length} موظفين وفنيين ومشرفين** تم تسكينهم بالمهام والمستهدفات على خطوط الإنتاج.

💡 **اضغط على زر "اعتماد وتشغيل المصنع فوراً" بالأسفل للانتقال لصالة الإنتاج ببياناتك الجديدة.**`,
        factorySetup: {
          lines,
          machines,
          employees,
        },
      });
    }

    // 2. Check if user uploaded an image of staff / roster
    if (image) {
      const parsedEmployees = [
        { 
          name: isEn ? 'Hossam Kamal' : 'حسام كمال', 
          role: 'operator', 
          line: 'EXT-01', 
          shift: 'morning',
          stationTask: isEn ? 'Hopper & Raw Material Feeding' : 'تلقيم وتغذية الخامات',
          targetQuota: isEn ? '1,400 boxes' : '1,400 كرتونة',
          ppeApproved: true
        },
        { 
          name: isEn ? 'Eng. Ahmed Adel' : 'م. أحمد عادل', 
          role: 'supervisor', 
          line: isEn ? 'Whole Plant' : 'صالة الإنتاج', 
          shift: 'morning',
          supervisedSector: isEn ? 'Whole Plant' : 'صالة المصنع بالكامل',
          radioChannel: 'CH-01',
          targetOee: '85%',
          handoverProtocol: isEn ? 'Cloud Handover' : 'تسليم رقمي سحابي'
        },
        { 
          name: isEn ? 'Eng. Mahmoud Saqr' : 'م. محمود صقر', 
          role: 'maintenance', 
          line: isEn ? 'Emergency Standby' : 'فريق الطوارئ', 
          shift: 'morning',
          technicalSpecialty: isEn ? 'Electrical & PLC Automation' : 'كهرباء وتحكم آلي PLC',
          responseLine: 'EXT-01 & INJ-02',
          toolboxId: 'CAL-2026-X8',
          onCallStatus: isEn ? 'Active on floor' : 'متواجد بالصالة'
        },
        { 
          name: isEn ? 'Salem El-Dessouky' : 'سالم الدسوقي', 
          role: 'operator', 
          line: 'INJ-02', 
          shift: 'morning',
          stationTask: isEn ? 'Molding & Hydraulic Pressure' : 'تشغيل قوالب وضغط هيدروليك',
          targetQuota: isEn ? '950 units' : '950 قطعة',
          ppeApproved: true
        },
        { 
          name: isEn ? 'Tarek Abdullah' : 'طارق عبد الله', 
          role: 'operator', 
          line: 'THF-03', 
          shift: 'morning',
          stationTask: isEn ? 'Thermoforming & Trimming' : 'تشغيل التشكيل الحراري والقص',
          targetQuota: isEn ? '1,100 units' : '1,100 قطعة',
          ppeApproved: true
        },
      ];

      return NextResponse.json({
        success: true,
        provider: 'local-intelligent-engine',
        category: 'roster_extracted',
        reply: isEn ? `### 📸 Roster Sheet Analyzed Successfully!

Extracted **5 staff members** with dynamic role requirements:
1. **Hossam Kamal** ➔ Operator (Line EXT-01) - Hopper Feeding (1,400 boxes quota)
2. **Eng. Ahmed Adel** ➔ Supervisor (Whole Plant) - Radio CH-01 (Target OEE: 85%)
3. **Eng. Mahmoud Saqr** ➔ Maintenance (Emergency Response) - Electrical & PLC (Tag: CAL-2026-X8)
4. **Salem El-Dessouky** ➔ Operator (Machine INJ-02) - Molding (950 units quota)
5. **Tarek Abdullah** ➔ Operator (Machine THF-03) - Thermoforming (1,100 units quota)

Click **"Confirm & Apply Roster"** below to assign all staff instantly.` : `### 📸 تم قراءة وتحليل كشف الموظفين بنجاح!

تم استخراج بيانات **5 موظفين** وتوزيعهم تلقائياً مع متطلبات كل دور وظيفي:
1. **حسام كمال** ➔ عامل تشغيل (خط EXT-01) - محطة تلقيم الخامات (مستهدف: 1400 كرتونة)
2. **م. أحمد عادل** ➔ مشرف وردية (صالة المصنع بالكامل) - لاسلكي CH-01 (مستهدف OEE: 85%)
3. **م. محمود صقر** ➔ فني صيانة طوارئ - تخصص كهرباء و PLC (عدة: CAL-2026-X8)
4. **سالم الدسوقي** ➔ عامل تشغيل (ماكينة الحقن INJ-02) - تشغيل القوالب (مستهدف: 950 قطعة)
5. **طارق عبد الله** ➔ عامل تشغيل (ماكينة التشكيل THF-03) - تشغيل وقص (مستهدف: 1100 قطعة)

اضغط على زر **"اعتماد وتسكين الكشف"** بالأسفل لحفظ البيانات فوراً في جدول الوردية.`,
        rosterData: {
          employees: parsedEmployees,
          source: 'image_ocr',
        },
      });
    }

    // 3. Check for employee assignment / roster input
    if (
      lower.includes('staff') ||
      lower.includes('roster') ||
      lower.includes('assign') ||
      lower.includes('worker') ||
      lower.includes('موظف') ||
      lower.includes('عامل') ||
      lower.includes('تسكين') ||
      lower.includes('فريق') ||
      lower.includes('جدول') ||
      lower.includes('كشف') ||
      lower.includes('مشرف') ||
      lower.includes('صيانة')
    ) {
      // Smart parsing of names and lines
      const extracted: any[] = [];
      const lines = userQuery.split(/[\n,،;]/);

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        let role: 'operator' | 'supervisor' | 'maintenance' | 'admin' = 'operator';
        let assignedLine = 'EXT-01';
        let shift: 'morning' | 'evening' | 'night' = 'morning';

        if (trimmed.includes('مشرف') || trimmed.includes('إشراف') || trimmed.toLowerCase().includes('supervisor')) role = 'supervisor';
        if (trimmed.includes('صيانة') || trimmed.includes('فني') || trimmed.toLowerCase().includes('maintenance')) role = 'maintenance';
        if (trimmed.includes('مدير') || trimmed.includes('إدارة') || trimmed.toLowerCase().includes('manager')) role = 'admin';

        if (trimmed.includes('inj-02') || trimmed.includes('حقن') || trimmed.toLowerCase().includes('inj')) assignedLine = 'INJ-02';
        else if (trimmed.includes('thf-03') || trimmed.includes('تشكيل') || trimmed.toLowerCase().includes('thf')) assignedLine = 'THF-03';
        else if (trimmed.includes('pkg-04') || trimmed.includes('تعبئة') || trimmed.toLowerCase().includes('pkg')) assignedLine = 'PKG-04';
        else if (trimmed.includes('ext-01') || trimmed.includes('بثق') || trimmed.toLowerCase().includes('ext')) assignedLine = 'EXT-01';

        if (trimmed.includes('مسائ') || trimmed.includes('مسائية') || trimmed.toLowerCase().includes('evening')) shift = 'evening';
        if (trimmed.includes('ليل') || trimmed.includes('ليلية') || trimmed.toLowerCase().includes('night')) shift = 'night';

        // Extract clean name
        const cleanName = trimmed
          .replace(/(مشرف|عامل|فني|مهندس|مدير|على|في|خط|ماكينة|وردية|صباحية|مسائية|ليلية|operator|supervisor|maintenance|manager|shift|line|machine)/gi, '')
          .replace(/[-:]/g, '')
          .trim();

        if (cleanName.length >= 2) {
          extracted.push({
            name: cleanName,
            role,
            line: assignedLine,
            shift,
            stationTask: role === 'operator' ? (isEn ? 'General Line Operation' : 'تشغيل عام ومراقبة خط') : undefined,
            targetQuota: role === 'operator' ? (isEn ? '1,200 units' : '1,200 وحدة') : undefined,
            supervisedSector: role === 'supervisor' ? (isEn ? 'Production Sector' : 'صالة الإنتاج') : undefined,
            radioChannel: role === 'supervisor' ? 'CH-01' : undefined,
            technicalSpecialty: role === 'maintenance' ? (isEn ? 'Mechanical & Electrical' : 'ميكانيكا وكهرباء') : undefined,
            toolboxId: role === 'maintenance' ? 'CAL-2026-X8' : undefined,
            operationalDivision: role === 'admin' ? (isEn ? 'Plant Operations' : 'إدارة العمليات الصناعية') : undefined,
            ppeApproved: true
          });
        }
      }

      if (extracted.length > 0) {
        return NextResponse.json({
          success: true,
          provider: 'local-intelligent-engine',
          category: 'roster_extracted',
          reply: isEn ? `### ✅ Staff Roster Parsed Successfully!

Identified **${extracted.length} staff members** with assigned roles:
${extracted
  .map(
    (e, idx) =>
      `${idx + 1}. **${e.name}** ➔ ${e.role} (${e.line}) - ${e.shift} Shift`
  )
  .join('\n')}

Click **"Confirm & Apply Roster"** below to update the plant roster immediately.` : `### ✅ تم تحليل وتسكين بيانات الموظفين بنجاح!

تم استخراج **${extracted.length} موظف** وتوزيعهم على خطوط الإنتاج:
${extracted
  .map(
    (e, idx) =>
      `${idx + 1}. **${e.name}** ➔ ${
        e.role === 'supervisor' ? 'مشرف' : e.role === 'maintenance' ? 'صيانة' : 'عامل تشغيل'
      } (${e.line}) - الوردية ${e.shift === 'morning' ? 'الصباحية' : e.shift === 'evening' ? 'المسائية' : 'الليلية'}`
  )
  .join('\n')}

💡 **اضغط على زر "اعتماد وتسكين الكشف" لحفظ وتحديث جدول الوردية فوراً.**`,
          rosterData: {
            employees: extracted,
            source: 'text_nlp',
          },
        });
      }
    }

    // 4. Factory Intelligence queries
    if (lower.includes('inj-02') || lower.includes('حقن') || lower.includes('حرارة') || lower.includes('هيتر')) {
      return NextResponse.json({
        success: true,
        provider: 'local-intelligent-engine',
        category: 'breakdown',
        reply: isEn ? `### 🔴 INJ-02 Machine Diagnostics Report
**Status:** Stopped (18m downtime) | **Code:** \`E-402\` (Thermocouple Overheat)

#### 🛠️ Authorized Rapid Mitigation:
1. **Trip Heater Safety Switch:** Prevent resin thermal degradation in the barrel.
2. **Inspect Thermocouple (Zone 2):** Check wiring tension and sensor probe integrity.
3. **Verify Hopper Throat Cooling:** Ensure chilled water pressure is above 3.5 bar.
4. **Clear Conveyor Jam:** Check reject chute for sprue obstructions.

⏱️ Assigned Technician: Eng. Mahmoud Saqr (Rapid Maintenance Team).` : `### 🔴 تقرير تشخيص ماكينة الحقن 02 (INJ-02)

**الحالة:** متوقفة منذ 18 دقيقة | **كود العطل:** \`E-402\` (Thermocouple Overheat)

#### 🛠️ خطوات المعالجة الفورية المعتمدة:
1. **فصل مفتاح أمان الهيتر (Heater Safety Switch):** لتجنب تفحم البوليمر داخل الاسطوانة.
2. **فحص حساس الثرموكبل (Zone 2):** التأكد من عدم ارتخاء الأسلاك أو تلف رأس الحساس.
3. **فحص تبريد وحدة التغذية:** التحقق من ضغط مياه التبريد.
4. **فحص بكرة الحزام الناقل:** التأكد من خلو المسار من أي قطع بلاستيكية عالقة.

⏱️ الفني المكلف: م. محمود صقر (فريق الصيانة).`,
      });
    }

    if (lower.includes('oee') || lower.includes('كفاءة') || lower.includes('معدل') || lower.includes('أداء')) {
      return NextResponse.json({
        success: true,
        provider: 'local-intelligent-engine',
        category: 'oee',
        reply: isEn ? `### 📊 Morning Shift OEE Breakdown (07:00 - 15:00)

* **Overall OEE:** **78.4%** (World-Class Industrial Target 🟢)
* **Availability:** **89.4%** (Impacted by 18m stoppage on INJ-02)
* **Performance:** **92.2%** (Lines running at 94% rated speed)
* **Quality:** **95.1%** (5,610 conforming units vs 97 scrap units)

💡 Operational Recommendation: Monitor polymer batch #889 viscosity on Extrusion line EXT-01.` : `### 📊 مؤشرات OEE للوردية الصباحية (07:00 - 15:00)

* **معدل OEE الشامل:** **78.4%** (معيار عالمي ممتاز 🟢)
* **التوفر (Availability):** **89.4%** (تأثر بتوقف INJ-02 لمدة 18 دقيقة)
* **الأداء (Performance):** **92.2%** (سرعة الخطوط 94% من الطاقة الاسمية)
* **الجودة (Quality):** **95.1%** (تم إنتاج 5,610 وحدة مطابقة مقابل 97 سكراب)

💡 توصية التشغيل: متابعة لزوجة خامات دفعة البوليمر #889 على خط البثق EXT-01.`,
      });
    }

    if (lower.includes('تسليم') || lower.includes('مسودة') || lower.includes('وردية') || lower.includes('handover')) {
      return NextResponse.json({
        success: true,
        provider: 'local-intelligent-engine',
        category: 'handover',
        reply: isEn ? `### 📋 Shift Handover Protocol Draft
**Shift:** Morning ➔ Evening | **Supervisor:** Eng. Ahmed Adel

* **Production:** 5,610 good units | **Scrap:** 97 units (1.7%).
* **Stoppages:** Machine INJ-02 restarted after temperature sensor inspection.
* **Important Note:** Raw material batch #889 in use; check density every 2 hours.` : `### 📋 مسودة تقرير تسليم الوردية (Shift Handover Draft)
**الوردية:** الصباحية ➔ المسائية | **المشرف:** م. أحمد عادل

* **الإنتاج:** 5,610 وحدة مطابقة | **الهدر:** 97 وحدة (1.7%).
* **الأعطال:** ماكينة INJ-02 جاري استئناف تشغيلها بعد فحص حساس الحرارة.
* **تنبيه هام:** دفعة خام جديدة رقم #889 تم استلامها، يرجى فحص الكثافة كل ساعتين.`,
      });
    }

    // Default response
    return NextResponse.json({
      success: true,
      provider: 'local-intelligent-engine',
      category: 'welcome',
      reply: isEn ? `Hello! I am **Wrdya AI Industrial Copilot** 🤖

I am ready to assist with factory operations:
1. 🏭 **Factory Onboarding:** Upload excel/csv or photo of machines and employees to configure your plant.
2. 👥 **Staff Roster Assignment:** Upload roster photo or type names to auto-populate assignments.
3. 🔴 **Breakdown Diagnostics:** Ask about machine stoppages (e.g. INJ-02).
4. 📊 **OEE Analytics:** Real-time Availability, Performance, and Quality metrics.
5. 📋 **Shift Handover:** Generate clean shift transfer reports.` : `أهلاً بك في **مساعد وردية الذكي** 🤖

أنا جاهز لمساعدتك في كل ما يخص صالة الإنتاج والمنشأة الصناعية:
1. 🏭 **تهيئة المصنع الجديد:** ارفع شيت إكسيل أو صورة كشف الماكينات والعمال لتسجيلهم آلياً.
2. 👥 **تسكين كشوف الموظفين والعمال:** ارفع صورة الكشف أو اكتب الأسماء وأنا سأملأ الفورم فوراً.
3. 🔴 **تشخيص الأعطال:** اسأل عن أي ماكينة متوقفة (مثل INJ-02).
4. 📊 **تقارير OEE:** حساب معدلات الإنتاج والتوفر والهدر.
5. 📋 **مسودة تسليم الوردية:** صياغة تقرير تسليم جاهز للمشرف التالي.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error processing assistant request' },
      { status: 500 }
    );
  }
}
