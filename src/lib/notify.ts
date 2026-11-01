import 'server-only';
import fs from 'fs';
import path from 'path';

/**
 * Instant Telegram notifications for leads, seller listings, and wishlist alerts.
 * Target bot: https://t.me/sakanyBOT_SUPPORT_BOT
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
  paymentMethod?: string | null;
}

export interface SellerPropertyNotification {
  id?: string;
  title: string;
  unitType?: string | null;
  areaSqm?: number | string | null;
  totalPrice?: number | string | null;
  city?: string | null;
  location?: string | null;
  paymentMethod?: string | null;
  downPayment?: number | string | null;
  monthlyInstallment?: number | string | null;
  sellerName?: string | null;
  sellerPhone?: string | null;
  saleCircumstances?: string | null;
  imagesCount?: number;
}

export interface WishlistAlertNotification {
  name?: string | null;
  phone: string;
  email?: string | null;
  location: string;
  unitType?: string | null;
  budget?: number | string | null;
  paymentMethod?: string | null;
  notes?: string | null;
}

export interface BuyerSellerMatchNotification {
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string | null;
  buyerBudget?: number | string | null;
  propertyTitle: string;
  propertyLocation: string;
  propertyPrice: number | string;
  sellerName?: string | null;
  sellerPhone?: string | null;
}

let cachedChatId: string | null = null;
const CHAT_ID_FILE = path.join(process.cwd(), '.telegram_chat_id.json');

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .slice(0, 800);
}

function formatWhatsAppLink(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (!digits || digits.length < 8) return null;
  let waNumber = digits;
  if (waNumber.startsWith('01') && waNumber.length === 11) {
    waNumber = `2${waNumber}`;
  } else if (waNumber.startsWith('0') && !waNumber.startsWith('00')) {
    waNumber = `2${waNumber}`;
  }
  return `https://wa.me/${waNumber}`;
}

function formatEGP(val: unknown): string {
  const num = Number(val);
  if (!num || isNaN(num)) return String(val || '');
  return `${num.toLocaleString('ar-EG')} ج.م`;
}

/**
 * Resolves the Telegram chat ID:
 * 1. Env variable TELEGRAM_CHAT_ID / TELEGRAM_ADMIN_CHAT_ID
 * 2. In-memory cache
 * 3. Local disk cache file (.telegram_chat_id.json)
 * 4. Automatic discovery via Telegram getUpdates API (finding who pressed /start)
 */
