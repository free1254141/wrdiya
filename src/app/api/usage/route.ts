import { NextRequest, NextResponse } from 'next/server';
import { getUsageStatus } from '@/lib/usage-manager';
import { getVerifiedUser, getGuestId, getClientIpHash, GUEST_COOKIE, guestCookieOptions } from '@/lib/server-auth';

/** Current plan + remaining quota for the header pill / pricing modal. Read-only. */
export async function GET(req: NextRequest) {
  const user = await getVerifiedUser(req);
  const { guestId, isNew } = getGuestId(req);
  const usage = await getUsageStatus({
    userId: user?.id || null,
    guestId: user ? null : guestId,
    ipHash: getClientIpHash(req),
  });

  const res = NextResponse.json({ success: true, usage }, { headers: { 'Cache-Control': 'no-store' } });
  if (!user && isNew) res.cookies.set(GUEST_COOKIE, guestId, guestCookieOptions());
  return res;
}
