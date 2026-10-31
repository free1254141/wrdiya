/**
 * DeepSeek AI Agentic Integration for Sakanybot (سكنى بوت)
 * Endpoint: https://api.deepseek.com/chat/completions
 * Model: deepseek-chat (OpenAI-compatible Function Calling)
 *
 * Supports two-sided real estate brokerage (شراء + بيع):
 *  - Buyers: search properties/lands, view details, calculate installments, book viewings.
 *  - Sellers: suggest & open the interactive Seller Listing Form modal directly from chat,
 *    or list/update apartments/villas/lands for sale with full sale circumstances (ظروف البيع).
 */

import { Property, SellerFormPrefill, SessionContext } from '@/lib/types';
import {
  AGENTIC_TOOLS_SCHEMA,
  executePropertySearch,
  executeInstallmentCalculation,
  executeLeadRecording,
  executePropertyDetails,
  executeListPropertyForSale,
  executeUpdateSellerProperty,
} from './ai/agentic-tools';
import {
  buildContextSystemMessage,
  emptySessionContext,
  sanitizeSellerPrefill,
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
  /** Full result list for the inline results table. */
  allProperties: Property[];
  totalMatches: number;
  toolCallsCount: number;
  /** Updated conversation memory to echo back to the client. */
  sessionContext: SessionContext;
  /** True when a seller unit/land was created or updated during this turn. */
  sellerUpdated?: boolean;
  /** True when the bot should open the Seller Listing Form modal on the client. */
  openSellerModal?: boolean;
  /** Optional prefill data for the Seller Listing Form modal. */
  sellerPrefill?: SellerFormPrefill | null;
}

const CARDS_PER_REPLY = 4;
const MAX_TOOL_ROUNDS = 3;
const HISTORY_TURNS = 10;
const HISTORY_CHARS = 700;

export function isDeepSeekConfigured(): boolean {
  const key = process.env.DEEPSEEK_API_KEY;
  return Boolean(key && key.trim().length > 10 && !key.includes('placeholder'));
}

