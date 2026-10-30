/**
 * sakanybot Daily Usage & Quota Manager
 * - Daily Limit: 10 queries per registered user per day (auto-resets at midnight)
 * - Guest Limit: 3 queries total before mandatory login
 */

export interface DailyUsageState {
  used: number;
  limit: number;
  remaining: number;
  exceeded: boolean;
  requiresLogin: boolean;
  resetDate: string;
}

export const DAILY_LIMIT = 10;
export const GUEST_LIMIT = 3;

interface DailyRecord {
  dateKey: string;
  count: number;
}

// In-memory store keyed by clientId / userId
const dailyUsageStore = new Map<string, DailyRecord>();

function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getTomorrowDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

/**
 * Check and increment daily usage
 * @param clientId User ID or anonymous/guest identifier
 * @param isAuthenticated Whether user is signed in
 * @param increment Whether to consume 1 query
 */
export function checkAndIncrementDailyUsage(
  clientId: string,
  isAuthenticated: boolean,
  increment = true
): DailyUsageState {
  const todayKey = getTodayKey();
  const id = clientId || 'guest_user';

  // 1. Guest Enforcement: strictly max 3 messages before login
  if (!isAuthenticated) {
    let guestRecord = dailyUsageStore.get(`guest_${id}`);
    if (!guestRecord || guestRecord.dateKey !== todayKey) {
      guestRecord = { dateKey: todayKey, count: 0 };
      dailyUsageStore.set(`guest_${id}`, guestRecord);
    }

    if (guestRecord.count >= GUEST_LIMIT) {
      return {
        used: guestRecord.count,
        limit: GUEST_LIMIT,
        remaining: 0,
        exceeded: true,
        requiresLogin: true,
        resetDate: getTomorrowDate(),
      };
    }

    if (increment) {
      guestRecord.count += 1;
    }

    return {
      used: guestRecord.count,
      limit: GUEST_LIMIT,
      remaining: Math.max(0, GUEST_LIMIT - guestRecord.count),
      exceeded: false,
      requiresLogin: false,
      resetDate: getTomorrowDate(),
    };
  }

  // 2. Authenticated User: Daily limit of 10 messages (resets daily)
  let userRecord = dailyUsageStore.get(`user_${id}`);
  if (!userRecord || userRecord.dateKey !== todayKey) {
    userRecord = { dateKey: todayKey, count: 0 };
    dailyUsageStore.set(`user_${id}`, userRecord);
  }

  if (userRecord.count >= DAILY_LIMIT) {
    return {
      used: userRecord.count,
      limit: DAILY_LIMIT,
      remaining: 0,
      exceeded: true,
      requiresLogin: false,
      resetDate: getTomorrowDate(),
    };
  }

  if (increment) {
    userRecord.count += 1;
  }

  return {
    used: userRecord.count,
    limit: DAILY_LIMIT,
    remaining: Math.max(0, DAILY_LIMIT - userRecord.count),
    exceeded: false,
    requiresLogin: false,
    resetDate: getTomorrowDate(),
  };
}

/**
 * Helper to upgrade user to Pro (retained for backend routes)
 */
export function upgradeUserToPro(clientId: string) {
  return checkAndIncrementUsage(clientId, 'pro', false);
}

/**
 * Helper for backwards-compat if any code calls checkAndIncrementUsage
 */
export function checkAndIncrementUsage(clientId: string, _plan = 'free', increment = true) {
  const isAuth = clientId && !clientId.startsWith('guest_') && !clientId.startsWith('session_') && clientId !== 'anonymous_user';
  const res = checkAndIncrementDailyUsage(clientId, Boolean(isAuth), increment);
  return {
    used: res.used,
    limit: res.limit,
    plan: 'free' as const,
    exceeded: res.exceeded,
    remaining: res.remaining,
    resetDate: res.resetDate,
  };
}
