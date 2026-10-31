import 'server-only';

export const PAYPAL_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

export function isPayPalConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

/**
 * Mock payments are ONLY allowed on a local dev server without PayPal keys.
 * In production a missing key is an error — never a free upgrade.
 */
export function isMockPaymentAllowed(): boolean {
  return process.env.NODE_ENV !== 'production' && !isPayPalConfigured();
}

export async function getPayPalAccessToken(): Promise<string | null> {
  if (!isPayPalConfigured()) return null;
  const auth = Buffer.from(`${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  try {
    const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
      method: 'POST',
      body: 'grant_type=client_credentials',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      cache: 'no-store',
    });
    const data = await res.json();
    return data.access_token || null;
  } catch (err) {
    console.error('PayPal Access Token Error:', err);
    return null;
  }
}

export async function paypalFetch(token: string, path: string, init: RequestInit = {}) {
  const res = await fetch(`${PAYPAL_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}
