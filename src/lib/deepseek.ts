/**
 * DeepSeek AI Agentic Integration for Sakanybot (سكنى بوت)
 * Endpoint: https://api.deepseek.com/chat/completions
 * Model: deepseek-chat (OpenAI-compatible Function Calling)
 *
 * Architecture mirrors the stokscan_AI agentic pipeline:
 *  1. The model decides by itself whether a tool is needed (no rigid regex gates).
 *  2. Multi-round tool loop (search -> refine -> answer) with parallel tool execution.
 *  3. Conversation memory: a session-context system message (last search, units shown,
 *     focused unit, buyer profile) + compact recent history, so follow-ups such as
 *     "التانية دي بكام؟" or "وريني أرخص واحدة" are understood.
 *  4. 100% grounded answers: only tool results are allowed as a source of prices/units.
 */

import { Property, SessionContext } from '@/lib/types';
import {
  AGENTIC_TOOLS_SCHEMA,
  executePropertySearch,
  executeInstallmentCalculation,
  executeLeadRecording,
  executePropertyDetails,
} from './ai/agentic-tools';
import {
  buildContextSystemMessage,
  emptySessionContext,
  toShownUnit,
  updateSessionContext,
} from './ai/session-context';

export interface DeepSeekChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  name?: string;
  tool_calls?: any[];
}

export interface AgenticChatResult {
  content: string;
  /** Cards shown inline (max 4). */
  properties: Property[];
  /** Full result list for the "view all" table (only when more than 4 matched). */
  allProperties: Property[];
  totalMatches: number;
  toolCallsCount: number;
  /** Updated conversation memory to echo back to the client. */
  sessionContext: SessionContext;
}

const CARDS_PER_REPLY = 4;
const MAX_TOOL_ROUNDS = 3;
const HISTORY_TURNS = 10;
const HISTORY_CHARS = 700;

export function isDeepSeekConfigured(): boolean {
  const key = process.env.DEEPSEEK_API_KEY;
  return Boolean(key && key.trim().length > 10 && !key.includes('placeholder'));
}

