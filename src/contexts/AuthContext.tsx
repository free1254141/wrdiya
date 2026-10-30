'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check local session or Supabase session
    try {
      const saved = localStorage.getItem('skanybot_user') || localStorage.getItem('aqar_ai_user');
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string) => {
    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name: email.split('@')[0],
      email: email,
    };
    setUser(newUser);
    try {
      localStorage.setItem('skanybot_user', JSON.stringify(newUser));
    } catch {
      // ignore
    }
  };

  const signOut = async () => {
    setUser(null);
    try {
      localStorage.removeItem('skanybot_user');
      localStorage.removeItem('aqar_ai_user');
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
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
