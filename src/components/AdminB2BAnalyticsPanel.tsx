'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity,
  Building2,
  KeyRound,
  RefreshCw,
  Eye,
  Clock,
  Users,
} from 'lucide-react';

interface AnalyticsPayload {
  visitors: {
    totalEvents: number;
    uniqueSessions: number;
    topPages: Array<{ path: string; views: number }>;
    recentEvents: Array<{
      id: string;
      session_id: string;
      page_path: string;
      event_type: string;
      referrer: string | null;
      metadata: Record<string, any>;
      created_at: string;
    }>;
  };
  trials: {
    total: number;
    activeCount: number;
    items: Array<{
      id: string;
      company_name: string;
      contact_name: string | null;
      phone: string;
      email: string | null;
      service_type: string;
      monthly_users: number;
      estimated_price_egp: number;
      tier_name: string;
      trial_api_key: string;
      status: string;
      expires_at: string;
      created_at: string;
    }>;
  };
  apiUsage: {
    totalCalls: number;
    byKey: Array<{ key: string; company: string; calls: number; lastUsed: string }>;
    recentLogs: Array<{
      id: string;
      api_key: string;
      company_name: string | null;
      tier: string;
      method: string;
      status_code: number;
      location: string | null;
      area_sqm: number | null;
      latency_ms: number | null;
      created_at: string;
    }>;
  };
}

