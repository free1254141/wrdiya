import { NextRequest, NextResponse } from 'next/server';
import { unlockLeadBonus, toPublicUsage } from '@/lib/usage-manager';
import { getVerifiedUser, getGuestId, getClientIpHash } from '@/lib/server-auth';
import { notifyNewLead } from '@/lib/notify';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, name, preferredLocation } = body || {};

    if (!phone || typeof phone !== 'string' || phone.replace(/\D/g, '').length < 8) {
      return NextResponse.json(
        { error: 'يرجى إدخال رقم هاتف / واتساب صالح للتواصل وتفعيل الرصيد الإضافي' },
        { status: 400 }
      );
    }

    const user = await getVerifiedUser(req);
    const { guestId } = getGuestId(req);
    const ipHash = getClientIpHash(req);

    const result = await unlockLeadBonus(
      {
        userId: user?.id || null,
        guestId: user ? null : guestId,
        ipHash,
        email: user?.email || null,
      },
      phone,
      name,
      preferredLocation
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'تعذر تفعيل الرصيد الإضافي' }, { status: 400 });
    }

    // Trigger Telegram notification for high-intent unlocked lead
    await notifyNewLead({
      name: (name || '').trim() || 'مشتري جاد (طلب تمديد 50 استشارة)',
      phone: phone.trim(),
      email: user?.email || null,
      location: preferredLocation?.trim() || null,
      notes: 'تم تفعيل 50 استشارة إضافية بنجاح لمواصلة البحث والمقارنة',
      source: 'lead_quota_unlock',
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'مبروك! تم فتح 50 استشارة إضافية لحسابك مجاناً اليوم 🚀',
      bonusAdded: result.bonusAdded,
      limit: result.limit,
      remaining: result.remaining,
    });
  } catch (err: any) {
    console.error('Error in /api/usage/unlock-bonus:', err);
    return NextResponse.json({ error: err?.message || 'حدث خطأ في النظام' }, { status: 500 });
  }
}
