/**
 * DeepSeek AI Integration for Skanybot
 * Endpoint: https://api.deepseek.com/chat/completions
 * Model: deepseek-chat
 * 
 * System Prompt: Grounded Real Estate Advisor persona for Egypt & International.
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
 * Generate a conversational broker response using DeepSeek Chat
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

  // Format retrieved properties as verifiable grounding context
  const propertyContext = matchedProperties.map((p, idx) => {
    return `[الوحدة ${idx + 1}]:
- الاسم: ${p.title}
- النوع: ${p.unit_type}
- المشروع/الكمبوند: ${p.compound?.name || 'كمبوند معتمد'}
- السعر الإجمالي: ${p.total_price.toLocaleString()} ${p.currency}
- المقدم: ${p.down_payment_pct}% (${(p.down_payment_amount || p.total_price * 0.1).toLocaleString()} ${p.currency})
- مدة التقسيط: ${p.installment_years || 7} سنوات
- القسط الشهري: ${(p.monthly_installment || Math.round(p.total_price * 0.9 / ((p.installment_years || 7) * 12))).toLocaleString()} ${p.currency}
- المساحة: ${p.area_sqm || 'غير محدد'} م²
- الغرف: ${p.bedrooms || 'غير محدد'} | الحمامات: ${p.bathrooms || 'غير محدد'}
- الاستلام: ${p.delivery_date || 'استلام فوري / 2026'}
- المنصة: ${p.platform || 'Aqarmap'}`;
  }).join('\n\n');

  const systemPrompt = `أنت "Skanybot" - مستشار وبروكر العقارات الذكي الأول في مصر ودولياً (دبي، إسبانيا، تركيا).
شعارك الأساسي وميزتك التنافسية:
"اعرف أسعار وأقساط أي كمبوند في مصر أو دبي في ثواني — ومن غير مكالمات سيلز مزعجة."

القواعد الصارمة لإجاباتك:
1. أنت تعتمد حصرياً و100% على الوحدات العقارية الحقيقية المرفقة في سياق البيانات أدناه (Grounding Context). لا تخترع أو تهلوس بأي أسعار أو أرقام من خارج البيانات.
2. اذكر للعميل تفاصيل الأسعار بدقة، والمقدم، والقسط الشهري، ونظام السداد لكل وحدة تناسب طلبه.
3. كن مهذباً وواضحاً ومباشراً بدون أي إلحاح بيعي أو ضغط مكالمات مزعج.
4. شجع العميل على حجز معاينة ميدانية مجانية بالضغط على زر "طلب معاينة 📅" المتاح في كارت الوحدة مباشرة، أو التواصل عبر الواتساب بدون أي إزعاج.
5. أجب بلغة المستخدم المطلوبة (${locale === 'ar' ? 'العربية' : locale}).

البيانات العقارية المعتمدة المتاحة حالياً للاستعلام:
${propertyContext || 'لا توجد وحدات مطابقة تماماً للميزانية المحددة حالياً. قدم نصيحة عقارية ورشح للعميل استكشاف أقرب البدائل المتاحة.'}
`;

  const messages: DeepSeekChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-4), // keep last 4 context turns
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
        max_tokens: 1200,
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
