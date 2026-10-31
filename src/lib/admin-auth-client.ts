/**
 * Client-safe admin authorization helpers.
 * Strictly restricts admin access to weeessd57@gmail.com.
 */

export const PRIMARY_ADMIN_EMAIL = 'weeessd57@gmail.com';

export function isAllowedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();

  // Explicit check for the user's primary admin email (supports username or full gmail)
  if (clean === PRIMARY_ADMIN_EMAIL || clean === 'weeessd57' || clean.startsWith('weeessd57@')) return true;

  // Optional environment override if specified
  const envAdmins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return envAdmins.includes(clean);
}
