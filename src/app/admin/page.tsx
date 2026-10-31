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
  ChevronRight,
  ChevronLeft
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
        setSessions(data.sessions || []);
        // Auto-select first session if none selected
        if (!selectedSessionId && data.sessions && data.sessions.length > 0) {
          setSelectedSessionId(data.sessions[0].id);
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
      }
    } catch (err) {
      console.error('Failed to fetch session messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // 4. Delete Session
  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذه المحادثة نهائياً من العرض؟')) {
      return;
    }

    try {
      setDeletingSessionId(sessionId);
      const res = await fetch(`/api/admin/chats/${sessionId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, is_deleted: true } : s))
        );
        if (selectedSessionId === sessionId) {
          fetchSessionMessages(sessionId);
        }
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100" dir="rtl">
      {/* Top Admin Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-black shadow-md shadow-amber-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white">لوحة تحكم وإدارة سكنى بوت</h1>
                <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                  مشرف النظام
                </span>
              </div>
              <p className="text-xs text-slate-400">
                مرحباً بك: <span className="font-mono text-amber-300 font-bold">{user?.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                fetchStats();
                fetchSessions();
                if (selectedSessionId) fetchSessionMessages(selectedSessionId);
              }}
              disabled={loadingStats || loadingSessions}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-800/80 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-slate-800 hover:text-white"
              title="تحديث البيانات"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loadingStats || loadingSessions ? 'animate-spin text-amber-400' : ''}`}
              />
              <span className="hidden sm:inline">تحديث</span>
            </button>

            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-3.5 py-2 text-xs font-bold text-black transition shadow-sm hover:shadow-amber-500/20"
            >
              <span>العودة للتطبيق</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* KPI Stats Bar */}
      <section className="border-b border-slate-800/80 bg-slate-900/40 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Users */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 transition hover:border-slate-700">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>المستخدمين المسجلين</span>
              <Users className="h-4 w-4 text-sky-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-white">
                {stats?.totalUsers ?? '—'}
              </span>
              <span className="text-[11px] text-slate-400">عميل مسجل</span>
            </div>
          </div>

          {/* Card 2: Chat Sessions */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 transition hover:border-slate-700">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>جلسات المحادثة</span>
              <MessageSquare className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-white">
                {stats?.totalSessions ?? '—'}
              </span>
              <span className="text-[11px] text-amber-400 font-bold">
                +{stats?.recentSessions24h ?? 0} خلال 24 ساعة
              </span>
            </div>
          </div>

          {/* Card 3: Total AI Messages */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 transition hover:border-slate-700">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>رسائل الذكاء الاصطناعي</span>
              <Sparkles className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-white">
                {stats?.totalMessages ?? '—'}
              </span>
              <span className="text-[11px] text-slate-400">رسالة متبادلة</span>
            </div>
          </div>

          {/* Card 4: Properties Inventory */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 transition hover:border-slate-700">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>العقارات المتاحة</span>
              <Building2 className="h-4 w-4 text-purple-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-white">
                {stats?.totalProperties ?? '—'}
              </span>
              <span className="text-[11px] text-slate-400">وحدة معتمدة</span>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs Switcher */}
      <section className="border-b border-slate-800 px-4 sm:px-6 bg-slate-900/20">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
              activeTab === 'chats'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>مراجعة محادثات العملاء</span>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
              {sessions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
              activeTab === 'users'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>المستخدمين المسجلين والتحليلات</span>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
              {usersList.length}
            </span>
          </button>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 overflow-hidden flex flex-col">
        {activeTab === 'chats' ? (
          /* ============================================================== */
          /* TAB 1: CHAT SESSIONS & CONVERSATION REVIEW                     */
          /* ============================================================== */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 h-[calc(100vh-280px)] min-h-[500px]">
            {/* Left Column: Sessions List (4 cols) */}
            <div className="lg:col-span-5 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              {/* Search & Filter Header */}
              <div className="p-3 border-b border-slate-800 space-y-2 bg-slate-900/80">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={sessionSearch}
                    onChange={(e) => setSessionSearch(e.target.value)}
                    placeholder="ابحث بالعنوان أو الكلمات أو المعرف..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pr-9 pl-3 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500 text-[11px]">الحالة:</span>
                  {(['all', 'active', 'deleted'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setSessionFilter(mode)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                        sessionFilter === mode
                          ? 'bg-amber-500 text-black'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {mode === 'all' ? 'الكل' : mode === 'active' ? 'النشطة' : 'المحذوفة'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sessions List Scroll */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-1">
                {loadingSessions ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-amber-500" />
                    جاري تحميل المحادثات...
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    <Inbox className="h-6 w-6 mx-auto mb-2 text-slate-600" />
                    لا توجد محادثات تطابق البحث
                  </div>
                ) : (
                  sessions.map((s) => {
                    const isSelected = selectedSessionId === s.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() => setSelectedSessionId(s.id)}
                        className={`group relative cursor-pointer rounded-xl p-3 transition ${
                          isSelected
                            ? 'bg-amber-500/15 border border-amber-500/40'
                            : 'hover:bg-slate-800/50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {s.user_email ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 text-sky-400 px-1.5 py-0.5 text-[10px] font-bold shrink-0">
                                <User className="h-2.5 w-2.5" />
                                <span className="truncate max-w-[120px]">{s.user_email}</span>
                              </span>
                            ) : (
                              <span className="rounded-md bg-slate-800 text-slate-400 px-1.5 py-0.5 text-[10px] font-bold shrink-0">
                                زائر مجهول
                              </span>
                            )}
                            {s.is_deleted && (
                              <span className="rounded-md bg-rose-500/15 text-rose-400 px-1.5 py-0.5 text-[9px] font-bold shrink-0">
                                محذوف
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-[10px] text-slate-500 shrink-0">
                            <Clock className="h-2.5 w-2.5" />
                            <span>{timeAgo(s.created_at)}</span>
                          </div>
                        </div>

                        {/* Title / Initial question */}
                        <h4 className="mt-1.5 text-xs font-bold text-slate-200 line-clamp-2 leading-relaxed">
                          {s.title}
                        </h4>

                        {/* Snippet of last message */}
                        {s.last_message && (
                          <p className="mt-1 text-[11px] text-slate-400 line-clamp-1">
                            {s.last_role === 'assistant' ? '🤖 البوت: ' : '👤 العميل: '}
                            {s.last_message}
                          </p>
                        )}

                        {/* Card Footer */}
                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                          <span className="rounded-md bg-slate-800/80 px-2 py-0.5 text-slate-400 font-mono">
                            {s.message_count} رسائل
                          </span>
                          <span className="font-mono text-[9px] text-slate-500 truncate max-w-[140px]">
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
            <div className="lg:col-span-7 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              {selectedSessionId && activeSession ? (
                <>
                  {/* Conversation Header Bar */}
                  <div className="p-3.5 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-white truncate">
                          {activeSession.title || 'محادثة عقارية'}
                        </h3>
                        {activeSession.is_deleted && (
                          <span className="rounded-md bg-rose-500/20 text-rose-400 px-2 py-0.5 text-[10px] font-bold">
                            محذوفة
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        {activeSession.user?.email ? (
                          <span className="text-sky-400 font-semibold flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {activeSession.user.email}
                          </span>
                        ) : (
                          <span className="text-slate-500">زائر غير مسجل</span>
                        )}
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-500" />
                          {formatDate(activeSession.created_at)}
                        </span>
                        <span>•</span>
                        <button
                          onClick={() => handleCopySessionId(activeSession.id)}
                          className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-amber-400"
                          title="نسخ معرف الجلسة"
                        >
                          <span>{activeSession.id.slice(0, 8)}...</span>
                          {copiedId ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleDeleteSession(activeSession.id)}
                        disabled={deletingSessionId === activeSession.id || activeSession.is_deleted}
                        className="flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1.5 text-xs font-bold text-rose-400 transition disabled:opacity-50"
                        title="حذف المحادثة"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>حذف</span>
                      </button>
                    </div>
                  </div>

                  {/* Conversation Messages Feed */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loadingMessages ? (
                      <div className="p-8 text-center text-slate-500 text-xs">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-amber-500" />
                        جاري تحميل رسائل المحادثة...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-xs">
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
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                            </div>

                            {/* Message Bubble Container */}
                            <div className={`max-w-[85%] space-y-1.5 ${isBot ? 'text-right' : 'text-right'}`}>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                <span className="font-bold text-slate-300">
                                  {isBot ? 'سكنى بوت' : activeSession.user?.name || 'العميل'}
                                </span>
                                <span>•</span>
                                <span>{formatDate(msg.created_at)}</span>
                                {isBot && (
                                  <span className="font-mono text-[9px] bg-slate-800 text-amber-300 px-1.5 py-0.2 rounded">
                                    {aiModel}
                                  </span>
                                )}
                              </div>

                              {/* Bubble */}
                              <div
                                className={`rounded-2xl p-3.5 text-xs leading-relaxed whitespace-pre-wrap break-words ${
                                  isBot
                                    ? 'bg-slate-900 border border-slate-800 text-slate-100 shadow-xs'
                                    : 'bg-amber-500 text-black font-medium shadow-md shadow-amber-500/10'
                                }`}
                              >
                                {msg.content}
                              </div>

                              {/* Properties Recommended Badge */}
                              {isBot && propCount > 0 && (
                                <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-400">
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
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-500 text-xs">
                  <MessageSquare className="h-10 w-10 text-slate-700 mb-3" />
                  <p className="font-bold text-slate-400">اختر محادثة من القائمة لمراجعتها بالكامل</p>
                  <p className="mt-1 text-slate-600">
                    يمكنك استعراض أسئلة العملاء، ردود الذكاء الاصطناعي، والعقارات المقترحة.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* TAB 2: REGISTERED USERS & ANALYTICS                            */
          /* ============================================================== */
          <div className="space-y-4 flex-1">
            {/* Search Box */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="ابحث عن مستخدم بالبريد أو الاسم أو المعرف..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pr-10 pl-4 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="text-xs text-slate-400">
                إجمالي المسجلين: <span className="font-mono font-bold text-amber-400">{filteredUsers.length}</span>
              </div>
            </div>

            {/* Users Table */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="border-b border-slate-800 bg-slate-900 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">المستخدم</th>
                      <th className="p-3.5">البريد الإلكتروني</th>
                      <th className="p-3.5">تاريخ التسجيل</th>
                      <th className="p-3.5">آخر تسجيل دخول</th>
                      <th className="p-3.5">الدور</th>
                      <th className="p-3.5 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {loadingStats ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                          <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-amber-500" />
                          جاري تحميل قائمة المستخدمين...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                          لا يوجد مستخدمين يطابقون البحث
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3.5 font-bold text-slate-200 flex items-center gap-2">
                            <div className="grid h-7 w-7 place-items-center rounded-full bg-amber-500/20 text-amber-400 font-bold shrink-0">
                              {u.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <span className="truncate max-w-[180px]">{u.name}</span>
                          </td>
                          <td className="p-3.5 font-mono text-slate-300">
                            {u.email}
                            {u.email === 'weeessd57@gmail.com' && (
                              <span className="mr-2 rounded-md bg-amber-500/20 text-amber-400 px-1.5 py-0.5 text-[9px] font-bold">
                                Super Admin
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-slate-400">
                            {formatDate(u.created_at)}
                          </td>
                          <td className="p-3.5 text-slate-400">
                            {formatDate(u.last_sign_in_at)}
                          </td>
                          <td className="p-3.5">
                            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => {
                                setSessionSearch(u.email);
                                setActiveTab('chats');
                              }}
                              className="rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 text-[11px] font-bold text-amber-400 transition"
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
