'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { UserRole, FactoryProfile, NewFactoryRegistration } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  assignedLine?: string;
  avatar?: string;
  factoryId?: string;
  factoryName?: string;
}

export const DEFAULT_FACTORY: FactoryProfile = {
  id: 'fac-eg-01',
  name: 'مصنع النيل للصناعات البلاستيكية والبوليمر',
  industry: 'بلاستيك وبوليمر وعبوات صناعية',
  code: 'WRD-EG-742',
  adminName: 'د. طارق فهمي (المدير العام)',
  adminEmail: 'manager@wrdya.com',
  shiftModel: '3_shifts_8h',
  linesCount: 3,
  machinesCount: 4,
  staffCount: 18,
  createdAt: new Date().toISOString(),
};

export const DEMO_PROFILES: Record<UserRole, UserProfile> = {
  operator: {
    id: 'usr-op-01',
    name: 'حسام كمال',
    email: 'operator@wrdya.com',
    role: 'operator',
    department: 'خطوط البثق والتشكيل',
    assignedLine: 'EXT-01',
    avatar: '👷‍♂️',
    factoryId: 'fac-eg-01',
    factoryName: 'مصنع النيل للصناعات البلاستيكية والبوليمر',
  },
  supervisor: {
    id: 'usr-sup-02',
    name: 'م. أحمد عادل',
    email: 'supervisor@wrdya.com',
    role: 'supervisor',
    department: 'إشراف الوردية الصباحية',
    assignedLine: 'كل صالة الإنتاج',
    avatar: '📋',
    factoryId: 'fac-eg-01',
    factoryName: 'مصنع النيل للصناعات البلاستيكية والبوليمر',
  },
  maintenance: {
    id: 'usr-maint-03',
    name: 'م. محمود صقر',
    email: 'maintenance@wrdya.com',
    role: 'maintenance',
    department: 'فريق الصيانة الكهربائية والميكانيكية',
    assignedLine: 'فريق الطوارئ',
    avatar: '🛠️',
    factoryId: 'fac-eg-01',
    factoryName: 'مصنع النيل للصناعات البلاستيكية والبوليمر',
  },
  admin: {
    id: 'usr-mgr-04',
    name: 'د. طارق فهمي',
    email: 'manager@wrdya.com',
    role: 'admin',
    department: 'الإدارة العامة والعمليات',
    assignedLine: 'إدارة المصنع',
    avatar: '👔',
    factoryId: 'fac-eg-01',
    factoryName: 'مصنع النيل للصناعات البلاستيكية والبوليمر',
  },
};

interface AuthContextType {
  user: UserProfile | null;
  factory: FactoryProfile;
  activeRole: UserRole;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  registerFactory: (data: NewFactoryRegistration) => Promise<{ success: boolean; error?: string; factory?: FactoryProfile }>;
  updateFactory: (data: Partial<FactoryProfile>) => void;
  loginAsDemo: (role: UserRole) => void;
  setActiveRole: (role: UserRole) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_USER_KEY = 'wrdya_user_profile_v2';
const STORAGE_ROLE_KEY = 'wrdya_active_role_v2';
const STORAGE_FACTORY_KEY = 'wrdya_factory_profile_v2';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [factory, setFactory] = useState<FactoryProfile>(DEFAULT_FACTORY);
  const [activeRole, setActiveRoleState] = useState<UserRole>('supervisor');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session from localStorage or Supabase
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_USER_KEY);
      const savedRole = localStorage.getItem(STORAGE_ROLE_KEY) as UserRole | null;
      const savedFactory = localStorage.getItem(STORAGE_FACTORY_KEY);

      if (savedFactory) {
        try {
          setFactory(JSON.parse(savedFactory));
        } catch {}
      }

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
            factoryName: authUser.user_metadata?.factoryName,
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

  const updateFactory = (data: Partial<FactoryProfile>) => {
    setFactory((prev) => {
      const updated = { ...prev, ...data };
      localStorage.setItem(STORAGE_FACTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const registerFactory = async (
    data: NewFactoryRegistration
  ): Promise<{ success: boolean; error?: string; factory?: FactoryProfile }> => {
    try {
      const generatedCode = 'WRD-' + (data.industry.slice(0, 2).toUpperCase() || 'EG') + '-' + Math.floor(100 + Math.random() * 900);
      const newFactory: FactoryProfile = {
        id: 'fac-' + Date.now(),
        name: data.factoryName.trim(),
        industry: data.industry,
        code: generatedCode,
        adminName: data.adminName.trim(),
        adminEmail: data.email.trim(),
        shiftModel: data.shiftModel,
        linesCount: data.estimatedLines || 3,
        machinesCount: data.estimatedMachines || 6,
        staffCount: 0,
        createdAt: new Date().toISOString(),
      };

      // Create admin user profile for the factory owner/manager
      const adminProfile: UserProfile = {
        id: 'usr-admin-' + Date.now(),
        name: data.adminName.trim(),
        email: data.email.trim(),
        role: 'admin',
        department: 'الإدارة العامة للمصنع',
        assignedLine: 'كل خطوط المصنع',
        avatar: '👔',
        factoryId: newFactory.id,
        factoryName: newFactory.name,
      };

      if (supabase && supabase.auth) {
        try {
          await supabase.auth.signUp({
            email: data.email.trim(),
            password: data.password,
            options: {
              data: {
                name: data.adminName,
                role: 'admin',
                factoryName: data.factoryName,
                factoryCode: generatedCode,
              },
            },
          });
        } catch {
          // Continue with local storage if network or offline
        }
      }

      setFactory(newFactory);
      setUser(adminProfile);
      setActiveRoleState('admin');

      localStorage.setItem(STORAGE_FACTORY_KEY, JSON.stringify(newFactory));
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(adminProfile));
      localStorage.setItem(STORAGE_ROLE_KEY, 'admin');

      return { success: true, factory: newFactory };
    } catch (err: any) {
      return { success: false, error: err.message || 'فشل تسجيل المصنع الجديد' };
    }
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
            factoryName: data.user.user_metadata?.factoryName,
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
      factory,
      activeRole,
      isLoading,
      signIn,
      signUp,
      registerFactory,
      updateFactory,
      loginAsDemo,
      setActiveRole,
      signOut,
    }),
    [user, factory, activeRole, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
