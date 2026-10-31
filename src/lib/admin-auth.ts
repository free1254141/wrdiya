import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedUser } from '@/lib/server-auth';
import { isAllowedAdminEmail } from '@/lib/admin-auth-client';

export interface AdminAuthResult {
  user: {
    id: string;
    email: string;
  };
}

/**
 * Server-side route handler guard to require admin privileges.
 * Returns 404 (Not Found) if unauthorized so the admin endpoints appear non-existent.
 */
export async function requireAdmin(req: NextRequest): Promise<AdminAuthResult | NextResponse> {
  const user = await getVerifiedUser(req);

  if (!user || !user.email || !isAllowedAdminEmail(user.email)) {
    return new NextResponse(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return {
    user: {
      id: user.id,
      email: user.email,
    },
  };
}
