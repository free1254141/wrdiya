'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  initialMachines, 
  initialShiftNotes, 
  initialDowntimeLogs, 
  initialProductionLogs 
} from '@/lib/supabase';
import { Machine, ShiftNote, DowntimeLog, ProductionLog } from '@/lib/types';
import { 
  Factory, 
  Users, 
  Cpu, 
  PackageCheck, 
  BarChart3, 
  Bot, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  ShieldAlert, 
  Layers, 
  Play, 
  Activity,
  Calendar,
  ExternalLink
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const { user, factory, activeRole } = useAuth();
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [machines, setMachines] = useState<Machine[]>(initialMachines);
  const [shiftNotes] = useState<ShiftNote[]>(initialShiftNotes);
  const [downtimeLogs] = useState<DowntimeLog[]>(initialDowntimeLogs);
  const [productionLogs] = useState<ProductionLog[]>(initialProductionLogs);

  // Load onboarded setup if stored
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wrdya_onboarded_setup');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.machines && parsed.machines.length > 0) {
          setMachines(parsed.machines.map((m: any, idx: number) => ({
            id: m.id || `mach-${idx + 1}`,
            factory_id: factory?.id || 'fac-01',
            name: m.name,
            code: m.code,
            line_name: m.line,
            current_status: m.status || 'running',
            last_status_change: new Date().toISOString(),
          })));
        }
      }
    } catch {}
  }, [factory]);

  const runningCount = machines.filter((m) => m.current_status === 'running').length;
  const downCount = machines.filter((m) => m.current_status === 'down').length;
  const maintenanceCount = machines.filter((m) => m.current_status === 'maintenance').length;
  const pinnedNote = shiftNotes.find((n) => n.is_pinned_for_next_shift);

  const toolsCards = [
    {
      title: isAr ? 'إدارة الورديات وتسكين العمال' : 'Shift Roster & Staff',
      desc: isAr ? 'تسكين المشرفين والفنيين على الخطوط، استيراد الكشوف بالإكسيل والصور، واعتماد التسليم.' : 'Assign operators to lines, AI sheet import, and shift handover sign-off.',
      href: '/roster',
      icon: Users,
      badge: isAr ? 'تسكين حي' : 'Active Roster',
      color: 'from-blue-500/20 via-blue-500/10 to-transparent border-blue-500/30 text-blue-400',
    },
    {
      title: isAr ? 'الماكينات والأعطال والآندون' : 'Machines & Downtime',
      desc: isAr ? 'مراقبة فورية للماكينات، مؤقت التوقف الحي، وبلاغات الصيانة الصوتية والتشخيص الذكي.' : 'Live machine status, downtime stopwatches, voice alerts & AI root cause.',
      href: '/machines',
      icon: Cpu,
      badge: `${downCount} ${isAr ? 'متوقفة' : 'Down'}`,
      color: 'from-rose-500/20 via-rose-500/10 to-transparent border-rose-500/30 text-rose-400',
    },
    {
      title: isAr ? 'تسجيل الإنتاج وتتبع الجودة' : 'Production & Quality Counts',
      desc: isAr ? 'تسجيل كميات إنتاج كل ساعة، حصر القطع السليمة والهدر، وحساب مؤشرات الجودة.' : 'Hourly counts, good vs scrap counter, defect categorization & pacing.',
      href: '/production',
      icon: PackageCheck,
      badge: '5,610 Units',
      color: 'from-amber-500/20 via-amber-500/10 to-transparent border-amber-500/30 text-amber-400',
    },
    {
      title: isAr ? 'تحليلات OEE وتقارير المصنع' : 'OEE Analytics & Reports',
      desc: isAr ? 'معايير الكفاءة الشاملة (التوفر × الأداء × الجودة)، سجل الأعطال التاريخي وتصدير التقارير.' : 'OEE calculations, MTTR/MTBF, downtime logs archive & PDF/Excel export.',
      href: '/analytics',
      icon: BarChart3,
      badge: '78.4% OEE',
      color: 'from-emerald-500/20 via-emerald-500/10 to-transparent border-emerald-500/30 text-emerald-400',
    },
    {
      title: isAr ? 'محطة مساعد وردية الذكي' : 'AI Industrial Copilot',
      desc: isAr ? 'استشارات فنية، تحليل شيتات الأعطال، استخراج الجداول من صور اللوحات، وصياغة التقارير.' : 'Chatbot, sheet & image OCR parser, SOP troubleshooting & handover drafting.',
      href: '/copilot',
      icon: Bot,
      badge: 'AI Assistant',
      color: 'from-purple-500/20 via-purple-500/10 to-transparent border-purple-500/30 text-purple-400',
    },
    {
      title: isAr ? 'إعدادات المنشأة والماكينات' : 'Plant Facilities & Setup',
      desc: isAr ? 'تعريف خطوط الإنتاج والماكينات الجديدة، كود المصنع، وإدارة الصلاحيات والفريق.' : 'Manage production lines, machinery inventory, plant code & team permissions.',
      href: '/settings',
      icon: Factory,
      badge: factory?.code || 'WRD-EG-742',
      color: 'from-cyan-500/20 via-cyan-500/10 to-transparent border-cyan-500/30 text-cyan-400',
    },
  ];

  return (
    <AppLayout
      pageTitle={isAr ? 'صالة الإنتاج والتحكم المركزي' : 'Plant Floor Central Overview'}
      pageSubtitle={isAr 
        ? `${factory?.name || 'مصنع النيل للبلاستيك والبوليمر'} • كود المنشأة: ${factory?.code || 'WRD-EG-742'} • الوردية الصباحية` 
        : `${factory?.name || 'Nile Polymer Plant'} • Facility Code: ${factory?.code || 'WRD-EG-742'} • Morning Shift`}
      actionButton={
        <Link
          href="/tv-board"
          target="_blank"
          className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-cyan-400 border border-zinc-700 text-xs font-bold flex items-center gap-1.5 transition"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>{isAr ? 'فتح شاشة التلفزيون (TV)' : 'Open Andon TV'}</span>
        </Link>
      }
    >
      <div className="space-y-6">
        
        {/* Pinned Shift Handover Alert Banner */}
        {pinnedNote && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-amber-500/5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                    {isAr ? '📌 تنبيه تسليم وردية مثبت وموجه لصالة الإنتاج' : '📌 Pinned Shift Handover Alert'}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                    {pinnedNote.supervisor_name}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-200 mt-1 leading-relaxed">
                  {pinnedNote.note_text}
                </p>
              </div>
            </div>

            <Link
              href="/roster"
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-black text-xs font-black shrink-0 transition self-start sm:self-auto"
            >
              {isAr ? 'عرض دفتر الوردية ➔' : 'View Shift Log ➔'}
            </Link>
          </div>
        )}

        {/* Top KPI Telemetry Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Card 1: Overall OEE */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0d121c] border border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold">{isAr ? 'معدل OEE العام للصالة' : 'Overall Plant OEE'}</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">78.4%</span>
              <span className="text-[10px] text-zinc-400 font-semibold">{isAr ? 'مستهدف: 85%' : 'Target: 85%'}</span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-emerald-400 h-full rounded-full" style={{ width: '78.4%' }} />
            </div>
          </div>

          {/* Card 2: Machines Live Status */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0d121c] border border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold">{isAr ? 'حالة ماكينات الصالة' : 'Floor Machines'}</span>
              <Cpu className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                {runningCount} <span className="text-sm font-normal text-zinc-400">/ {machines.length}</span>
              </span>
              <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                {downCount} {isAr ? 'متوقفة' : 'Down'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> {runningCount} {isAr ? 'تعمل' : 'Running'}
              <span className="mx-1">•</span>
              <span className="w-2 h-2 rounded-full bg-amber-400" /> {maintenanceCount} {isAr ? 'صيانة' : 'Maint'}
            </div>
          </div>

          {/* Card 3: Shift Production Count */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0d121c] border border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold">{isAr ? 'إنتاج الوردية الحالي' : 'Shift Output'}</span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">5,610</span>
              <span className="text-[10px] text-zinc-400">{isAr ? 'قطعة مطابقة' : 'Good Units'}</span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: '93.5%' }} />
            </div>
          </div>

          {/* Card 4: Scrap & Quality */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0d121c] border border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold">{isAr ? 'معدل الجودة والهدر' : 'Quality & Scrap'}</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">98.3%</span>
              <span className="text-[10px] text-rose-400 font-bold">1.7% {isAr ? 'سكراب' : 'Scrap'}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-3 font-mono">
              <span>97 {isAr ? 'وحدة هدر' : 'scrap units'}</span>
              <span className="text-emerald-400">95.1% Quality OEE</span>
            </div>
          </div>

        </div>

        {/* Section: Dedicated Specialized Tools Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'الأدوات المتخصصة للمصنع (Dedicated Tools)' : 'Dedicated Plant Tools & Workspaces'}</span>
            </h2>
            <span className="text-xs text-zinc-500">
              {isAr ? 'انتقل إلى الصفحة المتخصصة لكل مهمة صناعية' : 'Jump directly into specialized task pages'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {toolsCards.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="p-5 rounded-2xl bg-[#0d121c] hover:bg-[#111724] border border-zinc-800 hover:border-zinc-700 transition group flex flex-col justify-between space-y-4 shadow-lg hover:shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${tool.color} border`}>
                        <Icon className="w-5 h-5 group-hover:scale-110 transition" />
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
                        {tool.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition flex items-center gap-2">
                      <span>{tool.title}</span>
                      <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition" />
                    </h3>

                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                      {tool.desc}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 group-hover:text-zinc-300">
                    <span>{isAr ? 'فتح الأداة المتخصصة' : 'Launch Dedicated Tool'}</span>
                    <span className="text-amber-400 font-bold">➔</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Section: Live Floor Machines Snapshot */}
        <div className="p-5 rounded-2xl bg-[#0d121c] border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 pulse-emerald" />
              <h3 className="text-sm font-black text-white">
                {isAr ? 'المعاينة الحية لماكينات الصالة (Live Machines)' : 'Live Floor Machinery Snapshot'}
              </h3>
            </div>
            <Link
              href="/machines"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
            >
              <span>{isAr ? 'لوحة التحكم الكاملة في الأعطال' : 'Open Full Downtime Controller'}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {machines.map((machine) => {
              const isDown = machine.current_status === 'down';
              const isMaint = machine.current_status === 'maintenance';

              return (
                <div
                  key={machine.id}
                  className={`p-3.5 rounded-xl border transition ${
                    isDown 
                      ? 'bg-rose-500/10 border-rose-500/40 text-rose-300' 
                      : isMaint 
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' 
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-white font-bold">
                      {machine.code}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      isDown 
                        ? 'bg-rose-500/20 text-rose-400' 
                        : isMaint 
                          ? 'bg-amber-500/20 text-amber-400' 
                          : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isDown ? 'bg-rose-400 animate-ping' : isMaint ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                      {isDown ? (isAr ? 'عطل متوقف' : 'Stopped') : isMaint ? (isAr ? 'تحت الصيانة' : 'Maint') : (isAr ? 'تعمل' : 'Running')}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-white truncate">{machine.name}</p>

                  {isDown && (
                    <div className="mt-2 pt-2 border-t border-rose-500/20 text-[11px] text-rose-400">
                      <span className="font-semibold">{machine.active_downtime_note || (isAr ? 'ارتفاع حرارة هيتر الحقن' : 'Overheat warning')}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
