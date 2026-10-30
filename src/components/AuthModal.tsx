'use client';

import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose, defaultMode = 'login' }: AuthModalProps) {
  const { locale, isRtl } = useLanguage();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await signInWithEmail(email, password);
        if (!res.success) {
          setError(res.error || (locale === 'ar' ? 'فشل تسجيل الدخول. يرجى مراجعة البيانات.' : 'Login failed. Please check credentials.'));
        } else {
          onClose();
        }
      } else {
        const res = await signUpWithEmail(email, password, fullName);
        if (!res.success) {
          setError(res.error || (locale === 'ar' ? 'فشل إنشاء الحساب.' : 'Sign-up failed.'));
        } else if (res.requireVerification) {
          setSuccessMsg(
            locale === 'ar'
              ? 'تم إنشاء الحساب بنجاح! يرجى مراجعة بريدك الإلكتروني لتأكيد التسجيل.'
              : 'Account created! Please check your email to verify your registration.'
          );
        } else {
          onClose();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const res = await signInWithGoogle();
      if (!res.success) {
        setError(res.error || 'Failed to authenticate with Google');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 sm:p-8"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 ltr:right-5 rtl:left-5 grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{locale === 'ar' ? 'حساب Skanybot المعتمد' : 'Skanybot Real Estate Account'}</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {mode === 'login'
              ? (locale === 'ar' ? 'تسجيل الدخول' : 'Sign In to Skanybot')
              : (locale === 'ar' ? 'إنشاء حساب جديد' : 'Create Free Account')}
          </h2>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400">
            {locale === 'ar'
              ? 'سجّل دخولك لحفظ محادثاتك العقارية ومتابعة استفساراتك عبر أجهزتك'
              : 'Save your property inquiries, chat history, and quota across all devices'}
          </p>
        </div>

        {/* Google One-Click Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-3 px-4 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800 disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
          ) : (
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
          )}
          <span>
            {locale === 'ar' ? 'المتابعة بواسطة Google' : 'Continue with Google'}
          </span>
        </button>

        {/* Divider */}
        <div className="relative my-5 select-none text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-zinc-800" />
          </div>
          <span className="relative bg-white px-3 text-[11px] font-semibold text-slate-400 dark:bg-zinc-950 dark:text-zinc-500">
            {locale === 'ar' ? 'أو عبر البريد الإلكتروني' : 'Or with email'}
          </span>
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
                {locale === 'ar' ? 'الاسم بالكامل' : 'Full Name'}
              </label>
              <div className="relative">
                <User className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={locale === 'ar' ? 'محمد أحمد' : 'John Doe'}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 ltr:pl-9 rtl:pr-9 ltr:pr-3 rtl:pl-3 text-xs text-slate-900 outline-none transition focus:border-amber-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-amber-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
              {locale === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 ltr:pl-9 rtl:pr-9 ltr:pr-3 rtl:pl-3 text-xs text-slate-900 outline-none transition focus:border-amber-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
              {locale === 'ar' ? 'كلمة المرور' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 ltr:pl-9 rtl:pr-9 ltr:pr-10 rtl:pl-10 text-xs text-slate-900 outline-none transition focus:border-amber-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-amber-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 -translate-y-1/2 ltr:right-3 rtl:left-3 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 py-3 text-xs font-black text-black shadow-md transition hover:brightness-105 active:scale-[0.98] disabled:opacity-50 mt-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === 'login' ? (
              <span>{locale === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</span>
            ) : (
              <span>{locale === 'ar' ? 'إنشاء حساب جديد' : 'Sign Up'}</span>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-5 text-center text-xs text-slate-500 dark:text-zinc-400">
          {mode === 'login' ? (
            <p>
              {locale === 'ar' ? 'ليس لديك حساب بعد؟' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(null); }}
                className="font-bold text-amber-600 dark:text-amber-400 hover:underline"
              >
                {locale === 'ar' ? 'أنشئ حساباً مجانياً' : 'Create one for free'}
              </button>
            </p>
          ) : (
            <p>
              {locale === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null); }}
                className="font-bold text-amber-600 dark:text-amber-400 hover:underline"
              >
                {locale === 'ar' ? 'سجّل الدخول' : 'Sign in'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
