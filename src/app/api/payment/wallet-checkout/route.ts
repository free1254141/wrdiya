import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedUser, getGuestId, getClientIpHash } from '@/lib/server-auth';
import { grantPro } from '@/lib/usage-manager';
import { sendTelegramMessage } from '@/lib/notify';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://csuifvyghfsibkrnxrby.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const OFFICIAL_WALLET_NUMBER = '01024359109';
const PRO_PRICE_EGP = 250;

function esc(s: any): string {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { senderPhone } = body || {};

    const cleanSenderPhone = String(senderPhone || '').trim();
    const phoneDigits = cleanSenderPhone.replace(/\D/g, '');

    if (!/^01[0125]\d{8}$/.test(phoneDigits)) {
      return NextResponse.json(
        { error: 'يرجى إدخال رقم هاتف مصري كامل مكون من 11 رقماً يبدأ بـ (010 أو 011 أو 012 أو 015)' },
        { status: 400 }
      );
    }

    const user = await getVerifiedUser(req);
    const { guestId } = getGuestId(req);
    const ipHash = getClientIpHash(req);

    // Target User ID for Pro plan allocation
    const targetUserId = user?.id || `guest_${guestId || ipHash}`;
    const userEmail = user?.email || null;
    const clientName = ((user as any)?.name || userEmail?.split('@')[0] || '').trim() || 'مشترك برو (تحويل فوري)';

    // 1. Instantly activate Pro plan for the user (30 days, 300 queries)
    let proResult;
    try {
      proResult = await grantPro(targetUserId, 30);
    } catch (grantErr: any) {
      console.error('[wallet-checkout] grantPro error:', grantErr);
      try {
        await supabaseAdmin.from('user_plans').upsert({
          user_id: targetUserId,
          plan: 'pro',
          pro_until: new Date(Date.now() + 30 * 86400000).toISOString(),
          period_start: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      } catch (upsertErr) {
        console.warn('[wallet-checkout] fallback upsert failed:', upsertErr);
      }
    }

    // 2. Bind phone number to user profile and account if authenticated
    if (user?.id) {
      try {
        await supabaseAdmin.from('user_profiles').upsert({
          id: user.id,
          phone: cleanSenderPhone,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      } catch (profileErr) {
        // non-blocking
      }

      try {
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          user_metadata: { phone: cleanSenderPhone },
        });
      } catch (metaErr) {
        // non-blocking
      }
    }

    // 3. Record payment inquiry / audit in Supabase
    try {
      await supabaseAdmin.from('leads_inquiries').insert([{
        user_name: clientName,
        phone: cleanSenderPhone,
        email: userEmail,
        source: 'wallet_payment_01024359109',
        status: 'مكتمل - تفعيل فوري',
        user_id: user?.id || null,
        budget_max: PRO_PRICE_EGP,
        payment_method: `تحويل فودافون كاش -> ${OFFICIAL_WALLET_NUMBER}`,
        notes: `تحويل مبلغ ${PRO_PRICE_EGP} ج.م على فودافون كاش لرقم ${OFFICIAL_WALLET_NUMBER}. تم ربط الهاتف بحساب العميل وتفعيل باقة Pro فوراً.`,
      }]);
    } catch (dbErr) {
      console.warn('[wallet-checkout] Failed to log lead in Supabase:', dbErr);
    }

    // 4. Dispatch instant Telegram alert to the support channel
    const nowTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });
    const nowDate = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
    
    let waPhone = phoneDigits;
    if (waPhone.startsWith('0') && waPhone.length === 11) {
      waPhone = `2${waPhone}`;
    }
    const waLink = `https://wa.me/${waPhone}?text=${encodeURIComponent(`مرحباً أستاذ ${clientName}، شكراً لتحويلك على سكنى بوت، تم تفعيل باقة Pro وربط رقم هاتفك بحسابك فوراً بنجاح.`)}`;

    const telegramMsg = [
      '💎 <b>اشتراك Pro جديد — تفعيل فوري وربط هاتف!</b>',
      '━━━━━━━━━━━━━━━━━━',
      `👤 <b>المستخدم:</b> ${esc(clientName)}`,
      userEmail ? `✉️ <b>البريد الإلكتروني:</b> <code>${esc(userEmail)}</code>` : '',
      `📱 <b>رقم هاتف العميل:</b> <code>${esc(cleanSenderPhone)}</code>`,
      `🎯 <b>المحفظة المستلمة:</b> <code>${OFFICIAL_WALLET_NUMBER}</code>`,
      `💰 <b>المبلغ:</b> ${PRO_PRICE_EGP} ج.م`,
      `⚡ <b>الحالة:</b> <b>تم ربط الهاتف بحسابه وتفعيل باقة Pro فوراً (300 استفسار) ✅</b>`,
      `📅 <b>التوقيت:</b> ${nowDate} - ${nowTime}`,
      '━━━━━━━━━━━━━━━━━━',
      `💬 <a href="${waLink}"><b>فتح محادثة واتساب فوري مع العميل</b></a>`,
      `📋 <a href="https://ewanbot.com/admin"><b>لوحة تحكم الإدارة</b></a>`,
    ].filter(Boolean).join('\n');

    await sendTelegramMessage(telegramMsg).catch((tErr) => {
      console.warn('[wallet-checkout] Telegram notification failed:', tErr);
    });

    return NextResponse.json({
      success: true,
      message: 'مبروك! تم ربط رقم هاتفك وتفعيل باقة برو (Pro) فوراً لحسابك 🚀',
      plan: 'pro',
      limit: 300,
      remaining: 300,
      phone: cleanSenderPhone,
      proUntil: proResult?.proUntil || new Date(Date.now() + 30 * 86400000).toISOString(),
    });
  } catch (error: any) {
    console.error('Wallet checkout error:', error);
    return NextResponse.json(
      { error: error?.message || 'حدث خطأ أثناء معالجة التفعيل' },
      { status: 500 }
    );
  }
}
