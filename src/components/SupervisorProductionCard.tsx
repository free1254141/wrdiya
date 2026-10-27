'use client';

import React, { useState } from 'react';
import { Machine, ShiftName } from '@/lib/types';
import { Locale, translations } from '@/lib/i18n';
import { Layers, Save, CheckCircle, Percent, BarChart3 } from 'lucide-react';

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
  const t = translations[locale];
  const [selectedShift, setSelectedShift] = useState<ShiftName>('morning');
  const [productionData, setProductionData] = useState<Record<string, { good: number; scrap: number }>>(
    () => {
      const initial: Record<string, { good: number; scrap: number }> = {};
      machines.forEach((m) => {
        initial[m.id] = { good: 1500, scrap: 35 };
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

  // Compute total good and scrap
  const totalGood = Object.values(productionData).reduce((sum, item) => sum + (item.good || 0), 0);
  const totalScrap = Object.values(productionData).reduce((sum, item) => sum + (item.scrap || 0), 0);
  const scrapRate = totalGood + totalScrap > 0 ? ((totalScrap / (totalGood + totalScrap)) * 100).toFixed(1) : '0';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md mb-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {t.supervisor.action_production}
            </h3>
            <span className="text-[11px] text-slate-400">
              تسجيل مخرجات جميع الماكينات لحساب مؤشر الجودة و OEE
            </span>
          </div>
        </div>

        {/* Shift selector */}
        <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-700 text-xs text-white">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <select
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value as ShiftName)}
            className="bg-transparent font-medium focus:outline-none cursor-pointer text-slate-200"
          >
            <option value="morning" className="bg-slate-900 text-white">{t.shifts.morning}</option>
            <option value="evening" className="bg-slate-900 text-white">{t.shifts.evening}</option>
            <option value="night" className="bg-slate-900 text-white">{t.shifts.night}</option>
          </select>
        </div>
      </div>

      {/* Machine Production Table */}
      <div className="space-y-2.5 mb-4">
        {machines.map((m) => {
          const good = productionData[m.id]?.good || 0;
          const scrap = productionData[m.id]?.scrap || 0;
          const machineScrapPercent = good + scrap > 0 ? ((scrap / (good + scrap)) * 100).toFixed(1) : '0';

          return (
            <div
              key={m.id}
              className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-2 min-w-[160px]">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <div>
                  <span className="text-xs font-bold text-slate-200 block truncate max-w-[180px]">
                    {m.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {m.code}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Good count input */}
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">
                    {t.supervisor.good_units}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={good}
                    onChange={(e) => handleInputChange(m.id, 'good', parseInt(e.target.value) || 0)}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-blue-400"
                  />
                </div>

                {/* Scrap count input */}
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">
                    {t.supervisor.scrap_units}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={scrap}
                    onChange={(e) => handleInputChange(m.id, 'scrap', parseInt(e.target.value) || 0)}
                    className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-red-300 font-mono focus:outline-none focus:border-red-400"
                  />
                </div>

                {/* Scrap % badge */}
                <div className="text-right min-w-[50px]">
                  <span className="block text-[10px] text-slate-400">الهدر:</span>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {machineScrapPercent}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary & Save Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-slate-400">إجمالي السليم: </span>
            <span className="font-mono font-bold text-emerald-400">{totalGood.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-400">إجمالي الهدر: </span>
            <span className="font-mono font-bold text-red-400">{totalScrap.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-400">نسبة الهدر: </span>
            <span className="font-mono font-bold text-amber-400">{scrapRate}%</span>
          </div>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={savedSuccess}
          className={`py-2 px-5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition ${
            savedSuccess
              ? 'bg-emerald-600 text-white'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 active:scale-95'
          }`}
        >
          {savedSuccess ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>تم الحفظ بنجاح!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{t.supervisor.save_production}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
