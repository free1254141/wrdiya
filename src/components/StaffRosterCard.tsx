'use client';

import React, { useState, useEffect } from 'react';
import { Locale } from '@/lib/i18n';
import { 
  Users, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Sparkles, 
  FileText, 
  Bot, 
  Wrench, 
  ShieldCheck, 
  Radio, 
  Gauge, 
  Cpu, 
  Sliders, 
  Briefcase 
} from 'lucide-react';

export interface StaffMember {
  id: string;
  name: string;
  role: 'operator' | 'supervisor' | 'maintenance' | 'admin';
  line: string;
  shift: 'morning' | 'evening' | 'night';
  // Operator dynamic fields
  stationTask?: string;
  targetQuota?: string;
  ppeApproved?: boolean;
  // Supervisor dynamic fields
  supervisedSector?: string;
  radioChannel?: string;
  targetOee?: string;
  handoverProtocol?: string;
  // Maintenance dynamic fields
  technicalSpecialty?: string;
  responseLine?: string;
  toolboxId?: string;
  onCallStatus?: string;
  // Admin dynamic fields
  operationalDivision?: string;
  approvalScope?: string;
  emergencyExtension?: string;
}

const INITIAL_STAFF: StaffMember[] = [
  { 
    id: 'st-1', 
    name: 'حسام كمال', 
    role: 'operator', 
    line: 'EXT-01', 
    shift: 'morning',
    stationTask: 'تلقيم وتغذية الخامات',
    targetQuota: '1,400 كرتونة',
    ppeApproved: true
  },
  { 
    id: 'st-2', 
    name: 'سالم الدسوقي', 
    role: 'operator', 
    line: 'INJ-02', 
    shift: 'morning',
    stationTask: 'تشغيل قوالب وضغط هيدروليك',
    targetQuota: '950 قطعة',
    ppeApproved: true
  },
  { 
    id: 'st-3', 
    name: 'م. أحمد عادل', 
    role: 'supervisor', 
    line: 'صالة الإنتاج الرئيسية', 
    shift: 'morning',
    supervisedSector: 'صالة المصنع بالكامل',
    radioChannel: 'CH-01 طوارئ وإنتاج',
    targetOee: '85%',
    handoverProtocol: 'تسليم رقمي سحابي معتمد'
  },
  { 
    id: 'st-4', 
    name: 'م. محمود صقر', 
    role: 'maintenance', 
    line: 'فريق التدخل السريع', 
    shift: 'morning',
    technicalSpecialty: 'كهرباء وتحكم آلي PLC',
    responseLine: 'EXT-01 & INJ-02',
    toolboxId: 'CAL-2026-X8',
    onCallStatus: 'متواجد بالصالة'
  },
  { 
    id: 'st-5', 
    name: 'د. عاصم فريد', 
    role: 'admin', 
    line: 'الإدارة العامة', 
    shift: 'morning',
    operationalDivision: 'إدارة العمليات الصناعية',
    approvalScope: 'صلاحية كاملة وإيقاف خطوط',
    emergencyExtension: 'EXT-101'
  },
];

