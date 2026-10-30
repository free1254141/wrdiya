import { NextRequest, NextResponse } from 'next/server';
import { upgradeUserToPro } from '@/lib/usage-manager';

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
    const body = await req.json();
    const orderId = body.orderId || body.orderID;
    const clientId = body.clientId || 'guest_user';

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    const token = await getPayPalAccessToken();

    if (token && !orderId.startsWith('MOCK-')) {
      const captureRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const captureData = await captureRes.json();
      if (captureData.status === 'COMPLETED' || captureData.status === 'APPROVED') {
        const usage = upgradeUserToPro(clientId);
        return NextResponse.json({
          success: true,
          status: 'COMPLETED',
          plan: 'pro',
          limit: 300,
          usage,
        });
      }

      return NextResponse.json({ success: false, data: captureData }, { status: 400 });
    }

    // Handle mock / test confirmation
    const usage = upgradeUserToPro(clientId);
    return NextResponse.json({
      success: true,
      status: 'COMPLETED',
      plan: 'pro',
      limit: 300,
      usage,
    });

  } catch (error: any) {
    console.error('PayPal Capture Order Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to capture PayPal order' }, { status: 500 });
  }
}
