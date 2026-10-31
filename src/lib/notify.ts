import 'server-only';

/**
 * Instant owner notification for new leads (hot real-estate leads go cold fast).
 * Uses a Telegram bot — free and instant on your phone.
 *
 * Setup:
 *  1. Open @BotFather on Telegram -> /newbot -> copy the token  => TELEGRAM_BOT_TOKEN
 *  2. Send any message to your new bot, then open
 *     https://api.telegram.org/bot<TOKEN>/getUpdates and copy "chat":{"id":...} => TELEGRAM_CHAT_ID
 * If the env vars are missing, notifications are silently skipped.
 */
export interface LeadNotification {
  name?: string | null;
  phone: string;
  email?: string | null;
  unitTitle?: string | null;
  developer?: string | null;
  location?: string | null;
  budget?: number | string | null;
  notes?: string | null;
  source: string;
}

function esc(s: unknown): string {
  return String(s ?? '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string)).slice(0, 600);
}

export async function notifyNewLead(lead: LeadNotification): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const digits = lead.phone.replace(/\D/g, '');
  const waNumber = digits.startsWith('0') ? `2${digits}` : digits;

  const lines = [
    '🔥 <b>عميل جديد - سكني بوت</b>',
    `👤 الاسم: ${esc(lead.name || 'غير محدد')}`,
    `📞 الموبايل: <code>${esc(lead.phone)}</code>`,
    lead.email ? `✉️ الإيميل: ${esc(lead.email)}` : '',
    lead.unitTitle ? `🏠 الوحدة: ${esc(lead.unitTitle)}` : '',
    lead.developer ? `🏗️ المطور: ${esc(lead.developer)}` : '',
    lead.location ? `📍 المنطقة: ${esc(lead.location)}` : '',
    lead.budget ? `💰 الميزانية: ${esc(lead.budget)}` : '',
    lead.notes ? `📝 ${esc(lead.notes)}` : '',
    `🔗 المصدر: ${esc(lead.source)}`,
    waNumber.length >= 10 ? `💬 <a href="https://wa.me/${waNumber}">كلمه واتساب دلوقتي</a>` : '',
  ].filter(Boolean);

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: lines.join('\n'), parse_mode: 'HTML', disable_web_page_preview: true }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    console.warn('[notify] Telegram lead notification failed:', err);
  }
}