const SYSTEM_PROMPT = `أنت "سكنى بوت" (sakanybot) — مستشارك العقاري الذكي والبروكر المعتمد للـ **شراء والبيع** في مصر (التجمع الخامس، الشيخ زايد، العاصمة الإدارية، 6 أكتوبر، مدينتي، الشروق، العبور، الساحل) ودولياً (دبي، إسبانيا، تركيا).

الأدوات المتاحة لك:
1. "search_properties": للبحث عن عقارات أو قطع أراضي معروضة للبيع (سواء من مشاريع المطورين أو من عروض الملاك المباشرة).
   - استدعِها فوراً عند أي سؤال شرائي بمحددات العميل الدقيقة (target_price, unit_type, location, bedrooms, installment_years, down_payment_pct, sort).
2. "get_property_details": لجلب التفاصيل الكاملة وظروف البيع لوحدة معروضة بالفعل.
3. "calculate_installments": لحساب المقدم والأقساط الشهرية والربع سنوية بدقة.
4. "record_customer_lead": لحفظ رقم هاتف المشتري وتنسيق معاينة.
5. "open_seller_listing_form": لفتح نافذة/ديالوج فورم إضافة بيانات وحدة أو قطعة أرض للبيع مباشرة على شاشة المستخدم!
   - **قاعدة مهمة جداً عند رغبة المستخدم في البيع أو إدخال بيانات وحدته**:
     أ) إذا قال المستخدم إنه يريد بيع وحدته/شقته/أرضه أو يريد إدخال بيانات وحدته (مثال: "عايز أبيع شقتي"، "عندي وحدة للبيع"، "عايز أدخل بيانات لوحدتي"، "I want to sell my property") ولم يطلب فتح الفورم مباشرة بعد:
        - رحّب به واقترح عليه فتح **فورم إضافة بيانات الوحدة للبيع** واسأله بوضوح: **"تحب أفتحلك فورم إضافة بيانات الوحدة دلوقتي عشان تدخل تفاصيلها وصورها بسهولة؟"** (بلغة المستخدم).
     ب) إذا وافق المستخدم (وقال مثلاً: "ماشي"، "ماشى"، "اه"، "أيوه"، "تمام"، "موافق"، "ياريت"، "افتحه"، "يلا"، "yes", "ok", "sure") أو طلب فتح الفورم مباشرة ("افتح الفورم"، "افتحلي الديالوج"):
        - استدعِ الأداة "open_seller_listing_form" فوراً! وستفتح الواجهة الفورم أمامه تلقائياً، وأخبره في ردك أنك فتحت له الفورم الآن على الشاشة ليدخل بيانات وحدته ويحفظها.
6. "list_property_for_sale": لإضافة وتسجيل وحدة عقارية أو قطعة أرض مباشرة في قاعدة البيانات إذا أعطاك العميل كافة بياناتها الأساسية نصياً في الشات (نوع العقار/الأرض، المنطقة، المساحة، والسعر).
7. "update_my_listed_property": لتعديل أي وحدة يملكها العميل حالياً (موجودة في seller_own_listed_units_for_sale في سياق المحادثة) مثل تعديل السعر، المساحة، ظروف البيع، أو إضافة صور جديدة أرفقها في الشات.
8. التحية والدردشة العامة: أجب بإيجاز وود بدون استدعاء أدوات.

الذاكرة وفهم سياق المحادثة:
- يصلك دائماً في "سياق المحادثة":
  - "seller_own_listed_units_for_sale": وحدات وأراضي العميل المعروضة للبيع حالياً (إن وجدت) بمعرّفاتها (id) وأسعارها وظروف بيعها.
  - "bot_just_offered_to_open_seller_form": إذا كانت true فهذا يعني أنك اقترحت في الرسالة السابقة فتح فورم إضافة الوحدة، فإذا رد المستخدم بـ "ماشي" أو "اه" أو "تمام" أو "موافق" استدعِ "open_seller_listing_form" فوراً.
  - "last_search_args": آخر بحث شرائي.
  - "units_shown_to_user_in_last_reply": الوحدات المعروضة في آخر رد مرقمة n=1..4.
  - "unit_user_is_looking_at_now": الوحدة المفتوحة أمامه الآن.
  - "pending_uploaded_images_ready_to_attach": عدد الصور التي رفعها العميل في الشات وجاهزة للربط بوحدته.
- عبارات مثل "الأولى"، "التانية"، "دي"، "عدّل وحدتي"، "ضف الصور دي لشقتي" افهمها فوراً من السياق واستدعِ الأداة المناسبة دون سؤال العميل "أنهي وحدة؟".

أسلوب الرد:
- راقٍ ومهني وموجز (فقرتان إلى 3 فقرات مركزة) وبلغة العميل.
- الواجهة تعرض تحت ردك مباشرةً 4 كروت مصورة + جدول تفاعلي بنتائج البحث (بداخله زر "عرض البيانات" لكل وحدة، وتحت الجدول زر "إظهار الكل" لعرض باقي نتائج هذا البحث). لذلك لا تذكر أرقاماً ضخمة لقاعدة البيانات، بل تحدث فقط عن نتائج البحث المطابقة المعروضة في الكروت والجدول بالأسفل.`;

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

