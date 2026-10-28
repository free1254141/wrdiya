'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { UserRole } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  assignedLine?: string;
  avatar?: string;
}

export const DEMO_PROFILES: Record<UserRole, UserProfile> = {
  operator: {
    id: 'usr-op-01',
    name: 'حسام كمال',
    email: 'operator@wrdya.com',
    role: 'operator',
    department: 'خطوط البثق والتشكيل',
    assignedLine: 'EXT-01',
    avatar: '👷‍♂️',
  },
  supervisor: {
    id: 'usr-sup-02',
    name: 'م. أحمد عادل',
    email: 'supervisor@wrdya.com',
    role: 'supervisor',
    department: 'إشراف الوردية الصباحية',
    assignedLine: 'كل صالة الإنتاج',
    avatar: '📋',
  },
  maintenance: {
    id: 'usr-maint-03',
    name: 'م. محمود صقر',
    email: 'maintenance@wrdya.com',
    role: 'maintenance',
    department: 'فريق الصيانة الكهربائية والميكانيكية',
    assignedLine: 'فريق الطوارئ',
    avatar: '🛠️',
  },
  admin: {
    id: 'usr-mgr-04',
    name: 'د. طارق فهمي',
    email: 'manager@wrdya.com',
    role: 'admin',
    department: 'إدارة العمليات والإنتاج',
    assignedLine: 'الإدارة العامة',
    avatar: '👔',
  },
};

interface AuthContextType {
  user: UserProfile | null;
  activeRole: UserRole;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  loginAsDemo: (role: UserRole) => void;
  setActiveRole: (role: UserRole) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_USER_KEY = 'wrdya_user_profile_v2';
const STORAGE_ROLE_KEY = 'wrdya_active_role_v2';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeRole, setActiveRoleState] = useState<UserRole>('operator');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session from localStorage or Supabase
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_USER_KEY);
      const savedRole = localStorage.getItem(STORAGE_ROLE_KEY) as UserRole | null;

      if (savedUser) {
        const parsed = JSON.parse(savedUser) as UserProfile;
        setUser(parsed);
        if (savedRole) {
          setActiveRoleState(savedRole);
        } else {
          setActiveRoleState(parsed.role);
        }
      } else {
        // Default to Supervisor demo persona so the app opens ready with live data
        const defaultProfile = DEMO_PROFILES.supervisor;
        setUser(defaultProfile);
        setActiveRoleState('supervisor');
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(defaultProfile));
        localStorage.setItem(STORAGE_ROLE_KEY, 'supervisor');
      }
    } catch {
      setUser(DEMO_PROFILES.supervisor);
      setActiveRoleState('supervisor');
    } finally {
      setIsLoading(false);
    }

    // Optional Supabase Auth listener
    if (supabase && supabase.auth) {
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session?.user) {
          const authUser = data.session.user;
          const role = (authUser.user_metadata?.role as UserRole) || 'supervisor';
          const profile: UserProfile = {
            id: authUser.id,
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'المستخدم',
            email: authUser.email || '',
            role,
            department: authUser.user_metadata?.department || 'صالة الإنتاج',
          };
          setUser(profile);
          setActiveRoleState(role);
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(profile));
          localStorage.setItem(STORAGE_ROLE_KEY, role);
        }
      }).catch(() => {
        // Ignore Supabase connection errors during local dev
      });
    }
  }, []);

  const setActiveRole = (newRole: UserRole) => {
    setActiveRoleState(newRole);
    localStorage.setItem(STORAGE_ROLE_KEY, newRole);
    if (user) {
      const updatedUser = { ...user, role: newRole };
      setUser(updatedUser);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updatedUser));
    }
  };

  const loginAsDemo = (role: UserRole) => {
    const profile = DEMO_PROFILES[role];
    setUser(profile);
    setActiveRoleState(role);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(profile));
    localStorage.setItem(STORAGE_ROLE_KEY, role);
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check if it's one of the demo emails
      const matchedDemoRole = (Object.keys(DEMO_PROFILES) as UserRole[]).find(
        (r) => DEMO_PROFILES[r].email.toLowerCase() === email.trim().toLowerCase()
      );

      if (matchedDemoRole) {
        loginAsDemo(matchedDemoRole);
        return { success: true };
      }

      // Try Supabase Auth
      if (supabase && supabase.auth) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.user) {
          const role = (data.user.user_metadata?.role as UserRole) || 'operator';
          const profile: UserProfile = {
            id: data.user.id,
            name: data.user.user_metadata?.name || email.split('@')[0],
            email: data.user.email || email,
            role,
            department: data.user.user_metadata?.department || 'صالة الإنتاج',
          };
          setUser(profile);
          setActiveRoleState(role);
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(profile));
          localStorage.setItem(STORAGE_ROLE_KEY, role);
          return { success: true };
        }
      }

      // Fallback local sign in
      const defaultRole: UserRole = email.includes('admin') || email.includes('manager')
        ? 'admin'
        : email.includes('maint')
        ? 'maintenance'
        : email.includes('super')
        ? 'supervisor'
        : 'operator';

      const customUser: UserProfile = {
        id: 'usr-' + Date.now(),
        name: email.split('@')[0],
        email: email.trim(),
        role: defaultRole,
        department: 'قسم العمليات الرئيسي',
      };

      setUser(customUser);
      setActiveRoleState(defaultRole);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(customUser));
      localStorage.setItem(STORAGE_ROLE_KEY, defaultRole);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'فشل تسجيل الدخول' };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (supabase && supabase.auth) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              name,
              role,
            },
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }
      }

      const newUser: UserProfile = {
        id: 'usr-' + Date.now(),
        name: name.trim() || email.split('@')[0],
        email: email.trim(),
        role,
        department: role === 'operator' ? 'تشغيل الماكينات' : role === 'maintenance' ? 'إدارة الصيانة' : 'إدارة الإنتاج',
      };

      setUser(newUser);
      setActiveRoleState(role);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(newUser));
      localStorage.setItem(STORAGE_ROLE_KEY, role);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'فشل إنشاء الحساب' };
    }
  };

  const signOut = async () => {
    if (supabase && supabase.auth) {
      await supabase.auth.signOut().catch(() => {});
    }
    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_ROLE_KEY);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      activeRole,
      isLoading,
      signIn,
      signUp,
      loginAsDemo,
      setActiveRole,
      signOut,
    }),
    [user, activeRole, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
