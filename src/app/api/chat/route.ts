import { NextRequest, NextResponse } from 'next/server';
import { 
  analyzeUserQuery, 
  queryProperties, 
  getFeaturedOpportunities, 
  formatGroundedBrokerResponse 
} from '@/lib/real-estate-engine';
import { generateDeepSeekBrokerReply, isDeepSeekConfigured } from '@/lib/deepseek';
import { checkAndIncrementUsage, SubscriptionPlan } from '@/lib/usage-manager';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://csuifvyghfsibkrnxrby.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

/**
 * Ensure a chat session exists in Supabase.
 * Returns the UUID session id for foreign key linking.
 */
async function ensureChatSession(sessionId: string, title: string): Promise<string | null> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId);

    if (isUuid) {
      const { data: existing } = await supabaseAdmin
        .from('chat_sessions')
        .select('id')
        .eq('id', sessionId)
        .maybeSingle();

      if (existing) {
        return existing.id;
      }

      const { data: created, error } = await supabaseAdmin
        .from('chat_sessions')
        .insert({
          id: sessionId,
          session_token: sessionId,
          title: title.slice(0, 80),
          is_deleted: false,
        })
        .select('id')
        .single();

      if (!error && created) return created.id;
    } else {
      const { data: existing } = await supabaseAdmin
        .from('chat_sessions')
        .select('id')
        .eq('session_token', sessionId)
        .maybeSingle();

      if (existing) {
        return existing.id;
      }

      const { data: created, error } = await supabaseAdmin
        .from('chat_sessions')
        .insert({
          session_token: sessionId,
          title: title.slice(0, 80),
          is_deleted: false,
        })
        .select('id')
        .single();

      if (!error && created) return created.id;
    }
  } catch (err) {
    console.error('ensureChatSession error:', err);
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userMessage = body.message || body.prompt || (body.messages && body.messages.length > 0 ? body.messages[body.messages.length - 1].content : '');
    const sessionId = body.sessionId || body.session_id;
    const clientId = body.clientId || sessionId || req.headers.get('x-forwarded-for') || 'guest_user';
    const userPlan: SubscriptionPlan = body.plan === 'pro' ? 'pro' : 'free';
    const locale = (['ar', 'en', 'tr', 'ru', 'de', 'fr', 'es'].includes(body.locale) ? body.locale : 'ar');
    const freeTest = body.freeTest || body.bypassDeepSeek || body.engineOnly || false;

    if (!userMessage || !userMessage.trim()) {
      return NextResponse.json(
        { error: locale === 'ar' ? 'من فضلك أدخل سؤالك العقاري أو نوع الوحدة التي تبحث عنها.' : 'Please enter your property inquiry or preferred unit type.' },
        { status: 400 }
      );
    }

    // 1. Quota & Usage Enforcement (Free: 30 / month, Pro: 300 / month)
    const usage = checkAndIncrementUsage(clientId, userPlan, true);
    if (usage.exceeded) {
      return NextResponse.json(
        {
          success: false,
          error: 'quota_exceeded',
          message: locale === 'ar'
            ? `لقد استهلكت رصيدك الشهري المتاح (${usage.limit} استفسار). قم بالترقية لخطة Pro للحصول على 300 استفسار شهرياً!`
            : `You have reached your monthly quota of ${usage.limit} queries. Upgrade to Pro for 300 queries/month!`,
          usage,
        },
        { status: 429 }
      );
    }

    // 2. Analyze query constraints & intent (Anti-Hallucination filter extractor)
    const analysis = analyzeUserQuery(userMessage);

    // 3. Fetch grounded properties from Supabase matching the exact constraints
    const matchedProperties = await queryProperties(analysis.filter);

    // 4. Fetch featured opportunities for realistic fallbacks
    const featuredOpportunities = await getFeaturedOpportunities();

    // 5. Build Grounded Response:
    // If freeTest / bypassDeepSeek is requested, use the fast 0-cost local grounded engine
    let finalContent = '';
    const propertiesToReturn = matchedProperties.length > 0 ? matchedProperties : featuredOpportunities.slice(0, 4);

    if (isDeepSeekConfigured() && !freeTest) {
      try {
        const history = (body.messages || []).map((m: any) => ({
          role: m.role || 'user',
          content: m.content || '',
        }));
        const deepSeekReply = await generateDeepSeekBrokerReply(userMessage, propertiesToReturn, locale, history);
        if (deepSeekReply && deepSeekReply.trim().length > 20) {
          finalContent = deepSeekReply;
        }
      } catch (aiErr) {
        console.warn('DeepSeek generation failed, falling back to rule engine:', aiErr);
      }
    }

    // Fallback to deterministic grounded broker response if DeepSeek not configured, failed, or freeTest requested
    if (!finalContent) {
      const formatted = formatGroundedBrokerResponse(
        userMessage,
        analysis,
        matchedProperties,
        featuredOpportunities,
        locale
      );
      finalContent = formatted.content;
    }

    const defaultSuggestedActions = locale === 'ar' 
      ? ['طلب استشارة ومعاينة مجانية 📅', 'حساب خطة الأقساط الشهرية 💰', 'عقارات في دبي والإمارات 🇦🇪']
      : ['Book Free Viewing 📅', 'Calculate Monthly Installments 💰', 'Dubai & UAE Properties 🇦🇪'];

    // 6. Store message pair in Supabase chat_sessions & chat_messages tables for auditing & CRM
    if (sessionId) {
      try {
        const dbSessionId = await ensureChatSession(sessionId, userMessage);
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
                ai_model: (isDeepSeekConfigured() && !freeTest) ? 'deepseek-chat' : 'grounded-engine',
                usage: { used: usage.used, limit: usage.limit, plan: usage.plan },
              }
            }
          ]);
        }
      } catch (logErr) {
        console.error('Failed to log chat message to Supabase:', logErr);
      }
    }

    return NextResponse.json({
      success: true,
      role: 'assistant',
      content: finalContent,
      properties: propertiesToReturn,
      suggestedActions: defaultSuggestedActions,
      intent: analysis.intent,
      filterApplied: analysis.filter,
      aiProvider: (isDeepSeekConfigured() && !freeTest) ? 'deepseek' : 'grounded-engine',
      usage: {
        used: usage.used,
        limit: usage.limit,
        plan: usage.plan,
        remaining: usage.remaining,
        resetDate: usage.resetDate,
      },
    });

  } catch (error: any) {
    console.error('Real Estate Chat Route Error:', error);
    return NextResponse.json(
      { 
        error: 'حدث خطأ أثناء معالجة استفسارك العقاري. يرجى المحاولة مرة أخرى.',
        details: error?.message 
      },
      { status: 500 }
    );
  }
}
