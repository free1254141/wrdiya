-- ==============================================================================
-- LineChat (وردية - Wrdya) - Production Supabase Migration
-- Multi-Tenant RLS, 6 Core Tables, Generated Downtime Calculation, Realtime Pub
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Factories (Tenant root)
CREATE TABLE IF NOT EXISTS public.factories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    subscription_status TEXT NOT NULL DEFAULT 'trial' 
        CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled')),
    paypal_subscription_id TEXT,
    plan_tier TEXT NOT NULL DEFAULT 'starter' 
        CHECK (plan_tier IN ('starter', 'pro')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Users Profile (Extends auth.users with Tenant & Role)
CREATE TABLE IF NOT EXISTS public.users_profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    factory_id UUID NOT NULL REFERENCES public.factories(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'operator'
        CHECK (role IN ('admin', 'supervisor', 'maintenance', 'operator')),
    preferred_lang TEXT NOT NULL DEFAULT 'ar'
        CHECK (preferred_lang IN ('ar', 'en')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Machines
CREATE TABLE IF NOT EXISTS public.machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factory_id UUID NOT NULL REFERENCES public.factories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    qr_url TEXT,
    current_status TEXT NOT NULL DEFAULT 'running'
        CHECK (current_status IN ('running', 'down', 'maintenance')),
    last_status_change TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Downtime Logs (Machine breakdowns with computed duration)
CREATE TABLE IF NOT EXISTS public.downtime_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factory_id UUID NOT NULL REFERENCES public.factories(id) ON DELETE CASCADE,
    machine_id UUID NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
    reported_by UUID REFERENCES public.users_profile(id) ON DELETE SET NULL,
    resolved_by UUID REFERENCES public.users_profile(id) ON DELETE SET NULL,
    reason_category TEXT NOT NULL 
        CHECK (reason_category IN ('electrical', 'mechanical', 'material', 'other')),
    voice_note_text TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    ended_at TIMESTAMPTZ,
    duration_minutes NUMERIC GENERATED ALWAYS AS (
        CASE 
            WHEN ended_at IS NOT NULL THEN ROUND(EXTRACT(EPOCH FROM (ended_at - started_at)) / 60, 2)
            ELSE NULL 
        END
    ) STORED
);

-- 6. Production Logs (Shift output for OEE calculation)
CREATE TABLE IF NOT EXISTS public.production_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factory_id UUID NOT NULL REFERENCES public.factories(id) ON DELETE CASCADE,
    machine_id UUID NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
    supervisor_id UUID REFERENCES public.users_profile(id) ON DELETE SET NULL,
    shift_name TEXT NOT NULL 
        CHECK (shift_name IN ('morning', 'evening', 'night')),
    good_count INTEGER NOT NULL DEFAULT 0 CHECK (good_count >= 0),
    scrap_count INTEGER NOT NULL DEFAULT 0 CHECK (scrap_count >= 0),
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Shift Notes (Handover alerts & supervisor notes)
CREATE TABLE IF NOT EXISTS public.shift_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factory_id UUID NOT NULL REFERENCES public.factories(id) ON DELETE CASCADE,
    supervisor_id UUID REFERENCES public.users_profile(id) ON DELETE SET NULL,
    category TEXT NOT NULL 
        CHECK (category IN ('material_issue', 'worker_absence', 'handover_alert', 'general')),
    note_text TEXT NOT NULL,
    is_pinned_for_next_shift BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for high-frequency queries
CREATE INDEX IF NOT EXISTS idx_users_profile_factory ON public.users_profile(factory_id);
CREATE INDEX IF NOT EXISTS idx_machines_factory ON public.machines(factory_id);
CREATE INDEX IF NOT EXISTS idx_downtime_factory_machine ON public.downtime_logs(factory_id, machine_id);
CREATE INDEX IF NOT EXISTS idx_downtime_active ON public.downtime_logs(machine_id) WHERE ended_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_production_factory_date ON public.production_logs(factory_id, log_date);
CREATE INDEX IF NOT EXISTS idx_shift_notes_pinned ON public.shift_notes(factory_id) WHERE is_pinned_for_next_shift = true;

-- ==============================================================================
-- 8. Row Level Security (RLS) Policies
-- Strict isolation ensuring tenants can ONLY access their own factory data
-- ==============================================================================

ALTER TABLE public.factories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downtime_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_notes ENABLE ROW LEVEL SECURITY;

-- Helper function: get caller factory_id
CREATE OR REPLACE FUNCTION public.current_user_factory_id()
RETURNS UUID AS $$
  SELECT factory_id FROM public.users_profile WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Factories policy
CREATE POLICY factories_select_policy ON public.factories
    FOR SELECT USING (id = public.current_user_factory_id() OR owner_id = auth.uid());

CREATE POLICY factories_update_policy ON public.factories
    FOR UPDATE USING (owner_id = auth.uid());

-- Users Profile policy
CREATE POLICY users_profile_policy ON public.users_profile
    FOR ALL USING (factory_id = public.current_user_factory_id());

-- Machines policy
CREATE POLICY machines_all_policy ON public.machines
    FOR ALL USING (factory_id = public.current_user_factory_id());

-- Downtime Logs policy
CREATE POLICY downtime_logs_policy ON public.downtime_logs
    FOR ALL USING (factory_id = public.current_user_factory_id());

-- Production Logs policy
CREATE POLICY production_logs_policy ON public.production_logs
    FOR ALL USING (factory_id = public.current_user_factory_id());

-- Shift Notes policy
CREATE POLICY shift_notes_policy ON public.shift_notes
    FOR ALL USING (factory_id = public.current_user_factory_id());

-- ==============================================================================
-- 9. Realtime Publication Setup
-- Enables instant live updates across mobile workers, supervisors & maintenance
-- ==============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.machines;
ALTER PUBLICATION supabase_realtime ADD TABLE public.downtime_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shift_notes;

-- ==============================================================================
-- 10. Sample Seed Data (For Demonstration & Local Testing)
-- ==============================================================================
INSERT INTO public.factories (id, name, subscription_status, plan_tier)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'مصنع الأمل للبلاستيك والتغليف (Al-Amal Plastics)', 'active', 'pro')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.machines (id, factory_id, name, code, current_status)
VALUES
    ('11111111-1111-1111-1111-111111111101', '00000000-0000-0000-0000-000000000001', 'خط البثق الرئيسي 01 (Extruder Line 1)', 'EXT-01', 'running'),
    ('11111111-1111-1111-1111-111111111102', '00000000-0000-0000-0000-000000000001', 'ماكينة الحقن 02 (Injection M-02)', 'INJ-02', 'down'),
    ('11111111-1111-1111-1111-111111111103', '00000000-0000-0000-0000-000000000001', 'ماكينة التشكيل الحراري (Thermoformer T-03)', 'THF-03', 'running'),
    ('11111111-1111-1111-1111-111111111104', '00000000-0000-0000-0000-000000000001', 'خط التعبئة والتغليف 04 (Packaging Line 4)', 'PKG-04', 'maintenance')
ON CONFLICT (id) DO NOTHING;

-- Active downtime event on INJ-02 for instant demo
INSERT INTO public.downtime_logs (factory_id, machine_id, reason_category, voice_note_text, started_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111102',
    'electrical',
    'ارتفاع غير متوقع في حرارة هيتر الحقن وتوقف الحزام الناقل',
    timezone('utc'::text, now()) - interval '14 minutes'
) ON CONFLICT DO NOTHING;

-- Pinned handover alert for supervisor shift change
INSERT INTO public.shift_notes (factory_id, category, note_text, is_pinned_for_next_shift)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'handover_alert',
    'تنبيه هام للوردية المسائية: تم استلام دفعة بوليمر خام جديدة (دفعة رقم #889). يرجى فحص الكثافة قبل بدء التشغيل على خط البثق EXT-01.',
    true
) ON CONFLICT DO NOTHING;
