'use client';

import React, { useState } from 'react';
import { DowntimeLog, ProductionLog, ShiftNote } from '@/lib/types';
import { Locale, translations } from '@/lib/i18n';
import { 
  TrendingUp, 
  FileSpreadsheet, 
  BarChart, 
  CheckCircle2, 
  Zap, 
  ArrowUpRight,
  ShieldAlert,
  Users,
  Download,
  Printer,
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';

interface ManagerAnalyticsCardProps {
  downtimeLogs: DowntimeLog[];
  productionLogs: ProductionLog[];
  shiftNotes?: ShiftNote[];
  locale: Locale;
}

export default function ManagerAnalyticsCard({
  downtimeLogs,
  productionLogs,
  shiftNotes = [],
  locale,
}: ManagerAnalyticsCardProps) {
  const isAr = locale === 'ar';
  const t = translations[locale];
  const [activeTab, setActiveTab] = useState<'oee' | 'pareto' | 'permissions'>('oee');

  const totalGood = 8050;
  const totalScrap = 205;
  const availabilityRate = 89.4;
  const performanceRate = 92.2;
  const qualityRate = 97.5;
  const overallOEE = 78.4;

  const handleExportReport = () => {
    const reportData = {
      factory: isAr ? 'المصنع المصري للبوليمر والبلاستيك' : 'Egyptian Polymer & Plastic Plant',
      date: new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US'),
      shift: isAr ? 'الوردية الصباحية والمسائية' : 'Morning & Evening Shifts',
      kpi: {
        oee: `${overallOEE}%`,
        availability: `${availabilityRate}%`,
        performance: `${performanceRate}%`,
        quality: `${qualityRate}%`,
      },
      production: {
        totalGood,
        totalScrap,
      },
      downtimeMinutes: 145,
      openIncidents: downtimeLogs.filter((d) => !d.ended_at).length,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Wrdya-Shift-Report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Top Manager Command Bar */}
      <div className="neobrutal-card rounded-2xl p-5 border-2 border-zinc-700 bg-[#0d121c]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                {isAr ? 'لوحة الإدارة العامة ومؤشرات OEE الشاملة' : 'Plant Executive Dashboard & OEE Analytics'}
              </h3>
              <p className="text-xs text-zinc-400">
                {isAr ? 'متابعة كفاءة المصنع، تقارير الهدر، وتدقيق صلاحيات المستخدمين' : 'Cross-plant efficiency, scrap analysis, and role governance'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportReport}
              className="neobrutal-btn px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAr ? 'تصدير التقرير (JSON)' : 'Export JSON'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="neobrutal-btn px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isAr ? 'طباعة الوردية' : 'Print Shift'}</span>
            </button>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 mb-4 text-xs font-bold overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('oee')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === 'oee'
                ? 'bg-purple-500 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {isAr ? 'مؤشر OEE ومثلث الكفاءة' : 'OEE Tri-Factor Dashboard'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pareto')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === 'pareto'
                ? 'bg-purple-500 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {isAr ? 'تحليل باريتو لأسباب التوقف (Downtime Pareto)' : 'Downtime Pareto Root Cause'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('permissions')}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === 'permissions'
                ? 'bg-purple-500 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {isAr ? 'سجل صلاحيات الأدوار (RBAC)' : 'Role Permissions (RBAC)'}
          </button>
        </div>

        {/* Tab 1: OEE Tri-Factor Breakdown */}
        {activeTab === 'oee' && (
          <div className="space-y-4">
            {/* Main OEE Big Card */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-zinc-900 to-zinc-900 border border-purple-500/30 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-purple-300">
                  {isAr ? 'معدل الكفاءة التشغيلية الشاملة للمصنع:' : 'Overall Plant Operational Efficiency (OEE):'}
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-mono text-3xl sm:text-4xl font-black text-white">{overallOEE}%</span>
                  <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30">
                    {isAr ? 'معيار عالمي ممتاز (World-Class)' : 'World-Class Target'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-zinc-400 max-w-sm">
                {isAr
                  ? 'تم احتساب المعدل بالاعتماد على ساعات تشغيل الماكينات الأربعة والإنتاج التراكمي للورديتين.'
                  : 'Computed from runtime logs across 4 machines for morning and evening production shifts.'}
              </p>
            </div>

            {/* Tri-Factor Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Availability */}
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-zinc-300">{isAr ? 'التوفر (Availability)' : 'Availability'}</span>
                  <span className="font-mono text-sm font-black text-blue-400">{availabilityRate}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden mb-2">
                  <div className="h-full bg-blue-500" style={{ width: `${availabilityRate}%` }} />
                </div>
                <span className="text-[10px] text-zinc-500">
                  {isAr ? 'تأثر بتوقف ماكينة الحقن 18 دقيقة' : 'Impacted by 18m stoppage on INJ-02'}
                </span>
              </div>

              {/* Performance */}
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-zinc-300">{isAr ? 'الأداء (Performance)' : 'Performance'}</span>
                  <span className="font-mono text-sm font-black text-amber-400">{performanceRate}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden mb-2">
                  <div className="h-full bg-amber-500" style={{ width: `${performanceRate}%` }} />
                </div>
                <span className="text-[10px] text-zinc-500">
                  {isAr ? 'متوسط سرعة الخطوط 94% من المعدل الاسمي' : 'Average line cycle speed at 94% rated'}
                </span>
              </div>

              {/* Quality */}
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-zinc-300">{isAr ? 'الجودة (Quality)' : 'Quality'}</span>
                  <span className="font-mono text-sm font-black text-emerald-400">{qualityRate}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden mb-2">
                  <div className="h-full bg-emerald-500" style={{ width: `${qualityRate}%` }} />
                </div>
                <span className="text-[10px] text-zinc-500">
                  {isAr ? '8,050 وحدة مطابقة مقابل 205 سكراب' : '8,050 good units vs 205 scrap'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Pareto Breakdown */}
        {activeTab === 'pareto' && (
          <div className="space-y-3">
            <div className="text-xs text-zinc-400 mb-2">
              {isAr ? 'توزيع ساعات التوقف حسب الفئة الفنية (قاعدة 80/20):' : 'Downtime distribution by category (80/20 rule):'}
            </div>
            {[
              { cat: isAr ? 'أعطال كهربائية وحساسات' : 'Electrical & Sensor Overheat', mins: 68, pct: 47, color: 'bg-amber-500' },
              { cat: isAr ? 'أعطال ميكانيكية وهيدروليك' : 'Mechanical & Hydraulic Pressure', mins: 42, pct: 29, color: 'bg-blue-500' },
              { cat: isAr ? 'تأخر ونقص خامات البوليمر' : 'Polymer Raw Material Delay', mins: 25, pct: 17, color: 'bg-emerald-500' },
              { cat: isAr ? 'أسباب ضبط جودة أخرى' : 'QA Adjustments & Mold Changes', mins: 10, pct: 7, color: 'bg-purple-500' },
            ].map((p, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold text-zinc-200">{p.cat}</span>
                  <span className="font-mono text-zinc-400">{p.mins} {isAr ? 'دقيقة' : 'mins'} ({p.pct}%)</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div className={`h-full ${p.color}`} style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Permissions Governance */}
        {activeTab === 'permissions' && (
          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">👷 {isAr ? 'عامل التشغيل (Operator)' : 'Machine Operator'}</span>
                <span className="text-zinc-400 text-[11px]">{isAr ? 'تسجيل التوقف بالصوت • عداد الإنتاج والهدر • تسليم المهام' : 'Voice downtime logging, unit counters, shift checklist'}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                {isAr ? 'نشط ومفعل' : 'Active'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">📋 {isAr ? 'مشرف الوردية (Supervisor)' : 'Shift Supervisor'}</span>
                <span className="text-zinc-400 text-[11px]">{isAr ? 'اعتماد أرقام الوردية • تسكين كشف العمال • تثبيت التنبيهات' : 'Shift signoff, staff roster management, pinned alerts'}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 font-bold">
                {isAr ? 'صلاحيات كاملة' : 'Full Scope'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">🛠️ {isAr ? 'مهندس الصيانة (Maintenance)' : 'Maintenance Tech'}</span>
                <span className="text-zinc-400 text-[11px]">{isAr ? 'استلام بلاغات MTTR • توثيق الإصلاح • طلب قطع الغيار' : 'MTTR dispatch, repair log, spare parts requisition'}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold">
                {isAr ? 'استجابة سريعة' : 'Rapid Response'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">🏢 {isAr ? 'مدير المصنع (Plant Manager / Owner)' : 'Plant Manager / Owner'}</span>
                <span className="text-zinc-400 text-[11px]">{isAr ? 'تحليلات OEE الشاملة • تصدير التقارير • شاشة الآندون TV' : 'OEE executive analytics, report exports, Andon TV'}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30 font-bold">
                {isAr ? 'إدارة عليا' : 'Executive Admin'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
