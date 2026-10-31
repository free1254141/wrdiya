import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedUser } from '@/lib/server-auth';
import { getPayPalAccessToken, isMockPaymentAllowed, paypalFetch } from '@/lib/paypal';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { grantPro, getUsageStatus, PRO_PRICE_USD } from '@/lib/usage-manager';
import { getClientIpHash } from '@/lib/server-auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getVerifiedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'login_required' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const orderId: string = String(body.orderId || body.orderID || '').trim();
    if (!orderId || !/^[A-Z0-9-]{5,64}$/i.test(orderId)) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'payment_unavailable' }, { status: 503 });
    }

    // ── Local dev mock (never in production) ──
    if (orderId.startsWith('MOCK-')) {
      if (!isMockPaymentAllowed()) {
        return NextResponse.json({ error: 'invalid_order' }, { status: 400 });
      }
      const { proUntil } = await grantPro(user.id);
      const usage = await getUsageStatus({ userId: user.id, guestId: null, ipHash: getClientIpHash(req) });
      return NextResponse.json({ success: true, status: 'COMPLETED', plan: 'pro', proUntil, usage, mock: true });
    }

    const token = await getPayPalAccessToken();
    if (!token) {
      return NextResponse.json({ error: 'payment_unavailable' }, { status: 503 });
    }

    // 1. Capture (if already captured, PayPal returns 422 ORDER_ALREADY_CAPTURED — fine, we re-read it)
    const capture = await paypalFetch(token, `/v2/checkout/orders/${orderId}/capture`, { method: 'POST', body: '{}' });
    if (!capture.ok && capture.status !== 422) {
      console.error('PayPal capture failed:', capture.data);
      return NextResponse.json({ error: 'capture_failed' }, { status: 400 });
    }

    // 2. Read the authoritative order state from PayPal
    const order = await paypalFetch(token, `/v2/checkout/orders/${orderId}`, { method: 'GET' });
    const pu = order.data?.purchase_units?.[0];
    const cap = pu?.payments?.captures?.[0];

    const verified =
      order.ok &&
      order.data?.status === 'COMPLETED' &&
      pu?.custom_id === user.id &&
      cap?.status === 'COMPLETED' &&
      cap?.amount?.currency_code === 'USD' &&
      Number(cap?.amount?.value) >= Number(PRO_PRICE_USD);

    if (!verified) {
      console.error('PayPal order verification failed', { orderId, status: order.data?.status, custom: pu?.custom_id, cap: cap?.status });
      return NextResponse.json({ error: 'payment_not_verified' }, { status: 400 });
    }

    // 3. Record payment — unique(provider_order_id) guarantees one credit per order
    const { error: payErr } = await admin.from('payments').insert({
      user_id: user.id,
      provider: 'paypal',
      provider_order_id: orderId,
      amount: Number(cap.amount.value),
      currency: cap.amount.currency_code,
      status: cap.status,
      plan: 'pro',
      raw: { capture_id: cap.id, payer: order.data?.payer?.payer_id || null },
    });

    let alreadyCredited = false;
    if (payErr) {
      if (payErr.code === '23505') {
        alreadyCredited = true;
      } else {
        console.error('Failed to record payment:', payErr);
        return NextResponse.json({ error: 'record_failed' }, { status: 500 });
      }
    }

    if (!alreadyCredited) {
      await grantPro(user.id);
    }

    const usage = await getUsageStatus({ userId: user.id, guestId: null, ipHash: getClientIpHash(req) });
    return NextResponse.json({ success: true, status: 'COMPLETED', plan: 'pro', proUntil: usage.proUntil, usage, alreadyCredited });
  } catch (error: any) {
    console.error('PayPal Capture Order Error:', error);
    return NextResponse.json({ error: 'capture_failed' }, { status: 500 });
  }
}
