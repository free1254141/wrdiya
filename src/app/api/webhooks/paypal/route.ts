import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const event = await req.json();
    const eventType = event.event_type;
    const resource = event.resource;

    console.log(`[PayPal Webhook] Received event: ${eventType}`, resource?.id);

    // Process subscription status changes
    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        const subscriptionId = resource?.id;
        const customId = resource?.custom_id; // Factory ID passed during subscription
        console.log(`[PayPal Webhook] Subscription activated for factory: ${customId}, sub: ${subscriptionId}`);
        // If Supabase is connected, update factories table:
        // await supabase.from('factories').update({
        //   subscription_status: 'active',
        //   paypal_subscription_id: subscriptionId,
        // }).eq('id', customId);
        break;
      }
      case 'BILLING.SUBSCRIPTION.CANCELLED': {
        const subscriptionId = resource?.id;
        console.log(`[PayPal Webhook] Subscription cancelled for sub: ${subscriptionId}`);
        // await supabase.from('factories').update({
        //   subscription_status: 'canceled',
        // }).eq('paypal_subscription_id', subscriptionId);
        break;
      }
      case 'PAYMENT.SALE.COMPLETED': {
        console.log(`[PayPal Webhook] Payment sale completed`);
        break;
      }
      default:
        console.log(`[PayPal Webhook] Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true, event_type: eventType });
  } catch (error: any) {
    console.error('[PayPal Webhook] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
