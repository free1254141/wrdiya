import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { B2BServiceType, calculateB2BPricing } from '@/lib/b2b-pricing';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const companyName = String(body.company_name || '').trim();
    const contactName = String(body.contact_name || '').trim();
    const phone = String(body.phone || '').trim();
    const email = String(body.email || '').trim();
    const monthlyUsers = Number(body.monthly_users || 1000);
    const serviceType = (['widget', 'api', 'both'].includes(body.service_type)
      ? body.service_type
      : 'both') as B2BServiceType;

    if (!companyName || !phone) {
      return NextResponse.json(
        { success: false, error: 'يرجى إدخال اسم الشركة ورقم الهاتف/الواتساب.' },
        { status: 400 }
      );
    }

    const quote = calculateB2BPricing(monthlyUsers, serviceType);
    const trialApiKey = `ewan_trial_${crypto.randomBytes(8).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

    const admin = getSupabaseAdmin();
    if (admin) {
      const { error } = await admin.from('b2b_partner_trials').insert({
        company_name: companyName,
        contact_name: contactName || null,
        phone,
        email: email || null,
        service_type: serviceType,
        monthly_users: Math.max(100, Math.round(monthlyUsers || 1000)),
        estimated_price_egp: quote.monthlyPriceEgp,
        tier_name: quote.tierName,
        trial_api_key: trialApiKey,
        status: 'active',
        expires_at: expiresAt,
      });

      if (error) {
        return NextResponse.json(
          { success: false, error: 'تعذر حفظ طلب التجربة: ' + error.message },
          { status: 500 }
        );
      }

      await admin.from('page_analytics_events').insert({
        session_id: String(body.session_id || 'b2b_partners'),
        page_path: '/partners',
        event_type: 'b2b_trial_activated',
        metadata: {
          company_name: companyName,
          monthly_users: monthlyUsers,
          estimated_price_egp: quote.monthlyPriceEgp,
          service_type: serviceType,
        },
      });
    }

    // Best-effort Telegram notification to admin
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (botToken && chatId) {
      const text =
        `🚀 *طلب تجربة 3 أيام B2B جديد!*\n` +
        `🏢 الشركة: ${companyName}\n` +
        `👤 المسؤول: ${contactName || 'غير محدد'}\n` +
        `📱 واتساب: ${phone}\n` +
        `👥 المستخدمين/شهر: ${monthlyUsers.toLocaleString('en-US')}\n` +
        `💰 التسعير المقدر: ${quote.monthlyPriceEgp.toLocaleString('en-US')} ج.م/شهر (${quote.tierName})\n` +
        `🔑 مفتاح التجربة: \`${trialApiKey}\``;
      fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      trial: {
        company_name: companyName,
        trial_api_key: trialApiKey,
        expires_at: expiresAt,
        trial_days: 3,
        tier_name: quote.tierName,
        estimated_price_egp: quote.monthlyPriceEgp,
        monthly_users: monthlyUsers,
        service_type: serviceType,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Unexpected error' },
      { status: 500 }
    );
  }
}
