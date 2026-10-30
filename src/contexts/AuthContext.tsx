'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  supabaseUser: User | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string; requireVerification?: boolean }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const supabase = useMemo(() => createClient(), []);

  // Format Supabase User to UserProfile
  const mapSupabaseUser = (sbUser: User | null): UserProfile | null => {
    if (!sbUser) return null;
    const meta = sbUser.user_metadata || {};
    const name = meta.full_name || meta.name || sbUser.email?.split('@')[0] || 'User';
    const avatar = meta.avatar_url || meta.picture || undefined;
    return {
      id: sbUser.id,
      name,
      email: sbUser.email || '',
      avatar,
    };
  };

  useEffect(() => {
    let mounted = true;
    let authEventReceived = false;

    // 1. Initial Session Check
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted || authEventReceived) return;
        if (error || !data.session) {
          setSession(null);
          setSupabaseUser(null);
          setUser(null);
        } else {
          setSession(data.session);
          setSupabaseUser(data.session.user);
          setUser(mapSupabaseUser(data.session.user));
        }
      })
      .catch((err) => {
        if (!mounted || authEventReceived) return;
        console.error('Failed to get Supabase auth session:', err);
        setSession(null);
        setSupabaseUser(null);
        setUser(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    // 2. Auth State Change Listener (OAuth, Login, SignOut)
    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;
      authEventReceived = true;
      setSession(nextSession);
      const nextUser = nextSession?.user ?? null;
      setSupabaseUser(nextUser);
      setUser(mapSupabaseUser(nextUser));
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  // Sign In with Email & Password
  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      setSession(data.session);
      setSupabaseUser(data.user);
      setUser(mapSupabaseUser(data.user));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  // Sign Up with Email & Password
  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name || email.split('@')[0],
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // If email confirmation is disabled in Supabase, user is immediately logged in
      if (data.session) {
        setSession(data.session);
        setSupabaseUser(data.user);
        setUser(mapSupabaseUser(data.user));
        return { success: true };
      }

      return { success: true, requireVerification: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  // Sign in with Google (OAuth)
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: 'consent select_account',
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Google Sign-In failed' };
    }
  };

  // Sign Out
  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setSupabaseUser(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        session,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
