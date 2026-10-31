import { NextRequest, NextResponse } from 'next/server';
import { 
  analyzeUserQuery, 
  queryProperties, 
  getFeaturedOpportunities, 
  formatGroundedBrokerResponse 
} from '@/lib/real-estate-engine';
import { runDeepSeekAgenticChat, isDeepSeekConfigured } from '@/lib/deepseek';
import {
  didAssistantOfferSellerForm,
  extractSellerPrefillFromMessage,
  getSellerFormBotCopy,
  isDirectOpenSellerFormRequest,
  isSellerListingIntent,
  isUserAgreeingToOpenForm,
} from '@/lib/ai/agentic-tools';
import { sanitizeSessionContext, updateSessionContext } from '@/lib/ai/session-context';
import { getSellerProperties } from '@/lib/seller-listings';
import { consumeQuery, toPublicUsage, type ConsumeResult } from '@/lib/usage-manager';
import { getVerifiedUser, getGuestId, getClientIpHash, GUEST_COOKIE, guestCookieOptions } from '@/lib/server-auth';
import { notifyNewLead } from '@/lib/notify';
import { createClient } from '@supabase/supabase-js';
import { Property, SellerFormPrefill, SessionContext } from '@/lib/types';

const MAX_MESSAGE_CHARS = 2000;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://csuifvyghfsibkrnxrby.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

/**
 * Ensure a chat session exists in Supabase.
 * Returns the UUID session id for foreign key linking.
 */