const SYSTEM_PROMPT = `أنت "سكنى بوت" (sakanybot) — مستشارك العقاري الذكي والبروكر المعتمد في مصر (التجمع الخامس، الشيخ زايد، العاصمة الإدارية، 6 أكتوبر، مدينتي) ودولياً (دبي، إسبانيا، تركيا).

الأدوات:
1. "search_properties": للبحث في قاعدة بيانات العقارات الحقيقية والمحدثة.
   - عند أي سؤال عن ميزانية ("في حدود 20 مليون"، "بـ 3 مليون"، "أقل من 5 مليون") أو نوع عقار (شقة، فيلا، استوديو، دوبلكس، أرض) أو منطقة، استدعِ الأداة فوراً بالمحددات الدقيقة (مثل target_price: 20000000).
   - لا تجب من الذاكرة ولا تخمّن أسعاراً؛ اعتمد 100% على ما ترجعه الأدوات.
   - إذا سأل عن نوع غير متاح (كالأراضي) ورجعت الأداة بعدم وجوده، وضّح ذلك بلطف ورشّح البدائل في ميزانيته.
2. "get_property_details": للتفاصيل الكاملة لوحدة معروضة بالفعل (مرافق، تسليم، تشطيب، مطور...).
3. "calculate_installments": لحساب المقدم والأقساط.
4. "record_customer_lead": عند كتابة العميل رقم هاتفه أو طلبه معاينة.
5. التحية والشكر والدردشة العامة: أجب بإيجاز بدون أدوات وبدون عرض عقارات، ولا تمسح السياق.

الذاكرة وفهم سياق المحادثة (مهم جداً):
- يصلك دائماً (عند وجود سياق) رسالة "سياق المحادثة" فيها: آخر بحث (last_search_args)، الوحدات التي عُرضت على العميل في الرد السابق مرقمة n=1..4، الوحدة التي يتصفحها العميل الآن (unit_user_is_looking_at_now)، وملف العميل (ميزانيته ومناطقه المفضلة ونوع الوحدة).
- عبارات الإشارة مثل "دي"، "دي بكام"، "الأولى"، "التانية"، "الأخيرة"، "اللي قبلها"، "الأرخص منهم" تشير لتلك الوحدات: إن وُجدت unit_user_is_looking_at_now فهي المقصودة بـ "دي/هذه"، وإلا فاستخدم الوحدات المعروضة حسب الترتيب n. لا تسأل العميل "تقصد أنهي وحدة؟" إلا إذا كانت الإشارة غامضة فعلاً.
- أسئلة المتابعة التي تعدّل البحث ("أرخص"، "3 غرف"، "في الشيخ زايد"، "فيلا بدل شقة"، "بميزانية أقل") ادمج فيها شروط last_search_args مع التعديل واستدعِ search_properties من جديد. "أرخص/أغلى/أكبر واحدة" = نفس الشروط السابقة مع sort المناسب.
- عند تغيير الدولة أو العملة (مثلاً من التجمع إلى دبي) لا تنقل الميزانية القديمة إلا إذا ذكرها العميل بنفس العملة.
- الأسئلة عن وحدة معروضة بالفعل (مواصفاتها، مرافقها، قسطها): لا تعد البحث. استخدم get_property_details بمعرّفها (وتظهر بطاقتها تلقائياً) أو احسب القسط بـ calculate_installments من سعرها ومقدمها ومدتها الموجودة في السياق دون سؤال العميل عنها.
- راعِ ملف العميل (ميزانيته ومناطقه) في اقتراحاتك، ولا تسأله عن شيء ذكره سابقاً.

أسلوب الرد:
- راقٍ ومهني وموجز (فقرتان إلى 3 فقرات مركزة) وبلغة العميل.
- الواجهة تعرض 4 كروت فقط، وإذا كان إجمالي المطابق (total_matches_in_database) أكثر من 4 يظهر للعميل زر برمجي "عرض كل النتائج" يفتح جدولاً بكل الوحدات. اذكر العدد الكلي واطلب منه الضغط على هذا الزر لرؤية الباقي، ولا تطلب منه أن يكتب لك "المزيد".
- لا تسرد جداولاً ضخمة لأن الواجهة تعرض الكروت التفاعلية بالصور والأسعار مباشرة.
- وضّح ميزة كل وحدة ومقدمها وفترة تقسيطها، وأنهِ بدعوة لمعاينة مجانية أو توصيله بإدارة المشروع بدون مكالمات سيلز مزعجة.`;

/** Keep recent turns, trimmed, so long replies do not flood the context window. */
function compactHistory(
  history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return history
    .filter(m => m && typeof m.content === 'string' && m.content.trim())
    .slice(-HISTORY_TURNS)
    .map(m => ({
      role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: m.content.length > HISTORY_CHARS ? m.content.slice(0, HISTORY_CHARS) + '…' : m.content,
    }));
}

async function callDeepSeek(apiKey: string, body: Record<string, any>) {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.3, max_tokens: 700, ...body }),
  });
  if (!res.ok) {
    console.warn('[DeepSeek Agentic] HTTP Error:', res.status, await res.text());
    return null;
  }
  const data = await res.json();
  return data.choices?.[0]?.message || null;
}

/**
 * Run the agentic chat turn with DeepSeek function calling + conversation memory.
 */
