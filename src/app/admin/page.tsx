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
  ChevronDown,
  ClipboardList,
  Phone,
  PhoneCall,
  MessageCircle,
  MapPin,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
  CheckCheck,
  Coins,
  Send,
  Tag,
  Eye,
  XCircle,
  CheckCircle,
  Home,
  Bed,
  Bath,
  Images
} from 'lucide-react';
import { Property } from '@/lib/types';
import PropertyDetailsModal from '@/components/PropertyDetailsModal';

interface AdminStats {
  totalUsers: number;
  totalSessions: number;
  totalMessages: number;
  totalProperties: number;
  recentSessions24h: number;
  totalLeads?: number;
  totalSellerListings?: number;
  pendingSellerListings?: number;
}

interface AdminLead {
  id: string;
  user_name: string;
  phone: string;
  email: string | null;
  unit_title: string | null;
  developer_name: string | null;
  preferred_location: string | null;
  preferred_unit_type: string | null;
  budget_max: number | null;
  payment_method: string | null;
  notes: string | null;
  source: string | null;
  status: string;
  created_at: string;
  session_id: string | null;
  user_id: string | null;
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

  // Active Tab: 'chats' | 'leads' | 'seller_properties' | 'users'
  const [activeTab, setActiveTab] = useState<'chats' | 'leads' | 'seller_properties' | 'users'>('chats');