export async function runDeepSeekAgenticChat(
  userPrompt: string,
  locale: string = 'ar',
  conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [],
  context: SessionContext = emptySessionContext(),
  options: {
    phoneShared?: boolean;
    ownerId?: string;
    myListings?: Property[];
    attachedImages?: string[];
  } = {}
): Promise<AgenticChatResult | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!isDeepSeekConfigured() || !apiKey) {
    return null;
  }

  const isAr = locale === 'ar';
  const ownerId = options.ownerId || 'guest_seller';
  const myListings = options.myListings || [];
  let pendingImages = [
    ...(context.pending_images || []),
    ...(options.attachedImages || []),
  ].slice(0, 6);

  const tempCtx: SessionContext = { ...context, pending_images: pendingImages };
  const messages: any[] = [{ role: 'system', content: SYSTEM_PROMPT }];
  if (
    tempCtx.turns > 0 ||
    tempCtx.shown.length ||
    tempCtx.focus ||
    myListings.length > 0 ||
    pendingImages.length > 0 ||
    tempCtx.pending_seller_form_offer
  ) {
    messages.push({
      role: 'system',
      content: buildContextSystemMessage(tempCtx, myListings.map(toShownUnit)),
    });
  }

  const promptWithImageNote =
    options.attachedImages && options.attachedImages.length > 0
      ? `${userPrompt}
[ملاحظة نظام: أرفق المستخدم مع هذه الرسالة ${options.attachedImages.length} صورة لوحدته وجاهزة للحفظ التلقائي عند استدعاء list_property_for_sale أو update_my_listed_property]`
      : userPrompt;

  messages.push(...compactHistory(conversationHistory), { role: 'user', content: promptWithImageNote });

  let searchCards: Property[] = [];
  const detailCards: Property[] = [];
  let allMatches: Property[] = [];
  let totalMatches = 0;
  let lastSearchArgs: Record<string, any> | null = null;
  let toolCallsCount = 0;
  let finalContent = '';
  let sellerUpdated = false;
  let openSellerModal = false;
  let sellerPrefill: SellerFormPrefill | null = context.seller_prefill || null;

  try {
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const allowTools = round < MAX_TOOL_ROUNDS;
      const assistant = await callDeepSeek(
        apiKey,
        allowTools ? { messages, tools: AGENTIC_TOOLS_SCHEMA, tool_choice: 'auto' } : { messages }
      );

      if (!assistant) {
        if (round === 0) return null;
        break;
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
              total_matches_for_this_search: res.total_matches,
              offset: res.offset,
              message: res.message,
              properties_summary: res.properties.map(p => ({
                id: p.id,
                title: p.title,
                type: p.unit_type,
                price: `${p.total_price.toLocaleString()} ${p.currency}`,
                compound: p.compound?.name,
                location: p.location_text || p.compound?.city || p.compound?.area_name,
                down_payment: `${p.down_payment_pct}% (${(p.down_payment_amount || 0).toLocaleString()} ${p.currency})`,
                installment_years: p.installment_years,
                monthly_installment: p.monthly_installment,
                bedrooms: p.bedrooms,
                area_sqm: p.area_sqm,
                sale_circumstances: p.sale_circumstances,
                listing_source: p.platform === 'SellerListing' ? 'معروض مباشرة من المالك' : 'مشروع مطور معتمد',
              })),
            };
          } else if (fnName === 'get_property_details') {
            const res = await executePropertyDetails(args);
            if (res.found && res.property && !detailCards.some(c => c.id === res.property!.id)) {
              detailCards.push(res.property);
            }
            output = res.found ? res.details : { error: 'الوحدة غير موجودة في قاعدة البيانات' };
          } else if (fnName === 'calculate_installments') {
            output = executeInstallmentCalculation(args);
          } else if (fnName === 'record_customer_lead') {
            output = await executeLeadRecording(args);
          } else if (fnName === 'open_seller_listing_form') {
            openSellerModal = true;
            const extracted = sanitizeSellerPrefill(args);
            if (extracted) {
              sellerPrefill = { ...(sellerPrefill || {}), ...extracted };
            }
            output = {
              success: true,
              modal_opened: true,
              prefill: sellerPrefill,
              message: 'تم فتح نافذة/فورم إضافة بيانات الوحدة للبيع على شاشة المستخدم الآن بنجاح.',
            };
          } else if (fnName === 'list_property_for_sale') {
            const res = await executeListPropertyForSale(ownerId, args, pendingImages);
            if (res.success && res.property) {
              sellerUpdated = true;
              pendingImages = []; // consumed
              detailCards.push(res.property);
            }
            output = res.success ? res.summary : { error: res.error };
          } else if (fnName === 'update_my_listed_property') {
            const res = await executeUpdateSellerProperty(ownerId, args, pendingImages);
            if (res.success && res.property) {
              sellerUpdated = true;
              pendingImages = []; // consumed
              detailCards.push(res.property);
            }
            output = res.success ? res.summary : { error: res.error };
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
    if (!searchCards.length && !detailCards.length && !openSellerModal) return null;
  }

  const searched = lastSearchArgs !== null;
  const cards = searched ? searchCards : detailCards.slice(0, CARDS_PER_REPLY);

  if (!finalContent) {
    if (openSellerModal) {
      finalContent = isAr
        ? '✅ فتحت لك الآن فورم إضافة بيانات وحدتك للبيع على الشاشة! يمكنك ملء التفاصيل ورفع الصور وحفظها فوراً.'
        : '✅ I have opened the Property Listing Form for you on screen! Fill in your unit details and click Publish Listing.';
    } else {
      finalContent = isAr
        ? `وجدت لك ${totalMatches || cards.length} وحدة مطابقة لطلبك. تفقّد الكروت والجدول بالأسفل.`
        : `Found ${totalMatches || cards.length} units matching your request. See the cards and table below.`;
    }
  }

  const sessionContext = updateSessionContext(context, {
    searchArgs: searched ? lastSearchArgs : null,
    shown: cards,
    total: totalMatches,
    focus: !searched && detailCards.length === 1 ? toShownUnit(detailCards[0]) : undefined,
    phoneShared: options.phoneShared,
    pendingImages,
    pendingSellerFormOffer: openSellerModal ? false : context.pending_seller_form_offer,
    sellerPrefill: openSellerModal ? null : sellerPrefill,
  });

  return {
    content: finalContent,
    properties: cards,
    allProperties: searched ? allMatches : cards,
    totalMatches,
    toolCallsCount,
    sessionContext,
    sellerUpdated,
    openSellerModal,
    sellerPrefill,
  };
}
