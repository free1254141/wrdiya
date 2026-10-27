import { createClient as createBrowserClient } from '@/utils/supabase/client';
import { Machine, DowntimeLog, ShiftNote, ProductionLog } from './types';

// Supabase client instance using the secured utils
export const supabase = createBrowserClient();

export const initialMachines: Machine[] = [
  {
    id: '11111111-1111-1111-1111-111111111101',
    factory_id: '00000000-0000-0000-0000-000000000001',
    name: 'خط البثق الرئيسي 01 (Extruder Line 1)',
    code: 'EXT-01',
    current_status: 'running',
    last_status_change: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: '11111111-1111-1111-1111-111111111102',
    factory_id: '00000000-0000-0000-0000-000000000001',
    name: 'ماكينة الحقن 02 (Injection M-02)',
    code: 'INJ-02',
    current_status: 'down',
    last_status_change: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    active_downtime_start: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    active_downtime_reason: 'electrical',
    active_downtime_note: 'ارتفاع غير متوقع في حرارة هيتر الحقن وتوقف الحزام الناقل',
  },
  {
    id: '11111111-1111-1111-1111-111111111103',
    factory_id: '00000000-0000-0000-0000-000000000001',
    name: 'ماكينة التشكيل الحراري (Thermoformer T-03)',
    code: 'THF-03',
    current_status: 'running',
    last_status_change: new Date(Date.now() - 3600000 * 7).toISOString(),
  },
  {
    id: '11111111-1111-1111-1111-111111111104',
    factory_id: '00000000-0000-0000-0000-000000000001',
    name: 'خط التعبئة والتغليف 04 (Packaging Line 4)',
    code: 'PKG-04',
    current_status: 'maintenance',
    last_status_change: new Date(Date.now() - 3600000 * 2).toISOString(),
    active_downtime_start: new Date(Date.now() - 3600000 * 2).toISOString(),
    active_downtime_reason: 'mechanical',
    active_downtime_note: 'تغيير شفرات القص وفحص محامل الحركة الدورية',
  },
];

export const initialShiftNotes: ShiftNote[] = [
  {
    id: 'note-01',
    factory_id: '00000000-0000-0000-0000-000000000001',
    supervisor_name: 'م. أحمد الشمري (مشرف الوردية الصباحية)',
    category: 'handover_alert',
    note_text: 'تنبيه هام للوردية المسائية: تم استلام دفعة بوليمر خام جديدة (دفعة رقم #889). يرجى فحص الكثافة قبل بدء التشغيل على خط البثق EXT-01 لتجنب فقاعات الهواء.',
    is_pinned_for_next_shift: true,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'note-02',
    factory_id: '00000000-0000-0000-0000-000000000001',
    supervisor_name: 'م. خالد الدوسري',
    category: 'material_issue',
    note_text: 'نقص في كراتين التعبئة مقاس 50x30 تم إخطار إدارة المشتريات لتوريد شحنة عاجلة في الوردية الليلية.',
    is_pinned_for_next_shift: false,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];

export const initialDowntimeLogs: DowntimeLog[] = [
  {
    id: 'down-01',
    factory_id: '00000000-0000-0000-0000-000000000001',
    machine_id: '11111111-1111-1111-1111-111111111102',
    machine_name: 'ماكينة الحقن 02 (INJ-02)',
    machine_code: 'INJ-02',
    reported_by: 'فني التشغيل سالم',
    reason_category: 'electrical',
    voice_note_text: 'ارتفاع غير متوقع في حرارة هيتر الحقن وتوقف الحزام الناقل',
    started_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    ended_at: null,
  },
  {
    id: 'down-02',
    factory_id: '00000000-0000-0000-0000-000000000001',
    machine_id: '11111111-1111-1111-1111-111111111101',
    machine_name: 'خط البثق الرئيسي 01 (EXT-01)',
    machine_code: 'EXT-01',
    reported_by: 'فني التشغيل عمر',
    reason_category: 'mechanical',
    voice_note_text: 'انسداد فلتر التغذية وتغيير المصفاة السريعة',
    started_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    ended_at: new Date(Date.now() - 3600000 * 5 - 1000 * 60 * 25).toISOString(),
    duration_minutes: 35,
  },
];

export const initialProductionLogs: ProductionLog[] = [
  {
    id: 'prod-01',
    factory_id: '00000000-0000-0000-0000-000000000001',
    machine_id: '11111111-1111-1111-1111-111111111101',
    machine_name: 'خط البثق الرئيسي 01 (EXT-01)',
    shift_name: 'morning',
    good_count: 4850,
    scrap_count: 120,
    log_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  },
  {
    id: 'prod-02',
    factory_id: '00000000-0000-0000-0000-000000000001',
    machine_id: '11111111-1111-1111-1111-111111111103',
    machine_name: 'ماكينة التشكيل الحراري (THF-03)',
    shift_name: 'morning',
    good_count: 3200,
    scrap_count: 85,
    log_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  },
];
