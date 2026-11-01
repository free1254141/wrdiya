import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CHAT_ID_FILE = path.join(process.cwd(), '.telegram_chat_id.json');

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const message = update?.message || update?.channel_post || update?.callback_query?.message;

    if (message?.chat?.id) {
      const chatId = String(message.chat.id);
      const username = message.chat.username || message.chat.first_name || 'Admin';
      const firstName = message.chat.first_name || username;

      // Save to disk
      try {
        fs.writeFileSync(
          CHAT_ID_FILE,
          JSON.stringify({
            chatId,
            user: username,
            name: `${message.chat.first_name || ''} ${message.chat.last_name || ''}`.trim() || username,
            updated_at: new Date().toISOString(),
          }),
          'utf-8'
        );
      } catch (e) {
        console.warn('[telegram-webhook] Failed to write chat ID to disk:', e);
      }

      // If user sent /start or any message, send a welcome greeting
      const text = message.text || '';
      const token = process.env.TELEGRAM_BOT_TOKEN;
      if (token && (text.startsWith('/start') || text.startsWith('/help'))) {
        const welcomeHtml = [
          `🤖 <b>أهلاً بك يا ${firstName} في سكني بوت (SakanyBot)! 👋</b>`,
          '━━━━━━━━━━━━━━━━━━',
          '✅ <b>تم ربط وتفعيل حسابك الإشرافي بنجاح!</b>',
          'ستصلك هنا إشعارات فورية لكل من:',
          '1️⃣ <b>طلبات المعاينة وحجز المواعيد</b> فور إدخال العميل لرقم هاتفه.',
          '2️⃣ <b>تسجيل المشترين في قائمة التنبيهات الذكية (Wishlist)</b>.',
          '3️⃣ <b>الوحدات الجديدة المعروضة للبيع</b> من الملاك مباشرة.',
          '4️⃣ <b>التطابق الذكي الفوري</b> بين المشترين والوحدات المعروضة.',
          '━━━━━━━━━━━━━━━━━━',
          '⚡ <i>النظام متصل ونشط لحظياً.</i>',
        ].join('\n');

        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: welcomeHtml,
            parse_mode: 'HTML',
          }),
        }).catch((err) => console.warn('[telegram-webhook] Failed to send welcome:', err));
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[telegram-webhook] Error processing update:', error);
    return NextResponse.json({ ok: true }); // Return 200 so Telegram doesn't retry infinitely
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'SakanyBot Telegram Webhook',
    timestamp: new Date().toISOString(),
  });
}
