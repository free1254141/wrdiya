import { NextRequest, NextResponse } from 'next/server';
import { 
  analyzeUserQuery, 
  queryProperties, 
  getFeaturedOpportunities, 
  formatGroundedBrokerResponse 
} from '@/lib/real-estate-engine';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://csuifvyghfsibkrnxrby.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userMessage = body.message || body.prompt || (body.messages && body.messages.length > 0 ? body.messages[body.messages.length - 1].content : '');
    const sessionId = body.sessionId || body.session_id;
    const locale = (['ar', 'en', 'tr', 'ru', 'de', 'fr', 'es'].includes(body.locale) ? body.locale : 'ar');

    if (!userMessage || !userMessage.trim()) {
      return NextResponse.json(
        { error: locale === 'ar' ? 'من فضلك أدخل سؤالك العقاري أو نوع الوحدة التي تبحث عنها.' : 'Please enter your property inquiry or preferred unit type.' },
        { status: 400 }
      );
    }

    // 1. Analyze query constraints & intent (Anti-Hallucination filter extractor)
    const analysis = analyzeUserQuery(userMessage);

    // 2. Fetch grounded properties from Supabase matching the exact constraints
    const matchedProperties = await queryProperties(analysis.filter);

    // 3. Fetch featured opportunities for realistic fallbacks
    const featuredOpportunities = await getFeaturedOpportunities();

    // 4. Format grounded response strictly backed by database evidence
    const formatted = formatGroundedBrokerResponse(
      userMessage,
      analysis,
      matchedProperties,
      featuredOpportunities,
      locale
    );

    // 5. If sessionId is provided, store message pair in chat_messages table
    if (sessionId) {
      try {
        await supabaseAdmin.from('chat_messages').insert([
          {
            session_id: sessionId,
            role: 'user',
            content: userMessage,
          },
          {
            session_id: sessionId,
            role: 'assistant',
            content: formatted.content,
            metadata: {
              properties_count: formatted.properties.length,
              property_ids: formatted.properties.map(p => p.id),
              suggested_actions: formatted.suggestedActions
            }
          }
        ]);
      } catch (logErr) {
        console.error('Failed to log chat message to Supabase:', logErr);
      }
    }

    return NextResponse.json({
      success: true,
      role: 'assistant',
      content: formatted.content,
      properties: formatted.properties,
      suggestedActions: formatted.suggestedActions,
      intent: analysis.intent,
      filterApplied: analysis.filter
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
