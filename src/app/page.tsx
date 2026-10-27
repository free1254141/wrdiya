'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  initialMachines, 
  initialShiftNotes, 
  initialDowntimeLogs, 
  initialProductionLogs 
} from '@/lib/supabase';
import { 
  Machine, 
  ShiftNote, 
  DowntimeLog, 
  ProductionLog, 
  ChatMessage, 
  UserRole, 
  DowntimeCategory, 
  ShiftName, 
  NoteCategory 
} from '@/lib/types';
import { Locale, translations } from '@/lib/i18n';
import Navbar from '@/components/Navbar';
import PinnedHandoverAlert from '@/components/PinnedHandoverAlert';
import MachineStatusHeader from '@/components/MachineStatusHeader';
import OperatorBreakdownCard from '@/components/OperatorBreakdownCard';
import SupervisorProductionCard from '@/components/SupervisorProductionCard';
import SupervisorNoteCard from '@/components/SupervisorNoteCard';
import MaintenanceAlertFeed from '@/components/MaintenanceAlertFeed';
import ManagerAnalyticsCard from '@/components/ManagerAnalyticsCard';
import ChatFeed from '@/components/ChatFeed';

function MainAppContent() {
  const searchParams = useSearchParams();
  const machineParam = searchParams ? searchParams.get('machine_id') : null;

  const [locale, setLocale] = useState<Locale>('ar');
  const [activeRole, setActiveRole] = useState<UserRole>('operator');
  const [machines, setMachines] = useState<Machine[]>(initialMachines);
  const [selectedMachineId, setSelectedMachineId] = useState<string>(() => {
    if (machineParam) {
      const found = initialMachines.find(
        (m) => m.code.toLowerCase() === machineParam.toLowerCase() || m.id === machineParam
      );
      if (found) return found.id;
    }
    return initialMachines[1].id; // Default to INJ-02 (currently has active demo downtime)
  });

  const [shiftNotes, setShiftNotes] = useState<ShiftNote[]>(initialShiftNotes);
  const [downtimeLogs, setDowntimeLogs] = useState<DowntimeLog[]>(initialDowntimeLogs);
  const [productionLogs, setProductionLogs] = useState<ProductionLog[]>(initialProductionLogs);

  // Initial chat feed
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender_role: 'supervisor',
      sender_name: 'م. أحمد الشمري',
      timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
      type: 'shift_handover',
      content: '📌 تنبيه تسليم وردية: تم استلام دفعة بوليمر خام جديدة (#889). يرجى التحقق من الكثافة قبل التشغيل على EXT-01.',
    },
    {
      id: 'm2',
      sender_role: 'operator',
      sender_name: 'فني الخط سالم',
      timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      type: 'breakdown_alert',
      content: '🔴 عطل طارئ: ماكينة الحقن 02 (INJ-02) توقفت بسبب ارتفاع حرارة هيتر الحقن وتوقف الحزام الناقل.',
    },
    {
      id: 'm3',
      sender_role: 'maintenance',
      sender_name: 'م. فراس (الصيانة)',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      type: 'text',
      content: '🔧 تم استلام البلاغ على INJ-02 وجاري فحص لوحة القواطع الكهربائية وهيتر التسخين.',
    },
  ]);

  const t = translations[locale];
  const activeMachine = machines.find((m) => m.id === selectedMachineId) || machines[0];
  const pinnedNote = shiftNotes.find((n) => n.is_pinned_for_next_shift);

  // Handler: Operator reports breakdown
  const handleReportBreakdown = (category: DowntimeCategory, voiceNote: string) => {
    const nowIso = new Date().toISOString();
    const newLog: DowntimeLog = {
      id: `down-${Date.now()}`,
      factory_id: activeMachine.factory_id,
      machine_id: activeMachine.id,
      machine_name: activeMachine.name,
      machine_code: activeMachine.code,
      reported_by: 'فني التشغيل (Operator)',
      reason_category: category,
      voice_note_text: voiceNote || 'عطل مفاجئ تم الإبلاغ عنه من الخط',
      started_at: nowIso,
      ended_at: null,
    };

    setDowntimeLogs((prev) => [newLog, ...prev]);

    // Update machine status
    setMachines((prev) =>
      prev.map((m) =>
        m.id === activeMachine.id
          ? {
              ...m,
              current_status: 'down',
              last_status_change: nowIso,
              active_downtime_start: nowIso,
              active_downtime_reason: category,
              active_downtime_note: voiceNote || t.breakdown_categories[category],
            }
          : m
      )
    );

    // Add to chat feed
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender_role: 'operator',
      sender_name: 'فني الخط (Operator)',
      timestamp: nowIso,
      type: 'breakdown_alert',
      content: `🔴 بلاغ عطل فوري على [${activeMachine.code} - ${activeMachine.name}]: تصنيف: ${t.breakdown_categories[category]}. ${voiceNote ? `"${voiceNote}"` : ''}`,
    };
    setMessages((prev) => [newMsg, ...prev]);
  };

  // Handler: Operator marks fixed
  const handleResolveBreakdown = () => {
    const nowIso = new Date().toISOString();

    setDowntimeLogs((prev) =>
      prev.map((log) =>
        log.machine_id === activeMachine.id && !log.ended_at
          ? { ...log, ended_at: nowIso, duration_minutes: 18 }
          : log
      )
    );

    setMachines((prev) =>
      prev.map((m) =>
        m.id === activeMachine.id
          ? {
              ...m,
              current_status: 'running',
              last_status_change: nowIso,
              active_downtime_start: undefined,
              active_downtime_reason: undefined,
              active_downtime_note: undefined,
            }
          : m
      )
    );

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender_role: 'operator',
      sender_name: 'فني الخط (Operator)',
      timestamp: nowIso,
      type: 'repair_log',
      content: `🟢 تم إصلاح الماكينة [${activeMachine.code} - ${activeMachine.name}] بنجاح واستئناف دورة الإنتاج. مدة التوقف المسجلة: 18 دقيقة.`,
    };
    setMessages((prev) => [newMsg, ...prev]);
  };

  // Handler: Supervisor saves batch production
  const handleSaveProduction = (
    entries: Array<{ machine_id: string; good: number; scrap: number; shift: ShiftName }>
  ) => {
    const nowIso = new Date().toISOString();
    const newLogs: ProductionLog[] = entries.map((e) => {
      const targetMachine = machines.find((m) => m.id === e.machine_id);
      return {
        id: `prod-${Date.now()}-${e.machine_id}`,
        factory_id: targetMachine?.factory_id || '00000000-0000-0000-0000-000000000001',
        machine_id: e.machine_id,
        machine_name: targetMachine?.name,
        shift_name: e.shift,
        good_count: e.good,
        scrap_count: e.scrap,
        log_date: nowIso.split('T')[0],
        created_at: nowIso,
      };
    });

    setProductionLogs((prev) => [...newLogs, ...prev]);

    const totalGood = entries.reduce((s, x) => s + x.good, 0);
    const totalScrap = entries.reduce((s, x) => s + x.scrap, 0);

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender_role: 'supervisor',
      sender_name: 'مشرف الوردية',
      timestamp: nowIso,
      type: 'production_summary',
      content: `📊 تم تسجيل إنتاج نهاية الوردية (${entries[0]?.shift}): إجمالي الوحدات السليمة: ${totalGood.toLocaleString()} | إجمالي الهدر: ${totalScrap.toLocaleString()} وحدة. تم تحديث حساب OEE.`,
    };
    setMessages((prev) => [newMsg, ...prev]);
  };

  // Handler: Supervisor adds shift note
  const handleAddShiftNote = (category: NoteCategory, noteText: string, isPinned: boolean) => {
    const nowIso = new Date().toISOString();
    const newNote: ShiftNote = {
      id: `note-${Date.now()}`,
      factory_id: activeMachine.factory_id,
      supervisor_name: 'مشرف الوردية (Supervisor)',
      category,
      note_text: noteText,
      is_pinned_for_next_shift: isPinned,
      created_at: nowIso,
    };

    setShiftNotes((prev) => [newNote, ...prev]);

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender_role: 'supervisor',
      sender_name: 'مشرف الوردية',
      timestamp: nowIso,
      type: 'shift_handover',
      content: `${isPinned ? '📌 [تنبيه مثبت للوردية القادمة] ' : '📝 [ملاحظة وردية] '}${t.note_categories[category]}: ${noteText}`,
    };
    setMessages((prev) => [newMsg, ...prev]);
  };

  // Handler: Chat direct message
  const handleSendChatMessage = (text: string) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender_role: activeRole,
      sender_name:
        activeRole === 'operator'
          ? 'فني الخط (Operator)'
          : activeRole === 'supervisor'
          ? 'مشرف الوردية (Supervisor)'
          : activeRole === 'maintenance'
          ? 'مهندس الصيانة (Maintenance)'
          : 'المدير / AI Analyst',
      timestamp: new Date().toISOString(),
      type: 'text',
      content: text,
    };
    setMessages((prev) => [newMsg, ...prev]);
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 font-sans ${locale === 'ar' ? 'rtl' : 'ltr'}`} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Top Navbar */}
      <Navbar
        locale={locale}
        setLocale={setLocale}
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        activeMachineId={selectedMachineId}
        onSelectMachine={setSelectedMachineId}
        machines={machines}
      />

      <main className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
        {/* Pinned Supervisor Handover Alert (Always visible if active) */}
        <PinnedHandoverAlert
          note={pinnedNote}
          locale={locale}
          onAcknowledge={() => {
            setShiftNotes((prev) =>
              prev.map((n) => (n.id === pinnedNote?.id ? { ...n, is_pinned_for_next_shift: false } : n))
            );
          }}
        />

        {/* Machine Status Sticky Header with Live Stopwatch */}
        <MachineStatusHeader
          machine={activeMachine}
          locale={locale}
          onSelectMachine={setSelectedMachineId}
          allMachines={machines}
        />

        {/* 2-Column Responsive Layout: Left Action Cards by Role, Right Live Chat Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Action Column (7 cols on Desktop) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Operator Role View */}
            {activeRole === 'operator' && (
              <OperatorBreakdownCard
                machine={activeMachine}
                locale={locale}
                onReportBreakdown={handleReportBreakdown}
                onResolveBreakdown={handleResolveBreakdown}
              />
            )}

            {/* Supervisor Role View */}
            {activeRole === 'supervisor' && (
              <div className="space-y-4">
                <SupervisorProductionCard
                  machines={machines}
                  locale={locale}
                  onSaveProduction={handleSaveProduction}
                />
                <SupervisorNoteCard
                  locale={locale}
                  onAddNote={handleAddShiftNote}
                />
              </div>
            )}

            {/* Maintenance Role View */}
            {activeRole === 'maintenance' && (
              <MaintenanceAlertFeed
                downtimeLogs={downtimeLogs}
                machines={machines}
                locale={locale}
              />
            )}

            {/* Manager / Admin Role View */}
            {activeRole === 'admin' && (
              <ManagerAnalyticsCard
                downtimeLogs={downtimeLogs}
                productionLogs={productionLogs}
                shiftNotes={shiftNotes}
                locale={locale}
              />
            )}
          </div>

          {/* Realtime Chat & Broadcast Feed (5 cols on Desktop) */}
          <div className="lg:col-span-5">
            <ChatFeed
              messages={messages}
              locale={locale}
              currentUserRole={activeRole}
              onSendMessage={handleSendChatMessage}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">تحميل وردية (LineChat)...</div>}>
      <MainAppContent />
    </Suspense>
  );
}
