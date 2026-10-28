export type UserRole = 'operator' | 'supervisor' | 'maintenance' | 'admin';

export type MachineStatus = 'running' | 'down' | 'maintenance';

export type DowntimeCategory = 'electrical' | 'mechanical' | 'material' | 'other';

export type ShiftName = 'morning' | 'evening' | 'night';

export type NoteCategory = 'material_issue' | 'worker_absence' | 'handover_alert' | 'general';

export interface FactoryProfile {
  id: string;
  name: string;
  industry: string;
  code: string;
  adminName: string;
  adminEmail: string;
  shiftModel: string;
  linesCount: number;
  machinesCount: number;
  staffCount: number;
  createdAt: string;
}

export interface NewFactoryRegistration {
  factoryName: string;
  industry: string;
  adminName: string;
  email: string;
  password: string;
  shiftModel: string;
  estimatedLines?: number;
  estimatedMachines?: number;
}

export interface StaffMember {
  id: string;
  name: string;
  role: UserRole;
  line: string;
  shift: ShiftName;
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

export interface Machine {
  id: string;
  factory_id: string;
  name: string;
  code: string;
  line_name?: string;
  qr_url?: string;
  current_status: MachineStatus;
  last_status_change: string;
  active_downtime_start?: string;
  active_downtime_reason?: DowntimeCategory;
  active_downtime_note?: string;
  target_hourly_rate?: number;
}

export interface DowntimeLog {
  id: string;
  factory_id: string;
  machine_id: string;
  machine_name?: string;
  machine_code?: string;
  reported_by?: string;
  resolved_by?: string;
  reason_category: DowntimeCategory;
  voice_note_text?: string;
  started_at: string;
  ended_at?: string | null;
  duration_minutes?: number | null;
}

export interface ProductionLog {
  id: string;
  factory_id: string;
  machine_id: string;
  machine_name?: string;
  supervisor_id?: string;
  shift_name: ShiftName;
  good_count: number;
  scrap_count: number;
  log_date: string;
  created_at: string;
}

export interface ShiftNote {
  id: string;
  factory_id: string;
  supervisor_id?: string;
  supervisor_name?: string;
  category: NoteCategory;
  note_text: string;
  is_pinned_for_next_shift: boolean;
  created_at: string;
}

export interface OEEMetrics {
  availability: number; // e.g. 88.5%
  performance: number;  // e.g. 92.0%
  quality: number;      // e.g. 96.4%
  overall_oee: number;  // e.g. 78.5%
  total_good: number;
  total_scrap: number;
  total_downtime_minutes: number;
}

export interface ChatMessage {
  id: string;
  sender_role: UserRole;
  sender_name: string;
  timestamp: string;
  type: 'text' | 'breakdown_alert' | 'repair_log' | 'shift_handover' | 'production_summary' | 'ai_analyst_card';
  content?: string;
  meta?: any;
}