  // Stats & Users state
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Viewing Requests (Leads) state
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [leadsSearch, setLeadsSearch] = useState('');
  const [leadsStatusFilter, setLeadsStatusFilter] = useState<string>('all');
  const [leadsCounts, setLeadsCounts] = useState<{ all: number; new: number; contacted: number; viewed: number }>({
    all: 0,
    new: 0,
    contacted: 0,
    viewed: 0,
  });
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null);

  // Seller Properties (وحدات وعروض الملاك المعروضة للبيع) state
  const [sellerProperties, setSellerProperties] = useState<Property[]>([]);
  const [loadingSellerProperties, setLoadingSellerProperties] = useState(false);
  const [sellerSearch, setSellerSearch] = useState('');
  const [sellerStatusFilter, setSellerStatusFilter] = useState<string>('all');
  const [sellerCounts, setSellerCounts] = useState<{ all: number; pending: number; approved: number; rejected: number }>({
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [updatingSellerId, setUpdatingSellerId] = useState<string | null>(null);
  const [deletingSellerId, setDeletingSellerId] = useState<string | null>(null);
  const [previewProperty, setPreviewProperty] = useState<Property | null>(null);

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

  // Real-time telemetry calculations for active session (Cost & Latency - Admin Only)
  const sessionStats = useMemo(() => {
    let totalCostUsd = 0;
    let totalCostEgp = 0;
    let totalTokens = 0;
    let speedSum = 0;
    let speedCount = 0;

    for (const m of messages) {
      if (m.metadata) {
        if (typeof m.metadata.cost_usd === 'number') totalCostUsd += m.metadata.cost_usd;
        if (typeof m.metadata.cost_egp === 'number') totalCostEgp += m.metadata.cost_egp;
        if (m.metadata.tokens?.total) totalTokens += m.metadata.tokens.total;
        if (typeof m.metadata.duration_seconds === 'number') {
          speedSum += m.metadata.duration_seconds;
          speedCount++;
        }
      }
    }

    return {
      totalCostUsd,
      totalCostEgp: totalCostEgp || totalCostUsd * 49.5,
      totalTokens,
      avgSpeed: speedCount > 0 ? (speedSum / speedCount).toFixed(2) : null,
    };
  }, [messages]);

  // User search
  const [userSearch, setUserSearch] = useState('');

  // Telegram bot notifications state
  const [telegramStatus, setTelegramStatus] = useState<{
    hasToken: boolean;
    botUsername: string;
    chatId: string | null;
    status: 'connected' | 'waiting_start' | 'missing_token';
  } | null>(null);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [telegramMessage, setTelegramMessage] = useState<string | null>(null);

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

  const fetchTelegramStatus = async () => {
    try {
      const res = await fetch('/api/admin/telegram-status');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.diagnostics) {
          setTelegramStatus(data.diagnostics);
        }
      }
    } catch {}
  };

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    setTelegramMessage(null);
    try {
      const res = await fetch('/api/admin/telegram-status', { method: 'POST' });
      const data = await res.json();
      setTelegramMessage(data.message || (data.success ? 'تم إرسال الإشعار بنجاح!' : 'تعذر إرسال الإشعار'));
      fetchTelegramStatus();
    } catch {
      setTelegramMessage('حدث خطأ أثناء محاولة الإرسال');
    } finally {
      setTestingTelegram(false);
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

  // 5. Fetch Viewing Requests (Leads)
  const fetchLeads = async () => {
    try {
      setLoadingLeads(true);
      const params = new URLSearchParams();
      if (leadsSearch) params.set('q', leadsSearch);
      if (leadsStatusFilter !== 'all') params.set('status', leadsStatusFilter);

      const res = await fetch(`/api/admin/leads?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
        if (data.counts) {
          setLeadsCounts(data.counts);
        }
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoadingLeads(false);
    }
  };

  // Update Lead Status (e.g. 'جديد', 'تم التواصل', 'تمت المعاينة', 'ملغي')
  const handleUpdateLeadStatus = async (id: string, newStatus: string) => {
    try {
      setUpdatingLeadId(id);
      const res = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((lead) => (lead.id === id ? { ...lead, status: newStatus } : lead))
        );
        fetchLeads();
      }
    } catch (err) {
      console.error('Failed to update lead status:', err);
    } finally {
      setUpdatingLeadId(null);
    }
  };

  // Hard Delete Lead
  const handleDeleteLead = async (id: string, customerName: string) => {
    if (!window.confirm(`⚠️ تأكيد حذف طلب المعاينة الخاص بالعميل (${customerName}) نهائياً؟\n\nلن يمكن استرجاع بيانات هذا الطلب.`)) {
      return;
    }
    try {
      setDeletingLeadId(id);
      const res = await fetch(`/api/admin/leads?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setLeads((prev) => prev.filter((lead) => lead.id !== id));
        setLeadsCounts((prev) => ({
          ...prev,
          all: Math.max(0, prev.all - 1),
        }));
      }
    } catch (err) {
      console.error('Failed to delete lead:', err);
    } finally {
      setDeletingLeadId(null);
    }
  };

  // Export Leads to CSV
  const exportLeadsToCsv = () => {
    if (leads.length === 0) return;
    const headers = [
      'اسم العميل',
      'رقم الهاتف',
      'البريد الإلكتروني',
      'الوحدة المطلوبة',
      'المطور / الكمبوند',
      'المنطقة المفضلة',
      'نوع الوحدة',
      'الميزانية القصوى (جنيه)',
      'طريقة السداد',
      'الحالة',
      'ملاحظات وموعد المعاينة',
      'المصدر',
      'تاريخ الطلب'
    ];

    const rows = leads.map((l) => [
      `"${(l.user_name || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.unit_title || '').replace(/"/g, '""')}"`,
      `"${(l.developer_name || '').replace(/"/g, '""')}"`,
      `"${(l.preferred_location || '').replace(/"/g, '""')}"`,
      `"${(l.preferred_unit_type || '').replace(/"/g, '""')}"`,
      `"${l.budget_max || ''}"`,
      `"${(l.payment_method || '').replace(/"/g, '""')}"`,
      `"${(l.status || '').replace(/"/g, '""')}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      `"${(l.source || '').replace(/"/g, '""')}"`,
      `"${new Date(l.created_at).toLocaleString('ar-EG')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `skanybot-leads-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper: Direct WhatsApp link with prefilled Egyptian greeting
  const getWhatsAppUrl = (lead: AdminLead) => {
    const raw = (lead.phone || '').replace(/[^0-9]/g, '');
    let clean = raw;
    if (clean.startsWith('0')) clean = clean.slice(1);
    if (!clean.startsWith('20')) clean = `20${clean}`;
    const text = encodeURIComponent(
      `السلام عليكم أ/ ${lead.user_name || 'العميل العزيز'}، معاك من إدارة سكنى بوت بخصوص طلب معاينة وحدة ${lead.unit_title ? `"${lead.unit_title}"` : 'العقارية'}`
    );
    return `https://wa.me/${clean}?text=${text}`;
  };

  // 6. Fetch Seller Properties (عروض وحدات الملاك)
  const fetchSellerProperties = async () => {
    try {
      setLoadingSellerProperties(true);
      const params = new URLSearchParams();
      if (sellerSearch) params.set('q', sellerSearch);
      if (sellerStatusFilter !== 'all') params.set('status', sellerStatusFilter);

      const res = await fetch(`/api/admin/seller-properties?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSellerProperties(data.properties || []);
        if (data.counts) {
          setSellerCounts(data.counts);
        }
      }
    } catch (err) {
      console.error('Failed to fetch seller properties:', err);
    } finally {
      setLoadingSellerProperties(false);
    }
  };

  // Approve & Publish Seller Property to active platform data
  const handleApproveSellerProperty = async (id: string, title?: string) => {
    try {
      setUpdatingSellerId(id);
      const res = await fetch('/api/admin/seller-properties', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'approve' }),
      });
      if (res.ok) {
        setSellerProperties((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: 'معتمد' } : p))
        );
        fetchSellerProperties();
        fetchStats(true);
      }
    } catch (err) {
      console.error('Failed to approve seller property:', err);
    } finally {
      setUpdatingSellerId(null);
    }
  };

  // Reject Seller Property
  const handleRejectSellerProperty = async (id: string) => {
    if (!window.confirm('هل تريد رفض هذا العرض؟ لن يتم نشره في قاعدة بيانات المنصة.')) {
      return;
    }
    try {
      setUpdatingSellerId(id);
      const res = await fetch('/api/admin/seller-properties', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'reject' }),
      });
      if (res.ok) {
        setSellerProperties((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: 'مرفوض' } : p))
        );
        fetchSellerProperties();
        fetchStats(true);
      }
    } catch (err) {
      console.error('Failed to reject seller property:', err);
    } finally {
      setUpdatingSellerId(null);
    }
  };

  // Delete Seller Property permanently
  const handleDeleteSellerProperty = async (id: string, title?: string) => {
    if (!window.confirm(`⚠️ تأكيد حذف هذا العرض ("${title || id}") نهائياً من قاعدة البيانات؟`)) {
      return;
    }
    try {
      setDeletingSellerId(id);
      const res = await fetch(`/api/admin/seller-properties?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSellerProperties((prev) => prev.filter((p) => p.id !== id));
        fetchSellerProperties();
        fetchStats(true);
      }
    } catch (err) {
      console.error('Failed to delete seller property:', err);
    } finally {
      setDeletingSellerId(null);
    }
  };

  // Helper: Direct WhatsApp link for Seller
  const getSellerWhatsAppUrl = (p: Property) => {
    const phone = p.seller_phone || p.compound?.developer?.whatsapp || '';
    const raw = phone.replace(/[^0-9]/g, '');
    let clean = raw;
    if (clean.startsWith('0')) clean = clean.slice(1);
    if (!clean.startsWith('20')) clean = `20${clean}`;
    const text = encodeURIComponent(
      `السلام عليكم أ/ ${p.seller_name || 'المالك العزيز'}، معاك إدارة سكنى بوت بخصوص وحدتك المعروضة للبيع ("${p.title}")...`
    );
    return `https://wa.me/${clean}?text=${text}`;
  };

  useEffect(() => {
    fetchStats();
    fetchSessions(1, false);
    fetchLeads();
    fetchSellerProperties();
    fetchTelegramStatus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSellerProperties();
    }, 300);
    return () => clearTimeout(timer);
  }, [sellerSearch, sellerStatusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads();
    }, 300);
    return () => clearTimeout(timer);
  }, [leadsSearch, leadsStatusFilter]);

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
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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

          {/* Card 5: Viewing Requests & Leads */}
          <div
            onClick={() => setActiveTab('leads')}
            className={`rounded-2xl border p-3.5 transition cursor-pointer hover:border-amber-500/50 ${
              activeTab === 'leads'
                ? 'border-amber-500 bg-amber-500/10'
                : isDark
                ? 'border-zinc-800 bg-black'
                : 'border-zinc-200 bg-zinc-50 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>طلبات المعاينة (Leads)</span>
              <ClipboardList className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-black font-mono ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                {stats?.totalLeads ?? leadsCounts.all ?? 0}
              </span>
              {leadsCounts.new > 0 ? (
                <span className="text-[11px] text-emerald-400 font-black">
                  +{leadsCounts.new} جديد
                </span>
              ) : (
                <span className="text-[11px] text-zinc-500">طلب حجز</span>
              )}
            </div>
          </div>

          {/* Card 6: Seller Direct Listings */}
          <div
            onClick={() => setActiveTab('seller_properties')}
            className={`rounded-2xl border p-3.5 transition cursor-pointer hover:border-amber-500/50 ${
              activeTab === 'seller_properties'
                ? 'border-amber-500 bg-amber-500/10'
                : isDark
                ? 'border-zinc-800 bg-black'
                : 'border-zinc-200 bg-zinc-50 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>عروض وحدات الملاك</span>
              <Tag className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-black font-mono ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                {stats?.totalSellerListings ?? sellerCounts.all ?? 0}
              </span>
              {sellerCounts.pending > 0 ? (
                <span className="text-[11px] text-amber-500 font-black animate-pulse">
                  +{sellerCounts.pending} قيد المراجعة
                </span>
              ) : (
                <span className="text-[11px] text-zinc-500">معروضة</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Telegram Live Notification Banner */}
      <section className="px-4 sm:px-6 pt-1 pb-3">
        <div className="max-w-7xl mx-auto">
          <div
            className={`rounded-2xl border p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition ${
              telegramStatus?.status === 'connected'
                ? isDark
                  ? 'border-emerald-500/30 bg-emerald-950/20'
                  : 'border-emerald-200 bg-emerald-50/70'
                : isDark
                ? 'border-amber-500/30 bg-amber-950/20'
                : 'border-amber-200 bg-amber-50/70'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  telegramStatus?.status === 'connected'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-amber-500/15 text-amber-400'
                }`}
              >
                <Send className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                    إشعارات تليجرام الفورية (@{telegramStatus?.botUsername || 'sakanyBOT_SUPPORT_BOT'})
                  </span>
                  {telegramStatus?.status === 'connected' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      متصل ونشط ✅
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      في انتظار الضغط على /start 📲
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  {telegramStatus?.status === 'connected'
                    ? 'تصلك تنبيهات فورية مباشرة على تليجرام عند طلب معاينة أو إضافة وحدة جديدة للبيع مع أرقام الواتساب وروابط الإدارة.'
                    : 'افتح البوت واضغط /start مرة واحدة لربط حسابك وتلقي الإشعارات الفورية لكل طلب معاينة أو إضافة وحدة.'}
                </p>
                {telegramMessage && (
                  <p className="text-xs mt-1.5 font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md inline-block">
                    {telegramMessage}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <a
                href={`https://t.me/${telegramStatus?.botUsername || 'sakanyBOT_SUPPORT_BOT'}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-xs transition"
              >
                <span>فتح البوت على تليجرام</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <button
                onClick={handleTestTelegram}
                disabled={testingTelegram}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
                  isDark
                    ? 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                    : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'
                } disabled:opacity-50`}
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>{testingTelegram ? 'جاري الإرسال...' : 'تجربة إرسال إشعار'}</span>
              </button>

              <button
                onClick={fetchTelegramStatus}
                title="تحديث حالة البوت"
                className={`p-2 rounded-xl border transition ${
                  isDark
                    ? 'border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                    : 'border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                }`}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
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
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto">
          {/* Tab 1: Chats */}
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition whitespace-nowrap shrink-0 ${
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

          {/* Tab 2: Viewing Requests (Leads) */}
          <button
            onClick={() => setActiveTab('leads')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition whitespace-nowrap shrink-0 ${
              activeTab === 'leads'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            <span>طلبات المعاينة والعملاء (Leads)</span>
            {leadsCounts.new > 0 && (
              <span className="rounded-full bg-emerald-500 text-black px-1.5 py-0.2 text-[10px] font-black">
                {leadsCounts.new} جديد
              </span>
            )}
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                activeTab === 'leads'
                  ? 'bg-amber-500/20 text-amber-500 font-bold'
                  : isDark
                  ? 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                  : 'bg-zinc-200 text-zinc-700'
              }`}
            >
              {leadsCounts.all}
            </span>
          </button>

          {/* Tab 3: Seller Properties */}
          <button
            onClick={() => setActiveTab('seller_properties')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition whitespace-nowrap shrink-0 ${
              activeTab === 'seller_properties'
                ? 'border-amber-500 text-amber-500'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Tag className="h-4 w-4" />
            <span>وحدات وعروض الملاك للبيع</span>
            {sellerCounts.pending > 0 && (
              <span className="rounded-full bg-amber-500 text-black px-1.5 py-0.2 text-[10px] font-black">
                {sellerCounts.pending} قيد المراجعة
              </span>
            )}
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                activeTab === 'seller_properties'
                  ? 'bg-amber-500/20 text-amber-500 font-bold'
                  : isDark
                  ? 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                  : 'bg-zinc-200 text-zinc-700'
              }`}
            >
              {sellerCounts.all}
            </span>
          </button>

          {/* Tab 4: Users */}
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition whitespace-nowrap shrink-0 ${
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
                          {sessionStats.totalCostUsd > 0 && (
                            <span className="rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] px-2.5 py-0.5 font-bold font-mono border border-emerald-500/30" title={`التكلفة بالجنيه المصري: ${sessionStats.totalCostEgp.toFixed(2)} ج.م`}>
                              💵 تكلفة الجلسة: ${sessionStats.totalCostUsd.toFixed(4)} ({sessionStats.totalCostEgp.toFixed(2)} ج.م)
                            </span>
                          )}
                          {sessionStats.avgSpeed && (
                            <span className="rounded-full bg-amber-500/15 text-amber-400 text-[10px] px-2 py-0.5 font-bold font-mono border border-amber-500/30">
                              ⚡ متوسط السرعة: {sessionStats.avgSpeed}s
                            </span>
                          )}
                          {sessionStats.totalTokens > 0 && (
                            <span className="rounded-full bg-zinc-800 text-zinc-300 text-[10px] px-2 py-0.5 font-bold font-mono border border-zinc-700">
                              🔢 {sessionStats.totalTokens} Tokens
                            </span>
                          )}
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
                                    <>
                                      <span
                                        className={`font-mono text-[9px] px-1.5 py-0.5 rounded ${
                                          isDark ? 'bg-zinc-900 text-amber-300 border border-zinc-800' : 'bg-zinc-200 text-amber-800'
                                        }`}
                                      >
                                        {aiModel}
                                      </span>

                                      {/* Speed latency */}
                                      {msg.metadata?.duration_seconds !== undefined && (
                                        <span className="inline-flex items-center gap-1 font-mono text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold">
                                          <span>⚡</span>
                                          <span>{msg.metadata.duration_seconds}s</span>
                                        </span>
                                      )}

                                      {/* Cost per call - ADMIN ONLY */}
                                      {msg.metadata?.cost_usd !== undefined && (
                                        <span
                                          className="inline-flex items-center gap-1 font-mono text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold"
                                          title={`التكلفة بالجنيه المصري: ${(msg.metadata.cost_egp || 0).toFixed(4)} ج.م`}
                                        >
                                          <span>💵</span>
                                          <span>${msg.metadata.cost_usd.toFixed(5)}</span>
                                          <span>({(msg.metadata.cost_egp || 0).toFixed(3)} ج.م)</span>
                                        </span>
                                      )}

                                      {/* Tokens count */}
                                      {msg.metadata?.tokens?.total && (
                                        <span
                                          className="inline-flex items-center gap-1 font-mono text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700"
                                          title={`المدخلات: ${msg.metadata.tokens.prompt} | المخرجات: ${msg.metadata.tokens.completion}`}
                                        >
                                          <span>🔢 {msg.metadata.tokens.total} T</span>
                                        </span>
                                      )}
                                    </>
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
                        className="absolute bottom-4 left-4 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-amber-500/40 bg-zinc-900/95 text-amber-400 hover:text-white shadow-xl backdrop-blur-md transition-all hover:scale-105 active:scale-95"
                        title="الانتقال لآخر رسالة"
                      >
                        <ChevronDown className="h-4 w-4" />
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
        ) : activeTab === 'leads' ? (
          /* ============================================================== */
          /* TAB 2: VIEWING REQUESTS & LEADS (طلبات المعاينة والعملاء)     */
          /* ============================================================== */
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            {/* Leads Search & Filter Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    value={leadsSearch}
                    onChange={(e) => setLeadsSearch(e.target.value)}
                    placeholder="ابحث باسم العميل، الهاتف، العقار، المنطقة..."
                    className={`w-full rounded-xl border pr-10 pl-4 py-2 text-xs focus:outline-hidden focus:border-amber-500 transition ${
                      isDark
                        ? 'border-zinc-800 bg-black text-white placeholder-zinc-500'
                        : 'border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400'
                    }`}
                  />
                  {leadsSearch && (
                    <button
                      onClick={() => setLeadsSearch('')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Status Filter Chips */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {[
                    { id: 'all', label: 'الكل', count: leadsCounts.all },
                    { id: 'جديد', label: 'جديد', count: leadsCounts.new },
                    { id: 'تم التواصل', label: 'تم التواصل', count: leadsCounts.contacted },
                    { id: 'تمت المعاينة', label: 'تمت المعاينة', count: leadsCounts.viewed },
                    { id: 'ملغي', label: 'ملغي', count: 0 },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setLeadsStatusFilter(filter.id)}
                      className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                        leadsStatusFilter === filter.id
                          ? 'bg-amber-500 text-black shadow-xs font-black'
                          : isDark
                          ? 'border border-zinc-800 bg-black text-zinc-300 hover:bg-zinc-900'
                          : 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      <span>{filter.label}</span>
                      {filter.count > 0 && (
                        <span
                          className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                            leadsStatusFilter === filter.id
                              ? 'bg-black/20 text-black font-black'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {filter.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons: Export CSV & Refresh */}
              <div className="flex items-center gap-2">
                <button
                  onClick={exportLeadsToCsv}
                  disabled={leads.length === 0}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition disabled:opacity-50 ${
                    isDark
                      ? 'border-zinc-800 bg-black text-zinc-200 hover:bg-zinc-900'
                      : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
                  }`}
                  title="تصدير جميع طلبات المعاينة إلى ملف Excel / CSV"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-500" />
                  <span>تصدير Excel/CSV</span>
                </button>

                <button
                  onClick={fetchLeads}
                  disabled={loadingLeads}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                    isDark
                      ? 'border-zinc-800 bg-black text-zinc-200 hover:bg-zinc-900'
                      : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
                  }`}
                  title="تحديث طلبات المعاينة"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingLeads ? 'animate-spin text-amber-500' : ''}`} />
                  <span className="hidden sm:inline">تحديث</span>
                </button>
              </div>
            </div>

            {/* Leads Cards Grid */}
            {loadingLeads ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-zinc-400 text-xs">
                <RefreshCw className="h-6 w-6 animate-spin text-amber-500 mb-3" />
                <span>جاري تحميل طلبات المعاينة والعملاء...</span>
              </div>
            ) : leads.length === 0 ? (
              <div
                className={`flex-1 flex flex-col items-center justify-center p-12 text-zinc-400 text-xs rounded-2xl border ${
                  isDark ? 'border-zinc-800 bg-black' : 'border-zinc-200 bg-white'
                }`}
              >
                <ClipboardList className="h-10 w-10 text-zinc-700 mb-3" />
                <p className="font-bold text-sm text-zinc-300">لا توجد طلبات معاينة حالياً</p>
                <p className="mt-1 text-zinc-500 text-center max-w-sm">
                  {leadsSearch
                    ? 'لم يتم العثور على أي طلبات تطابق معايير البحث الحالية.'
                    : 'عندما يقوم أي عميل بطلب معاينة أو حجز وحدة، ستظهر كافة تفاصيله فورياً هنا.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 overflow-y-auto flex-1 pr-1">
                {leads.map((lead) => {
                  const statusColors: Record<string, string> = {
                    'جديد': 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
                    'تم التواصل': 'border-sky-500/40 bg-sky-500/10 text-sky-400',
                    'تمت المعاينة': 'border-amber-500/40 bg-amber-500/10 text-amber-400',
                    'ملغي': 'border-rose-500/40 bg-rose-500/10 text-rose-400',
                  };
                  const currentStatusClass = statusColors[lead.status] || 'border-zinc-700 bg-zinc-800 text-zinc-300';

                  return (
                    <div
                      key={lead.id}
                      className={`rounded-2xl border p-4 flex flex-col justify-between transition-all hover:border-amber-500/40 shadow-xs ${
                        isDark ? 'border-zinc-800 bg-black' : 'border-zinc-200 bg-white'
                      }`}
                    >
                      {/* Customer Info & Status Bar */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/15 text-amber-500 font-black text-sm shrink-0 border border-amber-500/30">
                              {lead.user_name?.charAt(0)?.toUpperCase() || 'ع'}
                            </div>
                            <div>
                              <h3 className={`text-sm font-black ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                                {lead.user_name || 'عميل بدون اسم'}
                              </h3>
                              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                                <Clock className="h-3 w-3" />
                                <span>{formatDate(lead.created_at)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Quick Status Selector */}
                          <select
                            value={lead.status || 'جديد'}
                            disabled={updatingLeadId === lead.id}
                            onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value)}
                            className={`rounded-xl border px-2.5 py-1 text-xs font-bold cursor-pointer transition focus:outline-hidden ${currentStatusClass}`}
                          >
                            <option value="جديد" className="bg-zinc-900 text-emerald-400">جديد</option>
                            <option value="تم التواصل" className="bg-zinc-900 text-sky-400">تم التواصل</option>
                            <option value="تمت المعاينة" className="bg-zinc-900 text-amber-400">تمت المعاينة</option>
                            <option value="ملغي" className="bg-zinc-900 text-rose-400">ملغي</option>
                          </select>
                        </div>

                        {/* Direct Communication Buttons (WhatsApp & Call) */}
                        <div className="mt-3.5 grid grid-cols-2 gap-2">
                          {/* Direct WhatsApp */}
                          <a
                            href={getWhatsAppUrl(lead)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 text-xs font-bold transition shadow-xs hover:shadow-emerald-600/30"
                            title={`محادثة فورية على واتساب: ${lead.phone}`}
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span>واتساب مباشر</span>
                          </a>

                          {/* Direct Call */}
                          <a
                            href={`tel:${lead.phone}`}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 px-3 py-2 text-xs font-bold transition"
                            title={`اتصال هاتفي بالعميل: ${lead.phone}`}
                          >
                            <Phone className="h-3.5 w-3.5" />
                            <span dir="ltr" className="font-mono text-[11px] font-bold">{lead.phone || 'اتصال'}</span>
                          </a>
                        </div>

                        {/* Requested Property & Developer Info Card */}
                        <div className={`mt-3.5 rounded-xl border p-2.5 text-xs ${
                          isDark ? 'border-zinc-800/80 bg-zinc-950/60' : 'border-zinc-200/80 bg-zinc-50'
                        }`}>
                          <div className="flex items-start gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <span className="text-[10px] text-zinc-400">الوحدة المطلوبة للمعاينة:</span>
                              <p className={`font-bold text-xs truncate ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                {lead.unit_title || 'طلب عام بدون تحديد وحدة'}
                              </p>
                              {lead.developer_name && (
                                <p className="text-[10px] text-zinc-400 mt-0.5">
                                  المطور / الكمبوند: <span className="text-zinc-200 font-bold">{lead.developer_name}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Preferred Location & Unit Type */}
                          {(lead.preferred_location || lead.preferred_unit_type) && (
                            <div className="mt-2 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
                              {lead.preferred_location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-zinc-500" />
                                  <span>{lead.preferred_location}</span>
                                </span>
                              )}
                              {lead.preferred_unit_type && (
                                <span className="font-bold text-zinc-300">
                                  {lead.preferred_unit_type}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Budget & Payment Method */}
                          {(lead.budget_max || lead.payment_method) && (
                            <div className="mt-2 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
                              {lead.budget_max ? (
                                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                                  <Coins className="h-3 w-3" />
                                  <span>{Number(lead.budget_max).toLocaleString('en-US')} ج.م</span>
                                </span>
                              ) : <span />}
                              {lead.payment_method && (
                                <span className="rounded-md bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                                  {lead.payment_method}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Customer Notes / Timing */}
                        {lead.notes && (
                          <div className="mt-2.5 px-1 text-xs">
                            <span className="text-[10px] font-bold text-zinc-400">ملاحظات وموعد المعاينة:</span>
                            <p className={`mt-0.5 text-xs line-clamp-3 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                              {lead.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Card Footer: View Chat & Delete */}
                      <div className="mt-3.5 pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-2">
                        {lead.session_id ? (
                          <button
                            onClick={() => {
                              setSelectedSessionId(lead.session_id);
                              setActiveTab('chats');
                            }}
                            className="flex items-center gap-1 text-[11px] font-bold text-amber-500 hover:text-amber-400 transition"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>عرض محادثة العميل</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-zinc-500">
                            المصدر: {lead.source || 'استمارة مباشرة'}
                          </span>
                        )}

                        <button
                          onClick={() => handleDeleteLead(lead.id, lead.user_name)}
                          disabled={deletingLeadId === lead.id}
                          className="grid h-7 w-7 place-items-center rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/15 transition"
                          title="حذف هذا الطلب نهائياً"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === 'seller_properties' ? (
          /* ============================================================== */
          /* TAB 3: SELLER PROPERTIES (عروض ووحدات الملاك المعروضة للبيع)  */
          /* ============================================================== */
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            {/* Search & Status Filters Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    value={sellerSearch}
                    onChange={(e) => setSellerSearch(e.target.value)}
                    placeholder="ابحث باسم المالك، الهاتف، عنوان الوحدة، المنطقة..."
                    className={`w-full rounded-xl border pr-10 pl-4 py-2 text-xs focus:outline-hidden focus:border-amber-500 transition ${
                      isDark
                        ? 'border-zinc-800 bg-black text-white placeholder-zinc-500'
                        : 'border-zinc-300 bg-white text-zinc-900 placeholder-zinc-400'
                    }`}
                  />
                  {sellerSearch && (
                    <button
                      onClick={() => setSellerSearch('')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Status Filter Chips */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {[
                    { id: 'all', label: 'الكل', count: sellerCounts.all },
                    { id: 'قيد المراجعة', label: 'قيد المراجعة (جديدة)', count: sellerCounts.pending },
                    { id: 'معتمد', label: 'معتمد ومضاف للداتا', count: sellerCounts.approved },
                    { id: 'مرفوض', label: 'مرفوض', count: sellerCounts.rejected },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setSellerStatusFilter(filter.id)}
                      className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                        sellerStatusFilter === filter.id
                          ? 'bg-amber-500 text-black shadow-xs font-black'
                          : isDark
                          ? 'border border-zinc-800 bg-black text-zinc-300 hover:bg-zinc-900'
                          : 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      <span>{filter.label}</span>
                      {filter.count > 0 && (
                        <span
                          className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                            sellerStatusFilter === filter.id
                              ? 'bg-black/20 text-black font-black'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {filter.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Refresh Button */}
              <button
                onClick={fetchSellerProperties}
                disabled={loadingSellerProperties}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                  isDark
                    ? 'border-zinc-800 bg-black text-zinc-200 hover:bg-zinc-900'
                    : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
                title="تحديث عروض الملاك"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingSellerProperties ? 'animate-spin text-amber-500' : ''}`} />
                <span className="hidden sm:inline">تحديث</span>
              </button>
            </div>

            {/* List / Grid of Seller Listings */}
            {loadingSellerProperties ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-zinc-400 text-xs">
                <RefreshCw className="h-6 w-6 animate-spin text-amber-500 mb-3" />
                <span>جاري تحميل عروض ووحدات الملاك...</span>
              </div>
            ) : sellerProperties.length === 0 ? (
              <div
                className={`flex-1 flex flex-col items-center justify-center p-12 text-zinc-400 text-xs rounded-2xl border ${
                  isDark ? 'border-zinc-800 bg-black' : 'border-zinc-200 bg-white'
                }`}
              >
                <Tag className="h-10 w-10 text-zinc-700 mb-3" />
                <p className="font-bold text-sm text-zinc-300">لا توجد عروض بيع للملاك حالياً</p>
                <p className="mt-1 text-zinc-500 text-center max-w-sm">
                  {sellerSearch
                    ? 'لم يتم العثور على أي وحدات تطابق معايير البحث الحالية.'
                    : 'عندما يقوم أي مستخدم بعرض شقة أو أرض للبيع عبر المنصة، ستظهر كافة تفاصيلها هنا لمراجعتها واعتمادها.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 overflow-y-auto flex-1 pr-1">
                {sellerProperties.map((p) => {
                  const isApproved = p.status === 'معتمد' || p.status === 'متاح' || p.status === 'متاح للبيع';
                  const isPending = p.status === 'قيد المراجعة';
                  const isRejected = p.status === 'مرفوض';

                  return (
                    <div
                      key={p.id}
                      className={`rounded-2xl border p-4 flex flex-col justify-between transition-all hover:border-amber-500/40 shadow-xs ${
                        isDark ? 'border-zinc-800 bg-black' : 'border-zinc-200 bg-white'
                      }`}
                    >
                      <div>
                        {/* Header: Photo Preview & Status */}
                        <div className="flex items-start gap-3">
                          {p.images && p.images[0] ? (
                            <div className="relative h-20 w-24 shrink-0 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-800">
                              <img
                                src={p.images[0]}
                                alt={p.title}
                                className="h-full w-full object-cover"
                              />
                              {p.images.length > 1 && (
                                <span className="absolute bottom-1 right-1 rounded-md bg-black/80 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                  +{p.images.length - 1} صور
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="grid h-20 w-24 shrink-0 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-500">
                              <Images className="h-6 w-6" />
                              <span className="text-[9px] mt-0.5 font-bold">بدون صور</span>
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-black text-amber-500">
                                {p.unit_type}
                              </span>

                              {/* Status Badge */}
                              {isPending && (
                                <span className="flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                                  <Clock className="h-3 w-3" />
                                  <span>قيد المراجعة</span>
                                </span>
                              )}
                              {isApproved && (
                                <span className="flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>معتمد بالداتا</span>
                                </span>
                              )}
                              {isRejected && (
                                <span className="flex items-center gap-1 rounded-md bg-rose-500/15 border border-rose-500/40 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                                  <XCircle className="h-3 w-3" />
                                  <span>مرفوض</span>
                                </span>
                              )}
                            </div>

                            <h4 className={`mt-1.5 text-xs font-black line-clamp-2 ${isDark ? 'text-white' : 'text-zinc-900'}`} title={p.title}>
                              {p.title}
                            </h4>

                            <div className="mt-1 flex items-center gap-1 text-[11px] text-zinc-400">
                              <MapPin className="h-3 w-3 text-amber-500 shrink-0" />
                              <span className="truncate">{p.location_text || p.compound?.city}</span>
                            </div>
                          </div>
                        </div>

                        {/* Seller Contact Box */}
                        <div className={`mt-3 rounded-xl border p-2.5 text-xs ${
                          isDark ? 'border-zinc-800/80 bg-zinc-950/60' : 'border-zinc-200/80 bg-zinc-50'
                        }`}>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-zinc-400">المالك: <strong className="text-zinc-200">{p.seller_name || 'مالك مباشر'}</strong></span>
                            <span className="text-[10px] text-zinc-500">{formatDate(p.created_at)}</span>
                          </div>

                          {/* Quick WhatsApp & Call Buttons for Seller */}
                          {p.seller_phone && (
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              <a
                                href={getSellerWhatsAppUrl(p)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1.5 text-xs font-bold transition shadow-xs"
                                title={`واتساب مباشر مع المالك: ${p.seller_phone}`}
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                                <span>واتساب المالك</span>
                              </a>

                              <a
                                href={`tel:${p.seller_phone}`}
                                className="flex items-center justify-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 px-2 py-1.5 text-xs font-bold transition"
                                title={`اتصال بالمالك: ${p.seller_phone}`}
                              >
                                <Phone className="h-3 w-3" />
                                <span dir="ltr" className="font-mono text-[11px]">{p.seller_phone}</span>
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Financials & Specs */}
                        <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-xl border border-zinc-800/60 p-2">
                            <span className="text-[10px] text-zinc-400 block">السعر المطلوب:</span>
                            <span className="font-mono font-black text-amber-500 text-sm">
                              {Number(p.total_price || 0).toLocaleString()} ج.م
                            </span>
                          </div>
                          <div className="rounded-xl border border-zinc-800/60 p-2">
                            <span className="text-[10px] text-zinc-400 block">المساحة والمواصفات:</span>
                            <span className="font-bold text-zinc-200 text-xs">
                              {p.area_sqm} م² {p.bedrooms ? `• ${p.bedrooms} غرف` : ''} {p.bathrooms ? `• ${p.bathrooms} ح` : ''}
                            </span>
                          </div>
                        </div>

                        {/* Payment & Finishing details */}
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-[11px] text-zinc-400 px-1">
                          <span>نظام السداد: <strong className="text-zinc-200">{(p.installment_years || 0) > 0 ? `تقسيط ${p.installment_years} سنوات (مقدم ${p.down_payment_pct}%)` : 'كاش بالكامل'}</strong></span>
                          <span>التشطيب: <strong className="text-zinc-200">{p.finishing_type || 'غير محدد'}</strong></span>
                        </div>

                        {/* Seller Sale Circumstances & Notes */}
                        {p.sale_circumstances && (
                          <div className="mt-2.5 rounded-xl border border-zinc-800/50 bg-zinc-950/40 p-2 text-xs">
                            <span className="text-[10px] font-bold text-zinc-400 block">ظروف البيع وملاحظات المالك:</span>
                            <p className="mt-0.5 text-xs text-zinc-300 line-clamp-3">
                              {p.sale_circumstances}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Card Footer: Approval / Rejection Actions */}
                      <div className="mt-4 pt-3 border-t border-zinc-800/60 space-y-2">
                        {/* Approval & Rejection Row */}
                        <div className="flex items-center gap-2">
                          {!isApproved ? (
                            <button
                              onClick={() => handleApproveSellerProperty(p.id, p.title)}
                              disabled={updatingSellerId === p.id}
                              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2 px-3 transition shadow-xs"
                              title="اعتماد الوحدة وإضافتها فورياً لقاعدة بيانات المنصة ومحرك الذكاء الاصطناعي"
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span>اعتماد وإضافة للداتا ⚡</span>
                            </button>
                          ) : (
                            <div className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 py-2 text-xs font-bold text-emerald-400">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>منشورة ومعتمدة في الداتا</span>
                            </div>
                          )}

                          {!isRejected && (
                            <button
                              onClick={() => handleRejectSellerProperty(p.id)}
                              disabled={updatingSellerId === p.id}
                              className="flex items-center justify-center gap-1 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs py-2 px-3 transition"
                              title="رفض هذا العرض"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span>رفض</span>
                            </button>
                          )}
                        </div>

                        {/* Secondary Actions: Full Preview & Permanent Delete */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <button
                            onClick={() => setPreviewProperty(p)}
                            className="flex items-center gap-1 text-[11px] font-bold text-amber-500 hover:text-amber-400 transition"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>معاينة تفاصيل الوحدة الكاملة</span>
                          </button>

                          <button
                            onClick={() => handleDeleteSellerProperty(p.id, p.title)}
                            disabled={deletingSellerId === p.id}
                            className="grid h-7 w-7 place-items-center rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/15 transition"
                            title="حذف هذا العرض نهائياً من قاعدة البيانات"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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

      {/* Full Property Preview Modal for Admin */}
      {previewProperty && (
        <PropertyDetailsModal
          property={previewProperty}
          isOpen={Boolean(previewProperty)}
          onClose={() => setPreviewProperty(null)}
        />
      )}
    </div>
  );
}
