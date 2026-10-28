'use client';

import React, { useState } from 'react';
import { Machine, ShiftName } from '@/lib/types';
import { Locale, translations } from '@/lib/i18n';
import { Layers, Save, CheckCircle, Percent, BarChart3, Clock, Sparkles } from 'lucide-react';

interface SupervisorProductionCardProps {
  machines: Machine[];
  locale: Locale;
  onSaveProduction: (entries: Array<{ machine_id: string; good: number; scrap: number; shift: ShiftName }>) => void;
}

export default function SupervisorProductionCard({
  machines,
  locale,
  onSaveProduction,
}: SupervisorProductionCardProps) {
  const isAr = locale === 'ar';
  const t = translations[locale];
  const [selectedShift, setSelectedShift] = useState<ShiftName>('morning');
  const [productionData, setProductionData] = useState<Record<string, { good: number; scrap: number }>>(
    () => {
      const initial: Record<string, { good: number; scrap: number }> = {};
      machines.forEach((m, idx) => {
        initial[m.id] = { 
          good: idx === 0 ? 1420 : idx === 1 ? 840 : idx === 2 ? 2150 : 1200, 
          scrap: idx === 0 ? 18 : idx === 1 ? 42 : idx === 2 ? 12 : 25 
        };
      });
      return initial;
    }
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleInputChange = (machineId: string, field: 'good' | 'scrap', value: number) => {
    setProductionData((prev) => ({
      ...prev,
      [machineId]: {
        ...prev[machineId],
        [field]: Math.max(0, value || 0),
      },
    }));
  };

  const handleSaveAll = () => {
    const entries = machines.map((m) => ({
      machine_id: m.id,
      good: productionData[m.id]?.good || 0,
      scrap: productionData[m.id]?.scrap || 0,
      shift: selectedShift,
    }));
    onSaveProduction(entries);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const totalGood = Object.values(productionData).reduce((sum, item) => sum + (item.good || 0), 0);
  const totalScrap = Object.values(productionData).reduce((sum, item) => sum + (item.scrap || 0), 0);
  const scrapRate = totalGood + totalScrap > 0 ? ((totalScrap / (totalGood + totalScrap)) * 100).toFixed(1) : '0';

  return (
    <div className="neobrutal-card rounded-2xl p-5 border-2 border-zinc-700 bg-[#0d121c]">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">
              {isAr ? 'اعتماد إنتاج الورديات ومعدل OEE' : 'Shift Output Signoff & OEE Verification'}
            </h3>
            <p className="text-xs text-zinc-400">
              {isAr ? 'إدخال أرقام نهاية الوردية لحساب الكفاءة وتحديث الداشبورد' : 'Finalize shift production numbers to compute plant efficiency'}
            </p>
          </div>
        </div>

        {/* Shift selector pills */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setSelectedShift('morning')}
            className={`px-3 py-1.5 rounded-lg transition ${
              selectedShift === 'morning'
                ? 'bg-amber-500 text-black shadow-sm font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {isAr ? 'صباحية (07-15)' : 'Morning'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedShift('evening')}
            className={`px-3 py-1.5 rounded-lg transition ${
              selectedShift === 'evening'
                ? 'bg-amber-500 text-black shadow-sm font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {isAr ? 'مسائية (15-23)' : 'Evening'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedShift('night')}
            className={`px-3 py-1.5 rounded-lg transition ${
              selectedShift === 'night'
                ? 'bg-amber-500 text-black shadow-sm font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {isAr ? 'ليلية (23-07)' : 'Night'}
          </button>
        </div>
      </div>

      {/* Real-time KPI summary bar */}
      <div className="grid grid-cols-3 gap-3 mb-4 p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
        <div>
          <span className="block text-[10px] text-zinc-400 font-bold">{isAr ? 'إجمالي المطابق' : 'Total Conforming'}</span>
          <span className="font-mono text-lg font-black text-emerald-400">{totalGood.toLocaleString()}</span>
        </div>
        <div>
          <span className="block text-[10px] text-zinc-400 font-bold">{isAr ? 'إجمالي الهدر (Scrap)' : 'Total Scrap'}</span>
          <span className="font-mono text-lg font-black text-rose-400">{totalScrap.toLocaleString()}</span>
        </div>
        <div>
          <span className="block text-[10px] text-zinc-400 font-bold">{isAr ? 'معدل الهدر العام' : 'Scrap Rate'}</span>
          <span className="font-mono text-lg font-black text-amber-400">{scrapRate}%</span>
        </div>
      </div>

      {/* Machine-by-Machine Grid Inputs */}
      <div className="space-y-2.5 mb-4">
        {machines.map((m) => {
          const goodVal = productionData[m.id]?.good || 0;
          const scrapVal = productionData[m.id]?.scrap || 0;
          return (
            <div
              key={m.id}
              className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-white">
                  {m.code}
                </span>
                <span className="text-xs font-bold text-zinc-200">{m.name.split('(')[0]}</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-zinc-400">{isAr ? 'مطابق:' : 'Good:'}</span>
                  <input
                    type="number"
                    value={goodVal}
                    onChange={(e) => handleInputChange(m.id, 'good', parseInt(e.target.value))}
                    className="w-20 px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-700 text-emerald-400 font-mono font-bold text-xs text-center focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-zinc-400">{isAr ? 'هدر:' : 'Scrap:'}</span>
                  <input
                    type="number"
                    value={scrapVal}
                    onChange={(e) => handleInputChange(m.id, 'scrap', parseInt(e.target.value))}
                    className="w-16 px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-700 text-rose-400 font-mono font-bold text-xs text-center focus:border-amber-400"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleSaveAll}
        className="w-full neobrutal-btn py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center justify-center gap-2 transition"
      >
        {savedSuccess ? (
          <>
            <CheckCircle className="w-4 h-4 text-emerald-300" />
            <span>{isAr ? 'تم حفظ واعتماد إنتاج الوردية بنجاح!' : 'Shift Production Approved Successfully!'}</span>
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            <span>{isAr ? 'اعتماد وتوثيق بيانات الإنتاج الرسمية للوردية' : 'Authorize Official Shift Production Signoff'}</span>
          </>
        )}
      </button>
    </div>
  );
}
