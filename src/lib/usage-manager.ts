/**
 * Skanybot Usage & Quota Manager
 * - Free Plan: 30 queries per month
 * - Pro Plan: 300 queries per month
 * Tracks consumption per client / user ID with monthly renewal.
 */

export type SubscriptionPlan = 'free' | 'pro';

export interface UsageState {
  used: number;
  limit: number;
  plan: SubscriptionPlan;
  exceeded: boolean;
  remaining: number;
  resetDate: string;
}

const PLAN_LIMITS: Record<SubscriptionPlan, number> = {
  free: 30,
  pro: 300,
};

// In-memory cache for fast lookups (backed by client storage & database)
interface UsageRecord {
  monthKey: string;
  count: number;
  plan: SubscriptionPlan;
}

const usageStore = new Map<string, UsageRecord>();

function getMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getNextResetDate(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toISOString().split('T')[0];
}

/**
 * Check and increment client query usage
 */
export function checkAndIncrementUsage(
  clientId: string,
  userPlan: SubscriptionPlan = 'free',
  increment = true
): UsageState {
  const id = clientId || 'anonymous_user';
  const monthKey = getMonthKey();
  
  let record = usageStore.get(id);

  // Reset if new month
  if (!record || record.monthKey !== monthKey) {
    record = {
      monthKey,
      count: 0,
      plan: userPlan,
    };
    usageStore.set(id, record);
  }

  // Update plan if upgraded
  if (userPlan === 'pro' && record.plan !== 'pro') {
    record.plan = 'pro';
  }

  const limit = PLAN_LIMITS[record.plan] || 30;

  if (record.count >= limit) {
    return {
      used: record.count,
      limit,
      plan: record.plan,
      exceeded: true,
      remaining: 0,
      resetDate: getNextResetDate(),
    };
  }

  if (increment) {
    record.count += 1;
  }

  return {
    used: record.count,
    limit,
    plan: record.plan,
    exceeded: false,
    remaining: Math.max(0, limit - record.count),
    resetDate: getNextResetDate(),
  };
}

/**
 * Upgrade client to Pro plan (300 queries)
 */
export function upgradeUserToPro(clientId: string): UsageState {
  const id = clientId || 'anonymous_user';
  const monthKey = getMonthKey();
  let record = usageStore.get(id);

  if (!record || record.monthKey !== monthKey) {
    record = {
      monthKey,
      count: 0,
      plan: 'pro',
    };
  } else {
    record.plan = 'pro';
  }

  usageStore.set(id, record);

  return {
    used: record.count,
    limit: PLAN_LIMITS.pro,
    plan: 'pro',
    exceeded: record.count >= PLAN_LIMITS.pro,
    remaining: Math.max(0, PLAN_LIMITS.pro - record.count),
    resetDate: getNextResetDate(),
  };
}