export default function StaffRosterCard({ locale }: { locale: Locale }) {
  const isAr = locale === 'ar';
  const [staffList, setStaffList] = useState<StaffMember[]>(INITIAL_STAFF);
  const [activeTab, setActiveTab] = useState<'view' | 'manual'>('view');

  // Common Manual Form Inputs
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'operator' | 'supervisor' | 'maintenance' | 'admin'>('operator');
  const [newLine, setNewLine] = useState('EXT-01');
  const [newShift, setNewShift] = useState<'morning' | 'evening' | 'night'>('morning');

  // Operator-specific inputs
  const [stationTask, setStationTask] = useState('تلقيم وتغذية الخامات');
  const [targetQuota, setTargetQuota] = useState('1200 وحدة');
  const [ppeApproved, setPpeApproved] = useState(true);

  // Supervisor-specific inputs
  const [supervisedSector, setSupervisedSector] = useState('صالة المصنع بالكامل');
  const [radioChannel, setRadioChannel] = useState('CH-01: طوارئ وإنتاج');
  const [targetOee, setTargetOee] = useState('85%');
  const [handoverProtocol, setHandoverProtocol] = useState('تسليم رقمي سحابي');

  // Maintenance-specific inputs
  const [technicalSpecialty, setTechnicalSpecialty] = useState('كهرباء وتحكم PLC');
  const [toolboxId, setToolboxId] = useState('CAL-2026-X8');
  const [onCallStatus, setOnCallStatus] = useState('متواجد بالصالة');

  // Admin-specific inputs
  const [operationalDivision, setOperationalDivision] = useState('إدارة العمليات الصناعية');
  const [approvalScope, setApprovalScope] = useState('صلاحية كاملة وإيقاف خطوط');
  const [emergencyExtension, setEmergencyExtension] = useState('EXT-105');

  // Listen for custom AI events from the chatbot
  useEffect(() => {
    const handleAiUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        const formatted = e.detail.map((item: any, idx: number) => ({
          id: `ai-${Date.now()}-${idx}`,
          name: item.name,
          role: item.role || 'operator',
          line: item.line || 'EXT-01',
          shift: item.shift || 'morning',
          stationTask: item.stationTask || (item.role === 'operator' ? 'تشغيل عام ومراقبة خط' : undefined),
          targetQuota: item.targetQuota || '1200 وحدة',
          ppeApproved: true,
          supervisedSector: item.supervisedSector || (item.role === 'supervisor' ? 'صالة الإنتاج' : undefined),
          radioChannel: item.radioChannel || 'CH-01',
          technicalSpecialty: item.technicalSpecialty || (item.role === 'maintenance' ? 'ميكانيكا وكهرباء' : undefined),
          operationalDivision: item.operationalDivision || (item.role === 'admin' ? 'إدارة الإنتاج' : undefined),
        }));
        setStaffList(formatted);
      }
    };

    const handleOpenManual = () => {
      setActiveTab('manual');
    };

    window.addEventListener('wrdya-roster-updated', handleAiUpdate);
    window.addEventListener('wrdya-open-manual-roster', handleOpenManual);

    return () => {
      window.removeEventListener('wrdya-roster-updated', handleAiUpdate);
      window.removeEventListener('wrdya-open-manual-roster', handleOpenManual);
    };
  }, []);

  const handleAddManualMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newMember: StaffMember = {
      id: `st-${Date.now()}`,
      name: newName.trim(),
      role: newRole,
      line: newLine,
      shift: newShift,
      ...(newRole === 'operator' && {
        stationTask,
        targetQuota,
        ppeApproved,
      }),
      ...(newRole === 'supervisor' && {
        supervisedSector,
        radioChannel,
        targetOee,
        handoverProtocol,
      }),
      ...(newRole === 'maintenance' && {
        technicalSpecialty,
        responseLine: newLine,
        toolboxId,
        onCallStatus,
      }),
      ...(newRole === 'admin' && {
        operationalDivision,
        approvalScope,
        emergencyExtension,
      }),
    };

    setStaffList((prev) => [newMember, ...prev]);
    setNewName('');
    setActiveTab('view');
  };

  const handleRemove = (id: string) => {
    setStaffList((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="neobrutal-card rounded-2xl p-5 border-2 border-zinc-700 bg-[#0d121c]">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white">
                {isAr ? 'تسكين وإدارة عمال ومسؤولي الوردية' : 'Shift Workers & Staff Roster'}
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                {isAr ? 'متطلبات ديناميكية لكل دور' : 'Dynamic Role Requirements'}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {isAr
                ? 'فورم ذكي تتغير متطلباته آلياً حسب الدور الوظيفي للمسؤول (مشغل، مشرف، صيانة، مدير)'
                : 'Form requirements automatically change based on the assigned role'}
            </p>
          </div>
        </div>

        {/* Tab switcher: View/AI vs Manual */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('view')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'view' ? 'bg-amber-500 text-black font-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {isAr ? '📋 جدول المسكنين' : 'Active Roster'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'manual' ? 'bg-amber-500 text-black font-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {isAr ? '✍️ ملء فورم يدوي' : '✍️ Dynamic Form'}
          </button>
        </div>
      </div>

      {activeTab === 'view' ? (
        <div className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="p-2.5">{isAr ? 'المسؤول / العامل' : 'Staff Name'}</th>
                  <th className="p-2.5">{isAr ? 'الدور الوظيفي' : 'Role'}</th>
                  <th className="p-2.5">{isAr ? 'الخط / التكليف الرئيسي' : 'Line / Sector'}</th>
                  <th className="p-2.5">{isAr ? 'المتطلبات والتخصيص الوظيفي' : 'Role-Specific Details'}</th>
                  <th className="p-2.5">{isAr ? 'الوردية' : 'Shift'}</th>
                  <th className="p-2.5 text-center">{isAr ? 'حذف' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-zinc-200">
                {staffList.map((st) => (
                  <tr key={st.id} className="hover:bg-zinc-900/50 transition">
                    <td className="p-2.5">
                      <div className="font-bold text-white">{st.name}</div>
                      {st.ppeApproved && (
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3" /> {isAr ? 'مهمات السلامة معتمدة' : 'PPE Verified'}
                        </span>
                      )}
                    </td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${
                        st.role === 'operator'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          : st.role === 'supervisor'
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                          : st.role === 'maintenance'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                      }`}>
                        {st.role === 'operator' && (isAr ? '👷 مشغل خط' : 'Operator')}
                        {st.role === 'supervisor' && (isAr ? '📋 مشرف وردية' : 'Supervisor')}
                        {st.role === 'maintenance' && (isAr ? '🛠️ فني صيانة' : 'Maintenance')}
                        {st.role === 'admin' && (isAr ? '🏢 مدير مصنع' : 'Plant Manager')}
                      </span>
                    </td>
                    <td className="p-2.5 font-mono font-bold text-amber-400">
                      {st.line}
                    </td>
                    <td className="p-2.5">
                      {/* Dynamic Role Badges based on role type */}
                      {st.role === 'operator' && (
                        <div className="space-y-0.5">
                          <div className="text-zinc-200 font-semibold">{st.stationTask || (isAr ? 'محطة تشغيل' : 'Operation')}</div>
                          <div className="text-[10px] text-zinc-400 font-mono">
                            {isAr ? 'الإنتاج المستهدف:' : 'Target:'} {st.targetQuota || '1200'}
                          </div>
                        </div>
                      )}
                      {st.role === 'supervisor' && (
                        <div className="space-y-0.5">
                          <div className="text-blue-300 font-semibold flex items-center gap-1">
                            <Radio className="w-3 h-3" /> {st.radioChannel || 'CH-01'}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {isAr ? 'مستهدف OEE:' : 'Target OEE:'} <span className="text-emerald-400 font-bold">{st.targetOee || '85%'}</span>
                          </div>
                        </div>
                      )}
                      {st.role === 'maintenance' && (
                        <div className="space-y-0.5">
                          <div className="text-emerald-300 font-semibold flex items-center gap-1">
                            <Wrench className="w-3 h-3" /> {st.technicalSpecialty || 'ميكانيكا وكهرباء'}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono">
                            {isAr ? 'العدة:' : 'Tag:'} {st.toolboxId || 'CAL-2026'} | {st.onCallStatus || 'بالصالة'}
                          </div>
                        </div>
                      )}
                      {st.role === 'admin' && (
                        <div className="space-y-0.5">
                          <div className="text-purple-300 font-semibold flex items-center gap-1">
                            <Briefcase className="w-3 h-3" /> {st.operationalDivision || 'إدارة الإنتاج'}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {isAr ? 'تحويلة:' : 'Ext:'} {st.emergencyExtension || 'EXT-100'}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 text-[10px]">
                        {st.shift === 'morning' ? (isAr ? 'صباحية' : 'Morning') : st.shift === 'evening' ? (isAr ? 'مسائية' : 'Evening') : (isAr ? 'ليلية' : 'Night')}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemove(st.id)}
                        className="text-zinc-500 hover:text-rose-400 p-1 transition"
                        title={isAr ? 'حذف من الوردية' : 'Remove'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-amber-400" />
              {isAr
                ? 'ارفع صورة كشف أو أرسل رسالة للمساعد في الشات وسيقوم بملء كل هذه المتطلبات آلياً'
                : 'Upload a roster photo in the AI chatbot to populate role requirements automatically'}
            </span>
            <span className="font-bold text-zinc-300 font-mono">
              {staffList.length} {isAr ? 'مسؤولين مسكنين' : 'Staff Assigned'}
            </span>
          </div>
        </div>
      ) : (
        /* DYNAMIC ROLE-BASED MANUAL FORM */
        <form onSubmit={handleAddManualMember} className="space-y-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-2">
            <Sliders className="w-4 h-4 shrink-0" />
            <span>
              {isAr 
                ? 'تنبيه: اختر الدور الوظيفي للمسؤول أولاً وستتغير حقول ومتطلبات الفورم فوراً وفقاً لتخصصه'
                : 'Note: Changing the role will dynamically reconfigure the required form fields below'}
            </span>
          </div>

          {/* Core Row 1: Role Selector (Key trigger) and Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                {isAr ? 'الدور الوظيفي للمسؤول (يحدد متطلبات الفورم):' : 'Staff Role (Determines Requirements):'}
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-lg bg-zinc-950 border-2 border-amber-500/60 text-amber-400 text-xs font-bold focus:border-amber-400"
              >
                <option value="operator">{isAr ? '👷 عامل تشغيل ماكينة (Operator)' : 'Machine Operator'}</option>
                <option value="supervisor">{isAr ? '📋 مشرف وردية (Shift Supervisor)' : 'Shift Supervisor'}</option>
                <option value="maintenance">{isAr ? '🛠️ فني / مهندس صيانة (Maintenance)' : 'Maintenance Tech'}</option>
                <option value="admin">{isAr ? '🏢 مدير مصنع / مسؤول إدارة (Plant Manager)' : 'Plant Manager'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                {newRole === 'operator' 
                  ? (isAr ? 'اسم عامل التشغيل:' : 'Operator Name:') 
                  : newRole === 'supervisor' 
                  ? (isAr ? 'اسم مشرف الوردية:' : 'Supervisor Name:') 
                  : newRole === 'maintenance' 
                  ? (isAr ? 'اسم فني / مهندس الصيانة:' : 'Technician Name:') 
                  : (isAr ? 'اسم المدير / المسؤول:' : 'Manager Name:')}
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={isAr ? 'اكتب الاسم بالكامل...' : 'Enter full name...'}
                required
                className="w-full px-3 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs focus:border-amber-400 font-semibold"
              />
            </div>
          </div>

          {/* DYNAMIC FIELD SET 1: OPERATOR REQUIREMENTS */}
          {newRole === 'operator' && (
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
              <div className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                <Cpu className="w-4 h-4" />
                <span>{isAr ? 'متطلبات فني تشغيل الماكينات (Operator Requirements):' : 'Operator Requirements:'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    {isAr ? 'خط الإنتاج المخصص:' : 'Assigned Line:'}
                  </label>
                  <select
                    value={newLine}
                    onChange={(e) => setNewLine(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs font-mono"
                  >
                    <option value="EXT-01">EXT-01 (خط البثق والألواح الرئيسي)</option>
                    <option value="INJ-02">INJ-02 (ماكينة حقن البوليمر 02)</option>
                    <option value="THF-03">THF-03 (ماكينة التشكيل الحراري 03)</option>
                    <option value="PKG-04">PKG-04 (خط التعبئة والتغليف 04)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    {isAr ? 'محطة التشغيل / المهمة الدقيقة:' : 'Operating Station / Task:'}
                  </label>
                  <select
                    value={stationTask}
                    onChange={(e) => setStationTask(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs"
                  >
                    <option value="تلقيم وتغذية الخامات">{isAr ? 'تلقيم وتغذية الحبيبات والخامات (Hopper)' : 'Hopper & Raw Material Feeding'}</option>
                    <option value="تشغيل القوالب والحرارة">{isAr ? 'مراقبة القوالب وضغط الهيدروليك (Molding)' : 'Molding & Hydraulic Pressure'}</option>
                    <option value="فحص الجودة والمطابقة">{isAr ? 'فحص الجودة والفرز الأولي (QA Check)' : 'QA Check & Inline Sorting'}</option>
                    <option value="تعبئة وتغليف المنصات">{isAr ? 'تعبئة وتغليف المنصات (Packaging)' : 'Packaging & Palletizing'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    {isAr ? 'الإنتاج المستهدف للوردية (Quota):' : 'Target Quota per Shift:'}
                  </label>
                  <input
                    type="text"
                    value={targetQuota}
                    onChange={(e) => setTargetQuota(e.target.value)}
                    placeholder="مثال: 1,500 كرتونة"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs"
                  />
                </div>

                <div className="pt-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-200">
                    <input
                      type="checkbox"
                      checked={ppeApproved}
                      onChange={(e) => setPpeApproved(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-zinc-950 border-zinc-700"
                    />
                    <span>{isAr ? 'تم فحص مهمات الوقاية والسلامة (PPE Checked)' : 'Safety PPE Checked & Approved'}</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC FIELD SET 2: SUPERVISOR REQUIREMENTS */}
          {newRole === 'supervisor' && (
            <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-3">
              <div className="text-xs font-black text-blue-400 flex items-center gap-1.5">
                <Radio className="w-4 h-4" />
                <span>{isAr ? 'متطلبات مشرف الوردية (Supervisor Requirements):' : 'Supervisor Requirements:'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    {isAr ? 'القطاع المشرف عليه:' : 'Supervised Sector / Plant Area:'}
                  </label>
                  <select
                    value={supervisedSector}
                    onChange={(e) => {
                      setSupervisedSector(e.target.value);
                      setNewLine(e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs"
                  >
                    <option value="صالة المصنع بالكامل">{isAr ? 'صالة المصنع بالكامل (Whole Plant)' : 'Whole Factory Hall'}</option>
                    <option value="قطاع البثق والألواح">{isAr ? 'قطاع خطوط البثق والألواح (Extrusion)' : 'Extrusion Sector'}</option>
                    <option value="قطاع ماكينات الحقن">{isAr ? 'قطاع ماكينات الحقن (Injection)' : 'Injection Sector'}</option>
                    <option value="قطاع التعبئة والتخزين">{isAr ? 'قطاع التعبئة والتخزين (Packaging)' : 'Packaging & Logistics'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    {isAr ? 'قناة جهاز اللاسلكي (Radio Channel):' : 'Walkie-Talkie Channel:'}
                  </label>
                  <select
                    value={radioChannel}
                    onChange={(e) => setRadioChannel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs font-mono"
                  >
                    <option value="CH-01: طوارئ وإنتاج">CH-01: طوارئ وإنتاج رئيسي (Main Production)</option>
                    <option value="CH-02: صيانة سريعة">CH-02: عمليات الصيانة والورشة (Maintenance)</option>
                    <option value="CH-03: لوجستيات">CH-03: خامات وتحميل مستودعات (Logistics)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    {isAr ? 'الهدف التشغيلي لكفاءة الوردية (Target OEE):' : 'Target Shift OEE %:'}
                  </label>
                  <input
                    type="text"
                    value={targetOee}
                    onChange={(e) => setTargetOee(e.target.value)}
                    placeholder="مثال: 85%"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    {isAr ? 'بروتوكول تسليم الوردية:' : 'Handover Protocol:'}
                  </label>
                  <select
                    value={handoverProtocol}
                    onChange={(e) => setHandoverProtocol(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs"
                  >
                    <option value="تسليم رقمي سحابي">{isAr ? 'تسليم سحابي فوري عبر المنصة (Cloud Verified)' : 'Cloud Verified Handover'}</option>
                    <option value="محضر كتابي ومختوم">{isAr ? 'محضر تسليم كتابي ومختوم (Physical Signoff)' : 'Physical Signed Protocol'}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC FIELD SET 3: MAINTENANCE REQUIREMENTS */}
          {newRole === 'maintenance' && (
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
              <div className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                <Wrench className="w-4 h-4" />
                <span>{isAr ? 'متطلبات فني الصيانة والطوارئ (Maintenance Requirements):' : 'Maintenance Requirements:'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    {isAr ? 'التخصص الفني والهندسي الدقيق:' : 'Engineering Technical Specialty:'}
                  </label>
                  <select
                    value={technicalSpecialty}
                    onChange={(e) => setTechnicalSpecialty(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs"
                  >
                    <option value="كهرباء وتحكم آلي PLC">{isAr ? 'كهرباء وتحكم آلي وبرمجة PLC' : 'Electrical & PLC Automation'}</option>
                    <option value="ميكانيكا وصيانة وقائية">{isAr ? 'ميكانيكا عامة وهيدروليك وقائي' : 'Mechanical & Preventive PM'}</option>
                    <option value="هيدروليك ونيوماتيك">{isAr ? 'أنظمة ضغط الهواء والنيوماتيك' : 'Hydraulics & Pneumatics'}</option>
                    <option value="تبريد وتكييف صناعي">{isAr ? 'شيلرات تبريد ووحدات حرارية' : 'Industrial Chillers & HVAC'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    {isAr ? 'خط التدخل والاستجابة السريعة:' : 'Rapid Response Line:'}
                  </label>
                  <select
                    value={newLine}
                    onChange={(e) => setNewLine(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs font-mono"
                  >
                    <option value="فريق الطوارئ العام">{isAr ? 'طوارئ كافة خطوط صالة الإنتاج' : 'All Lines Emergency Standby'}</option>
                    <option value="EXT-01">EXT-01 (طوارئ خط البثق)</option>
                    <option value="INJ-02">INJ-02 (طوارئ ماكينة الحقن)</option>
                    <option value="ورشة الصيانة المركزية">{isAr ? 'ورشة الصيانة المركزية' : 'Central Workshop'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    {isAr ? 'كود صندوق العدة والمعايرة (Toolbox Tag):' : 'Toolbox / Calibration Tag ID:'}
                  </label>
                  <input
                    type="text"
                    value={toolboxId}
                    onChange={(e) => setToolboxId(e.target.value)}
                    placeholder="CAL-2026-X8"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    {isAr ? 'وضع الجاهزية (Readiness Mode):' : 'Readiness Status:'}
                  </label>
                  <select
                    value={onCallStatus}
                    onChange={(e) => setOnCallStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs"
                  >
                    <option value="متواجد بالصالة">{isAr ? 'متواجد داخل صالة الإنتاج (Floor Active)' : 'Active On Floor'}</option>
                    <option value="استعداد بالورشة On-Call">{isAr ? 'استعداد واستدعاء بالورشة (On-Call Standby)' : 'On-Call Standby in Workshop'}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC FIELD SET 4: ADMIN / MANAGER REQUIREMENTS */}
          {newRole === 'admin' && (
            <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-3">
              <div className="text-xs font-black text-purple-400 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4" />
                <span>{isAr ? 'متطلبات إدارة وتشغيل المصنع (Plant Manager Requirements):' : 'Plant Management Requirements:'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    {isAr ? 'الإدارة التشغيلية التابع لها:' : 'Operational Directorate:'}
                  </label>
                  <select
                    value={operationalDivision}
                    onChange={(e) => {
                      setOperationalDivision(e.target.value);
                      setNewLine(e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs"
                  >
                    <option value="إدارة العمليات الصناعية">{isAr ? 'إدارة العمليات الصناعية والتشغيل' : 'Plant Operations Directorate'}</option>
                    <option value="تأكيد وضبط الجودة QA">{isAr ? 'إدارة توكيد وضبط الجودة (QA / QC)' : 'Quality Assurance (QA / QC)'}</option>
                    <option value="السلامة والصحة المهنية HSE">{isAr ? 'السلامة والصحة المهنية والبيئة (HSE)' : 'Safety & HSE Directorate'}</option>
                    <option value="الإدارة العامة للمصنع">{isAr ? 'الإدارة العامة للمصنع والمالك' : 'General Plant Management'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    {isAr ? 'مستوى صلاحية الاعتماد (Approval Scope):' : 'Authorization Scope:'}
                  </label>
                  <select
                    value={approvalScope}
                    onChange={(e) => setApprovalScope(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs"
                  >
                    <option value="صلاحية كاملة وإيقاف خطوط">{isAr ? 'صلاحية كاملة وإيقاف فوري للخطوط (Full Override)' : 'Full Override & Shutdown'}</option>
                    <option value="اعتماد تسليم الوردية">{isAr ? 'اعتماد إغلاق وتسليم الورديات (Shift Signoff)' : 'Shift Signoff Approval'}</option>
                    <option value="تدقيق ومراجعة فقط">{isAr ? 'تدقيق ومراجعة تقارير OEE (Read-Only Audit)' : 'Read-Only Audit & Analytics'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  {isAr ? 'تحويلة الطوارئ المباشرة (Emergency Extension):' : 'Emergency Direct Extension:'}
                </label>
                <input
                  type="text"
                  value={emergencyExtension}
                  onChange={(e) => setEmergencyExtension(e.target.value)}
                  placeholder="EXT-105"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs font-mono"
                />
              </div>
            </div>
          )}

          {/* Common Row 3: Shift Selector */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1">
              {isAr ? 'الوردية المقررة:' : 'Assigned Shift:'}
            </label>
            <select
              value={newShift}
              onChange={(e) => setNewShift(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs font-semibold focus:border-amber-400"
            >
              <option value="morning">{isAr ? 'الوردية الصباحية (07:00 - 15:00)' : 'Morning Shift (07:00 - 15:00)'}</option>
              <option value="evening">{isAr ? 'الوردية المسائية (15:00 - 23:00)' : 'Evening Shift (15:00 - 23:00)'}</option>
              <option value="night">{isAr ? 'الوردية الليلية (23:00 - 07:00)' : 'Night Shift (23:00 - 07:00)'}</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
            <button
              type="submit"
              className="neobrutal-btn px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة وتسكين المسؤول في جدول الوردية' : 'Add to Active Roster'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('view')}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold hover:text-white transition"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
