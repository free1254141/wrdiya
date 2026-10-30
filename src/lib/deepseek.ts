/**
 * DeepSeek AI Integration for Skanybot
 * Endpoint: https://api.deepseek.com/chat/completions
 * Model: deepseek-chat
 * 
 * System Prompt: Grounded, Concise Real Estate Advisor persona for Egypt & International.
 */

import { Property } from './types';

export interface DeepSeekChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function isDeepSeekConfigured(): boolean {
  const key = process.env.DEEPSEEK_API_KEY;
  return Boolean(key && key.trim().length > 5 && !key.includes('placeholder'));
}

/**
 * Generate a concise, conversational broker response using DeepSeek Chat
 */
export async function generateDeepSeekBrokerReply(
  userPrompt: string,
  matchedProperties: Property[],
  locale: string = 'ar',
  conversationHistory: DeepSeekChatMessage[] = []
): Promise<string | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!isDeepSeekConfigured() || !apiKey) {
    return null; // Signals fallback to deterministic engine
  }

  // Limit to top 4 units to keep context focused and avoid prompt bloat
  const topUnits = matchedProperties.slice(0, 4);

  // Format retrieved properties as verifiable grounding context
  const propertyContext = topUnits.map((p, idx) => {
    return `[الوحدة ${idx + 1}]:
- الاسم: ${p.title}
- النوع: ${p.unit_type}
- المشروع/الكمبوند: ${p.compound?.name || 'كمبوند معتمد'}
- السعر الإجمالي: ${p.total_price.toLocaleString()} ${p.currency}
- المقدم: ${p.down_payment_pct}% (${(p.down_payment_amount || p.total_price * 0.1).toLocaleString()} ${p.currency})
- مدة التقسيط: ${p.installment_years || 7} سنوات
- القسط الشهري: ${(p.monthly_installment || Math.round(p.total_price * 0.9 / ((p.installment_years || 7) * 12))).toLocaleString()} ${p.currency}
- المساحة: ${p.area_sqm || 'غير محدد'} م²
- الغرف: ${p.bedrooms || 'غير محدد'} | الاستلام: ${p.delivery_date || 'استلام فوري / 2026'}`;
  }).join('\n\n');

  const isAr = locale === 'ar';

  const systemPrompt = `أنت "Skanybot" - مستشار عقاري ذكي وسريع ومباشر في مصر ودولياً (دبي، إسبانيا، تركيا).
شعارك: "اعرف أسعار وأقساط أي كمبوند في مصر أو دبي في ثواني ومن غير مكالمات سيلز مزعجة."

القواعد الأساسية للرد:
1. الإيجاز والذكاء: ردك يجب أن يكون قصيراً ومركزاً ومريحاً للقراءة (فقرتين إلى 3 فقرات قصيرة فقط، بحد أقصى 100-130 كلمة).
2. عدم تكرار القوائم الطويلة: لا تسرد كل الوحدات وتفاصيلها في النص كقائمة طويلة، لأن واجهة التطبيق تعرض بالفعل كروت العقارات التفاعلية الكاملة بالصور والأسعار وزر المعاينة تحت ردك مباشرة.
3. هيكل الإجابة المثالي:
   - تأكيد العثور على الوحدات المطلوبة في المنطقة/المشروع.
   - ملخص سريع للأسعار ونظام السداد (مثال: تبدأ الأسعار من كذا، بمقدم يبدأ من كذا، وقسط شهري من كذا حتى كذا سنوات).
   - توجيه العميل بلطف للاطلاع على كروت الوحدات بالأسفل لحجز معاينة مجانية أو فتح التفاصيل.
   - سؤال استيضاحي واحد ذكي (مثل: هل تفضل استلام فوري أم تقسيط أطول؟ أو ما هي الميزانية المناسبة لك؟).
4. لغة الرد: أجب بلغة المستخدم (${isAr ? 'العربية' : locale}) بأسلوب ودود ومهني وبدون إلحاح بيعي.

البيانات المعتمدة المتاحة حالياً للاستعلام:
${propertyContext || 'لا توجد وحدات مطابقة تماماً حالياً. قدم نصيحة عقارية ورشح للعميل استكشاف أقرب البدائل.'}
`;

  const messages: DeepSeekChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-3), // keep last 3 context turns
    { role: 'user', content: userPrompt },
  ];

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: 0.3,
        max_tokens: 350,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('DeepSeek API error status:', response.status, errText);
      return null; // triggers fallback
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;
    return reply || null;
  } catch (err) {
    console.error('DeepSeek invocation exception:', err);
    return null; // graceful fallback
  }
}
