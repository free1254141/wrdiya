'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { initialDowntimeLogs } from '@/lib/supabase';
import { 
  BarChart3, 
  Activity, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  ShieldAlert, 
  Download, 
  Filter, 
  Zap, 
  Calendar, 
  FileText,
  AlertTriangle,
  Flame,
  Gauge
} from 'lucide-react';

export default function OeeAnalyticsPage() {
  const { user, factory } = useAuth();
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [filterPeriod, setFilterPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // OEE Components
  const availability = 89.4; // %
  const performance = 92.2;  // %
  const quality = 95.1;      // %
  const overallOEE = ((availability * performance * quality) / 10000).toFixed(1); // 78.4%

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Metric,Value,Target\n"
      + `Overall OEE,${overallOEE}%,85%\n`
      + `Availability,${availability}%,90%\n`
      + `Performance,${performance}%,95%\n`
      + `Quality,${quality}%,98%\n`
      + "MTTR,24 min,15 min\n"
      + "MTBF,14.2 hours,20 hours\n";

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `wrdya_oee_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <AppLayout
      pageTitle={isAr ? 'تحليلات OEE وتقارير الكفاءة الصناعية' : 'OEE Analytics & Industrial Reliability'}
      pageSubtitle={isAr 
        ? 'حساب مؤشرات الكفاءة الشاملة (التوفر × الأداء × الجودة)، أوقات الاستجابة للأعطال، وتصدير التقارير' 
        : 'Comprehensive OEE breakdown, MTTR/MTBF reliability metrics, and performance report exports'}
      actionButton={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>{isAr ? 'تصدير التقرير (Excel / CSV)' : 'Export CSV Report'}</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        
        {downloadSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'تم تصدير وتحميل تقرير OEE بنجاح!' : 'Report downloaded successfully!'}</span>
          </div>
        )}

        {/* Time Period Filter Pills */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-400" />
            <span className="text-xs text-zinc-400 font-bold">{isAr ? 'الفترة الزمنية:' : 'Time Range:'}</span>
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setFilterPeriod('today')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filterPeriod === 'today' ? 'bg-amber-400 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {isAr ? 'اليوم' : 'Today'}
              </button>
              <button
                type="button"
                onClick={() => setFilterPeriod('week')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filterPeriod === 'week' ? 'bg-amber-400 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {isAr ? 'الأسبوع الحالي' : 'This Week'}
              </button>
              <button
                type="button"
                onClick={() => setFilterPeriod('month')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filterPeriod === 'month' ? 'bg-amber-400 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {isAr ? 'الشهر' : 'This Month'}
              </button>
            </div>
          </div>

          <span className="text-xs text-zinc-400 font-mono">
            {factory?.name || 'مصنع النيل'}
          </span>
        </div>

        {/* Big OEE Hero Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0f172a] via-[#0d131f] to-[#070a12] border-2 border-zinc-700 text-white relative overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            <div className="md:col-span-4 text-center md:text-right border-b md:border-b-0 md:border-r rtl:md:border-r-0 rtl:md:border-l border-zinc-800 pb-4 md:pb-0 md:px-4">
              <span className="text-xs uppercase font-bold tracking-widest text-amber-400">
                {isAr ? 'معدل الكفاءة الشامل للمعدات' : 'Overall Equipment Effectiveness'}
              </span>
              <div className="text-5xl sm:text-6xl font-black text-emerald-400 font-mono mt-1 tracking-tight">
                {overallOEE}%
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  {isAr ? '🟢 أداء صناعي ممتاز' : '🟢 World Class Standard'}
                </span>
                <span className="text-xs text-zinc-400 font-semibold">{isAr ? 'الهدف: 85%' : 'Target: 85%'}</span>
              </div>
            </div>

            {/* The 3 OEE Pillars */}
            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Pillar 1: Availability */}
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-bold">
                  <span>{isAr ? 'التوفر (Availability)' : 'Availability'}</span>
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="text-2xl font-black text-white font-mono">{availability}%</div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${availability}%` }} />
                </div>
                <p className="text-[10px] text-zinc-400">
                  {isAr ? 'تأثر بتوقف 18 دقيقة على ماكينة الحقن INJ-02' : 'Impacted by 18m stoppage on INJ-02'}
                </p>
              </div>

              {/* Pillar 2: Performance */}
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-bold">
                  <span>{isAr ? 'الأداء (Performance)' : 'Performance'}</span>
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-white font-mono">{performance}%</div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full" style={{ width: `${performance}%` }} />
                </div>
                <p className="text-[10px] text-zinc-400">
                  {isAr ? 'السرعة الفعلية 92% مقارنة بالسرعة الاسمية' : 'Operating at 92% rated machine speed'}
                </p>
              </div>

              {/* Pillar 3: Quality */}
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-zinc-400 text-xs font-bold">
                  <span>{isAr ? 'الجودة (Quality)' : 'Quality'}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white font-mono">{quality}%</div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${quality}%` }} />
                </div>
                <p className="text-[10px] text-zinc-400">
                  {isAr ? '5,610 وحدة سليمة مقابل 97 هدر فقط' : '5,610 conforming vs 97 scrap units'}
                </p>
              </div>

            </div>

          </div>
        </div>

        {/* Reliability Metrics (MTTR & MTBF) & Six Big Losses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* MTTR & MTBF Reliability Card */}
          <div className="p-5 rounded-2xl bg-[#0d121c] border border-zinc-800 space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'مؤشرات الصيانة والاعتمادية (Reliability KPIs)' : 'Maintenance Reliability KPIs'}</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                  MTTR (Mean Time To Repair)
                </span>
                <span className="text-2xl font-black text-amber-400 font-mono">24 {isAr ? 'دقيقة' : 'min'}</span>
                <p className="text-[10px] text-zinc-400 mt-1">
                  {isAr ? 'متوسط وقت الإصلاح وحل الأعطال' : 'Average time to resolve stoppages'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                  MTBF (Mean Time Between Failures)
                </span>
                <span className="text-2xl font-black text-cyan-400 font-mono">14.2 {isAr ? 'ساعة' : 'hours'}</span>
                <p className="text-[10px] text-zinc-400 mt-1">
                  {isAr ? 'متوسط زمن التشغيل الخالي من التوقف' : 'Average operating time without stops'}
                </p>
              </div>
            </div>
          </div>

          {/* Six Big Losses Pareto Breakdown */}
          <div className="p-5 rounded-2xl bg-[#0d121c] border border-zinc-800 space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <span>{isAr ? 'تحليل الخسائر الست الكبرى (6 Big Losses)' : 'Six Big Losses Breakdown'}</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60">
                <span className="text-zinc-300">1. {isAr ? 'أعطال مفاجئة وتوقف ماكينات' : 'Equipment Breakdowns'}</span>
                <span className="font-mono text-rose-400 font-bold">18m (52%)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60">
                <span className="text-zinc-300">2. {isAr ? 'تجهيز وتغيير قوالب وصيانة' : 'Setup & Tooling Changes'}</span>
                <span className="font-mono text-amber-400 font-bold">12m (28%)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60">
                <span className="text-zinc-300">3. {isAr ? 'توقفات طفيفة وسرعة منخفضة' : 'Minor Stops & Reduced Speed'}</span>
                <span className="font-mono text-cyan-400 font-bold">8m (14%)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60">
                <span className="text-zinc-300">4. {isAr ? 'عيوب تشغيل وتلف خامات' : 'Production Defects & Rework'}</span>
                <span className="font-mono text-zinc-400 font-bold">97 pcs (6%)</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </AppLayout>
  );
}
