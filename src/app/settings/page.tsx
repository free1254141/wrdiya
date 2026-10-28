'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth, DEMO_PROFILES } from '@/contexts/AuthContext';
import {
  Settings,
  Building2,
  Cpu,
  Users,
  CreditCard,
  ShieldCheck,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Clock,
  Radio,
  Sliders,
  Sparkles,
  Zap
} from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { locale } = useLanguage();
  const { factory, user } = useAuth();
  const isAr = locale === 'ar';

  const [activeTab, setActiveTab] = useState<'profile' | 'lines' | 'team' | 'billing' | 'integrations'>('profile');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [plantName, setPlantName] = useState(factory?.name || (isAr ? 'مصنع النيل للبلاستيك المتطور' : 'Nile Polymer Plant'));
  const [plantCode, setPlantCode] = useState(factory?.code || 'FAC-CAI-01');
  const [industry, setIndustry] = useState(factory?.industry || 'البلاستيك والبوليمر');
  const [shiftModel, setShiftModel] = useState('3x8');
  const [targetOEE, setTargetOEE] = useState('85');

  // Lines & Machines state
  const [lines, setLines] = useState([
    { id: 'L-01', name: isAr ? 'خط 1: البثق وسحب الخامات' : 'Line 1: Extrusion & Feeding', code: 'EXT-LINE', machinesCount: 1, status: 'active' },
    { id: 'L-02', name: isAr ? 'خط 2: الحقن والتشكيل الحراري' : 'Line 2: Injection & Thermoforming', code: 'INJ-LINE', machinesCount: 2, status: 'active' },
    { id: 'L-03', name: isAr ? 'خط 3: الفحص والتعبئة الآلية' : 'Line 3: Quality & Packaging', code: 'PKG-LINE', machinesCount: 1, status: 'active' },
  ]);

  const [machines, setMachines] = useState([
    { id: 'm-01', code: 'EXT-01', name: isAr ? 'وحدة البثق الرئيسية' : 'Main Extruder', line: 'EXT-LINE', speed: '1,400 u/h', cycleTime: '2.5s' },
    { id: 'm-02', code: 'INJ-02', name: isAr ? 'مكبس الحقن الهيدروليكي' : 'Hydraulic Injection Press', line: 'INJ-LINE', speed: '950 u/h', cycleTime: '3.8s' },
    { id: 'm-03', code: 'THF-03', name: isAr ? 'وحدة التشكيل الحراري' : 'Thermoformer Unit', line: 'INJ-LINE', speed: '1,100 u/h', cycleTime: '3.2s' },
    { id: 'm-04', code: 'PKG-04', name: isAr ? 'خط التعبئة والتغليف الآلي' : 'Automated Packing Unit', line: 'PKG-LINE', speed: '2,200 u/h', cycleTime: '1.6s' },
  ]);

  const [newLineName, setNewLineName] = useState('');
  const [newLineCode, setNewLineCode] = useState('');
  const [showAddLineModal, setShowAddLineModal] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddLine = () => {
    if (!newLineName.trim()) return;
    const code = newLineCode.trim() || `LINE-${lines.length + 1}`;
    setLines([...lines, { id: `L-0${lines.length + 1}`, name: newLineName, code, machinesCount: 0, status: 'active' }]);
    setNewLineName('');
    setNewLineCode('');
    setShowAddLineModal(false);
  };

  return (
    <AppLayout
      pageTitle={isAr ? 'إعدادات المنشأة والخطوط' : 'Plant Settings & Configuration'}
      pageSubtitle={isAr ? 'تهيئة بيانات المصنع، خطوط الإنتاج، صلاحيات الفريق، والربط البرمجي' : 'Configure facility profile, production lines, team permissions and integrations'}
      actionButton={
        <button
          type="button"
          onClick={handleSaveSettings}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs shadow transition cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{isAr ? 'حفظ التعديلات' : 'Save Changes'}</span>
        </button>
      }
    >
      <div className="space-y-6">
        
        {/* Success Alert */}
        {saveSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-bold text-sm">
              {isAr ? 'تم حفظ وتحديث إعدادات المنشأة بنجاح!' : 'Facility settings updated successfully!'}
            </span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto">
          {[
            { id: 'profile', label: isAr ? '🏢 ملف المنشأة' : '🏢 Facility Profile', icon: Building2 },
            { id: 'lines', label: isAr ? '🏭 خطوط الإنتاج والماكينات' : '🏭 Lines & Machinery', icon: Cpu },
            { id: 'team', label: isAr ? '👥 الفريق والصلاحيات' : '👥 Team & Permissions', icon: Users },
            { id: 'billing', label: isAr ? '💳 الاشتراك والفوترة' : '💳 Subscription & Billing', icon: CreditCard },
            { id: 'integrations', label: isAr ? '🔌 الربط البرمجي السحابي' : '🔌 Cloud & Database', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-zinc-950 shadow'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: FACILITY PROFILE */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>{isAr ? 'بيانات المنشأة الرئيسية' : 'Primary Facility Details'}</span>
              </h3>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  {isAr ? 'اسم المصنع أو الشركة' : 'Plant / Company Name'}
                </label>
                <input
                  type="text"
                  value={plantName}
                  onChange={(e) => setPlantName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  {isAr ? 'كود المنشأة التعريفي' : 'Plant Code'}
                </label>
                <input
                  type="text"
                  value={plantCode}
                  onChange={(e) => setPlantCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-sm text-white font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  {isAr ? 'القطاع الصناعي' : 'Industrial Sector'}
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-sm text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="البلاستيك والبوليمر">{isAr ? 'البلاستيك والبوليمر' : 'Plastics & Polymers'}</option>
                  <option value="الصناعات الغذائية والمشروبات">{isAr ? 'الصناعات الغذائية والمشروبات' : 'Food & Beverages'}</option>
                  <option value="الغزل والنسيج">{isAr ? 'الغزل والنسيج' : 'Textiles & Garments'}</option>
                  <option value="الصناعات الهندسية والمعدنية">{isAr ? 'الصناعات الهندسية والمعدنية' : 'Engineering & Metal'}</option>
                  <option value="الصناعات الكيماوية والدوائية">{isAr ? 'الصناعات الكيماوية والدوائية' : 'Chemical & Pharma'}</option>
                </select>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{isAr ? 'نظام الورديات ومؤشرات الأداء' : 'Shift Model & OEE Targets'}</span>
              </h3>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  {isAr ? 'نظام الورديات التشغيلي' : 'Shift Schedule Pattern'}
                </label>
                <select
                  value={shiftModel}
                  onChange={(e) => setShiftModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-sm text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="3x8">{isAr ? '3 ورديات × 8 ساعات (تغطية 24/7)' : '3 Shifts × 8 Hours (Continuous 24/7)'}</option>
                  <option value="2x12">{isAr ? 'ورديتان × 12 ساعة' : '2 Shifts × 12 Hours'}</option>
                  <option value="1x8">{isAr ? 'وردية واحدة نهارية (8 ساعات)' : 'Single Day Shift (8 Hours)'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  {isAr ? 'مستهدف OEE المعياري للمصنع (%)' : 'Target OEE Threshold (%)'}
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={targetOEE}
                  onChange={(e) => setTargetOEE(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-sm text-white font-mono focus:border-amber-400 focus:outline-none"
                />
                <span className="text-[11px] text-zinc-500 mt-1 block">
                  {isAr ? 'المعيار العالمي World Class OEE هو 85%' : 'World Class OEE benchmark is typically 85%'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs text-zinc-400">
                <span className="font-bold text-zinc-200 block mb-1">
                  {isAr ? 'مواعيد الورديات التلقائية' : 'Shift Schedule Hours'}
                </span>
                <ul className="space-y-1 text-[11px] font-mono">
                  <li>🌅 {isAr ? 'الصباحية' : 'Morning'}: 07:00 - 15:00</li>
                  <li>🌆 {isAr ? 'المسائية' : 'Evening'}: 15:00 - 23:00</li>
                  <li>🌙 {isAr ? 'الليلية' : 'Night'}: 23:00 - 07:00</li>
                </ul>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: LINES & MACHINERY */}
        {activeTab === 'lines' && (
          <div className="space-y-6">
            
            {/* Lines section */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>{isAr ? 'خطوط الإنتاج المسجلة' : 'Production Lines'}</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {isAr ? 'الخطوط النشطة في صالة المصنع لتسكين العمال وتتبع الإنتاج' : 'Active plant lines for roster assignment & pacing'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddLineModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700 text-xs font-bold transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAr ? 'إضافة خط إنتاج' : 'Add Line'}</span>
                </button>
              </div>

              {/* Add line inline modal */}
              {showAddLineModal && (
                <div className="mb-4 p-4 rounded-xl bg-zinc-950 border border-amber-500/30 flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="text"
                    placeholder={isAr ? 'اسم الخط (مثال: خط التعبئة 4)' : 'Line Name'}
                    value={newLineName}
                    onChange={(e) => setNewLineName(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder={isAr ? 'الكود (مثال: PKG-04)' : 'Code (e.g. PKG-04)'}
                    value={newLineCode}
                    onChange={(e) => setNewLineCode(e.target.value)}
                    className="w-36 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white font-mono"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddLine}
                      className="px-3 py-2 rounded-lg bg-amber-500 text-zinc-950 font-bold text-xs"
                    >
                      {isAr ? 'إضافة' : 'Add'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddLineModal(false)}
                      className="px-3 py-2 rounded-lg bg-zinc-800 text-zinc-400 text-xs"
                    >
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="p-3">{isAr ? 'كود الخط' : 'Line Code'}</th>
                      <th className="p-3">{isAr ? 'اسم الخط' : 'Line Name'}</th>
                      <th className="p-3">{isAr ? 'الماكينات' : 'Machines'}</th>
                      <th className="p-3">{isAr ? 'الحالة' : 'Status'}</th>
                      <th className="p-3 text-left">{isAr ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-sans">
                    {lines.map((l) => (
                      <tr key={l.id} className="hover:bg-zinc-800/30">
                        <td className="p-3 font-mono font-bold text-amber-400">{l.code}</td>
                        <td className="p-3 font-medium text-white">{l.name}</td>
                        <td className="p-3 text-zinc-300">{l.machinesCount} {isAr ? 'ماكينات' : 'Units'}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            {isAr ? 'نشط' : 'Active'}
                          </span>
                        </td>
                        <td className="p-3 text-left">
                          <button
                            type="button"
                            onClick={() => setLines(lines.filter(item => item.id !== l.id))}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/30 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Machines section */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-amber-400" />
                    <span>{isAr ? 'أصول الماكينات والمعدات' : 'Machinery & Station Assets'}</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {isAr ? 'تحديد السرعة الاسمية وزمن الدورة لكل ماكينة لحساب الـ OEE بدقة' : 'Nominal speed & ideal cycle time for OEE calculations'}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="p-3">{isAr ? 'كود الماكينة' : 'Machine Code'}</th>
                      <th className="p-3">{isAr ? 'اسم المعدة' : 'Description'}</th>
                      <th className="p-3">{isAr ? 'الخط التابع' : 'Line'}</th>
                      <th className="p-3">{isAr ? 'السرعة القياسية' : 'Rated Speed'}</th>
                      <th className="p-3">{isAr ? 'زمن الدورة (Ideal Cycle)' : 'Cycle Time'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-sans">
                    {machines.map((m) => (
                      <tr key={m.id} className="hover:bg-zinc-800/30">
                        <td className="p-3 font-mono font-bold text-white">{m.code}</td>
                        <td className="p-3 text-zinc-200">{m.name}</td>
                        <td className="p-3 font-mono text-zinc-400">{m.line}</td>
                        <td className="p-3 font-mono text-amber-400">{m.speed}</td>
                        <td className="p-3 font-mono text-emerald-400">{m.cycleTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: TEAM & PERMISSIONS */}
        {activeTab === 'team' && (
          <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>{isAr ? 'فريق العمل وحسابات النظام' : 'Factory Accounts & Access'}</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {isAr ? 'إدارة المشرفين والفنيين والمهندسين المسجلين بالمصنع' : 'Supervisors, technicians, operators and plant engineers'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.values(DEMO_PROFILES).map((profile) => (
                <div key={profile.id} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xl">
                        {profile.avatar}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-white block truncate">{profile.name}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">{profile.email}</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        {profile.role.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-500">
                    ID: {profile.id}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: BILLING */}
        {activeTab === 'billing' && (
          <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-400" />
                  <span>{isAr ? 'خطة الاشتراك الحالية' : 'Active Subscription'}</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {isAr ? 'تفاصيل باقة المصنع والدفع المعتمد عبر بايبال (PayPal)' : 'Plant subscription tier and PayPal billing integration'}
                </p>
              </div>

              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black">
                ● {isAr ? 'اشتراك مفعل' : 'Active Plan'}
              </span>
            </div>

            <div className="p-5 rounded-xl bg-gradient-to-r from-amber-500/15 via-zinc-950 to-zinc-950 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider block mb-1">
                  ENTERPRISE INDUSTRIAL TIER
                </span>
                <h4 className="text-lg font-black text-white">
                  {isAr ? 'الباقة الصناعية المتكاملة (غير محدودة)' : 'Full Industrial Plant Enterprise'}
                </h4>
                <p className="text-xs text-zinc-400 mt-1">
                  {isAr ? 'خطوط إنتاج غير محدودة • كشوف عمال غير محدودة • مساعد الذكاء الاصطناعي • شاشات Andon TV' : 'Unlimited lines, unlimited workers, AI Copilot, Andon TV full access'}
                </p>
              </div>

              <Link
                href="/pricing"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition shadow shrink-0"
              >
                {isAr ? 'إدارة الاشتراك والترقية' : 'Manage Subscription'}
              </Link>
            </div>
          </div>
        )}

        {/* TAB 5: INTEGRATIONS */}
        {activeTab === 'integrations' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Supabase Status */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Supabase Cloud PostgreSQL</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                  Connected
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {isAr
                  ? 'قاعدة البيانات السحابية المركزية المأمنة بمفاتيح البيئة مع تشفير كامل للجلسات والبيانات.'
                  : 'Encrypted cloud relational storage secured via environment variables.'}
              </p>
              <div className="text-[11px] font-mono text-zinc-500 pt-2 border-t border-zinc-800">
                Host: csuifvyghfsibkrnxrby.supabase.co
              </div>
            </div>

            {/* AI Engine Status */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Wrdya AI Edge Engine</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                  Active
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {isAr
                  ? 'محرك المعالجة الصناعي الموضعي لتوزيع العمال، فك شفرات الـ Whiteboard، وتوليد إجراءات الصيانة.'
                  : 'Autonomous operational parser for rosters, whiteboards and machine SOP troubleshooting.'}
              </p>
              <div className="text-[11px] font-mono text-zinc-500 pt-2 border-t border-zinc-800">
                Latency: &lt; 200ms • Zero External Token Bills
              </div>
            </div>

          </div>
        )}

      </div>
    </AppLayout>
  );
}
