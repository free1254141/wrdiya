'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isAllowedAdminEmail } from '@/lib/admin-auth-client';
import NotFound from '@/app/not-found';
import { Loader2 } from 'lucide-react';

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show neutral loader while auth state is resolving
  if (loading || !mounted) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <span className="text-xs font-mono">Verifying admin access...</span>
      </div>
    );
  }

  // Strictly check if the user's email is allowed (weeessd57@gmail.com)
  const isAllowed = Boolean(user?.email && isAllowedAdminEmail(user.email));

  // If not authorized, silently render 404 Not Found
  if (!isAllowed) {
    return <NotFound />;
  }

  return <>{children}</>;
}
