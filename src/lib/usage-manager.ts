import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { isAllowedAdminEmail } from '@/lib/admin-auth-client';

/**
 * sakanybot Usage & Quota Manager (persistent, server-enforced)
 *
 * Limits (protect AI costs + push serious users to Pro):
 * - Guest      : 3 queries / day per browser, max 15 / day per IP (shared mobile IPs)
 * - Free user  : 10 queries / day (resets at midnight Cairo time)
 * - Pro user   : 300 queries per 30-day paid period (+ 60/day anti-abuse cap)
 *
 * Counters live in Supabase (`usage_counters`) and are incremented atomically by the
 * `consume_usage` SQL function, so they survive restarts / multiple serverless instances.
 * If the database is unreachable we fall back to an in-memory counter (still limited).
 */

export const GUEST_LIMIT = 3;
export const GUEST_IP_LIMIT = 15;
export const DAILY_LIMIT = 20;
export const LEAD_BONUS_LIMIT = 50;
export const PRO_PERIOD_LIMIT = 300;
export const PRO_DAILY_CAP = 60;
export const PRO_PERIOD_DAYS = 30;
export const PRO_PRICE_USD = '15.00';

export type Plan = 'guest' | 'free' | 'pro' | 'admin';

export interface UsageState {
  plan: Plan;
  used: number;
  limit: number;
  remaining: number;
  /** 'day' for guest/free, 'period' for Pro */
  window: 'day' | 'period';
  resetDate: string;
  proUntil?: string | null;
  hasUnlockedBonus?: boolean;
  bonusAmount?: number;
}

export interface ConsumeResult extends UsageState {
  allowed: boolean;
  reason?: 'login_required' | 'daily_limit_reached' | 'pro_limit_reached' | 'buyer_consultant_handover';
  /** Give the consumed unit(s) back, e.g. when the AI call crashed. */
  refund: () => Promise<void>;
}

export interface QuotaIdentity {
  userId: string | null;
  guestId: string | null;
  ipHash: string;
  email?: string | null;
}

export async function isUserAdmin(id: QuotaIdentity): Promise<boolean> {
  if (id.email && isAllowedAdminEmail(id.email)) return true;
  if (!id.userId) return false;
  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      const { data } = await admin.auth.admin.getUserById(id.userId);
      if (data?.user?.email && isAllowedAdminEmail(data.user.email)) return true;
    } catch {}
  }
  return false;
}

interface UserPlanRow {
  plan: 'free' | 'pro';
  pro_until: string | null;
  period_start: string | null;
}

