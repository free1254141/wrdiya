import { NextRequest, NextResponse } from 'next/server';

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';
const PAYPAL_BASE = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken(): Promise<string | null> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    return null;
  }
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  try {
    const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
      method: 'POST',
      body: 'grant_type=client_credentials',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    const data = await res.json();
    return data.access_token || null;
  } catch (err) {
    console.error('PayPal Access Token Error:', err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const plan = body.plan || 'pro';
    const amount = plan === 'pro' ? '15.00' : '29.00';
    const userId = body.userId || null;

    const token = await getPayPalAccessToken();

    // If client credentials are configured with PayPal API
    if (token) {
      const origin = req.nextUrl.origin || 'https://skanybot.vercel.app';
      const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [
            {
              reference_id: userId || 'customer_purchase',
              amount: {
                currency_code: 'USD',
                value: amount,
              },
              description: 'sakanybot Pro Subscription - 300 Queries / Month',
            },
          ],
          application_context: {
            brand_name: 'sakanybot سكنى بوت',
            landing_page: 'NO_PREFERENCE',
            user_action: 'PAY_NOW',
            return_url: `${origin}/?payment=success`,
            cancel_url: `${origin}/?payment=cancelled`,
          }
        }),
      });

      const orderData = await orderRes.json();
      return NextResponse.json(orderData);
    }

    // Mock fallback when keys are not yet input in .env (allows frontend testing)
    const mockOrderId = `MOCK-ORDER-${Date.now()}`;
    return NextResponse.json({
      id: mockOrderId,
      status: 'CREATED',
      mock: true,
      amount,
      plan: 'pro',
      description: 'sakanybot Pro Subscription (300 Queries / Month)',
    });

  } catch (error: any) {
    console.error('PayPal Create Order Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create PayPal order' }, { status: 500 });
  }
}
