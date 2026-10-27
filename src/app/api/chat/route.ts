import { NextRequest, NextResponse } from 'next/server';



export async function POST(req: NextRequest) {
  try {
    const { prompt, locale = 'ar' } = await req.json();

    // AI Factory Analyst Logic with Generative UI responses
    const isArabic = locale === 'ar';
    const lowerPrompt = (prompt || '').toLowerCase();

    let reply = '';
    let toolCallData: any = null;

    if (lowerPrompt.includes('scrap') || lowerPrompt.includes('هدر') || lowerPrompt.includes('ورديات')) {
      reply = isArabic
        ? 'تحليل الذكاء الاصطناعي: سجلت الوردية الصباحية نسبة هدر 2.4%، بينما ارتفعت في الوردية المسائية إلى 4.9%. السبب المترابط مع ملاحظات المشرفين هو استلام دفعة بوليمر خام #889 ذات لزوجة متغيرة أثرت على خط البثق EXT-01.'
        : 'AI Analysis: Morning shift recorded 2.4% scrap rate, whereas evening shift spiked to 4.9%. Correlated supervisor notes point to new raw polymer batch #889 causing extrusion stability issues on EXT-01.';
      toolCallData = {
        tool: 'correlateNotesWithProduction',
        data: {
          morning_scrap: 2.4,
          evening_scrap: 4.9,
          correlated_note_id: 'note-01',
          root_cause: 'Polymer batch #889 viscosity fluctuation',
        },
      };
    } else if (lowerPrompt.includes('توقف') || lowerPrompt.includes('downtime') || lowerPrompt.includes('اعطال')) {
      reply = isArabic
        ? 'تحليل أوقات التوقف: ماكينة الحقن INJ-02 سجلت أعلى وقت توقف بإجمالي 82 دقيقة بسبب عطل كهربائي في حساسات الحرارة، متبوعة بماكينة البثق EXT-01 بـ 35 دقيقة استبدال فلتر.'
        : 'Downtime Analysis: Injection Machine INJ-02 had highest downtime (82 min) due to thermocouple failure, followed by Extruder EXT-01 (35 min filter swap).';
      toolCallData = {
        tool: 'getDowntimeSummary',
        data: {
          highest_machine: 'INJ-02',
          total_minutes: 82,
          category: 'electrical',
        },
      };
    } else {
      reply = isArabic
        ? 'مؤشر الكفاءة التشغيلية الشاملة OEE اليوم بلغ 78.4% (التوفر: 89.4%، الأداء: 92.2%، الجودة: 95.1%). المصنع ضمن المعدل العالمي الممتاز.'
        : 'Overall Factory OEE today is 78.4% (Availability: 89.4%, Performance: 92.2%, Quality: 95.1%). Operating at World-Class standard.';
      toolCallData = {
        tool: 'getProductionAndOEE',
        data: {
          oee: 78.4,
          availability: 89.4,
          performance: 92.2,
          quality: 95.1,
        },
      };
    }

    return NextResponse.json({
      success: true,
      reply,
      toolCallData,
      runtime: 'edge',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Edge AI Chat Error', message: error.message },
      { status: 500 }
    );
  }
}
