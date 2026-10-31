'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  MessageSquare,
  Building2,
  RefreshCw,
  Search,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Clock,
  CheckCircle2,
  User,
  Bot,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Inbox,
  Filter,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  AlertTriangle
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalSessions: number;
  totalMessages: number;
  totalProperties: number;
  recentSessions24h: number;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  role: string;
}

interface ChatSessionItem {
  id: string;
  session_token: string;
  title: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  message_count: number;
  last_message: string;
  last_role: string;
  last_at: string;
}

interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata: any;
  created_at: string;
  is_deleted: boolean;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();

  // Admin Theme: Dark / Light toggle specifically for Admin
  const [adminTheme, setAdminTheme] = useState<'dark' | 'light'>('dark');

  // Fullscreen / Maximize Chat Window
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'chats' | 'users'>('chats');

  // Stats & Users state
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Chat Sessions state
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessionSearch, setSessionSearch] = useState('');
  const [sessionFilter, setSessionFilter] = useState<'all' | 'active' | 'deleted'>('all');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Active Conversation state
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // User search
  const [userSearch, setUserSearch] = useState('');

  // Messages container scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load saved admin theme
  useEffect(() => {
    try {
      const saved = localStorage.getItem('skanybot_admin_theme') as 'dark' | 'light' | null;
      if (saved === 'dark' || saved === 'light') {
        setAdminTheme(saved);
      }
    } catch {}
  }, []);

  const toggleTheme = () => {
    const nextTheme = adminTheme === 'dark' ? 'light' : 'dark';
    setAdminTheme(nextTheme);
    try {
      localStorage.setItem('skanybot_admin_theme', nextTheme);
    } catch {}
  };

  // 1. Fetch Stats & Users
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setUsersList(data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // 2. Fetch Sessions
  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const params = new URLSearchParams();
      if (sessionSearch) params.set('q', sessionSearch);
      if (sessionFilter !== 'all') params.set('filter', sessionFilter);

      const res = await fetch(`/api/admin/chats?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const loadedSessions: ChatSessionItem[] = data.sessions || [];
        setSessions(loadedSessions);
        // Auto-select first session if none selected
        if (!selectedSessionId && loadedSessions.length > 0) {
          setSelectedSessionId(loadedSessions[0].id);
        } else if (selectedSessionId && !loadedSessions.find((s) => s.id === selectedSessionId)) {
          setSelectedSessionId(loadedSessions[0]?.id || null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin chats:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  // 3. Fetch Single Session Messages
  const fetchSessionMessages = async (sessionId: string) => {
    try {
      setLoadingMessages(true);
      const res = await fetch(`/api/admin/chats/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveSession(data.session);
        setMessages(data.messages || []);
        // Scroll to bottom on load
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      console.error('Failed to fetch session messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // 4. Permanent Hard Delete Session from Supabase
  const handlePermanentDelete = async (sessionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const targetSession = sessions.find((s) => s.id === sessionId);
    const titleSnippet = targetSession?.title || sessionId;

    if (
      !window.confirm(
        `⚠️ تأكيد الحذف النهائي:\n\nهل تريد حذف هذه المحادثة ("${titleSnippet}") وجميع رسائلها نهائياً من قاعدة بيانات Supabase؟\n\nلن يمكن استرجاع هذه البيانات بعد الحذف.`
      )
    ) {
      return;
    }

    try {
      setDeletingSessionId(sessionId);
      const res = await fetch(`/api/admin/chats/${sessionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        // Remove permanently from local state
        setSessions((prev) => {
          const updated = prev.filter((s) => s.id !== sessionId);
          if (selectedSessionId === sessionId) {
            setSelectedSessionId(updated[0]?.id || null);
            if (updated.length === 0) {
              setActiveSession(null);
              setMessages([]);
            }
          }
          return updated;
        });

        // Update stats
        setStats((prev) =>
          prev
            ? {
                ...prev,
                totalSessions: Math.max(0, prev.totalSessions - 1),
                totalMessages: Math.max(0, prev.totalMessages - (targetSession?.message_count || 0)),
              }
            : prev
        );
      } else {
        const data = await res.json();
        alert(`فشل الحذف: ${data.error || 'حدث خطأ'}`);
      }
    } catch (err: any) {
      console.error('Failed to permanently delete session:', err);
      alert('حدث خطأ أثناء الاتصال بقاعدة البيانات');
    } finally {
      setDeletingSessionId(null);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchSessions();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSessions();
    }, 300);
    return () => clearTimeout(timer);
  }, [sessionSearch, sessionFilter]);

  useEffect(() => {
    if (selectedSessionId) {
      fetchSessionMessages(selectedSessionId);
    }
  }, [selectedSessionId]);

  // Copy session ID
  const handleCopySessionId = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    if (!userSearch) return usersList;
    const q = userSearch.toLowerCase();
    return usersList.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.name?.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
    );
  }, [usersList, userSearch]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const timeAgo = (dateStr?: string | null) => {
    if (!dateStr) return '';
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'الآن';
      if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `منذ ${diffHours} ساعة`;
      const diffDays = Math.floor(diffHours / 24);
      return `منذ ${diffDays} يوم`;
    } catch {
      return '';
    }
  };

  const isDark = adminTheme === 'dark';

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
      dir="rtl"
    >
      {/* Top Admin Navbar */}
      <header
        className={`sticky top-0 z-40 border-b px-4 sm:px-6 py-3.5 backdrop-blur-md transition-colors ${
          isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-white/95 shadow-xs'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-black shadow-md shadow-amber-500/20 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  لوحة تحكم وإدارة سكنى بوت
                </h1>
                <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-500 dark:text-amber-400">
                  مشرف النظام
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                مرحباً بك: <span className="font-mono text-amber-600 dark:text-amber-300 font-bold">{user?.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark / Light Mode Switcher specifically in Admin */}
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                isDark
                  ? 'border-slate-800 bg-slate-800/80 text-amber-300 hover:bg-slate-800'
                  : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
              title={isDark ? 'التبديل إلى الوضع النهاري (Light Mode)' : 'التبديل إلى الوضع الليلي (Dark Mode)'}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="hidden sm:inline">{isDark ? 'نهاري' : 'ليلي'}</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => {
                fetchStats();
                fetchSessions();
                if (selectedSessionId) fetchSessionMessages(selectedSessionId);
              }}
              disabled={loadingStats || loadingSessions}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                isDark
                  ? 'border-slate-800 bg-slate-800/80 text-slate-200 hover:bg-slate-800 hover:text-white'
                  : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title="تحديث البيانات"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loadingStats || loadingSessions ? 'animate-spin text-amber-500' : ''}`}
              />
              <span className="hidden sm:inline">تحديث</span>
            </button>

            {/* Return to App */}
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-3.5 py-2 text-xs font-bold text-black transition shadow-xs hover:shadow-amber-500/20"
            >
              <span>العودة للتطبيق</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* KPI Stats Bar */}
      <section
        className={`border-b px-4 sm:px-6 py-4 transition-colors ${
          isDark ? 'border-slate-800/80 bg-slate-900/40' : 'border-slate-200 bg-slate-50/80'
        }`}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Users */}
          <div
            className={`rounded-2xl border p-3.5 transition ${
              isDark
                ? 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>المستخدمين المسجلين</span>
              <Users className="h-4 w-4 text-sky-500 dark:text-sky-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {stats?.totalUsers ?? '—'}
              </span>
              <span className="text-[11px] text-slate-400">عميل مسجل</span>
            </div>
          </div>

          {/* Card 2: Chat Sessions */}
          <div
            className={`rounded-2xl border p-3.5 transition ${
              isDark
                ? 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>جلسات المحادثة</span>
              <MessageSquare className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {stats?.totalSessions ?? '—'}
              </span>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                +{stats?.recentSessions24h ?? 0} خلال 24 ساعة
              </span>
            </div>
          </div>

          {/* Card 3: Total AI Messages */}
          <div
            className={`rounded-2xl border p-3.5 transition ${
              isDark
                ? 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>رسائل الذكاء الاصطناعي</span>
              <Sparkles className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {stats?.totalMessages ?? '—'}
              </span>
              <span className="text-[11px] text-slate-400">رسالة متبادلة</span>
            </div>
          </div>

          {/* Card 4: Properties Inventory */}
          <div
            className={`rounded-2xl border p-3.5 transition ${
              isDark
                ? 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>العقارات المتاحة</span>
              <Building2 className="h-4 w-4 text-purple-500 dark:text-purple-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {stats?.totalProperties ?? '—'}
              </span>
              <span className="text-[11px] text-slate-400">وحدة معتمدة</span>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs Switcher */}
      <section
        className={`border-b px-4 sm:px-6 transition-colors ${
          isDark ? 'border-slate-800 bg-slate-900/20' : 'border-slate-200 bg-slate-50/50'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
              activeTab === 'chats'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>مراجعة محادثات العملاء</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {sessions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
              activeTab === 'users'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>المستخدمين المسجلين والتحليلات</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {usersList.length}
            </span>
          </button>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col min-h-0">
        {activeTab === 'chats' ? (
          /* ============================================================== */
          /* TAB 1: CHAT SESSIONS & CONVERSATION REVIEW                     */
          /* ============================================================== */
          <div
            className={`transition-all duration-300 ${
              isFullscreen
                ? `fixed inset-0 z-50 p-3 sm:p-4 flex flex-col h-screen w-screen m-0 ${
                    isDark ? 'bg-slate-950' : 'bg-slate-100'
                  }`
                : 'flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-270px)] min-h-[580px]'
            }`}
          >
            {/* When Fullscreen, top header toolbar inside container */}
            {isFullscreen && (
              <div
                className={`flex items-center justify-between pb-3 border-b mb-3 shrink-0 ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-500" />
                  <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    مراجعة محادثات سكنى بوت (وضع ملء الشاشة الكامل)
                  </span>
                </div>
                <button
                  onClick={() => setIsFullscreen(false)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                    isDark
                      ? 'border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800'
                      : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
                  }`}
                  title="إنهاء وضع ملء الشاشة"
                >
                  <Minimize2 className="h-4 w-4" />
                  <span>تصغير الشاشة</span>
                </button>
              </div>
            )}

            {/* Layout Wrapper when Fullscreen */}
            <div
              className={`grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden ${
                isFullscreen ? 'h-full' : 'contents'
              }`}
            >
              {/* Left Column: Sessions List (5 cols) */}
              <div
                className={`lg:col-span-5 flex flex-col rounded-2xl border overflow-hidden min-h-0 ${
                  isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white shadow-sm'
                }`}
              >
                {/* Search & Filter Header */}
                <div
                  className={`p-3 border-b space-y-2 shrink-0 ${
                    isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={sessionSearch}
                      onChange={(e) => setSessionSearch(e.target.value)}
                      placeholder="ابحث بالعنوان أو الكلمات أو المعرف..."
                      className={`w-full rounded-xl border py-2 pr-9 pl-3 text-xs focus:border-amber-500 focus:outline-none transition ${
                        isDark
                          ? 'border-slate-800 bg-slate-950 text-slate-200 placeholder-slate-500'
                          : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-[11px]">الحالة:</span>
                      {(['all', 'active', 'deleted'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setSessionFilter(mode)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                            sessionFilter === mode
                              ? 'bg-amber-500 text-black'
                              : isDark
                              ? 'bg-slate-800 text-slate-400 hover:text-slate-200'
                              : 'bg-slate-200 text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {mode === 'all' ? 'الكل' : mode === 'active' ? 'النشطة' : 'المحذوفة'}
                        </button>
                      ))}
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono">
                      {sessions.length} جلسة
                    </span>
                  </div>
                </div>

                {/* Sessions List Scrollable Container with Smooth Scroll */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 p-1.5 space-y-1 min-h-0">
                  {loadingSessions ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-amber-500" />
                      جاري تحميل المحادثات...
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      <Inbox className="h-6 w-6 mx-auto mb-2 text-slate-500" />
                      لا توجد محادثات تطابق البحث
                    </div>
                  ) : (
                    sessions.map((s) => {
                      const isSelected = selectedSessionId === s.id;
                      return (
                        <div
                          key={s.id}
                          onClick={() => setSelectedSessionId(s.id)}
                          className={`group relative cursor-pointer rounded-xl p-3 transition border ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-500/50 shadow-xs'
                              : isDark
                              ? 'hover:bg-slate-800/50 border-transparent'
                              : 'hover:bg-slate-100 border-transparent'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {s.user_email ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/15 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 text-[10px] font-bold shrink-0">
                                  <User className="h-2.5 w-2.5" />
                                  <span className="truncate max-w-[120px]">{s.user_email}</span>
                                </span>
                              ) : (
                                <span
                                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold shrink-0 ${
                                    isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                                  }`}
                                >
                                  زائر مجهول
                                </span>
                              )}
                              {s.is_deleted && (
                                <span className="rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 text-[9px] font-bold shrink-0">
                                  محذوف
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
                              <Clock className="h-2.5 w-2.5" />
                              <span>{timeAgo(s.created_at)}</span>

                              {/* Hover Quick Delete from List */}
                              <button
                                onClick={(e) => handlePermanentDelete(s.id, e)}
                                className="opacity-0 group-hover:opacity-100 mr-1 p-1 rounded-md hover:bg-rose-500/20 text-rose-500 transition"
                                title="حذف هذه المحادثة نهائياً من Supabase"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          {/* Title / Initial question */}
                          <h4
                            className={`mt-1.5 text-xs font-bold line-clamp-2 leading-relaxed ${
                              isDark ? 'text-slate-200' : 'text-slate-800'
                            }`}
                          >
                            {s.title}
                          </h4>

                          {/* Snippet of last message */}
                          {s.last_message && (
                            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                              {s.last_role === 'assistant' ? '🤖 البوت: ' : '👤 العميل: '}
                              {s.last_message}
                            </p>
                          )}

                          {/* Card Footer */}
                          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                            <span
                              className={`rounded-md px-2 py-0.5 font-mono ${
                                isDark ? 'bg-slate-800/80 text-slate-300' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {s.message_count} رسائل
                            </span>
                            <span className="font-mono text-[9px] text-slate-400 truncate max-w-[140px]">
                              {s.session_token}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Full Conversation Timeline (7 cols) */}
              <div
                className={`lg:col-span-7 flex flex-col rounded-2xl border overflow-hidden min-h-0 ${
                  isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white shadow-sm'
                }`}
              >
                {selectedSessionId && activeSession ? (
                  <>
                    {/* Conversation Header Bar */}
                    <div
                      className={`p-3.5 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
                        isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={`text-sm font-black truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {activeSession.title || 'محادثة عقارية'}
                          </h3>
                          {activeSession.is_deleted && (
                            <span className="rounded-md bg-rose-500/20 text-rose-500 dark:text-rose-400 px-2 py-0.5 text-[10px] font-bold">
                              محذوفة سابقاً
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          {activeSession.user?.email ? (
                            <span className="text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {activeSession.user.email}
                            </span>
                          ) : (
                            <span className="text-slate-400">زائر غير مسجل</span>
                          )}
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            {formatDate(activeSession.created_at)}
                          </span>
                          <span>•</span>
                          <button
                            onClick={() => handleCopySessionId(activeSession.id)}
                            className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-amber-500"
                            title="نسخ معرف الجلسة"
                          >
                            <span>{activeSession.id.slice(0, 8)}...</span>
                            {copiedId ? (
                              <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Toggle Fullscreen inside conversation */}
                        <button
                          onClick={() => setIsFullscreen(!isFullscreen)}
                          className={`flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition ${
                            isDark
                              ? 'border-slate-800 bg-slate-800 text-slate-200 hover:bg-slate-700'
                              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                          }`}
                          title={isFullscreen ? 'تصغير' : 'تكبير ملء الشاشة'}
                        >
                          {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                          <span className="hidden sm:inline">{isFullscreen ? 'تصغير' : 'تكبير'}</span>
                        </button>

                        {/* Permanent Hard Delete Button */}
                        <button
                          onClick={() => handlePermanentDelete(activeSession.id)}
                          disabled={deletingSessionId === activeSession.id}
                          className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500 text-rose-600 dark:text-rose-300 hover:text-white px-3 py-1.5 text-xs font-black transition disabled:opacity-50 shadow-xs"
                          title="حذف هذه المحادثة نهائياً من قاعدة بيانات Supabase"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>{deletingSessionId === activeSession.id ? 'جاري الحذف...' : 'حذف نهائي من سوبابيز'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Conversation Messages Feed with Full Smooth Scrolling */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 min-h-0">
                      {loadingMessages ? (
                        <div className="p-8 text-center text-slate-400 text-xs">
                          <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-amber-500" />
                          جاري تحميل رسائل المحادثة...
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs">
                          لا توجد رسائل مسجلة في هذه الجلسة
                        </div>
                      ) : (
                        messages.map((msg, index) => {
                          const isBot = msg.role === 'assistant';
                          const propCount = msg.metadata?.property_ids?.length || 0;
                          const aiModel = msg.metadata?.ai_model || 'deepseek-chat';

                          return (
                            <div
                              key={msg.id || index}
                              className={`flex gap-3 ${isBot ? 'items-start' : 'items-start flex-row-reverse'}`}
                            >
                              {/* Avatar */}
                              <div
                                className={`grid h-8 w-8 place-items-center rounded-xl shrink-0 ${
                                  isBot
                                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                                    : isDark
                                    ? 'bg-slate-800 text-slate-300'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                              </div>

                              {/* Message Bubble Container */}
                              <div className={`max-w-[85%] space-y-1.5 ${isBot ? 'text-right' : 'text-right'}`}>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                  <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                    {isBot ? 'سكنى بوت' : activeSession.user?.name || 'العميل'}
                                  </span>
                                  <span>•</span>
                                  <span>{formatDate(msg.created_at)}</span>
                                  {isBot && (
                                    <span
                                      className={`font-mono text-[9px] px-1.5 py-0.5 rounded ${
                                        isDark ? 'bg-slate-800 text-amber-300' : 'bg-slate-200 text-amber-800'
                                      }`}
                                    >
                                      {aiModel}
                                    </span>
                                  )}
                                </div>

                                {/* Bubble */}
                                <div
                                  className={`rounded-2xl p-3.5 text-xs leading-relaxed whitespace-pre-wrap break-words ${
                                    isBot
                                      ? isDark
                                        ? 'bg-slate-900 border border-slate-800 text-slate-100 shadow-xs'
                                        : 'bg-slate-100 border border-slate-200 text-slate-900 shadow-xs'
                                      : 'bg-amber-500 text-black font-semibold shadow-md shadow-amber-500/10'
                                  }`}
                                >
                                  {msg.content}
                                </div>

                                {/* Properties Recommended Badge */}
                                {isBot && propCount > 0 && (
                                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                    <Building2 className="h-3 w-3" />
                                    <span>اقترح البوت {propCount} وحدات عقارية في هذا الرد</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 text-xs min-h-0">
                    <MessageSquare className="h-10 w-10 text-slate-400/40 mb-3" />
                    <p className="font-bold text-slate-500 dark:text-slate-400">
                      اختر محادثة من القائمة لمراجعتها بالكامل
                    </p>
                    <p className="mt-1 text-slate-400 text-center">
                      يمكنك استعراض أسئلة العملاء، ردود الذكاء الاصطناعي، والعقارات المقترحة، وحذف أي محادثة نهائياً من قاعدة البيانات.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* TAB 2: REGISTERED USERS & ANALYTICS                            */
          /* ============================================================== */
          <div className="space-y-4 flex-1">
            {/* Search Box */}
            <div
              className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${
                isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white shadow-xs'
              }`}
            >
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="ابحث عن مستخدم بالبريد أو الاسم أو المعرف..."
                  className={`w-full rounded-xl border py-2.5 pr-10 pl-4 text-xs focus:border-amber-500 focus:outline-none transition ${
                    isDark
                      ? 'border-slate-800 bg-slate-950 text-slate-200 placeholder-slate-500'
                      : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400">
                إجمالي المسجلين: <span className="font-mono font-bold text-amber-500">{filteredUsers.length}</span>
              </div>
            </div>

            {/* Users Table */}
            <div
              className={`rounded-2xl border overflow-hidden ${
                isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white shadow-xs'
              }`}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead
                    className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                      isDark ? 'border-slate-800 bg-slate-900 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <tr>
                      <th className="p-3.5">المستخدم</th>
                      <th className="p-3.5">البريد الإلكتروني</th>
                      <th className="p-3.5">تاريخ التسجيل</th>
                      <th className="p-3.5">آخر تسجيل دخول</th>
                      <th className="p-3.5">الدور</th>
                      <th className="p-3.5 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                    {loadingStats ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                          <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-amber-500" />
                          جاري تحميل قائمة المستخدمين...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                          لا يوجد مستخدمين يطابقون البحث
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr
                          key={u.id}
                          className={`transition ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}
                        >
                          <td className="p-3.5 font-bold flex items-center gap-2">
                            <div className="grid h-7 w-7 place-items-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold shrink-0">
                              {u.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <span className="truncate max-w-[180px]">{u.name}</span>
                          </td>
                          <td className="p-3.5 font-mono">
                            {u.email}
                            {u.email === 'weeessd57@gmail.com' && (
                              <span className="mr-2 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 text-[9px] font-bold">
                                Super Admin
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-slate-500 dark:text-slate-400">
                            {formatDate(u.created_at)}
                          </td>
                          <td className="p-3.5 text-slate-500 dark:text-slate-400">
                            {formatDate(u.last_sign_in_at)}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => {
                                setSessionSearch(u.email);
                                setActiveTab('chats');
                              }}
                              className="rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 transition"
                            >
                              عرض محادثاته
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