export async function runDeepSeekAgenticChat(
  userPrompt: string,
  locale: string = 'ar',
  conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [],
  context: SessionContext = emptySessionContext(),
  options: { phoneShared?: boolean } = {}
): Promise<AgenticChatResult | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!isDeepSeekConfigured() || !apiKey) {
    return null;
  }

  const isAr = locale === 'ar';
  const messages: any[] = [{ role: 'system', content: SYSTEM_PROMPT }];
  if (context.turns > 0 || context.shown.length || context.focus) {
    messages.push({ role: 'system', content: buildContextSystemMessage(context) });
  }
  messages.push(...compactHistory(conversationHistory), { role: 'user', content: userPrompt });

  let searchCards: Property[] = [];
  const detailCards: Property[] = [];
  let allMatches: Property[] = [];
  let totalMatches = 0;
  let lastSearchArgs: Record<string, any> | null = null;
  let toolCallsCount = 0;
  let finalContent = '';

  try {
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const allowTools = round < MAX_TOOL_ROUNDS;
      const assistant = await callDeepSeek(apiKey, allowTools ? { messages, tools: AGENTIC_TOOLS_SCHEMA, tool_choice: 'auto' } : { messages });

      if (!assistant) {
        if (round === 0) return null;
        break; // keep whatever the tools already produced
      }

      const calls: any[] = allowTools ? assistant.tool_calls || [] : [];
      if (!calls.length) {
        finalContent = assistant.content || '';
        break;
      }

      toolCallsCount += calls.length;
      messages.push(assistant);

      const toolResponses = await Promise.all(
        calls.map(async (tc: any) => {
          const fnName = tc.function?.name;
          let args: any = {};
          try {
            args = JSON.parse(tc.function?.arguments || '{}');
          } catch {
            console.error('Failed to parse tool arguments:', tc.function?.arguments);
          }

          let output: any = {};
          if (fnName === 'search_properties') {
            const res = await executePropertySearch(args);
            lastSearchArgs = args;
            searchCards = res.properties.slice(0, CARDS_PER_REPLY);
            allMatches = res.all_matches || [];
            totalMatches = res.total_matches || 0;
            output = {
              found_count: res.found,
              total_matches_in_database: res.total_matches,
              offset: res.offset,
              message: res.message,
              properties_summary: res.properties.map(p => ({
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
                area_sqm: p.area_sqm,
              })),
            };
          } else if (fnName === 'get_property_details') {
            const res = await executePropertyDetails(args);
            if (res.found && res.property && !detailCards.some(c => c.id === res.property!.id)) detailCards.push(res.property);
            output = res.found ? res.details : { error: 'الوحدة غير موجودة في قاعدة البيانات' };
          } else if (fnName === 'calculate_installments') {
            output = executeInstallmentCalculation(args);
          } else if (fnName === 'record_customer_lead') {
            output = await executeLeadRecording(args);
          } else {
            output = { error: `Tool ${fnName} not recognized` };
          }

          return { role: 'tool', tool_call_id: tc.id, content: JSON.stringify(output) };
        })
      );
      messages.push(...toolResponses);
    }
  } catch (error) {
    console.error('[DeepSeek Agentic] Invocation error:', error);
    if (!searchCards.length && !detailCards.length) return null;
  }

  const searched = lastSearchArgs !== null;
  const cards = searched ? searchCards : detailCards.slice(0, CARDS_PER_REPLY);

  if (!finalContent) {
    // Model failed after tools ran: still give a grounded, concise answer.
    finalContent = isAr
      ? `وجدت لك ${totalMatches || cards.length} وحدة مطابقة لطلبك. تفقّد الكروت بالأسفل.`
      : `Found ${totalMatches || cards.length} units matching your request. See the cards below.`;
  }

  const sessionContext = updateSessionContext(context, {
    searchArgs: searched ? lastSearchArgs : null,
    shown: cards,
    total: totalMatches,
    focus: !searched && detailCards.length === 1 ? toShownUnit(detailCards[0]) : undefined,
    phoneShared: options.phoneShared,
  });

  return {
    content: finalContent,
    properties: cards,
    allProperties: searched && totalMatches > CARDS_PER_REPLY ? allMatches : [],
    totalMatches,
    toolCallsCount,
    sessionContext,
  };
}