export default function AdminB2BAnalyticsPanel() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/b2b-analytics');
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'تعذر تحميل تحليلات الزوار والـ API');
      } else {
        setData(json);
      }
    } catch {
      setError('خطأ في الاتصال بالسيرفر');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('ar-EG', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  if (loading && !data) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-10 text-center text-sm text-zinc-400">
        جاري تحميل تحركات الزوار، طلبات الشركات، واستخدام الـ API...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center text-sm text-rose-300">
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Top KPI Cards */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <Activity className="h-5 w-5 text-amber-400" />
          <span>تحركات الزوار، طلبات التجربة (3 أيام)، واستخدام الـ API</span>
        </h2>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-bold text-white cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/75 p-4">
          <div className="text-xs text-zinc-400 flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-sky-400" />
            <span>إجمالي زيارات الصفحات</span>
          </div>
          <div className="text-2xl font-black text-white font-mono mt-1">
            {data.visitors.totalEvents}
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/75 p-4">
          <div className="text-xs text-zinc-400 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-amber-400" />
            <span>جلسات زوار فريدة</span>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">
            {data.visitors.uniqueSessions}
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <div className="text-xs text-emerald-300 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            <span>طلبات تجربة B2B (نشط)</span>
          </div>
          <div className="text-2xl font-black text-white font-mono mt-1">
            {data.trials.total}{' '}
            <span className="text-xs text-emerald-400">({data.trials.activeCount} نشط)</span>
          </div>
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="text-xs text-amber-300 flex items-center gap-1.5">
            <KeyRound className="h-3.5 w-3.5" />
            <span>طلبات الـ API (/api/v1/valuate)</span>
          </div>
          <div className="text-2xl font-black text-white font-mono mt-1">
            {data.apiUsage.totalCalls}
          </div>
        </div>
      </div>

      {/* Top Pages & API By Key */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
          <h3 className="text-sm font-black text-white mb-3">أكثر الصفحات زيارة</h3>
          <div className="space-y-2">
            {data.visitors.topPages.length === 0 ? (
              <div className="text-xs text-zinc-500">لا توجد زيارات مسجلة بعد.</div>
            ) : (
              data.visitors.topPages.map((p) => (
                <div
                  key={p.path}
                  className="flex items-center justify-between rounded-xl bg-zinc-950/80 border border-zinc-800/80 px-3 py-2 text-xs"
                >
                  <span className="font-mono text-amber-300" dir="ltr">
                    {p.path}
                  </span>
                  <span className="font-black text-white font-mono">{p.views} زيارة</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
          <h3 className="text-sm font-black text-white mb-3">استهلاك API حسب الشركة / المفتاح</h3>
          <div className="space-y-2">
            {data.apiUsage.byKey.length === 0 ? (
              <div className="text-xs text-zinc-500">لا توجد طلبات API مسجلة بعد.</div>
            ) : (
              data.apiUsage.byKey.map((k) => (
                <div
                  key={k.key}
                  className="flex items-center justify-between rounded-xl bg-zinc-950/80 border border-zinc-800/80 px-3 py-2 text-xs"
                >
                  <div>
                    <div className="font-bold text-white">{k.company}</div>
                    <div className="text-[10px] font-mono text-zinc-500" dir="ltr">
                      {k.key}
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="font-black text-emerald-400 font-mono">{k.calls} طلب</div>
                    <div className="text-[10px] text-zinc-500">{fmtDate(k.lastUsed)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* B2B Trial Requests Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
        <div className="p-4 border-b border-zinc-800 font-black text-sm text-white">
          طلبات الشركات للتجربة المجانية (3 أيام)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="p-3">الشركة / المسؤول</th>
                <th className="p-3">واتساب / إيميل</th>
                <th className="p-3">مستخدمو الشات/شهر</th>
                <th className="p-3">الباقة والتسعير</th>
                <th className="p-3">مفتاح التجربة</th>
                <th className="p-3">الانتهاء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {data.trials.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-zinc-500">
                    لا توجد طلبات تجربة شركات حتى الآن.
                  </td>
                </tr>
              ) : (
                data.trials.items.map((t) => {
                  const expired = new Date(t.expires_at).getTime() <= Date.now();
                  return (
                    <tr key={t.id} className="hover:bg-zinc-800/30">
                      <td className="p-3">
                        <div className="font-bold text-white">{t.company_name}</div>
                        <div className="text-[11px] text-zinc-400">{t.contact_name || '-'}</div>
                      </td>
                      <td className="p-3 font-mono">
                        <div className="text-emerald-300">{t.phone}</div>
                        <div className="text-[10px] text-zinc-400">{t.email || '-'}</div>
                      </td>
                      <td className="p-3 font-mono font-bold text-white">
                        {t.monthly_users.toLocaleString('ar-EG')}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-amber-300">
                          {t.estimated_price_egp.toLocaleString('ar-EG')} ج.م/شهر
                        </div>
                        <div className="text-[10px] text-zinc-400">{t.tier_name}</div>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-sky-300" dir="ltr">
                        {t.trial_api_key}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            expired
                              ? 'bg-rose-500/15 text-rose-300'
                              : 'bg-emerald-500/15 text-emerald-300'
                          }`}
                        >
                          {expired ? 'منتهية' : 'نشطة'} • {fmtDate(t.expires_at)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Visitor Movements & API Calls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
          <h3 className="text-sm font-black text-white mb-3 flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-sky-400" />
            <span>آخر تحركات الزوار بالصفحات</span>
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {data.visitors.recentEvents.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-zinc-950/70 border border-zinc-800/70 px-3 py-2 text-[11px]"
              >
                <div className="min-w-0">
                  <span className="font-mono text-amber-300" dir="ltr">
                    {ev.page_path}
                  </span>{' '}
                  <span className="text-zinc-400">({ev.event_type})</span>
                  <div className="text-[10px] text-zinc-500 font-mono truncate">
                    {ev.session_id}
                  </div>
                </div>
                <span className="text-[10px] text-zinc-400 shrink-0">{fmtDate(ev.created_at)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
          <h3 className="text-sm font-black text-white mb-3 flex items-center gap-1.5">
            <KeyRound className="h-4 w-4 text-emerald-400" />
            <span>آخر طلبات الـ API</span>
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {data.apiUsage.recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-zinc-950/70 border border-zinc-800/70 px-3 py-2 text-[11px]"
              >
                <div className="min-w-0">
                  <div className="font-bold text-white truncate">
                    {log.company_name || log.api_key} •{' '}
                    <span className="text-amber-300">{log.location || '-'}</span>{' '}
                    {log.area_sqm ? `(${log.area_sqm}م²)` : ''}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    {log.method} • HTTP {log.status_code} • {log.latency_ms || 0}ms
                  </div>
                </div>
                <span className="text-[10px] text-zinc-400 shrink-0">{fmtDate(log.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
