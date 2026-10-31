import 'server-only';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createHash } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export interface VerifiedUser {
  id: string;
  email: string | null;
}

/**
 * Resolve the signed-in user from the request in a way the client can NOT spoof.
 * 1) Supabase auth cookies (set by @supabase/ssr browser client)
 * 2) Fallback: `Authorization: Bearer <access_token>` header
 * Never trust a `userId` sent in the request body.
 */
export async function getVerifiedUser(req: NextRequest): Promise<VerifiedUser | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 1. Cookie-based session
  if (url && anonKey) {
    try {
      const supabase = createServerClient(url, anonKey, {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll() {
            // Route handlers here are read-only; middleware refreshes cookies.
          },
        },
      });
      const { data } = await supabase.auth.getUser();
      if (data?.user) return { id: data.user.id, email: data.user.email ?? null };
    } catch {
      // fall through to bearer token
    }
  }

  // 2. Bearer token
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';
  if (token) {
    const admin = getSupabaseAdmin();
    if (admin) {
      try {
        const { data } = await admin.auth.getUser(token);
        if (data?.user) return { id: data.user.id, email: data.user.email ?? null };
      } catch {
        // invalid token
      }
    }
  }

  return null;
}

export const GUEST_COOKIE = 'sb_gid';

/** Stable anonymous id stored in an httpOnly cookie (set it on the response when `isNew`). */
export function getGuestId(req: NextRequest): { guestId: string; isNew: boolean } {
  const existing = req.cookies.get(GUEST_COOKIE)?.value;
  if (existing && /^[a-f0-9-]{36}$/i.test(existing)) return { guestId: existing, isNew: false };
  return { guestId: crypto.randomUUID(), isNew: true };
}

export function guestCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  };
}

/** Best-effort client IP (Vercel sets x-forwarded-for / x-real-ip). Returned hashed for privacy. */
export function getClientIpHash(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for') || '';
  const ip = fwd.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  return createHash('sha256').update(`skanybot:${ip}`).digest('hex').slice(0, 32);
}
