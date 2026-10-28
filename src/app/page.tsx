'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  initialMachines, 
  initialShiftNotes, 
  initialDowntimeLogs, 
  initialProductionLogs 
} from '@/lib/supabase';
import { 
  Machine, 
  MachineStatus,
  ShiftNote, 
  DowntimeLog, 
  ProductionLog, 
  ChatMessage, 
  UserRole, 
  DowntimeCategory, 
  ShiftName, 
  NoteCategory 
} from '@/lib/types';
import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import PinnedHandoverAlert from '@/components/PinnedHandoverAlert';
import MachineStatusHeader from '@/components/MachineStatusHeader';
import OperatorBreakdownCard from '@/components/OperatorBreakdownCard';
import SupervisorProductionCard from '@/components/SupervisorProductionCard';
import SupervisorNoteCard from '@/components/SupervisorNoteCard';
import MaintenanceAlertFeed from '@/components/MaintenanceAlertFeed';
import ManagerAnalyticsCard from '@/components/ManagerAnalyticsCard';
import StaffRosterCard from '@/components/StaffRosterCard';
import ChatFeed from '@/components/ChatFeed';
import WrdyaCopilotWidget from '@/components/WrdyaCopilotWidget';

function MainAppContent() {
  const searchParams = useSearchParams();
  const machineParam = searchParams ? searchParams.get('machine_id') : null;

  const { user, factory, activeRole } = useAuth();
  const { locale, t } = useLanguage();

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

  // Load AI onboarded machines if present
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('wrdya_onboarded_setup');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.machines && parsed.machines.length > 0) {
          const generatedMachines: Machine[] = parsed.machines.map((m: any, idx: number) => ({
            id: m.id || `mach-ai-${idx + 1}`,
            factory_id: factory?.id || 'fac-01',
            name: m.name,
            code: m.code,
            line_name: m.line,
            current_status: (m.status as MachineStatus) || 'running',
            last_status_change: new Date().toISOString(),
          }));
          setMachines(generatedMachines);
          setSelectedMachineId(generatedMachines[0].id);
        }
      }
    } catch {}
  }, [factory]);

  const [shiftNotes, setShiftNotes] = useState<ShiftNote[]>(initialShiftNotes);
  const [downtimeLogs, setDowntimeLogs] = useState<DowntimeLog[]>(initialDowntimeLogs);
  const [productionLogs, setProductionLogs] = useState<ProductionLog[]>(initialProductionLogs);

  // Initial chat feed
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender_role: 'supervisor',
      sender_name: 'م. أحمد عادل (مشرف الوردية)',
      timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
      type: 'shift_handover',
      content: '📌 تنبيه تسليم وردية: تم استلام دفعة بوليمر خام جديدة (#889). يرجى التحقق من الكثافة قبل التشغيل على EXT-01.',
    },
    {
      id: 'm2',
      sender_role: 'operator',
      sender_name: 'حسام كمال (فني التشغيل)',
      timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      type: 'breakdown_alert',
      content: '🔴 عطل طارئ: ماكينة الحقن 02 (INJ-02) توقفت بسبب ارتفاع حرارة هيتر الحقن وتوقف الحزام الناقل.',
    },
    {
      id: 'm3',
      sender_role: 'maintenance',
      sender_name: 'م. محمود صقر (رئيس الصيانة)',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      type: 'text',
      content: '🔧 تم استلام البلاغ على INJ-02 وجاري فحص لوحة القواطع الكهربائية وحساس الثرموكبل.',
    },
  ]);

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
      reported_by: user?.name || 'فني التشغيل',
      reason_category: category,
      voice_note_text: voiceNote || 'عطل مفاجئ تم الإبلاغ عنه من الخط',
      started_at: nowIso,
      ended_at: null,
    };

    setDowntimeLogs((prev) => [newLog, ...prev]);

    // Update machine status to down
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
      sender_role: activeRole,
      sender_name: user?.name || 'فني التشغيل',
      timestamp: nowIso,
      type: 'breakdown_alert',
      content: `🔴 بلاغ عطل طارئ على ${activeMachine.name} (${activeMachine.code}) | السبب: ${t.breakdown_categories[category]}${voiceNote ? ` - تفاصيل: ${voiceNote}` : ''}`,
    };
    setMessages((prev) => [newMsg, ...prev]);
  };

  // Handler: Machine resolved
  const handleResolveBreakdown = () => {
    const nowIso = new Date().toISOString();

    // End active downtime log
    setDowntimeLogs((prev) =>
      prev.map((log) => {
        if (log.machine_id === activeMachine.id && !log.ended_at) {
          const duration = Math.max(
            1,
            Math.round((new Date(nowIso).getTime() - new Date(log.started_at).getTime()) / 60000)
          );
          return {
            ...log,
            ended_at: nowIso,
            duration_minutes: duration,
            resolved_by: user?.name || 'فني التشغيل والصيانة',
          };
        }
        return log;
      })
    );

    // Update machine status back to running
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
      sender_role: activeRole,
      sender_name: user?.name || 'فني التشغيل',
      timestamp: nowIso,
      type: 'text',
      content: `🟢 تم إصلاح العطل واستئناف تشغيل ماكينة ${activeMachine.name} بنجاح.`,
    };
    setMessages((prev) => [newMsg, ...prev]);
  };

  // Handler: Supervisor saves production
  const handleSaveProduction = (
    entries: Array<{ machine_id: string; good: number; scrap: number; shift: ShiftName }>
  ) => {
    const nowIso = new Date().toISOString();
    const newLogs: ProductionLog[] = entries.map((e) => ({
      id: `prod-${Date.now()}-${e.machine_id}`,
      factory_id: activeMachine.factory_id,
      machine_id: e.machine_id,
      machine_name: machines.find((m) => m.id === e.machine_id)?.name,
      shift_name: e.shift,
      good_count: e.good,
      scrap_count: e.scrap,
      log_date: nowIso.split('T')[0],
      created_at: nowIso,
    }));

    setProductionLogs((prev) => [...newLogs, ...prev]);

    const totalGood = entries.reduce((acc, curr) => acc + curr.good, 0);
    const totalScrap = entries.reduce((acc, curr) => acc + curr.scrap, 0);

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender_role: 'supervisor',
      sender_name: user?.name || 'مشرف الوردية',
      timestamp: nowIso,
      type: 'production_summary',
      content: `📊 تم تسجيل إنتاج نهاية الوردية (${entries[0]?.shift}): إجمالي الوحدات السليمة: ${totalGood.toLocaleString()} | إجمالي الهدر: ${totalScrap.toLocaleString()} وحدة. تم تحديث مؤشر OEE العام.`,
    };
    setMessages((prev) => [newMsg, ...prev]);
  };

  // Handler: Supervisor adds shift note
  const handleAddShiftNote = (category: NoteCategory, noteText: string, isPinned: boolean) => {
    const nowIso = new Date().toISOString();
    const newNote: ShiftNote = {
      id: `note-${Date.now()}`,
      factory_id: activeMachine.factory_id,
      supervisor_name: user?.name || 'مشرف الوردية',
      category,
      note_text: noteText,
      is_pinned_for_next_shift: isPinned,
      created_at: nowIso,
    };

    setShiftNotes((prev) => [newNote, ...prev]);

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender_role: 'supervisor',
      sender_name: user?.name || 'مشرف الوردية',
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
      sender_name: user?.name || 'مسؤول المصنع',
      timestamp: new Date().toISOString(),
      type: 'text',
      content: text,
    };
    setMessages((prev) => [newMsg, ...prev]);
  };

  return (
    <div className={`min-h-screen bg-[#07090e] text-zinc-100 font-sans neobrutal-grid-bg ${locale === 'ar' ? 'rtl' : 'ltr'}`} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Top High-Tech Command Navbar */}
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-5 sm:py-6">
        
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

        {/* 2-Column Responsive Layout: Left Live Chat Feed, Right Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Workspace Column (7 cols) - Right Side in RTL & LTR */}
          <div className="lg:col-span-7 space-y-5 order-1 rtl:order-1 ltr:order-2">
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
              <div className="space-y-5">
                <StaffRosterCard locale={locale} />
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
                onAcknowledgeAlert={(id) => {}}
                onResolveAlert={handleResolveBreakdown}
              />
            )}

            {/* Manager / Admin Role View */}
            {activeRole === 'admin' && (
              <div className="space-y-5">
                <StaffRosterCard locale={locale} />
                <ManagerAnalyticsCard
                  downtimeLogs={downtimeLogs}
                  productionLogs={productionLogs}
                  shiftNotes={shiftNotes}
                  locale={locale}
                />
              </div>
            )}
          </div>

          {/* Realtime Live Factory Broadcast Feed (5 cols) - Left Side (الشمال) */}
          <div className="lg:col-span-5 sticky top-20 order-2 rtl:order-2 ltr:order-1">
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
    <Suspense fallback={<div className="min-h-screen bg-[#07090e] text-white flex items-center justify-center font-bold">جاري تحميل نظام وردية الذكي...</div>}>
      <MainAppContent />
    </Suspense>
  );
}
