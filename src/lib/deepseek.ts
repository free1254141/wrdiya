/**
 * DeepSeek AI Agentic Integration for Sakanybot (سكنى بوت)
 * Endpoint: https://api.deepseek.com/chat/completions
 * Model: deepseek-chat (OpenAI-compatible Function Calling)
 *
 * Architecture inspired by pure LLM-driven Agentic Pipeline (like stokscan_AI):
 * 1. Model dynamically decides whether tools are needed (zero rigid regex blockers).
 * 2. Parallel tool execution for accurate database searches and math.
 * 3. 100% grounded responses strictly referencing real property records.
 */

import { Property } from '@/lib/types';
import { 
  AGENTIC_TOOLS_SCHEMA, 
  executePropertySearch, 
  executeInstallmentCalculation, 
  executeLeadRecording 
} from './ai/agentic-tools';

export interface DeepSeekChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  name?: string;
  tool_calls?: any[];
}

export interface AgenticChatResult {
  content: string;
  properties: Property[];
  toolCallsCount: number;
}

export function isDeepSeekConfigured(): boolean {
  const key = process.env.DEEPSEEK_API_KEY;
  return Boolean(key && key.trim().length > 10 && !key.includes('placeholder'));
}

/**
 * Run pure Agentic Chat with DeepSeek Function Calling
 */
