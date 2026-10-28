'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  initialMachines, 
  initialProductionLogs 
} from '@/lib/supabase';
import { ProductionLog, ShiftName } from '@/lib/types';
import { 
  PackageCheck, 
  Plus, 
  Minus, 
  CheckCircle2, 
  TrendingUp, 
  ShieldAlert, 
  Layers, 
  Calendar, 
  Check, 
  Clock, 
  AlertTriangle,
  Sparkles,
  BarChart2
} from 'lucide-react';

export default function ProductionLoggingPage() {
  const { user, factory } = useAuth();
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [selectedLine, setSelectedLine] = useState('EXT-01');
  const [selectedShift, setSelectedShift] = useState<ShiftName>('morning');
  const [targetCount, setTargetCount] = useState(1400);
  const [goodCount, setGoodCount] = useState(1280);
  const [scrapCount, setScrapCount] = useState(25);
  const [scrapReason, setScrapReason] = useState('فقاعات هواء وسماكة غير منتظمة');
  const [productionHistory, setProductionHistory] = useState<ProductionLog[]>(initialProductionLogs);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [currentDateStr, setCurrentDateStr] = useState('');

  useEffect(() => {
    setCurrentDateStr(new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US'));
  }, [isAr]);

  const totalProduced = goodCount + scrapCount;
  const scrapPercentage = totalProduced > 0 ? ((scrapCount / totalProduced) * 100).toFixed(1) : '0';
  const targetAttainment = targetCount > 0 ? Math.min(100, Math.round((goodCount / targetCount) * 100)) : 0;

  const handleLogProduction = (e: React.FormEvent) => {
    e.preventDefault();

    const newLog: ProductionLog = {
      id: `prod-${Date.now()}`,
      factory_id: factory?.id || 'fac-01',
      machine_id: '11111111-1111-1111-1111-111111111101',
      machine_name: selectedLine,
      supervisor_id: user?.id,
      shift_name: selectedShift,
      good_count: goodCount,
      scrap_count: scrapCount,
      log_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    };

    setProductionHistory((prev) => [newLog, ...prev]);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <AppLayout
      pageTitle={isAr ? 'تسجيل ومتابعة الإنتاج وتتبع الجودة' : 'Production Pacing & Quality Logging'}
      pageSubtitle={isAr 
        ? 'تسجيل كميات إنتاج كل ساعة، حصر القطع السليمة والهدر، وحساب معدلات الجودة الفعلية' 
        : 'Track hourly production pacing, log conforming vs scrap units, and monitor quality yields'}
      actionButton={
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400">
            {isAr ? 'مستهدف الصالة: 6,000 وحدة' : 'Shift Target: 6,000 units'}
          </span>
        </div>
      }
    >
      <div className="space-y-6">
        
        {savedSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg animate-bounce">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'تم اعتماد وحفظ دفعة الإنتاج بنجاح وتحديث معدل الـ OEE!' : 'Production batch submitted successfully and OEE updated!'}</span>
          </div>
        )}

        {/* Realtime Production Counters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: Good Units Counter */}
          <div className="p-5 rounded-2xl bg-[#0d121c] border-2 border-emerald-500/30 space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                {isAr ? 'القطع السليمة المطابقة (Good Units)' : 'Good Conforming Units'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold">
                Quality: {(100 - parseFloat(scrapPercentage)).toFixed(1)}%
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <button
                type="button"
                onClick={() => setGoodCount((prev) => Math.max(0, prev - 50))}
                className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-black flex items-center justify-center text-lg cursor-pointer"
              >
                <Minus className="w-5 h-5" />
              </button>

              <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                {goodCount.toLocaleString()}
              </span>

              <button
                type="button"
                onClick={() => setGoodCount((prev) => prev + 50)}
                className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black flex items-center justify-center text-lg cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] text-zinc-400 text-center">
              {isAr ? 'استخدم الأزرار للتعديل السريع بمقدار ±50 وحدة' : 'Quick increment/decrement by ±50 units'}
            </p>
          </div>

          {/* Card 2: Scrap & Defect Units Counter */}
          <div className="p-5 rounded-2xl bg-[#0d121c] border-2 border-rose-500/30 space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                {isAr ? 'الهدر والقطع المعيبة (Scrap Units)' : 'Scrap & Defective Units'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-mono font-bold">
                {scrapPercentage}% {isAr ? 'نسبة الهدر' : 'Defect Rate'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <button
                type="button"
                onClick={() => setScrapCount((prev) => Math.max(0, prev - 5))}
                className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-black flex items-center justify-center text-lg cursor-pointer"
              >
                <Minus className="w-5 h-5" />
              </button>

              <span className="text-3xl sm:text-4xl font-black text-rose-400 font-mono">
                {scrapCount.toLocaleString()}
              </span>

              <button
                type="button"
                onClick={() => setScrapCount((prev) => prev + 5)}
                className="w-10 h-10 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black flex items-center justify-center text-lg cursor-pointer shadow-lg shadow-rose-500/20"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] text-zinc-400 text-center">
              {isAr ? 'الحد المسموح للهدر في الوردية هو 2.0%' : 'Allowed shift scrap tolerance is 2.0%'}
            </p>
          </div>

          {/* Card 3: Target Attainment Pacing */}
          <div className="p-5 rounded-2xl bg-[#0d121c] border border-zinc-800 space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-bold">{isAr ? 'معدل تحقيق المستهدف' : 'Target Attainment'}</span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>

            <div className="text-center py-1">
              <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">
                {targetAttainment}%
              </span>
              <p className="text-xs text-zinc-400 mt-1">
                {goodCount} / {targetCount} {isAr ? 'وحدة من المستهدف' : 'units reached'}
              </p>
            </div>

            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-amber-400 h-full rounded-full transition-all duration-300" 
                style={{ width: `${targetAttainment}%` }} 
              />
            </div>
          </div>

        </div>

        {/* Batch Submission Form & Defect Analysis Panel */}
        <div className="neobrutal-card bg-[#0d121c] border-2 border-zinc-700 rounded-2xl p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-black text-white">
                {isAr ? 'اعتماد وتسجيل دفعة الإنتاج الحالية' : 'Submit Production Batch'}
              </h3>
            </div>
            <span className="text-xs text-zinc-400 font-mono">
              {currentDateStr || '2026-10-28'}
            </span>
          </div>

          <form onSubmit={handleLogProduction} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  {isAr ? 'خط الإنتاج أو الماكينة *' : 'Production Line *'}
                </label>
                <select
                  value={selectedLine}
                  onChange={(e) => setSelectedLine(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs sm:text-sm focus:border-amber-400 focus:outline-none"
                >
                  <option value="EXT-01">EXT-01 (خط البثق الرئيسي 01)</option>
                  <option value="INJ-02">INJ-02 (مكبس الحقن 02)</option>
                  <option value="THF-03">THF-03 (التشكيل الحراري 03)</option>
                  <option value="PKG-04">PKG-04 (خط التعبئة والتغليف 04)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  {isAr ? 'الوردية *' : 'Shift *'}
                </label>
                <select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs sm:text-sm focus:border-amber-400 focus:outline-none"
                >
                  <option value="morning">{isAr ? 'الوردية الصباحية (07:00 - 15:00)' : 'Morning Shift'}</option>
                  <option value="evening">{isAr ? 'الوردية المسائية (15:00 - 23:00)' : 'Evening Shift'}</option>
                  <option value="night">{isAr ? 'الوردية الليلية (23:00 - 07:00)' : 'Night Shift'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  {isAr ? 'المستهدف الاسمي (Target Quota) *' : 'Target Quota *'}
                </label>
                <input
                  type="number"
                  value={targetCount}
                  onChange={(e) => setTargetCount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs sm:text-sm focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                {isAr ? 'سبب الهدر الرئيسي (Pareto Defect Category)' : 'Primary Scrap Reason'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                {[
                  { id: 'bubbles', labelAr: 'فقاعات هواء وسماكة', labelEn: 'Air bubbles' },
                  { id: 'dimensions', labelAr: 'انحراف أبعاد وقوالب', labelEn: 'Dimensional defect' },
                  { id: 'burn', labelAr: 'تفحم وحروق بوليمر', labelEn: 'Polymer burn' },
                  { id: 'sealing', labelAr: 'عدم إحكام التغليف', labelEn: 'Improper seal' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setScrapReason(d.labelAr)}
                    className={`p-2 rounded-xl border text-xs font-medium transition cursor-pointer ${
                      scrapReason.includes(d.labelAr)
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {isAr ? d.labelAr : d.labelEn}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={scrapReason}
                onChange={(e) => setScrapReason(e.target.value)}
                placeholder={isAr ? 'ملاحظة تفصيلية لسبب الهدر...' : 'Detailed scrap note...'}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-8 py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-black text-sm flex items-center gap-2 transition cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <Check className="w-4 h-4" />
                <span>{isAr ? 'اعتماد وتسجيل دفعة الإنتاج في الصالة' : 'Submit & Commit Batch'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Historic Production Batches Table */}
        <div className="p-5 rounded-2xl bg-[#0d121c] border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'سجل دفعات الإنتاج المسجلة' : 'Shift Production Log History'}</span>
            </h3>
            <span className="text-xs text-zinc-500 font-mono">
              {productionHistory.length} {isAr ? 'دفعات معتمدة' : 'batches logged'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-bold">
                  <th className="py-2.5 px-3">{isAr ? 'الخط / الماكينة' : 'Line / Machine'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'الوردية' : 'Shift'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'الإنتاج السليم' : 'Good Count'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'الهدر / سكراب' : 'Scrap'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'معدل الجودة' : 'Quality Rate'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'التاريخ والوقت' : 'Logged At'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'الاعتماد' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {productionHistory.map((p) => {
                  const total = p.good_count + p.scrap_count;
                  const qRate = total > 0 ? (((p.good_count) / total) * 100).toFixed(1) : '100';

                  return (
                    <tr key={p.id} className="hover:bg-zinc-900/50 transition">
                      <td className="py-3 px-3 font-mono font-bold text-white">
                        {p.machine_name || 'EXT-01'}
                      </td>
                      <td className="py-3 px-3 text-zinc-300">
                        {p.shift_name === 'morning' ? (isAr ? 'الصباحية' : 'Morning') : (isAr ? 'المسائية' : 'Evening')}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                        {p.good_count.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono text-rose-400 font-semibold">
                        {p.scrap_count}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-white">
                        {qRate}%
                      </td>
                      <td className="py-3 px-3 text-zinc-400 font-mono text-[11px]">
                        {new Date(p.created_at).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                          {isAr ? 'معتمد' : 'Verified'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
