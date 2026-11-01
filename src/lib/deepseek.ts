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
import { getAllCachedProperties } from './real-estate-engine';
import {
  AGENTIC_TOOLS_SCHEMA,
  executePropertySearch,
  executeInstallmentCalculation,
  executeLeadRecording,
  executePropertyDetails,
  executeListPropertyForSale,
  executeUpdateSellerProperty,
  executePropertyValuation,
  executeAreaIntelligence,
  executeDealScoring,
  executeLegalAndInvestmentGuide,
  executeBudgetMatrixGuide,
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
  /** LLM Token & Cost telemetry for admin tracking */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cacheHitTokens: number;
    costUsd: number;
    costEgp: number;
  };
}

const CARDS_PER_REPLY = 4;
const MAX_TOOL_ROUNDS = 3;
const HISTORY_TURNS = 10;
const HISTORY_CHARS = 700;

export function isDeepSeekConfigured(): boolean {
  const key = process.env.DEEPSEEK_API_KEY;
  return Boolean(key && key.trim().length > 10 && !key.includes('placeholder'));
}

const SYSTEM_PROMPT = `أنت "سكنى بوت" (sakanybot) — مستشارك العقاري الذكي والبروكر المعتمد للـ **شراء والبيع** في جمهورية مصر العربية (التجمع الخامس، الشيخ زايد، العاصمة الإدارية، 6 أكتوبر، المستقبل سيتي، الشروق، الساحل الشمالي، الإسكندرية، العين السخنة).

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
8. "valuate_property": لتسعير وتقييم وحدة بالذكاء الاصطناعي والموديل الكمي (AVM) وحساب السعر العادل وسعر البيع السريع ونطاق السعر المقترح وأقرب الصفقات المشابهة (استدعِها فوراً عندما يسأل العميل "شقتي تسوى كام" أو يطلب تسعير وحدته أو يسأل عن السعر العادل لمساحة ومنطقة معينة).
9. "get_area_intelligence": لاستخراج عيوب ومميزات المناطق والأحياء بدقة وصراحة تامة ومتوسطات أسعار المتر كاش وتقسيط ومقارنة منطقتين (استدعِها عندما يسأل العميل عن عيوب أو مميزات منطقة أو يسأل "أشتري فين").
10. "calculate_property_deal_score": لحساب سكور الصفقة وجودة السعر من 0 إلى 100 بدقة رياضية وتبيان هل هي لقطة استثمارية، سعر عادل، أم سعر مبالغ فيه.
11. "get_market_legal_and_investment_guide": للرجوع الفوري للدليل القانوني والاستثماري وشبكة النقل والمحاور القومية (الشهر العقاري، التوكيلات، التصالح، وديعة وفروق الصيانة، رسوم التنازل، ضريبة التصرفات 2.5%، خصومات الكاش، العوائد الإيجارية، المونوريل والقطار السريع).
12. "get_budget_matrix_2026": خريطة ومصفوفة الميزانيات العقارية لمصر 2026/2027 (استدعِها فوراً عندما يسأل العميل عن ميزانية عامة مثل: "معايا مليون جنيه"، "معايا 500 ألف"، "أشتري إيه بميزانيتي"). ترشح فوراً خيارات الكاش والاستلام الفوري وخيارات التقسيط الحقيقية مع أسماء مشاريع واقعية في 12 منطقة.
13. التحية والدردشة العامة: أجب بإيجاز وود بدون استدعاء أدوات.

القواعد الاحترافية الحاسمة لإجابات سكنى بوت (Data & Math Intelligence):
1. **كشف الأقساط المخفية (Hidden Installment Gap):**
   - إذا أظهر فحص بيانات الوحدة وجود فجوة أقساط (warningMessage أو hiddenGapAmount)، اذكر للمشتري فوراً بصراحة تامة: *"انتبه: هناك [المبلغ] جنيه دفعات مخفية (استلام/سنوية) غير ظاهرة في القسط الشهري المعلن!"*، واذكر له القسط الشهري الحقيقي المتساوي.
2. **توحيد التقييم الكمي (AVM & Deal Score):**
   - اعتمد أرقام وسكور التقييم الموحد المحقون في البيانات دون أي تناقض، ولا تخلط بين أسماء المشاريع والمولات (مثلاً البوسكو كمبوند سكني لمصر إيطاليا، وريجنسي مشروع تجاري).
3. **خريطة ميزانيتك تجيب إيه في 2026/2027:**
   - إياك أن تصدم العميل وتقول له "مبلغك مش مبلغ شراء في 2026"! بل وضح له فوراً البدائل الواقعية:
     أ) خيار الشراء كاش واستلام فوري (في حدائق أكتوبر، أكتوبر الجديدة، بدر، الشروق، العبور).
     ب) خيار استخدام المبلغ كمقدم لشراء وحدة أرقى بالتقسيط (في المستقبل سيتي، العاصمة الإدارية، التجمع، الساحل، السخنة) مع ذكر أسماء المشاريع.
4. **البديل الأذكى تلقائياً (Auto Counter-Offer):**
   - إذا كان سكور الوحدة أقل من 65/100، يقوم النظام برمجياً بإرفاق كروت أفضل الوحدات البديلة تلقائياً تحت ردك مباشرةً. لذلك انتقد الوحدة بصراحة واختم ردك بعبارة توجيهية صريحة: *"ولأن هذه الوحدة مبالغ في سعرها، رشحت لك بالأسفل مباشرة كروت أفضل البدائل الحقيقية بنفس الميزانية وبسكور أعلى بكثير، يمكنك فتح الإعلان أو طلب معاينتها مباشرة"*.
5. **التفريق بين كمبوندات التجمع وعمارات بيت الوطن/الأهالي:**
   - عند تقييم أي شقة في التجمع الخامس، فرّق بوضوح في تحليلك: السعر العادل المعياري خارج الكمبوند (بيت الوطن/الأندلس/النرجس) هو ~26,000 إلى ~30,000 ج/م² نصف تشطيب؛ أما داخل الكمبوندات المتكاملة الكبرى (مثل هايد بارك، ميفيدا، الجولدن سكوير) فالسعر العادل يرتفع إلى ~42,000 إلى ~55,000 ج/م².
5. **فلتر البحث المكاني الصارم (Strict Location):**
   - إذا طلب العميل مدينة معينة وكانت النتائج فارغة، لا تعرض وحدات من مدن أخرى غير مطابقة، بل اذكر له بأمانة عدم وجود وحدات حالياً في تلك المدينة واقترح أقرب 3 بدائل جغرافية وسعرية.`;

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