// ─── Time helpers (Cairo day boundaries) ────────────────────────────────────
function cairoDateKey(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function tomorrowKey(): string {
  return cairoDateKey(new Date(Date.now() + 24 * 60 * 60 * 1000));
}

// ─── In-memory fallback ─────────────────────────────────────────────────────
const memoryStore = new Map<string, number>();

function memoryConsume(key: string, period: string, limit: number): number | null {
  const k = `${key}|${period}`;
  const current = memoryStore.get(k) || 0;
  if (current >= limit) return null;
  memoryStore.set(k, current + 1);
  if (memoryStore.size > 50_000) memoryStore.clear(); // avoid unbounded growth
  return current + 1;
}

function memoryRefund(key: string, period: string) {
  const k = `${key}|${period}`;
  const current = memoryStore.get(k) || 0;
  memoryStore.set(k, Math.max(0, current - 1));
}

// ─── DB primitives ──────────────────────────────────────────────────────────
async function consume(key: string, period: string, limit: number): Promise<number | null> {
  const admin = getSupabaseAdmin();
  if (admin) {
    const { data, error } = await admin.rpc('consume_usage', { p_key: key, p_period: period, p_limit: limit });
    if (!error) return typeof data === 'number' ? data : null;
    console.warn('[usage] consume_usage failed, using memory fallback:', error.message);
  }
  return memoryConsume(key, period, limit);
}

async function refund(key: string, period: string): Promise<void> {
  const admin = getSupabaseAdmin();
  if (admin) {
    const { error } = await admin.rpc('refund_usage', { p_key: key, p_period: period });
    if (!error) return;
  }
  memoryRefund(key, period);
}

async function readCount(key: string, period: string): Promise<number> {
  const admin = getSupabaseAdmin();
  if (admin) {
    const { data, error } = await admin
      .from('usage_counters')
      .select('count')
      .eq('key', key)
      .eq('period', period)
      .maybeSingle();
    if (!error) return data?.count ?? 0;
  }
  return memoryStore.get(`${key}|${period}`) || 0;
}

// ─── Plans ──────────────────────────────────────────────────────────────────
export async function getActivePlan(userId: string): Promise<{ plan: 'free' | 'pro'; proUntil: string | null; periodStart: string | null }> {
  const admin = getSupabaseAdmin();
  if (!admin) return { plan: 'free', proUntil: null, periodStart: null };
  const { data } = await admin
    .from('user_plans')
    .select('plan, pro_until, period_start')
    .eq('user_id', userId)
    .maybeSingle<UserPlanRow>();
  if (data && data.plan === 'pro' && data.pro_until && new Date(data.pro_until).getTime() > Date.now()) {
    return { plan: 'pro', proUntil: data.pro_until, periodStart: data.period_start };
  }
  return { plan: 'free', proUntil: null, periodStart: null };
}

/** Extend (or start) a Pro period for the user. Called only after a verified payment. */
export async function grantPro(userId: string, days = PRO_PERIOD_DAYS): Promise<{ proUntil: string }> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase service role is not configured');

  const current = await getActivePlan(userId);
  const now = new Date();
  const base = current.plan === 'pro' && current.proUntil ? new Date(current.proUntil) : now;
  const proUntil = new Date(base.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
  // New billing period => fresh 300 queries
  const periodStart = now.toISOString();

  const { error } = await admin.from('user_plans').upsert(
    { user_id: userId, plan: 'pro', pro_until: proUntil, period_start: periodStart, updated_at: now.toISOString() },
    { onConflict: 'user_id' }
  );
  if (error) throw new Error(`Failed to activate Pro: ${error.message}`);
  return { proUntil };
}

function proPeriodKey(periodStart: string | null): string {
  return `pro:${(periodStart || 'none').slice(0, 19)}`;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/** Helper to get bonus key for an identity */
function getBonusKey(id: QuotaIdentity): string {
  return id.userId ? `bonus:user:${id.userId}` : `bonus:guest:${id.guestId || id.ipHash}`;
}

/** Read-only status for the UI (does NOT consume). */
export async function getUsageStatus(id: QuotaIdentity): Promise<UsageState> {
  // ── Admin: Unlimited inquiries lifetime ──
  if (await isUserAdmin(id)) {
    return {
      plan: 'admin',
      used: 0,
      limit: 999999,
      remaining: 999999,
      window: 'period',
      resetDate: '∞',
      proUntil: null,
      hasUnlockedBonus: true,
      bonusAmount: 0,
    };
  }

  const today = cairoDateKey();
  const bonusKey = getBonusKey(id);
  const bonusAmount = await readCount(bonusKey, today);
  const hasUnlockedBonus = bonusAmount > 0;

  if (!id.userId) {
    const guestKey = `guest:${id.guestId || id.ipHash}`;
    const effectiveLimit = GUEST_LIMIT + bonusAmount;
    const [byGuest, byIp] = await Promise.all([readCount(guestKey, today), readCount(`ip:${id.ipHash}`, today)]);
    const remaining = Math.max(0, Math.min(effectiveLimit - byGuest, GUEST_IP_LIMIT + bonusAmount - byIp));
    return {
      plan: 'guest',
      used: Math.max(0, effectiveLimit - remaining),
      limit: effectiveLimit,
      remaining,
      window: 'day',
      resetDate: tomorrowKey(),
      hasUnlockedBonus,
      bonusAmount,
    };
  }

  const plan = await getActivePlan(id.userId);
  if (plan.plan === 'pro') {
    const used = await readCount(`user:${id.userId}`, proPeriodKey(plan.periodStart));
    return {
      plan: 'pro',
      used,
      limit: PRO_PERIOD_LIMIT,
      remaining: Math.max(0, PRO_PERIOD_LIMIT - used),
      window: 'period',
      resetDate: (plan.proUntil || '').slice(0, 10),
      proUntil: plan.proUntil,
      hasUnlockedBonus: true,
      bonusAmount: 0,
    };
  }

  const effectiveLimit = DAILY_LIMIT + bonusAmount;
  const used = await readCount(`user:${id.userId}`, today);
  return {
    plan: 'free',
    used,
    limit: effectiveLimit,
    remaining: Math.max(0, effectiveLimit - used),
    window: 'day',
    resetDate: tomorrowKey(),
    hasUnlockedBonus,
    bonusAmount,
  };
}

/**
 * Unlocks 50 bonus inquiries for a serious buyer upon submitting their contact phone number.
 * Records the lead into `leads_inquiries` so the admin team can follow up directly.
 */
export async function unlockLeadBonus(
  id: QuotaIdentity,
  phone: string,
  name?: string,
  preferredLocation?: string
): Promise<{ success: boolean; limit: number; remaining: number; bonusAdded: number; error?: string }> {
  if (!phone || phone.replace(/\D/g, '').length < 8) {
    return { success: false, limit: 0, remaining: 0, bonusAdded: 0, error: 'رقم الهاتف غير صالح' };
  }

  const cleanPhone = phone.trim();
  const cleanName = (name || '').trim() || 'مشتري جاد (طلب تمديد استشارات)';
  const today = cairoDateKey();
  const bonusKey = getBonusKey(id);

  const admin = getSupabaseAdmin();
  if (admin) {
    // 1. Record hot buyer lead in Supabase
    try {
      await admin.from('leads_inquiries').insert([{
        user_name: cleanName,
        phone: cleanPhone,
        preferred_location: preferredLocation?.trim() || null,
        source: 'lead_quota_unlock',
        status: 'جديد',
        user_id: id.userId || null,
        notes: `طلب فتح حصة الـ 50 استشارة إضافية (مشتري جاد يبحث بالمنصة)`,
      }]);
    } catch (e: any) {
      console.warn('[usage] Failed to record lead in leads_inquiries:', e.message);
    }

    // 2. Persist bonus quota in usage_counters
    try {
      await admin.from('usage_counters').upsert({
        key: bonusKey,
        period: today,
        count: LEAD_BONUS_LIMIT,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key,period' });
    } catch (e: any) {
      console.warn('[usage] Failed to persist bonus in usage_counters:', e.message);
    }
  }

  // Memory fallback store
  memoryStore.set(`${bonusKey}|${today}`, LEAD_BONUS_LIMIT);

  // Return fresh updated usage status
  const updatedStatus = await getUsageStatus(id);
  return {
    success: true,
    limit: updatedStatus.limit,
    remaining: updatedStatus.remaining,
    bonusAdded: LEAD_BONUS_LIMIT,
  };
}

/** Atomically consume one query for this identity. */
export async function consumeQuery(id: QuotaIdentity): Promise<ConsumeResult> {
  // ── Admin: Unlimited inquiries lifetime (never blocked, never counted against quota) ──
  if (await isUserAdmin(id)) {
    return {
      plan: 'admin',
      allowed: true,
      used: 0,
      limit: 999999,
      remaining: 999999,
      window: 'period',
      resetDate: '∞',
      proUntil: null,
      hasUnlockedBonus: true,
      bonusAmount: 0,
      refund: async () => {},
    };
  }

  const today = cairoDateKey();
  const bonusKey = getBonusKey(id);
  const bonusAmount = await readCount(bonusKey, today);
  const hasUnlockedBonus = bonusAmount > 0;

  const consumed: Array<[string, string]> = [];
  const doRefund = async () => {
    await Promise.all(consumed.map(([k, p]) => refund(k, p)));
    consumed.length = 0;
  };

  // ── Guest ──
  if (!id.userId) {
    const guestKey = `guest:${id.guestId || id.ipHash}`;
    const effectiveLimit = GUEST_LIMIT + bonusAmount;
    const base = {
      plan: 'guest' as const,
      limit: effectiveLimit,
      window: 'day' as const,
      resetDate: tomorrowKey(),
      hasUnlockedBonus,
      bonusAmount,
    };

    const byGuest = await consume(guestKey, today, effectiveLimit);
    if (byGuest === null) {
      const reason = hasUnlockedBonus ? 'buyer_consultant_handover' : 'login_required';
      return { ...base, allowed: false, reason, used: effectiveLimit, remaining: 0, refund: doRefund };
    }
    consumed.push([guestKey, today]);

    const byIp = await consume(`ip:${id.ipHash}`, today, GUEST_IP_LIMIT + bonusAmount);
    if (byIp === null) {
      await doRefund();
      const reason = hasUnlockedBonus ? 'buyer_consultant_handover' : 'login_required';
      return { ...base, allowed: false, reason, used: effectiveLimit, remaining: 0, refund: doRefund };
    }
    consumed.push([`ip:${id.ipHash}`, today]);

    const remaining = Math.max(0, Math.min(effectiveLimit - byGuest, GUEST_IP_LIMIT + bonusAmount - byIp));
    return { ...base, allowed: true, used: effectiveLimit - remaining, remaining, refund: doRefund };
  }

  const plan = await getActivePlan(id.userId);

  // ── Pro ──
  if (plan.plan === 'pro') {
    const periodKey = proPeriodKey(plan.periodStart);
    const base = {
      plan: 'pro' as const,
      limit: PRO_PERIOD_LIMIT,
      window: 'period' as const,
      resetDate: (plan.proUntil || '').slice(0, 10),
      proUntil: plan.proUntil,
      hasUnlockedBonus: true,
      bonusAmount: 0,
    };

    const daily = await consume(`pro-day:${id.userId}`, today, PRO_DAILY_CAP);
    if (daily === null) {
      const used = await readCount(`user:${id.userId}`, periodKey);
      return { ...base, allowed: false, reason: 'daily_limit_reached', used, remaining: Math.max(0, PRO_PERIOD_LIMIT - used), resetDate: tomorrowKey(), refund: doRefund };
    }
    consumed.push([`pro-day:${id.userId}`, today]);

    const used = await consume(`user:${id.userId}`, periodKey, PRO_PERIOD_LIMIT);
    if (used === null) {
      await doRefund();
      return { ...base, allowed: false, reason: 'pro_limit_reached', used: PRO_PERIOD_LIMIT, remaining: 0, refund: doRefund };
    }
    consumed.push([`user:${id.userId}`, periodKey]);
    return { ...base, allowed: true, used, remaining: Math.max(0, PRO_PERIOD_LIMIT - used), refund: doRefund };
  }

  // ── Free (Registered) ──
  const effectiveLimit = DAILY_LIMIT + bonusAmount;
  const base = {
    plan: 'free' as const,
    limit: effectiveLimit,
    window: 'day' as const,
    resetDate: tomorrowKey(),
    hasUnlockedBonus,
    bonusAmount,
  };

  const used = await consume(`user:${id.userId}`, today, effectiveLimit);
  if (used === null) {
    // If user already used their 20 + 50 = 70 messages, prompt the direct consultant handover!
    const reason = hasUnlockedBonus ? 'buyer_consultant_handover' : 'daily_limit_reached';
    return { ...base, allowed: false, reason, used: effectiveLimit, remaining: 0, refund: doRefund };
  }
  consumed.push([`user:${id.userId}`, today]);
  return { ...base, allowed: true, used, remaining: Math.max(0, effectiveLimit - used), refund: doRefund };
}

/** Strip the non-serializable refund fn before sending to the client. */
export function toPublicUsage(u: UsageState | ConsumeResult): UsageState {
  return {
    plan: u.plan,
    used: u.used,
    limit: u.limit,
    remaining: u.remaining,
    window: u.window,
    resetDate: u.resetDate,
    proUntil: u.proUntil ?? null,
    hasUnlockedBonus: u.hasUnlockedBonus ?? false,
    bonusAmount: u.bonusAmount ?? 0,
  };
}