export async function getAdminChatId(token: string): Promise<string | null> {
  const envChatId = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (envChatId && envChatId.trim()) {
    return envChatId.trim();
  }

  if (cachedChatId) {
    return cachedChatId;
  }

  try {
    if (fs.existsSync(CHAT_ID_FILE)) {
      const raw = fs.readFileSync(CHAT_ID_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data?.chatId) {
        cachedChatId = String(data.chatId);
        return cachedChatId;
      }
    }
  } catch (err) {
    // ignore disk cache read error
  }

  // Auto-discover via getUpdates
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=20`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(6000),
      cache: 'no-store'
    });
    if (!res.ok) return null;

    const body = await res.json();
    if (body.ok && Array.isArray(body.result) && body.result.length > 0) {
      for (let i = body.result.length - 1; i >= 0; i--) {
        const update = body.result[i];
        const chat = update.message?.chat || update.channel_post?.chat || update.callback_query?.message?.chat;
        if (chat?.id) {
          const foundId = String(chat.id);
          cachedChatId = foundId;
          try {
            fs.writeFileSync(CHAT_ID_FILE, JSON.stringify({ chatId: foundId, updated_at: new Date().toISOString(), user: chat.username || chat.first_name }), 'utf-8');
          } catch {}
          return foundId;
        }
      }
    }
  } catch (err) {
    console.warn('[notify] Failed to discover Telegram chat ID from getUpdates:', err);
  }

  return null;
}

/**
 * Send a generic HTML message to the admin Telegram chat
 */
export async function sendTelegramMessage(htmlContent: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn('[notify] TELEGRAM_BOT_TOKEN is not configured in .env.local');
    return false;
  }

  const chatId = await getAdminChatId(token);
  if (!chatId) {
    console.warn('[notify] Telegram chat ID not found. Open https://t.me/sakanyBOT_SUPPORT_BOT and send /start');
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: htmlContent,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(7000),
    });

    const result = await response.json();
    if (!result.ok) {
      console.warn('[notify] Telegram sendMessage error:', result.description);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[notify] Telegram send failed:', err);
    return false;
  }
}

/**
 * Notify admin when a user submits contact info or viewing request
 */
export async function notifyNewLead(lead: LeadNotification): Promise<void> {
  const waLink = formatWhatsAppLink(lead.phone);
  const now = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });

  const lines = [
    '🔔 <b>طلب معاينة / بيانات اتصال جديدة!</b>',
    '━━━━━━━━━━━━━━━━━━',
    `👤 <b>الاسم:</b> ${esc(lead.name || 'عميل مهتم')}`,
    `📞 <b>الهاتف:</b> <code>${esc(lead.phone)}</code>`,
    lead.email ? `✉️ <b>البريد:</b> ${esc(lead.email)}` : '',
    lead.unitTitle ? `🏠 <b>الوحدة المطلوبة:</b> ${esc(lead.unitTitle)}` : '',
    lead.developer ? `🏗️ <b>المطور:</b> ${esc(lead.developer)}` : '',
    lead.location ? `📍 <b>المنطقة:</b> ${esc(lead.location)}` : '',
    lead.budget ? `💰 <b>الميزانية:</b> ${esc(lead.budget)}` : '',
    lead.paymentMethod ? `💳 <b>نظام السداد:</b> ${esc(lead.paymentMethod)}` : '',
    lead.notes ? `📝 <b>ملاحظات:</b> ${esc(lead.notes)}` : '',
    `🔗 <b>المصدر:</b> ${esc(lead.source || 'شات بوت سكنى')}`,
    `⏰ <b>التوقيت:</b> ${now}`,
    '━━━━━━━━━━━━━━━━━━',
    waLink ? `💬 <a href="${waLink}"><b>فتح محادثة واتساب فوري مع العميل</b></a>` : '',
    `📋 <a href="https://sakanybot.vercel.app/admin"><b>عرض الطلب في لوحة الإدارة</b></a>`,
  ].filter(Boolean);

  await sendTelegramMessage(lines.join('\n'));
}

/**
 * Notify admin when a user registers for the Wishlist / Property Alert waiting list
 */
export async function notifyWishlistAlert(alert: WishlistAlertNotification): Promise<void> {
  const waLink = formatWhatsAppLink(alert.phone);
  const now = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });

  const lines = [
    '🎯 <b>تسجيل عميل جديد في قائمة الانتظار والتنبيهات الذكية!</b>',
    '━━━━━━━━━━━━━━━━━━',
    `👤 <b>الاسم:</b> ${esc(alert.name || 'عميل في قائمة التنبيهات')}`,
    `📞 <b>الهاتف / واتساب:</b> <code>${esc(alert.phone)}</code>`,
    alert.email ? `✉️ <b>البريد الإلكتروني:</b> ${esc(alert.email)}` : '',
    `📍 <b>المنطقة المطلوبة:</b> <b>${esc(alert.location)}</b>`,
    alert.unitType ? `🏢 <b>نوع الوحدة:</b> ${esc(alert.unitType)}` : '',
    alert.budget ? `💰 <b>الميزانية:</b> <b>${formatEGP(alert.budget)}</b>` : '',
    alert.paymentMethod ? `💳 <b>طريقة الدفع:</b> ${esc(alert.paymentMethod)}` : '',
    alert.notes ? `📝 <b>تفاصيل الطلب:</b> ${esc(alert.notes)}` : '',
    `⏰ <b>التوقيت:</b> ${now}`,
    '━━━━━━━━━━━━━━━━━━',
    waLink ? `💬 <a href="${waLink}"><b>محادثة العميل عبر واتساب فوراً</b></a>` : '',
    `📋 <a href="https://sakanybot.vercel.app/admin"><b>متابعة في لوحة الإدارة</b></a>`,
  ].filter(Boolean);

  await sendTelegramMessage(lines.join('\n'));
}

/**
 * Notify admin when an existing wishlist buyer matches a newly listed property
 */
export async function notifyBuyerSellerMatch(match: BuyerSellerMatchNotification): Promise<void> {
  const buyerWa = formatWhatsAppLink(match.buyerPhone);
  const sellerWa = match.sellerPhone ? formatWhatsAppLink(match.sellerPhone) : null;
  const now = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });

  const lines = [
    '⚡ <b>تطابق فوري: مشتري في قائمة الانتظار مع وحدة جديدة للبيع! 🔥</b>',
    '━━━━━━━━━━━━━━━━━━',
    '👤 <b>بيانات المشتري المنتظر:</b>',
    `• الاسم: ${esc(match.buyerName)}`,
    `• الهاتف: <code>${esc(match.buyerPhone)}</code>`,
    match.buyerEmail ? `• الإيميل: ${esc(match.buyerEmail)}` : '',
    match.buyerBudget ? `• الميزانية: ${formatEGP(match.buyerBudget)}` : '',
    buyerWa ? `💬 <a href="${buyerWa}"><b>تواصل مع المشتري على واتساب الآن</b></a>` : '',
    '──────────────────',
    '🏡 <b>الوحدة المعروضة للبيع المطابقة:</b>',
    `• العنوان: ${esc(match.propertyTitle)}`,
    `• الموقع: ${esc(match.propertyLocation)}`,
    `• السعر: <b>${formatEGP(match.propertyPrice)}</b>`,
    match.sellerName ? `• المالك: ${esc(match.sellerName)} (${esc(match.sellerPhone || '')})` : '',
    sellerWa ? `💬 <a href="${sellerWa}"><b>تواصل مع المالك على واتساب</b></a>` : '',
    `⏰ <b>التوقيت:</b> ${now}`,
    '━━━━━━━━━━━━━━━━━━',
    `🚀 <i>فرصة إتمام صفقة سريعة بدون تكلفة تسويق إضافية!</i>`,
  ].filter(Boolean);

  await sendTelegramMessage(lines.join('\n'));
}

/**
 * Notify admin when a user lists a property for sale
 */
export async function notifySellerListing(property: SellerPropertyNotification): Promise<void> {
  const waLink = property.sellerPhone ? formatWhatsAppLink(property.sellerPhone) : null;
  const now = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true });

  const lines = [
    '🏡 <b>عرض وحدة جديدة للبيع من المالك!</b>',
    '━━━━━━━━━━━━━━━━━━',
    `📌 <b>العنوان:</b> ${esc(property.title)}`,
    property.unitType ? `🏢 <b>النوع:</b> ${esc(property.unitType)}` : '',
    property.areaSqm ? `📐 <b>المساحة:</b> ${property.areaSqm} م²` : '',
    property.location || property.city ? `📍 <b>الموقع:</b> ${esc(property.location || property.city)}` : '',
    property.totalPrice ? `💵 <b>السعر الإجمالي:</b> <b>${formatEGP(property.totalPrice)}</b>` : '',
    property.paymentMethod ? `💳 <b>نظام الدفع:</b> ${esc(property.paymentMethod)}` : '',
    property.downPayment ? `🔹 <b>المقدم:</b> ${formatEGP(property.downPayment)}` : '',
    property.monthlyInstallment ? `🔹 <b>القسط الشهري:</b> ${formatEGP(property.monthlyInstallment)}` : '',
    '──────────────────',
    `👤 <b>المالك:</b> ${esc(property.sellerName || 'مالك معلن')}`,
    property.sellerPhone ? `📞 <b>هاتف المالك:</b> <code>${esc(property.sellerPhone)}</code>` : '',
    property.saleCircumstances ? `📝 <b>ظروف البيع:</b> ${esc(property.saleCircumstances)}` : '',
    property.imagesCount !== undefined ? `📷 <b>عدد الصور:</b> ${property.imagesCount} صورة` : '',
    `⏰ <b>التوقيت:</b> ${now}`,
    '━━━━━━━━━━━━━━━━━━',
    waLink ? `💬 <a href="${waLink}"><b>تواصل واتساب مع المالك مباشرة</b></a>` : '',
    `⚡ <a href="https://sakanybot.vercel.app/admin"><b>مراجعة واعتماد الوحدة من لوحة الإدارة</b></a>`,
  ].filter(Boolean);

  await sendTelegramMessage(lines.join('\n'));
}

/**
 * Diagnostics helper for admin panel
 */
export async function getTelegramDiagnostics(): Promise<{
  hasToken: boolean;
  botUsername: string;
  chatId: string | null;
  status: 'connected' | 'waiting_start' | 'missing_token';
}> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return {
      hasToken: false,
      botUsername: 'sakanyBOT_SUPPORT_BOT',
      chatId: null,
      status: 'missing_token'
    };
  }

  const chatId = await getAdminChatId(token);
  return {
    hasToken: true,
    botUsername: 'sakanyBOT_SUPPORT_BOT',
    chatId: chatId,
    status: chatId ? 'connected' : 'waiting_start'
  };
}