export async function runDeepSeekAgenticChat(
  userPrompt: string,
  locale: string = 'ar',
  conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = []
): Promise<AgenticChatResult | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!isDeepSeekConfigured() || !apiKey) {
    return null;
  }

  const isAr = locale === 'ar';

  const systemPrompt = `أنت "سكنى بوت" (sakanybot) — مستشارك العقاري الذكي والبروكر المعتمد في مصر (التجمع الخامس، الشيخ زايد، العاصمة الإدارية، 6 أكتوبر، مدينتي) ودولياً (دبي، إسبانيا، تركيا).

مهامك وصلاحياتك:
1. لديك أداة "search_properties" للبحث في قاعدة بيانات العقارات الحقيقية والمحدثة.
   - إذا سأل العميل عن أي ميزانية (مثال: "في حدود 20 مليون"، "بـ 3 مليون"، "أقل من 5 مليون") أو نوع عقار (شقة، فيلا، استوديو، دوبلكس، أرض) أو منطقة (التجمع، زايد، دبي، إسبانيا، إسطنبول)، استدعِ أداة "search_properties" فوراً بالمحددات الدقيقة (مثل target_price: 20000000 أو 3000000).
   - لا تجب من الذاكرة أو تخمن أسعاراً غير موجودة، بل اعتمد 100% على ما ترجعه الأداة.
   - إذا سأل العميل عن نوع وحدة غير متاح كقطع الأراضي وأرجعت الأداة عدم وجود أراضي، وضح له ذلك بلطف ورشح له الشقق المتاحة في ميزانيته.
2. أداة "calculate_installments": لحساب تفاصيل خطة الأقساط والمقدم لأي وحدة أو ميزانية.
3. أداة "record_customer_lead": إذا كتب العميل رقم هاتفه أو طلب معاينة، استدعِ هذه الأداة لتسجيل رقمه وتأكيد تنسيق المعاينة.
4. الدردشة العامة والتحية: إذا كان السؤال مجرد ترحيب عام أو شكر (مثل "هاي"، "مرحبا"، "شكراً")، أجب مباشرة بإيجاز وود دون استدعاء أي أدوات وبدون عرض عقارات.

أسلوب الرد:
- أسلوب راقٍ، مهني، وموجز (فقرتين إلى 3 فقرات مركزة).
- لا تسرد جداول ضخمة لأن واجهة التطبيق تعرض كروت العقارات التفاعلية الكاملة للمستخدم بالصور والأسعار مباشرة.
- وضّح ميزة كل وحدة ومقدمها وفترة تقسيطها.
- أنهِ ردك بدعوة لمعاينة مجانية أو إمكانية توصيله بإدارة المشروع بدون مكالمات سيلز مزعجة.`;

  const messages: any[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-4).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    })),
    { role: 'user', content: userPrompt }
  ];

  const collectedProperties: Property[] = [];
  let toolCallsCount = 0;

  try {
    // ── First Round: Ask DeepSeek (it may reply directly or request tool_calls) ──
    const firstResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        tools: AGENTIC_TOOLS_SCHEMA,
        tool_choice: 'auto',
        temperature: 0.3,
        max_tokens: 600,
      }),
    });

    if (!firstResponse.ok) {
      const err = await firstResponse.text();
      console.warn('[DeepSeek Agentic] HTTP Error:', firstResponse.status, err);
      return null;
    }

    const firstData = await firstResponse.json();
    const choice = firstData.choices?.[0];
    const assistantMessage = choice?.message;

    if (!assistantMessage) {
      return null;
    }

    // If DeepSeek responded directly without tools (e.g. general greeting)
    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      return {
        content: assistantMessage.content || '',
        properties: [],
        toolCallsCount: 0
      };
    }

    // ── Process Tool Calls in Parallel ──
    toolCallsCount += assistantMessage.tool_calls.length;
    messages.push(assistantMessage);

    const toolExecutionPromises = assistantMessage.tool_calls.map(async (tc: any) => {
      const fnName = tc.function?.name;
      let args: any = {};
      try {
        args = JSON.parse(tc.function?.arguments || '{}');
      } catch (parseErr) {
        console.error('Failed to parse tool arguments:', tc.function?.arguments);
      }

      let toolOutput: any = {};

      if (fnName === 'search_properties') {
        const searchRes = await executePropertySearch(args);
        if (searchRes.properties && searchRes.properties.length > 0) {
          searchRes.properties.forEach(p => {
            if (!collectedProperties.some(cp => cp.id === p.id)) {
              collectedProperties.push(p);
            }
          });
        }
        toolOutput = {
          found_count: searchRes.found,
          message: searchRes.message,
          properties_summary: searchRes.properties.map((p, idx) => ({
            id: p.id,
            title: p.title,
            type: p.unit_type,
            price: `${p.total_price.toLocaleString()} ${p.currency}`,
            compound: p.compound?.name,
            location: p.compound?.city || p.compound?.area_name,
            down_payment: `${p.down_payment_pct}% (${(p.down_payment_amount || 0).toLocaleString()} ${p.currency})`,
            installment_years: p.installment_years,
            monthly_installment: p.monthly_installment,
            bedrooms: p.bedrooms,
            area_sqm: p.area_sqm
          }))
        };
      } else if (fnName === 'calculate_installments') {
        toolOutput = executeInstallmentCalculation(args);
      } else if (fnName === 'record_customer_lead') {
        toolOutput = await executeLeadRecording(args);
      } else {
        toolOutput = { error: `Tool ${fnName} not recognized` };
      }

      return {
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify(toolOutput)
      };
    });

    const toolResponses = await Promise.all(toolExecutionPromises);
    messages.push(...toolResponses);

    // ── Second Round: Let DeepSeek synthesize final grounded answer from tool results ──
    const secondResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: 0.3,
        max_tokens: 600,
      }),
    });

    if (!secondResponse.ok) {
      const err = await secondResponse.text();
      console.warn('[DeepSeek Agentic] Second round HTTP Error:', secondResponse.status, err);
      // Fallback: construct concise response from tool results
      return {
        content: isAr
          ? `وجدت لك ${collectedProperties.length} وحدات مطابقة لمواصفات بحثك. تفقد تفاصيلها وكروت المعاينة بالأسفل.`
          : `Found ${collectedProperties.length} units matching your search. Check the property cards below.`,
        properties: collectedProperties.slice(0, 4),
        toolCallsCount
      };
    }

    const secondData = await secondResponse.json();
    const finalContent = secondData.choices?.[0]?.message?.content || '';

    return {
      content: finalContent,
      properties: collectedProperties.slice(0, 4),
      toolCallsCount
    };

  } catch (error) {
    console.error('[DeepSeek Agentic] Invocation error:', error);
    return null;
  }
}
