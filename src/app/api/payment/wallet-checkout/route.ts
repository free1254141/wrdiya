import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedUser, getGuestId, getClientIpHash } from '@/lib/server-auth';
import { grantPro, getActivePlan, toPublicUsage } from '@/lib/usage-manager';
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
    const { 
      senderPhone, 
      transferMethod = 'فودافون كاش', 
      senderName, 
      notes 
    } = body || {};

    const cleanSenderPhone = String(senderPhone || '').trim();
    const phoneDigits = cleanSenderPhone.replace(/\D/g, '');

    if (phoneDigits.length < 8) {
      return NextResponse.json(
        { error: 'يرجى إدخال رقم المحفظة أو الحساب المحول منه بشكل صحيح' },
        { status: 400 }
      );
    }

    const user = await getVerifiedUser(req);
    const { guestId } = getGuestId(req);
    const ipHash = getClientIpHash(req);

    // User identifier for Pro subscription
    const targetUserId = user?.id || `guest_${guestId || ipHash}`;
    const userEmail = user?.email || null;
    const clientName = (senderName || (user as any)?.name || userEmail || '').trim() || 'مشترك برو (تحويل محفظة)';

    // 1. Instantly activate Pro plan for the user (30 days, 300 queries)
    let proResult;
    try {
      proResult = await grantPro(targetUserId, 30);
    } catch (grantErr: any) {
      console.error('[wallet-checkout] grantPro error:', grantErr);
      // Fallback: If guest or constraint error, persist in usage_counters
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

    // 2. Record payment inquiry / audit in Supabase
    try {
      await supabaseAdmin.from('leads_inquiries').insert([{
        user_name: clientName,
        phone: cleanSenderPhone,
        email: userEmail,
        source: 'wallet_payment_01024359109',
        status: 'مكتمل - تفعيل فوري',
        user_id: user?.id || null,
        budget_max: PRO_PRICE_EGP,
        payment_method: `${transferMethod} -> ${OFFICIAL_WALLET_NUMBER}`,
        notes: `تحويل محفظة/إنستاباي لرقم ${OFFICIAL_WALLET_NUMBER} بمبلغ ${PRO_PRICE_EGP} ج.م. تفعيل فوري لباقة Pro. ملاحظات العميل: ${notes || 'لا يوجد'}`,
      }]);
    } catch (dbErr) {
      console.warn('[wallet-checkout] Failed to log lead in Supabase:', dbErr);
    }

    // 3. Dispatch instant Telegram alert to the support channel
    const nowTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });
    const nowDate = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
    
    let waPhone = phoneDigits;
    if (waPhone.startsWith('0') && waPhone.length === 11) {
      waPhone = `2${waPhone}`;
    }
    const waLink = `https://wa.me/${waPhone}?text=${encodeURIComponent(`مرحباً أستاذ ${clientName}، شكراً لاشتراكك في باقة Pro على منصة سكنى بوت، تم تفعيل باقتك فوراً بنجاح.`)}`;

    const telegramMsg = [
      '💎 <b>طلب اشتراك Pro جديد وتفعيل فوري!</b>',
      '━━━━━━━━━━━━━━━━━━',
      `👤 <b>الاسم:</b> ${esc(clientName)}`,
      userEmail ? `✉️ <b>البريد الإلكتروني:</b> <code>${esc(userEmail)}</code>` : '',
      `📱 <b>رقم المحفظة المحول منها:</b> <code>${esc(cleanSenderPhone)}</code>`,
      `💳 <b>طريقة التحويل:</b> ${esc(transferMethod)}`,
      `🎯 <b>المحفظة المستلمة:</b> <code>${OFFICIAL_WALLET_NUMBER}</code>`,
      `💰 <b>المبلغ المطلوب:</b> ${PRO_PRICE_EGP} ج.م`,
      `⚡ <b>حالة الباقة:</b> <b>تم التفعيل فوراً للعميل الآن (300 استفسار Pro) ✅</b>`,
      `📅 <b>التاريخ والتوقيت:</b> ${nowDate} - ${nowTime}`,
      notes ? `📝 <b>ملاحظة العميل / كود العملية:</b> ${esc(notes)}` : '',
      '━━━━━━━━━━━━━━━━━━',
      `💬 <a href="${waLink}"><b>فتح محادثة واتساب فوري مع العميل للتحقق</b></a>`,
      `📋 <a href="https://sakanybot.vercel.app/admin"><b>لوحة تحكم الإدارة</b></a>`,
    ].filter(Boolean).join('\n');

    await sendTelegramMessage(telegramMsg).catch((tErr) => {
      console.warn('[wallet-checkout] Telegram notification failed:', tErr);
    });

    return NextResponse.json({
      success: true,
      message: 'مبروك! تم تفعيل باقة برو (Pro) فوراً لحسابك بنجاح 🚀',
      plan: 'pro',
      limit: 300,
      remaining: 300,
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