export interface DeepSeekApiCallResult {
  message: any;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    prompt_cache_hit_tokens?: number;
    prompt_cache_miss_tokens?: number;
  };
}

async function callDeepSeek(apiKey: string, body: Record<string, any>): Promise<DeepSeekApiCallResult | null> {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.3, max_tokens: 1500, ...body }),
  });
  if (!res.ok) {
    console.warn('[DeepSeek Agentic] HTTP Error:', res.status, await res.text());
    return null;
  }
  const data = await res.json();
  return {
    message: data.choices?.[0]?.message || null,
    usage: data.usage || undefined,
  };
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

  // Cumulative token and cost telemetry for admin auditing
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalTokens = 0;
  let totalCacheHitTokens = 0;

  try {
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const allowTools = round < MAX_TOOL_ROUNDS;
      const apiResp = await callDeepSeek(
        apiKey,
        allowTools ? { messages, tools: AGENTIC_TOOLS_SCHEMA, tool_choice: 'auto' } : { messages }
      );

      if (!apiResp || !apiResp.message) {
        if (round === 0) return null;
        break;
      }

      if (apiResp.usage) {
        totalPromptTokens += apiResp.usage.prompt_tokens || 0;
        totalCompletionTokens += apiResp.usage.completion_tokens || 0;
        totalTokens += apiResp.usage.total_tokens || 0;
        totalCacheHitTokens += apiResp.usage.prompt_cache_hit_tokens || 0;
      }

      const assistant = apiResp.message;

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
          } else if (fnName === 'valuate_property') {
            output = await executePropertyValuation(args);
            // Auto Counter-Offer Card Attachment for sub-65 units
            if (output.deal_score && output.deal_score < 65) {
              try {
                const all = await getAllCachedProperties();
                const targetBudget = args.asking_price || (args.area_sqm ? args.area_sqm * 35000 : 0);
                const loc = (args.location || '').toLowerCase();
                const alternatives = all
                  .filter(p => {
                    const pLoc = `${p.compound?.city || ''} ${p.compound?.area_name || ''} ${p.title} ${(p as any).location_text || ''}`.toLowerCase();
                    const locMatch = loc.includes('تجمع') || loc.includes('cairo') ? (pLoc.includes('تجمع') || pLoc.includes('cairo')) : true;
                    const priceMatch = targetBudget > 0 ? (p.total_price <= targetBudget * 1.25 && p.total_price >= targetBudget * 0.45) : true;
                    return locMatch && priceMatch;
                  })
                  .slice(0, 2);
                if (alternatives.length > 0) {
                  detailCards.push(...alternatives);
                }
              } catch {}
            }
          } else if (fnName === 'get_area_intelligence') {
            output = executeAreaIntelligence(args);
          } else if (fnName === 'calculate_property_deal_score') {
            output = executeDealScoring(args);
            // Auto Counter-Offer Card Attachment for sub-65 units
            if (output.total_score && output.total_score < 65) {
              try {
                const all = await getAllCachedProperties();
                const targetBudget = args.unit_price || 0;
                const loc = (args.location || '').toLowerCase();
                const alternatives = all
                  .filter(p => {
                    const pLoc = `${p.compound?.city || ''} ${p.compound?.area_name || ''} ${p.title} ${(p as any).location_text || ''}`.toLowerCase();
                    const locMatch = loc.includes('تجمع') || loc.includes('cairo') ? (pLoc.includes('تجمع') || pLoc.includes('cairo')) : true;
                    const priceMatch = targetBudget > 0 ? (p.total_price <= targetBudget * 1.25 && p.total_price >= targetBudget * 0.45) : true;
                    return locMatch && priceMatch;
                  })
                  .slice(0, 2);
                if (alternatives.length > 0) {
                  detailCards.push(...alternatives);
                }
              } catch {}
            }
          } else if (fnName === 'get_market_legal_and_investment_guide') {
            output = executeLegalAndInvestmentGuide(args);
          } else if (fnName === 'get_budget_matrix_2026') {
            output = executeBudgetMatrixGuide(args);
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

  const cacheMissTokens = Math.max(0, totalPromptTokens - totalCacheHitTokens);
  // DeepSeek official pricing (deepseek-chat / V3):
  // Cache Hit: $0.07 / 1M tokens ($0.00000007 / token)
  // Cache Miss (standard prompt): $0.27 / 1M tokens ($0.00000027 / token)
  // Completion output: $1.10 / 1M tokens ($0.0000011 / token)
  // USD to EGP ~ 49.5
  const costUsd = (totalCacheHitTokens * 0.00000007) + (cacheMissTokens * 0.00000027) + (totalCompletionTokens * 0.0000011);
  const costEgp = costUsd * 49.5;

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
    usage: {
      promptTokens: totalPromptTokens,
      completionTokens: totalCompletionTokens,
      totalTokens,
      cacheHitTokens: totalCacheHitTokens,
      costUsd,
      costEgp,
    },
  };
}
