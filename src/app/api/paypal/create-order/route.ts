import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedUser } from '@/lib/server-auth';
import { getPayPalAccessToken, isMockPaymentAllowed, paypalFetch } from '@/lib/paypal';
import { PRO_PERIOD_DAYS, PRO_PERIOD_LIMIT, PRO_PRICE_USD } from '@/lib/usage-manager';

export async function POST(req: NextRequest) {
  try {
    // Buyer must be signed in — the order is bound to their verified account id.
    const user = await getVerifiedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'login_required' }, { status: 401 });
    }

    const token = await getPayPalAccessToken();

    if (!token) {
      if (isMockPaymentAllowed()) {
        // Local development only (no PayPal keys + not production)
        return NextResponse.json({ id: `MOCK-ORDER-${Date.now()}`, status: 'CREATED', mock: true });
      }
      console.error('PayPal is not configured or token request failed');
      return NextResponse.json({ error: 'payment_unavailable' }, { status: 503 });
    }

    const origin = req.nextUrl.origin;
    const { ok, data } = await paypalFetch(token, '/v2/checkout/orders', {
      method: 'POST',
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: 'pro_plan',
            custom_id: user.id, // verified on capture
            amount: { currency_code: 'USD', value: PRO_PRICE_USD },
            description: `ewanbot Pro - ${PRO_PERIOD_LIMIT} queries / ${PRO_PERIOD_DAYS} days`,
          },
        ],
        application_context: {
          brand_name: 'ewanbot',
          landing_page: 'NO_PREFERENCE',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
          return_url: `${origin}/?payment=success`,
          cancel_url: `${origin}/?payment=cancelled`,
        },
      }),
    });

    if (!ok || !data?.id) {
      console.error('PayPal create order failed:', data);
      return NextResponse.json({ error: 'create_order_failed' }, { status: 502 });
    }

    return NextResponse.json({ id: data.id, status: data.status, links: data.links });
  } catch (error: any) {
    console.error('PayPal Create Order Error:', error);
    return NextResponse.json({ error: 'create_order_failed' }, { status: 500 });
  }
}