async function ensureChatSession(sessionId: string, title: string, userId?: string | null): Promise<string | null> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId);

    if (isUuid) {
      const { data: existing } = await supabaseAdmin
        .from('chat_sessions')
        .select('id, user_id')
        .eq('id', sessionId)
        .maybeSingle();

      if (existing) {
        if (userId && !existing.user_id) {
          await supabaseAdmin
            .from('chat_sessions')
            .update({ user_id: userId, updated_at: new Date().toISOString() })
            .eq('id', sessionId);
        }
        return existing.id;
      }

      const { data: inserted, error } = await supabaseAdmin
        .from('chat_sessions')
        .insert([{
          id: sessionId,
          user_id: userId || null,
          title: title.slice(0, 60),
          is_pinned: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select('id')
        .single();

      if (!error && inserted) return inserted.id;
    }

    const { data: inserted } = await supabaseAdmin
      .from('chat_sessions')
      .insert([{
        user_id: userId || null,
        title: title.slice(0, 60),
        is_pinned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select('id')
      .single();

    return inserted?.id || null;
  } catch (err) {
    console.warn('Chat session ensure failed (continuing gracefully):', err);
    return null;
  }
}

/** Keep the full-results payload small enough to persist in the browser. */
function slimForTable(list: Property[]): Property[] {
  return list.map((p) => ({
    ...p,
    images: (p.images || []).slice(0, 3),
    compound: p.compound ? { ...p.compound, description: undefined } : p.compound,
  })) as Property[];
}

export async function POST(req: NextRequest) {
  let usage: ConsumeResult | null = null;
  let guestCookieToSet: string | null = null;
  const withGuestCookie = (res: NextResponse) => {
    if (guestCookieToSet) res.cookies.set(GUEST_COOKIE, guestCookieToSet, guestCookieOptions());
    return res;
  };

  try {
    const body = await req.json();
    const rawMessage: string = String(body.message || body.prompt || '').trim().slice(0, MAX_MESSAGE_CHARS);
    const attachedImages: string[] = Array.isArray(body.attachedImages) ? body.attachedImages.filter((x: any) => typeof x === 'string' && x.length > 5).slice(0, 6) : [];
    const userMessage: string = rawMessage || (attachedImages.length > 0 ? 'أرفقت صور الوحدة الخاصة بي' : '');
    const sessionId = body.sessionId || body.session_id;

    // Identity is resolved server-side from the auth session — body.userId is NOT trusted.
    const verifiedUser = await getVerifiedUser(req);
    const userId: string | null = verifiedUser?.id || null;
    const userEmail: string | null = verifiedUser?.email || null;
    const { guestId, isNew: isNewGuest } = getGuestId(req);
    if (!userId && isNewGuest) guestCookieToSet = guestId;

    // Logged-in sellers always act as themselves; guests keep their local seller id.
    const requestedSellerId: string = String(body.sellerOwnerId || 'guest_seller');
    const sellerOwnerId: string = userId || (/^(guest_|seller_)/.test(requestedSellerId) ? requestedSellerId : 'guest_seller');
    const locale = (['ar', 'en', 'tr', 'ru', 'de', 'fr', 'es'].includes(body.locale) ? body.locale : 'ar');
    const freeTest = body.freeTest || body.bypassDeepSeek || body.engineOnly || false;

    if (!userMessage) {
      return withGuestCookie(NextResponse.json(
        { error: locale === 'ar' ? 'من فضلك أدخل سؤالك العقاري أو نوع الوحدة التي تبحث عنها.' : 'Please enter your property inquiry or preferred unit type.' },
        { status: 400 }
      ));
    }

    // 1. Strict, persistent usage enforcement (Admin: unlimited, guest 3/day, free 10/day, Pro 300/period)
    usage = await consumeQuery({ userId, guestId: userId ? null : guestId, ipHash: getClientIpHash(req), email: userEmail });

    if (!usage.allowed) {
      const publicUsage = toPublicUsage(usage);
      if (usage.reason === 'login_required') {
        return withGuestCookie(NextResponse.json(
          {
            success: false,
            error: 'login_required',
            message: locale === 'ar'
              ? 'لقد استهلكت رسائلك التجريبية كزائر. سجّل دخولك مجاناً واحصل على 20 استفساراً يومياً!'
              : 'You have used your free guest messages. Sign in for free to get 20 queries per day!',
            usage: publicUsage,
          },
          { status: 401 }
        ));
      }
      return NextResponse.json(
        {
          success: false,
          error: usage.reason || 'daily_limit_reached',
          message: locale === 'ar'
            ? 'وصلت للحد الأقصى اليومي (20 استفساراً مجانياً). يتجدد رصيدك تلقائياً عند منتصف الليل لضمان جودة وسرعة الخدمة للجميع!'
            : 'You have reached your daily limit of 20 free queries. Your quota resets automatically tomorrow at midnight!',
          usage: publicUsage,
        },
        { status: 429 }
      );
    }

    // 2. Strict Lead / Phone Number Auto-Capture
    const phoneRegex = /(?:\+?20|0)?1[0125]\d{8}\b|\+?\d{10,14}\b/;
    const phoneMatch = userMessage.match(phoneRegex);
    const extractedPhone = phoneMatch ? phoneMatch[0] : null;

    let finalContent = '';
    let propertiesToReturn: Property[] = [];
    let allPropertiesToReturn: Property[] = [];
    let totalMatches = 0;
    let detectedIntent = 'search';
    let sellerUpdated = false;
    let openSellerModal = false;
    let sessionContext: SessionContext = sanitizeSessionContext(body.sessionContext);

    // Prepare history & inspect last assistant message for seller form offer context
    const rawHistory: any[] = Array.isArray(body.history) ? body.history : (Array.isArray(body.messages) ? body.messages : []);
    const history = rawHistory
      .filter((m: any) => m && typeof m.content === 'string' && m.content.trim())
      .map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
        content: String(m.content).slice(0, 1500),
      }));
    if (history.length && history[history.length - 1].role === 'user' && history[history.length - 1].content.trim() === userMessage) {
      history.pop();
    }
    const lastAssistantMsg = [...history].reverse().find((m) => m.role === 'assistant')?.content;

    const extractedMsgPrefill = extractSellerPrefillFromMessage(userMessage);
    let activeSellerPrefill: SellerFormPrefill | null =
      extractedMsgPrefill || sessionContext.seller_prefill
        ? { ...(sessionContext.seller_prefill || {}), ...(extractedMsgPrefill || {}) }
        : null;

    const sellerBotCopy = getSellerFormBotCopy(locale);
    const userAgreedToOpenForm = isUserAgreeingToOpenForm(
      userMessage,
      sessionContext.pending_seller_form_offer,
      lastAssistantMsg
    );
    const userDirectlyRequestedForm = isDirectOpenSellerFormRequest(userMessage);
    const userWantsToSell = isSellerListingIntent(userMessage);

    // 2.5 Immediate Deterministic Handling when user says "ماشي" / agrees to open the seller form or asks to open it directly
    if (userAgreedToOpenForm || userDirectlyRequestedForm) {
      openSellerModal = true;
      detectedIntent = 'open_seller_form';
      finalContent = sellerBotCopy.openedConfirmText;
      sessionContext = updateSessionContext(sessionContext, {
        pendingSellerFormOffer: false,
        sellerPrefill: null,
        phoneShared: Boolean(extractedPhone),
      });
    }

    // 3. AGENTIC EXECUTION: Pure LLM-driven Function Calling via DeepSeek
    if (!finalContent && isDeepSeekConfigured() && !freeTest) {
      try {
        const currentMyListings = await getSellerProperties(sellerOwnerId);
        const agenticResult = await runDeepSeekAgenticChat(
          userMessage,
          locale,
          history,
          { ...sessionContext, seller_prefill: activeSellerPrefill },
          {
            phoneShared: Boolean(extractedPhone),
            ownerId: sellerOwnerId,
            myListings: currentMyListings,
            attachedImages,
          }
        );
        if (agenticResult && agenticResult.content) {
          finalContent = agenticResult.content;
          propertiesToReturn = agenticResult.properties || [];
          allPropertiesToReturn = agenticResult.allProperties || [];
          totalMatches = agenticResult.totalMatches || 0;
          sessionContext = agenticResult.sessionContext;
          sellerUpdated = Boolean(agenticResult.sellerUpdated);
          if (agenticResult.openSellerModal) {
            openSellerModal = true;
            if (agenticResult.sellerPrefill) {
              activeSellerPrefill = { ...(activeSellerPrefill || {}), ...agenticResult.sellerPrefill };
            }
          }
          detectedIntent = openSellerModal
            ? 'open_seller_form'
            : agenticResult.toolCallsCount > 0
              ? 'agentic_search'
              : 'general';
        }
      } catch (aiErr) {
        console.warn('[Chat Route] DeepSeek agentic execution failed, falling back:', aiErr);
      }
    }

    // 3.5 If user wants to sell / enter unit details and form wasn't opened or saved yet, ensure we suggest opening the form!
    if (userWantsToSell && !openSellerModal && !sellerUpdated) {
      detectedIntent = 'seller_offer_form';
      propertiesToReturn = [];
      allPropertiesToReturn = [];
      totalMatches = 0;
      if (!finalContent || !didAssistantOfferSellerForm(finalContent)) {
        finalContent = sellerBotCopy.suggestOfferText;
      }
      sessionContext = updateSessionContext(sessionContext, {
        pendingSellerFormOffer: true,
        sellerPrefill: activeSellerPrefill,
        phoneShared: Boolean(extractedPhone),
      });
    } else if (didAssistantOfferSellerForm(finalContent) && !openSellerModal) {
      sessionContext = updateSessionContext(sessionContext, {
        pendingSellerFormOffer: true,
        sellerPrefill: activeSellerPrefill,
      });
    }

    // 4. DETERMINISTIC FALLBACK ENGINE (if DeepSeek is offline, failed, or freeTest requested)
    if (!finalContent) {
      const analysis = analyzeUserQuery(userMessage);
      detectedIntent = analysis.intent;
      const isGeneral = analysis.intent === 'general';

      let matchedProperties: Property[] = [];
      if (!isGeneral) {
        matchedProperties = await queryProperties(analysis.filter);
      }

      const featuredOpportunities = await getFeaturedOpportunities();
      
      const hasSpecificFilter = Boolean(analysis.filter.unit_type || analysis.filter.target_price || analysis.filter.location);
      if (isGeneral) {
        propertiesToReturn = [];
      } else if (matchedProperties.length > 0) {
        const capped = matchedProperties.slice(0, 12);
        propertiesToReturn = capped.slice(0, 4);
        totalMatches = capped.length;
        allPropertiesToReturn = capped;
      } else if (!hasSpecificFilter) {
        propertiesToReturn = featuredOpportunities.slice(0, 4);
      } else {
        propertiesToReturn = [];
      }

      sessionContext = updateSessionContext(sessionContext, {
        searchArgs: !isGeneral ? (analysis.filter as any) : null,
        shown: propertiesToReturn,
        total: totalMatches,
        phoneShared: Boolean(extractedPhone),
      });

      const formatted = formatGroundedBrokerResponse(
        userMessage,
        analysis,
        matchedProperties,
        featuredOpportunities,
        locale
      );
      finalContent = formatted.content;
    }

    // 5. Auto-record Lead if phone was extracted
    if (extractedPhone && !userWantsToSell && !openSellerModal) {
      try {
        const leadName = body.userName || (userEmail ? userEmail.split('@')[0] : 'عميل مهتم من الشات');
        await supabaseAdmin.from('leads_inquiries').insert([{
          user_name: leadName,
          phone: extractedPhone,
          email: userEmail,
          property_id: propertiesToReturn[0]?.id || null,
          unit_title: propertiesToReturn[0]?.title || null,
          developer_name: propertiesToReturn[0]?.compound?.developer?.name || null,
          notes: `طلب واستفسار مباشر عبر الشات: "${userMessage}"`,
          source: 'chat_conversation',
          status: 'جديد',
          user_id: userId || null,
          session_id: sessionId || null,
        }]);

        await notifyNewLead({
          name: leadName,
          phone: extractedPhone,
          email: userEmail,
          unitTitle: propertiesToReturn[0]?.title || null,
          developer: propertiesToReturn[0]?.compound?.developer?.name || null,
          notes: userMessage,
          source: 'الشات',
        });

        if (!finalContent.includes(extractedPhone)) {
          const ack = locale === 'ar'
            ? `✅ **تم تسجيل رقم هاتفك (${extractedPhone}) وتفاصيل طلبك بنجاح!**\nكشات بوت مستشارك الذكي، هدفي هو توفير وقتك وربطك مباشرة بصاحب الوحدة أو إدارة المبيعات الرسمية للمشروع لتحديد موعد المعاينة بدون أي إزعاج.\n\n`
            : `✅ **Your contact number (${extractedPhone}) and request have been recorded!**\nAs your AI advisor, my goal is to connect you directly with the property owner/developer for official viewing.\n\n`;
          finalContent = ack + finalContent;
        }
      } catch (leadSaveErr) {
        console.error('Lead auto-save error:', leadSaveErr);
      }
    }

    const baseSuggestedActions = locale === 'ar' 
      ? ['طلب استشارة ومعاينة مجانية 📅', 'حساب خطة الأقساط الشهرية 💰', 'عقارات في دبي والإمارات 🇦🇪']
      : ['Book Free Viewing 📅', 'Calculate Monthly Installments 💰', 'Dubai & UAE Properties 🇦🇪'];

    const defaultSuggestedActions = sessionContext.pending_seller_form_offer
      ? [sellerBotCopy.openFormChip, ...baseSuggestedActions.slice(0, 2)]
      : baseSuggestedActions;

    // 6. Store message pair in Supabase chat_sessions & chat_messages tables for auditing & CRM
    if (sessionId) {
      try {
        const dbSessionId = await ensureChatSession(sessionId, userMessage, userId);
        if (dbSessionId) {
          await supabaseAdmin.from('chat_messages').insert([
            {
              session_id: dbSessionId,
              role: 'user',
              content: userMessage,
              is_deleted: false,
            },
            {
              session_id: dbSessionId,
              role: 'assistant',
              content: finalContent,
              is_deleted: false,
              metadata: {
                properties_count: propertiesToReturn.length,
                property_ids: propertiesToReturn.map(p => p.id),
                open_seller_modal: openSellerModal,
                ai_model: (isDeepSeekConfigured() && !freeTest) ? 'deepseek-agentic' : 'grounded-engine',
                usage: { used: usage.used, limit: usage.limit, remaining: usage.remaining },
              }
            }
          ]);
        }
      } catch (logErr) {
        console.error('Failed to log chat message to Supabase:', logErr);
      }
    }

    return withGuestCookie(NextResponse.json({
      success: true,
      role: 'assistant',
      content: finalContent,
      properties: propertiesToReturn,
      allProperties: slimForTable(allPropertiesToReturn),
      totalMatches,
      sessionContext,
      sellerUpdated,
      openSellerModal,
      sellerModalMode: 'create',
      sellerPrefill: openSellerModal ? activeSellerPrefill : undefined,
      myListings: sellerUpdated ? await getSellerProperties(sellerOwnerId) : undefined,
      suggestedActions: defaultSuggestedActions,
      intent: detectedIntent,
      aiProvider: (isDeepSeekConfigured() && !freeTest) ? 'deepseek-agentic' : 'grounded-engine',
      usage: toPublicUsage(usage),
    }));

  } catch (error: any) {
    console.error('Real Estate Chat Route Error:', error);
    // Don't charge the user for a request that crashed
    if (usage?.allowed) {
      try { await usage.refund(); } catch {}
    }
    return withGuestCookie(NextResponse.json(
      { 
        error: 'حدث خطأ أثناء معالجة استفسارك العقاري. يرجى المحاولة مرة أخرى.',
      },
      { status: 500 }
    ));
  }
}
