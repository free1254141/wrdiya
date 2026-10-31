import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getTelegramDiagnostics, sendTelegramMessage } from '@/lib/notify';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const diag = await getTelegramDiagnostics();
  return NextResponse.json({
    success: true,
    diagnostics: diag,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const now = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });
  const testHtml = [
    '🤖 <b>تجربة إشعار من سكني بوت (SakanyBot)</b>',
    '━━━━━━━━━━━━━━━━━━',
    '✅ <b>تم ربط بوت التليجرام بنجاح!</b>',
    `⏰ التوقيت: ${now}`,
    'ستصلك هنا إشعارات فورية عند:',
    '1️⃣ إضافة أي وحدة جديدة للبيع من الملاك مباشرة',
    '2️⃣ تسجيل أي عميل لبياناته أو طلب معاينة عقار',
    '━━━━━━━━━━━━━━━━━━',
    '⚡ <i>سكني بوت يعمل بنظام التنبيهات اللحظية بدون تأخير.</i>',
  ].join('\n');

  const sent = await sendTelegramMessage(testHtml);
  if (sent) {
    return NextResponse.json({
      success: true,
      message: 'تم إرسال إشعار تجريبي إلى حسابك على تليجرام بنجاح! 🎉',
    });
  } else {
    return NextResponse.json({
      success: false,
      message: 'تعذر إرسال الإشعار. يرجى التأكد من الضغط على /start في محادثة البوت على تليجرام: https://t.me/sakanyBOT_SUPPORT_BOT',
    }, { status: 400 });
  }
}
