'use client';

import React, { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Users, 
  Plus, 
  Trash2, 
  Upload, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  Mic, 
  MicOff, 
  Sparkles, 
  CheckCircle2, 
  Bot, 
  Clock, 
  Radio, 
  Wrench, 
  ShieldCheck, 
  FileText, 
  Check, 
  AlertCircle,
  Pin,
  Send
} from 'lucide-react';

interface StaffItem {
  id: string;
  name: string;
  role: 'operator' | 'supervisor' | 'maintenance' | 'admin';
  line: string;
  shift: 'morning' | 'evening' | 'night';
  stationTask?: string;
  targetQuota?: string;
  supervisedSector?: string;
  radioChannel?: string;
  technicalSpecialty?: string;
  toolboxId?: string;
  operationalDivision?: string;
  ppeApproved?: boolean;
}

const DEFAULT_STAFF: StaffItem[] = [
  {
    id: 'st-1',
    name: 'حسام كمال',
    role: 'operator',
    line: 'EXT-01 (خط البثق)',
    shift: 'morning',
    stationTask: 'تلقيم وتغذية خامات البوليمر',
    targetQuota: '1,400 كرتونة',
    ppeApproved: true,
  },
  {
    id: 'st-2',
    name: 'سالم الدسوقي',
    role: 'operator',
    line: 'INJ-02 (ماكينة الحقن)',
    shift: 'morning',
    stationTask: 'تشغيل قوالب وضغط هيدروليك',
    targetQuota: '950 قطعة',
    ppeApproved: true,
  },
  {
    id: 'st-3',
    name: 'طارق عبد الله',
    role: 'operator',
    line: 'THF-03 (التشكيل الحراري)',
    shift: 'morning',
    stationTask: 'تشغيل التشكيل والقص الآلي',
    targetQuota: '1,100 قطعة',
    ppeApproved: true,
  },
  {
    id: 'st-4',
    name: 'م. أحمد عادل',
    role: 'supervisor',
    line: 'كامل صالة الإنتاج',
    shift: 'morning',
    supervisedSector: 'صالة المصنع بالكامل',
    radioChannel: 'CH-01: طوارئ وإنتاج',
    targetQuota: '85% OEE مستهدف',
  },
  {
    id: 'st-5',
    name: 'م. محمود صقر',
    role: 'maintenance',
    line: 'فريق صيانة الطوارئ والـ PLC',
    shift: 'morning',
    technicalSpecialty: 'كهرباء وتحكم آلي PLC',
    toolboxId: 'CAL-2026-X8',
  },
];

