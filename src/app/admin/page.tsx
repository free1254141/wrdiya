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
  User,
  Bot,
  Sparkles,
  Inbox,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  ArrowDown,
  ChevronDown
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

  // Admin Theme: Pure Black ('dark') or Clean White ('light')
  const [adminTheme, setAdminTheme] = useState<'dark' | 'light'>('dark');

  // Fullscreen / Maximize Window Toggle
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'chats' | 'users'>('chats');

  // Stats & Users state
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Chat Sessions state (Paginated)
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessionSearch, setSessionSearch] = useState('');
  const [sessionFilter, setSessionFilter] = useState<'all' | 'active' | 'deleted'>('all');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionsPage, setSessionsPage] = useState(1);
  const [hasMoreSessions, setHasMoreSessions] = useState(false);
  const [loadingMoreSessions, setLoadingMoreSessions] = useState(false);
  const [totalSessionsCount, setTotalSessionsCount] = useState<number | null>(null);

  // Active Conversation state (Windowed / Paginated)
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [totalMessagesCount, setTotalMessagesCount] = useState<number>(0);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Floating Scroll to Bottom state
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // User search
  const [userSearch, setUserSearch] = useState('');

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

  // 1. Fetch Stats & Users (with optional force cache bypass)
  const fetchStats = async (force = false) => {
    try {
      setLoadingStats(true);
      const res = await fetch(`/api/admin/stats${force ? '?force=true' : ''}`);
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

  // 2. Fetch Sessions (Paginated — loads 25 at a time)
  const fetchSessions = async (page = 1, append = false) => {
    try {
      if (append) {
        setLoadingMoreSessions(true);
      } else {
        setLoadingSessions(true);
      }

      const params = new URLSearchParams();
      if (sessionSearch) params.set('q', sessionSearch);
      if (sessionFilter !== 'all') params.set('filter', sessionFilter);
      params.set('page', String(page));
      params.set('pageSize', '25');

      const res = await fetch(`/api/admin/chats?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const loadedSessions: ChatSessionItem[] = data.sessions || [];
        setHasMoreSessions(Boolean(data.hasMore));
        setTotalSessionsCount(data.totalCount ?? null);
        setSessionsPage(page);

        if (append) {
          setSessions((prev) => [...prev, ...loadedSessions]);
        } else {
          setSessions(loadedSessions);
          // Auto-select first session if none selected
          if (!selectedSessionId && loadedSessions.length > 0) {
            setSelectedSessionId(loadedSessions[0].id);
          } else if (selectedSessionId && !loadedSessions.find((s) => s.id === selectedSessionId)) {
            setSelectedSessionId(loadedSessions[0]?.id || null);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin chats:', err);
    } finally {
      setLoadingSessions(false);
      setLoadingMoreSessions(false);
    }
  };

  const loadMoreSessions = () => {
    if (!loadingMoreSessions && hasMoreSessions) {
      fetchSessions(sessionsPage + 1, true);
    }
  };

  // 3. Fetch Session Messages (loads latest 35 messages by default)
  const fetchSessionMessages = async (sessionId: string, loadAll = false) => {
    try {
      if (loadAll) {
        setLoadingMoreMessages(true);
      } else {
        setLoadingMessages(true);
      }

      const res = await fetch(`/api/admin/chats/${sessionId}${loadAll ? '?all=true' : '?limit=35'}`);
      if (res.ok) {
        const data = await res.json();
        setActiveSession(data.session);
        setMessages(data.messages || []);
        setHasMoreMessages(Boolean(data.hasMore));
        setTotalMessagesCount(data.totalMessages || (data.messages || []).length);

        if (!loadAll) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 120);
        }
      }
    } catch (err) {
      console.error('Failed to fetch session messages:', err);
    } finally {
      setLoadingMessages(false);
      setLoadingMoreMessages(false);
    }
  };

  // Handle scroll detection inside the messages container
  const handleMessagesScroll = () => {
    const el = messagesScrollRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBottom(distanceToBottom > 160);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottom(false);
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

        // Update stats locally
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
    fetchSessions(1, false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSessions(1, false);
    }, 300);
    return () => clearTimeout(timer);
  }, [sessionSearch, sessionFilter]);

  useEffect(() => {
    if (selectedSessionId) {
      fetchSessionMessages(selectedSessionId, false);
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
      className={`min-h-full w-full flex flex-col font-sans transition-colors duration-150 ${
        isDark ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-900'
      }`}
      dir="rtl"
    >
      {/* Top Admin Navbar */}
      <header
        className={`sticky top-0 z-40 border-b px-4 sm:px-6 py-3 transition-colors ${
          isDark ? 'border-zinc-800 bg-black/95 backdrop-blur-md' : 'border-zinc-300 bg-white/95 shadow-xs'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-black shadow-md shadow-amber-500/20 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-base font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                  لوحة تحكم وإدارة سكنى بوت
                </h1>
                <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                  مشرف النظام
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                مرحباً بك: <span className="font-mono text-amber-500 font-bold">{user?.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Pure Black / Clean White Theme Switcher */}
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                isDark
                  ? 'border-zinc-800 bg-black text-amber-400 hover:bg-zinc-900'
                  : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
              }`}
              title={isDark ? 'التبديل إلى الوضع الفاتح (Light)' : 'التبديل إلى الوضع الأسود الخالص (Pure Black)'}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="hidden sm:inline">{isDark ? 'فاتح' : 'أسود خالص'}</span>
            </button>

            {/* Refresh Button (with forced cache bypass) */}
            <button
              onClick={() => {
                fetchStats(true);
                fetchSessions(1, false);
                if (selectedSessionId) fetchSessionMessages(selectedSessionId, false);
              }}
              disabled={loadingStats || loadingSessions}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                isDark
                  ? 'border-zinc-800 bg-black text-zinc-200 hover:bg-zinc-900'
                  : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
              }`}
              title="تحديث البيانات فورياً من سوبابيز"
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
        className={`border-b px-4 sm:px-6 py-3.5 transition-colors ${
          isDark ? 'border-zinc-800 bg-black' : 'border-zinc-200 bg-white'
        }`}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Users */}
          <div
            className={`rounded-2xl border p-3.5 transition ${
              isDark ? 'border-zinc-800 bg-black' : 'border-zinc-200 bg-zinc-50 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>المستخدمين المسجلين</span>
              <Users className="h-4 w-4 text-sky-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-black font-mono ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                {stats?.totalUsers ?? '—'}
              </span>
              <span className="text-[11px] text-zinc-500">عميل مسجل</span>
            </div>
          </div>

          {/* Card 2: Chat Sessions */}
          <div
            className={`rounded-2xl border p-3.5 transition ${
              isDark ? 'border-zinc-800 bg-black' : 'border-zinc-200 bg-zinc-50 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>جلسات المحادثة</span>
              <MessageSquare className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-black font-mono ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                {stats?.totalSessions ?? '—'}
              </span>
              <span className="text-[11px] text-amber-500 font-bold">
                +{stats?.recentSessions24h ?? 0} خلال 24 ساعة
              </span>
            </div>
          </div>

          {/* Card 3: Total AI Messages */}
          <div
            className={`rounded-2xl border p-3.5 transition ${
              isDark ? 'border-zinc-800 bg-black' : 'border-zinc-200 bg-zinc-50 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>رسائل الذكاء الاصطناعي</span>
              <Sparkles className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-black font-mono ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                {stats?.totalMessages ?? '—'}
              </span>
              <span className="text-[11px] text-zinc-500">رسالة متبادلة</span>
            </div>
          </div>

          {/* Card 4: Properties Inventory */}
          <div
            className={`rounded-2xl border p-3.5 transition ${
              isDark ? 'border-zinc-800 bg-black' : 'border-zinc-200 bg-zinc-50 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>العقارات المتاحة</span>
              <Building2 className="h-4 w-4 text-purple-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-black font-mono ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                {stats?.totalProperties ?? '—'}
              </span>
              <span className="text-[11px] text-zinc-500">وحدة معتمدة</span>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs Switcher */}
      <section
        className={`border-b px-4 sm:px-6 transition-colors ${
          isDark ? 'border-zinc-800 bg-black' : 'border-zinc-200 bg-zinc-50'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
              activeTab === 'chats'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>مراجعة محادثات العملاء</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                isDark ? 'bg-zinc-900 text-zinc-300 border border-zinc-800' : 'bg-zinc-200 text-zinc-700'
              }`}
            >
              {totalSessionsCount ?? sessions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
              activeTab === 'users'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>المستخدمين المسجلين والتحليلات</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                isDark ? 'bg-zinc-900 text-zinc-300 border border-zinc-800' : 'bg-zinc-200 text-zinc-700'
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
          /* TAB 1: CHAT SESSIONS & CONVERSATION REVIEW (OPTIMIZED STREAM)  */
          /* ============================================================== */
          <div
            className={`w-full flex-1 flex flex-col overflow-hidden transition-all duration-200 ${
              isFullscreen
                ? `fixed inset-0 z-50 h-screen w-screen m-0 p-3 sm:p-4 rounded-none border-none ${
                    isDark ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-900'
                  }`
                : `rounded-2xl border ${
                    isDark ? 'border-zinc-800 bg-black' : 'border-zinc-200 bg-white shadow-sm'
                  } h-[calc(100vh-250px)] min-h-[580px]`
            }`}
          >
            {/* Top Toolbar for Chat Window */}
            <div
              className={`flex items-center justify-between px-4 py-2.5 border-b shrink-0 ${
                isDark ? 'border-zinc-800 bg-black' : 'border-zinc-200 bg-zinc-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-amber-500" />
                <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                  مستعرض محادثات سكنى بوت ({sessions.length} معروضة من أصل {totalSessionsCount ?? sessions.length})
                </span>
              </div>

              {/* Window Fullscreen Toggle */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                  isDark
                    ? 'border-zinc-800 bg-black text-zinc-200 hover:bg-zinc-900 hover:text-white'
                    : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'
                }`}
                title={isFullscreen ? 'تصغير النافذة' : 'تكبير النافذة لملء الشاشة بالكامل (Fullscreen)'}
              >
                {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{isFullscreen ? 'تصغير الشاشة' : 'تكبير الشاشة'}</span>
              </button>
            </div>

            {/* Main Area: Sidebar List (Right in RTL) + Conversation Panel (Left in RTL) */}
            <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
              {/* Sessions Sidebar List (Fixed Width, Paginated) */}
              <div
                className={`w-full md:w-[360px] lg:w-[400px] shrink-0 border-l flex flex-col min-h-0 overflow-hidden ${
                  isDark ? 'border-zinc-800 bg-black' : 'border-zinc-200 bg-white'
                }`}
              >
                {/* Search & Filter Header */}
                <div
                  className={`p-3 border-b space-y-2 shrink-0 ${
                    isDark ? 'border-zinc-800 bg-black' : 'border-zinc-200 bg-zinc-50'
                  }`}
                >
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                    <input
                      type="text"
                      value={sessionSearch}
                      onChange={(e) => setSessionSearch(e.target.value)}
                      placeholder="ابحث بالعنوان أو الكلمات أو المعرف..."
                      className={`w-full rounded-xl border py-2 pr-9 pl-3 text-xs focus:border-amber-500 focus:outline-none transition ${
                        isDark
                          ? 'border-zinc-800 bg-zinc-950 text-white placeholder-zinc-500'
                          : 'border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400'
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-400 text-[11px]">الحالة:</span>
                      {(['all', 'active', 'deleted'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setSessionFilter(mode)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                            sessionFilter === mode
                              ? 'bg-amber-500 text-black'
                              : isDark
                              ? 'bg-zinc-900 text-zinc-400 hover:text-white'
                              : 'bg-zinc-200 text-zinc-600 hover:text-zinc-900'
                          }`}
                        >
                          {mode === 'all' ? 'الكل' : mode === 'active' ? 'النشطة' : 'المحذوفة'}
                        </button>
                      ))}
                    </div>

                    <span className="text-[11px] text-zinc-500 font-mono">
                      {sessions.length}
                    </span>
                  </div>
                </div>

                {/* Sessions Scrollable List */}
                <div className={`flex-1 min-h-0 overflow-y-auto divide-y ${isDark ? 'divide-zinc-800/60' : 'divide-zinc-100'}`}>
                  {loadingSessions ? (
                    <div className="p-8 text-center text-zinc-400 text-xs">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-amber-500" />
                      جاري تحميل المحادثات تدريجياً...
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="p-8 text-center text-zinc-400 text-xs">
                      <Inbox className="h-8 w-8 mx-auto mb-2 text-zinc-600" />
                      لا توجد محادثات تطابق البحث
                    </div>
                  ) : (
                    <>
                      {sessions.map((s) => {
                        const isSelected = s.id === selectedSessionId;
                        return (
                          <div
                            key={s.id}
                            onClick={() => setSelectedSessionId(s.id)}
                            className={`p-3.5 cursor-pointer transition text-right relative group ${
                              isSelected
                                ? isDark
                                ? 'bg-zinc-900/90 border-r-4 border-amber-500'
                                : 'bg-amber-500/10 border-r-4 border-amber-500'
                                : isDark
                                ? 'hover:bg-zinc-900/50'
                                : 'hover:bg-zinc-50'
                            }`}
                          >
                            {/* Top Row: User identifier + time + quick delete */}
                            <div className="flex items-center justify-between text-[11px] text-zinc-400">
                              <span className="font-semibold text-amber-500 truncate max-w-[170px]">
                                {s.user_email || s.user_name || 'زائر مجهول'}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] text-zinc-500">{timeAgo(s.last_at || s.updated_at)}</span>

                                {/* Hard Delete Button in Sidebar Item */}
                                <button
                                  onClick={(e) => handlePermanentDelete(s.id, e)}
                                  disabled={deletingSessionId === s.id}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 rounded transition"
                                  title="حذف هذه المحادثة نهائياً من قاعدة البيانات"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>

                            {/* Title / Initial question */}
                            <h4
                              className={`mt-1.5 text-xs font-bold line-clamp-2 leading-relaxed ${
                                isDark ? 'text-zinc-200' : 'text-zinc-800'
                              }`}
                            >
                              {s.title}
                            </h4>

                            {/* Snippet of last message */}
                            {s.last_message && (
                              <p className="mt-1 text-[11px] text-zinc-400 line-clamp-1">
                                {s.last_role === 'assistant' ? '🤖 البوت: ' : '👤 العميل: '}
                                {s.last_message}
                              </p>
                            )}

                            {/* Card Footer */}
                            <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-400">
                              <span
                                className={`rounded-md px-2 py-0.5 font-mono ${
                                  isDark ? 'bg-zinc-900 text-zinc-300' : 'bg-zinc-100 text-zinc-700'
                                }`}
                              >
                                {s.message_count} رسائل
                              </span>
                              <span className="font-mono text-[9px] text-zinc-500 truncate max-w-[140px]">
                                {s.session_token}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Load More Sessions Button (Pagination to save Supabase reads) */}
                      {hasMoreSessions && (
                        <div className="p-3 text-center">
                          <button
                            onClick={loadMoreSessions}
                            disabled={loadingMoreSessions}
                            className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                              isDark
                                ? 'border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-amber-400'
                                : 'border-zinc-300 bg-zinc-50 hover:bg-zinc-100 text-zinc-700'
                            }`}
                          >
                            {loadingMoreSessions ? (
                              <>
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                <span>جاري تحميل المزيد...</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3.5 w-3.5" />
                                <span>تحميل المزيد من المحادثات (صفحة {sessionsPage + 1})</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Conversation Panel (Takes remaining space) */}
              <div
                className={`relative flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden ${
                  isDark ? 'bg-black' : 'bg-zinc-50'
                }`}
              >
                {selectedSessionId && activeSession ? (
                  <>
                    {/* Conversation Header Bar */}
                    <div
                      className={`p-3.5 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
                        isDark ? 'border-zinc-800 bg-black' : 'border-zinc-200 bg-white'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={`text-sm font-black truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                            {activeSession.title || 'محادثة عقارية'}
                          </h3>
                          {activeSession.is_deleted && (
                            <span className="rounded-md bg-rose-500/20 text-rose-400 px-2 py-0.5 text-[10px] font-bold">
                              محذوفة سابقاً
                            </span>
                          )}
                          <span className="rounded-full bg-amber-500/10 text-amber-500 text-[10px] px-2 py-0.5 font-bold font-mono">
                            {totalMessagesCount} رسالة
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                          {activeSession.user?.email ? (
                            <span className="text-sky-400 font-semibold flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {activeSession.user.email}
                            </span>
                          ) : (
                            <span className="text-zinc-500">زائر غير مسجل</span>
                          )}
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-zinc-500" />
                            {formatDate(activeSession.created_at)}
                          </span>
                          <span>•</span>
                          <button
                            onClick={() => handleCopySessionId(activeSession.id)}
                            className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-amber-500"
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
                        {/* Permanent Hard Delete Button */}
                        <button
                          onClick={() => handlePermanentDelete(activeSession.id)}
                          disabled={deletingSessionId === activeSession.id}
                          className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-white px-3 py-1.5 text-xs font-black transition disabled:opacity-50 shadow-xs"
                          title="حذف هذه المحادثة نهائياً من قاعدة بيانات Supabase"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>{deletingSessionId === activeSession.id ? 'جاري الحذف...' : 'حذف نهائي من سوبابيز'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Messages Scrollable Timeline with progressive loading */}
                    <div
                      ref={messagesScrollRef}
                      onScroll={handleMessagesScroll}
                      className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4"
                    >
                      {/* Top Load Previous Messages Button if conversation is long */}
                      {hasMoreMessages && (
                        <div className="text-center py-2">
                          <button
                            onClick={() => fetchSessionMessages(selectedSessionId, true)}
                            disabled={loadingMoreMessages}
                            className={`rounded-full border px-4 py-1.5 text-xs font-bold transition flex items-center justify-center gap-2 mx-auto ${
                              isDark
                                ? 'border-zinc-800 bg-zinc-900 text-amber-400 hover:bg-zinc-800'
                                : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 shadow-xs'
                            }`}
                          >
                            {loadingMoreMessages ? (
                              <>
                                <RefreshCw className="h-3 w-3 animate-spin" />
                                <span>جاري استرجاع باقي الرسائل...</span>
                              </>
                            ) : (
                              <span>تحميل الرسائل السابقة بالكامل ({totalMessagesCount - messages.length} رسالة أقدم)</span>
                            )}
                          </button>
                        </div>
                      )}

                      {loadingMessages ? (
                        <div className="p-8 text-center text-zinc-400 text-xs">
                          <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-amber-500" />
                          جاري تحميل رسائل المحادثة...
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="p-8 text-center text-zinc-400 text-xs">
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
                                    ? 'bg-zinc-900 border border-zinc-800 text-zinc-300'
                                    : 'bg-zinc-200 text-zinc-700'
                                }`}
                              >
                                {isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                              </div>

                              {/* Message Bubble Container */}
                              <div className={`max-w-[85%] space-y-1.5 ${isBot ? 'text-right' : 'text-right'}`}>
                                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                                  <span className={`font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                                    {isBot ? 'سكنى بوت' : activeSession.user?.name || 'العميل'}
                                  </span>
                                  <span>•</span>
                                  <span>{formatDate(msg.created_at)}</span>
                                  {isBot && (
                                    <span
                                      className={`font-mono text-[9px] px-1.5 py-0.5 rounded ${
                                        isDark ? 'bg-zinc-900 text-amber-300 border border-zinc-800' : 'bg-zinc-200 text-amber-800'
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
                                        ? 'bg-zinc-950 border border-zinc-800 text-white shadow-xs'
                                        : 'bg-white border border-zinc-200 text-zinc-900 shadow-xs'
                                      : 'bg-amber-500 text-black font-semibold shadow-md shadow-amber-500/10'
                                  }`}
                                >
                                  {msg.content}
                                </div>

                                {/* Properties Recommended Badge */}
                                {isBot && propCount > 0 && (
                                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-500">
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

                    {/* Floating Scroll to Bottom Button in Admin */}
                    {showScrollBottom && (
                      <button
                        onClick={scrollToBottom}
                        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-black/90 text-amber-400 hover:text-white px-3.5 py-1.5 text-xs font-bold shadow-xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 animate-bounce"
                        title="الانتقال لآخر رسالة"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                        <span>الانتقال لآخر رسالة</span>
                      </button>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-zinc-400 text-xs min-h-0">
                    <MessageSquare className="h-10 w-10 text-zinc-700 mb-3" />
                    <p className="font-bold text-zinc-400">
                      اختر محادثة من القائمة لمراجعتها بالكامل
                    </p>
                    <p className="mt-1 text-zinc-500 text-center">
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
                isDark ? 'border-zinc-800 bg-black' : 'border-zinc-200 bg-white shadow-xs'
              }`}
            >
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="ابحث عن مستخدم بالبريد أو الاسم أو المعرف..."
                  className={`w-full rounded-xl border py-2.5 pr-10 pl-4 text-xs focus:border-amber-500 focus:outline-none transition ${
                    isDark
                      ? 'border-zinc-800 bg-zinc-950 text-white placeholder-zinc-500'
                      : 'border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400'
                  }`}
                />
              </div>

              <div className="text-xs text-zinc-400">
                إجمالي المسجلين: <span className="font-mono font-bold text-amber-500">{filteredUsers.length}</span>
              </div>
            </div>

            {/* Users Table */}
            <div
              className={`rounded-2xl border overflow-hidden ${
                isDark ? 'border-zinc-800 bg-black' : 'border-zinc-200 bg-white shadow-xs'
              }`}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead
                    className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                      isDark ? 'border-zinc-800 bg-black text-zinc-400' : 'border-zinc-200 bg-zinc-50 text-zinc-600'
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
                  <tbody className={`divide-y ${isDark ? 'divide-zinc-800/60' : 'divide-zinc-100'}`}>
                    {loadingStats ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-zinc-400 text-xs">
                          <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-amber-500" />
                          جاري تحميل قائمة المستخدمين...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-zinc-400 text-xs">
                          لا يوجد مستخدمين يطابقون البحث
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr
                          key={u.id}
                          className={`transition ${isDark ? 'hover:bg-zinc-900/60' : 'hover:bg-zinc-50'}`}
                        >
                          <td className="p-3.5 font-bold flex items-center gap-2">
                            <div className="grid h-7 w-7 place-items-center rounded-full bg-amber-500/20 text-amber-500 font-bold shrink-0">
                              {u.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <span className="truncate max-w-[180px]">{u.name}</span>
                          </td>
                          <td className="p-3.5 font-mono">
                            {u.email}
                            {u.email === 'weeessd57@gmail.com' && (
                              <span className="mr-2 rounded-md bg-amber-500/20 text-amber-500 px-1.5 py-0.5 text-[9px] font-bold">
                                Super Admin
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-zinc-400">
                            {formatDate(u.created_at)}
                          </td>
                          <td className="p-3.5 text-zinc-400">
                            {formatDate(u.last_sign_in_at)}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                isDark ? 'bg-zinc-900 text-zinc-300 border border-zinc-800' : 'bg-zinc-100 text-zinc-700'
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
                              className="rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 text-[11px] font-bold text-amber-500 transition"
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