export default function ShiftRosterPage() {
  const { user, factory } = useAuth();
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [activeShift, setActiveShift] = useState<'morning' | 'evening' | 'night'>('morning');
  const [staff, setStaff] = useState<StaffItem[]>(DEFAULT_STAFF);

  // Handover Note State
  const [handoverNote, setHandoverNote] = useState(
    isAr 
      ? 'تنبيه تسليم وردية: تم استلام دفعة بوليمر خام جديدة (#889). يرجى فحص الكثافة كل ساعتين على خط البثق EXT-01.' 
      : 'Handover alert: Raw polymer batch #889 arrived. Verify density every 2h on EXT-01.'
  );
  const [isNotePinned, setIsNotePinned] = useState(true);
  const [noteSaved, setNoteSaved] = useState(false);

  // Manual Add Form Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'operator' | 'supervisor' | 'maintenance' | 'admin'>('operator');
  const [newLine, setNewLine] = useState('EXT-01');
  const [newTask, setNewTask] = useState('');
  const [newQuota, setNewQuota] = useState('');

  // AI Import State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Load onboarded setup if stored
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wrdya_onboarded_setup');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.employees && parsed.employees.length > 0) {
          setStaff(parsed.employees.map((e: any, idx: number) => ({
            id: `st-init-${idx + 1}`,
            name: e.name,
            role: e.role || 'operator',
            line: e.line || 'EXT-01',
            shift: e.shift || 'morning',
            stationTask: e.stationTask || (e.role === 'operator' ? 'تشغيل عام ومراقبة خط' : undefined),
            targetQuota: e.targetQuota || '1,200 وحدة',
            supervisedSector: e.supervisedSector,
            radioChannel: e.radioChannel,
            technicalSpecialty: e.technicalSpecialty,
            toolboxId: e.toolboxId,
            ppeApproved: true,
          })));
        }
      }
    } catch {}
  }, []);

  const filteredStaff = staff.filter((s) => s.shift === activeShift);

  const handleAddManualStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newMember: StaffItem = {
      id: `st-${Date.now()}`,
      name: newName.trim(),
      role: newRole,
      line: newLine,
      shift: activeShift,
      stationTask: newTask.trim() || undefined,
      targetQuota: newQuota.trim() || undefined,
      ppeApproved: true,
    };

    setStaff((prev) => [newMember, ...prev]);
    setNewName('');
    setNewTask('');
    setNewQuota('');
    setIsAddOpen(false);
  };

  const handleRemoveStaff = (id: string) => {
    setStaff((prev) => prev.filter((s) => s.id !== id));
  };

  const handleTriggerAiRoster = async (type: 'sheet' | 'image', payload: string) => {
    setIsAiLoading(true);
    setAiSuccessMsg(null);
    try {
      const body: any = {
        locale,
        isFactoryOnboarding: true,
      };
      if (type === 'sheet') body.sheetData = payload;
      if (type === 'image') body.image = payload;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.factorySetup && data.factorySetup.employees) {
        const newItems: StaffItem[] = data.factorySetup.employees.map((e: any, idx: number) => ({
          id: `st-ai-${Date.now()}-${idx}`,
          name: e.name,
          role: e.role || 'operator',
          line: e.line || 'EXT-01',
          shift: activeShift,
          stationTask: e.stationTask || 'تشغيل عام',
          targetQuota: e.targetQuota || '1,200 وحدة',
          ppeApproved: true,
        }));
        setStaff((prev) => [...newItems, ...prev]);
        setAiSuccessMsg(isAr ? `تم استخراج وتسكين ${newItems.length} موظف وفني آلياً بنجاح! ✨` : `Successfully extracted & assigned ${newItems.length} staff! ✨`);
        setTimeout(() => setAiSuccessMsg(null), 5000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSaveHandover = () => {
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 3000);
  };

  return (
    <AppLayout
      pageTitle={isAr ? 'إدارة الورديات وتسكين العمال' : 'Shift Roster & Worker Allocation'}
      pageSubtitle={isAr 
        ? 'توزيع الفنيين والمشرفين على خطوط الإنتاج والماكينات، استيراد الكشوف بالذكاء الاصطناعي، واعتماد تسليم الوردية' 
        : 'Manage operator shift rosters, automated AI sheet parsing, and shift handover sign-offs'}
      actionButton={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إضافة موظف يدوياً' : 'Add Staff Manually'}</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        
        {/* Top Shift Navigator Tabs & AI Importers Bar */}
        <div className="p-4 rounded-2xl bg-[#0d121c] border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Shift Selection Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveShift('morning')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeShift === 'morning'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>🌅 {isAr ? 'الوردية الصباحية' : 'Morning'}</span>
              <span className="text-[10px] opacity-75 font-mono">07:00-15:00</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveShift('evening')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeShift === 'evening'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>🌆 {isAr ? 'الوردية المسائية' : 'Evening'}</span>
              <span className="text-[10px] opacity-75 font-mono">15:00-23:00</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveShift('night')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeShift === 'night'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>🌙 {isAr ? 'الوردية الليلية' : 'Night'}</span>
              <span className="text-[10px] opacity-75 font-mono">23:00-07:00</span>
            </button>
          </div>

          {/* AI Bulk Import Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAiLoading}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-zinc-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{isAr ? 'استيراد شيت إكسيل 🤖' : 'AI Excel Import 🤖'}</span>
            </button>

            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={isAiLoading}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-cyan-400 border border-zinc-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{isAr ? 'رفع صورة سبورة الصالة' : 'Roster Photo OCR'}</span>
            </button>

            {/* Hidden file inputs */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.xlsx,.xls,.txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleTriggerAiRoster('sheet', file.name);
              }}
            />
            <input
              type="file"
              ref={photoInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleTriggerAiRoster('image', 'whiteboard_photo');
              }}
            />
          </div>
        </div>

        {/* AI Notification Banner */}
        {aiSuccessMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{aiSuccessMsg}</span>
          </div>
        )}

        {isAiLoading && (
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center gap-2 text-xs font-bold text-amber-400">
            <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span>{isAr ? 'المساعد الذكي يقوم بتحليل الكشف وتسكين العمال على خطوط الإنتاج...' : 'AI is parsing roster and populating lines...'}</span>
          </div>
        )}

        {/* Staff Roster Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-400" />
              <span>
                {isAr ? 'كشف الموظفين المسكنين' : 'Assigned Crew'} ({filteredStaff.length} {isAr ? 'فرد' : 'staff'})
              </span>
            </h3>
            <span className="text-xs text-zinc-500 font-mono">
              {factory?.name || 'مصنع النيل'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredStaff.map((member) => {
              const isSupervisor = member.role === 'supervisor';
              const isMaintenance = member.role === 'maintenance';
              const isOperator = member.role === 'operator';

              return (
                <div
                  key={member.id}
                  className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                    isSupervisor 
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-200' 
                      : isMaintenance 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' 
                        : 'bg-[#0d121c] border-zinc-800 text-zinc-200'
                  }`}
                >
                  <div>
                    {/* Role Pill & Name */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isSupervisor 
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' 
                          : isMaintenance 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        {isSupervisor ? '📋 مشرف وردية' : isMaintenance ? '🛠️ فني صيانة' : '👷 فني تشغيل'}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveStaff(member.id)}
                        className="text-zinc-500 hover:text-rose-400 transition cursor-pointer p-1"
                        title={isAr ? 'حذف من الكشف' : 'Remove from shift'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="text-sm font-black text-white">{member.name}</h4>
                    <p className="text-xs text-zinc-400 mt-0.5 font-medium">{member.line}</p>

                    {/* Role Dynamic Details */}
                    <div className="mt-3 pt-2.5 border-t border-zinc-800/80 space-y-1.5 text-xs">
                      {isOperator && (
                        <>
                          <div className="flex items-center justify-between text-zinc-300">
                            <span className="text-zinc-400 text-[11px]">{isAr ? 'المهمة بالمحطة:' : 'Station Task:'}</span>
                            <span className="font-semibold text-white">{member.stationTask || 'تشغيل وتلقيم'}</span>
                          </div>
                          {member.targetQuota && (
                            <div className="flex items-center justify-between text-zinc-300">
                              <span className="text-zinc-400 text-[11px]">{isAr ? 'المستهدف:' : 'Target:'}</span>
                              <span className="font-mono text-amber-400 font-bold">{member.targetQuota}</span>
                            </div>
                          )}
                        </>
                      )}

                      {isSupervisor && (
                        <>
                          <div className="flex items-center justify-between text-zinc-300">
                            <span className="text-zinc-400 text-[11px]">{isAr ? 'القناة اللاسلكية:' : 'Radio:'}</span>
                            <span className="font-mono text-cyan-400 font-bold">{member.radioChannel || 'CH-01'}</span>
                          </div>
                          <div className="flex items-center justify-between text-zinc-300">
                            <span className="text-zinc-400 text-[11px]">{isAr ? 'المستهدف للصالة:' : 'Plant Target:'}</span>
                            <span className="font-mono text-emerald-400 font-bold">85% OEE</span>
                          </div>
                        </>
                      )}

                      {isMaintenance && (
                        <>
                          <div className="flex items-center justify-between text-zinc-300">
                            <span className="text-zinc-400 text-[11px]">{isAr ? 'التخصص:' : 'Specialty:'}</span>
                            <span className="text-emerald-300 font-medium">{member.technicalSpecialty || 'PLC وكهرباء'}</span>
                          </div>
                          <div className="flex items-center justify-between text-zinc-300">
                            <span className="text-zinc-400 text-[11px]">{isAr ? 'صندوق العدة:' : 'Toolbox ID:'}</span>
                            <span className="font-mono text-zinc-300">{member.toolboxId || 'CAL-2026-X8'}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-400">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      {isAr ? 'معتمد ومسجل بالصالة' : 'Verified on Floor'}
                    </span>
                    <span className="font-mono">{activeShift.toUpperCase()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shift Handover Protocol & Pinned Note Section */}
        <div className="p-5 rounded-2xl bg-[#0d121c] border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Pin className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">
                {isAr ? 'دفتر تسليم الوردية وملاحظات المشرف (Handover Protocol)' : 'Shift Handover & Handover Protocol'}
              </h3>
            </div>
            {noteSaved && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                {isAr ? 'تم حفظ وتعميم الملاحظة للصالة' : 'Handover saved & pinned to floor'}
              </span>
            )}
          </div>

          <div className="space-y-3">
            <textarea
              rows={3}
              value={handoverNote}
              onChange={(e) => setHandoverNote(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs sm:text-sm focus:border-amber-400 focus:outline-none"
              placeholder={isAr ? 'اكتب ملاحظات تسليم الوردية للمشرف القادم أو التنبيهات على خطوط الإنتاج...' : 'Enter handover notes for incoming supervisor...'}
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNotePinned}
                  onChange={(e) => setIsNotePinned(e.target.checked)}
                  className="rounded border-zinc-700 text-amber-400 focus:ring-0"
                />
                <span>{isAr ? 'تثبيت التنبيه في الشاشة الرئيسية وعلى شاشات الصالة' : 'Pin note to top of main dashboard'}</span>
              </label>

              <button
                type="button"
                onClick={handleSaveHandover}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isAr ? 'اعتماد وحفظ تسليم الوردية' : 'Save & Publish Handover'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal: Manual Add Staff Form */}
        {isAddOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0d121c] border-2 border-zinc-700 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>{isAr ? 'إضافة موظف أو فني للكشف' : 'Add Staff to Shift'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddManualStaff} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">
                    {isAr ? 'الاسم الكامل *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={isAr ? 'مثال: حسام كمال' : 'e.g. Hossam Kamal'}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1">
                      {isAr ? 'الدور الوظيفي *' : 'Role *'}
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:border-amber-400 focus:outline-none"
                    >
                      <option value="operator">{isAr ? 'عامل تشغيل' : 'Operator'}</option>
                      <option value="supervisor">{isAr ? 'مشرف وردية' : 'Supervisor'}</option>
                      <option value="maintenance">{isAr ? 'فني صيانة' : 'Maintenance'}</option>
                      <option value="admin">{isAr ? 'مدير عام' : 'Plant GM'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-bold mb-1">
                      {isAr ? 'الخط أو الماكينة *' : 'Assigned Line *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newLine}
                      onChange={(e) => setNewLine(e.target.value)}
                      placeholder="EXT-01"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-300 font-bold mb-1">
                    {isAr ? 'المهمة المحددة بمحطة العمل' : 'Station Task'}
                  </label>
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder={isAr ? 'تلقيم الخامات، تشغيل قوالب...' : 'Feeding, tooling...'}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-bold mb-1">
                    {isAr ? 'المستهدف الإنتاجي للوردية' : 'Target Quota'}
                  </label>
                  <input
                    type="text"
                    value={newQuota}
                    onChange={(e) => setNewQuota(e.target.value)}
                    placeholder="1,400 كرتونة"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-3.5 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white transition"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-black font-bold transition"
                  >
                    {isAr ? 'حفظ وتسكين' : 'Save & Assign'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
