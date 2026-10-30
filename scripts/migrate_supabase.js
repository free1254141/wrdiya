const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const lines = env.split('\n');
const envVars = {};
for (const line of lines) {
  const [k, ...v] = line.split('=');
  if (k && v.length) envVars[k.trim()] = v.join('=').trim();
}

async function runMigration() {
  const token = envVars.SUPABASE_ACCESS_TOKEN;
  const projectRef = 'csuifvyghfsibkrnxrby';

  const sql = `
  -- 1. Wipe dummy data from child tables first to respect foreign keys
  DELETE FROM public.downtime_logs;
  DELETE FROM public.shift_notes;
  DELETE FROM public.production_logs;
  DELETE FROM public.machines;
  DELETE FROM public.users_profile;
  DELETE FROM public.factories;

  -- 2. Add columns to factories if they do not exist
  ALTER TABLE public.factories 
    ADD COLUMN IF NOT EXISTS logo_url TEXT,
    ADD COLUMN IF NOT EXISTS industry TEXT,
    ADD COLUMN IF NOT EXISTS code TEXT,
    ADD COLUMN IF NOT EXISTS shift_model TEXT DEFAULT '3_shifts_8h';

  -- 3. Add columns to machines if they do not exist
  ALTER TABLE public.machines
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS line_name TEXT,
    ADD COLUMN IF NOT EXISTS speed TEXT,
    ADD COLUMN IF NOT EXISTS cycle_time TEXT;

  -- 4. Create production_lines table if not exists
  CREATE TABLE IF NOT EXISTS public.production_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factory_id UUID REFERENCES public.factories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
  );

  -- 5. Create staff_roster table if not exists
  CREATE TABLE IF NOT EXISTS public.staff_roster (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factory_id UUID REFERENCES public.factories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'operator',
    line_name TEXT,
    shift TEXT DEFAULT 'morning',
    station_task TEXT,
    target_quota TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
  );

  -- 6. Enable RLS and create open/authenticated policies
  ALTER TABLE public.production_lines ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.staff_roster ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS production_lines_all ON public.production_lines;
  CREATE POLICY production_lines_all ON public.production_lines FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS staff_roster_all ON public.staff_roster;
  CREATE POLICY staff_roster_all ON public.staff_roster FOR ALL USING (true) WITH CHECK (true);

  -- Relax RLS for public registration if anon user registers
  DROP POLICY IF EXISTS factories_insert_anon ON public.factories;
  CREATE POLICY factories_insert_anon ON public.factories FOR INSERT WITH CHECK (true);

  DROP POLICY IF EXISTS factories_select_all ON public.factories;
  CREATE POLICY factories_select_all ON public.factories FOR SELECT USING (true);

  DROP POLICY IF EXISTS machines_all ON public.machines;
  CREATE POLICY machines_all ON public.machines FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS downtime_logs_all ON public.downtime_logs;
  CREATE POLICY downtime_logs_all ON public.downtime_logs FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS production_logs_all ON public.production_logs;
  CREATE POLICY production_logs_all ON public.production_logs FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS shift_notes_all ON public.shift_notes;
  CREATE POLICY shift_notes_all ON public.shift_notes FOR ALL USING (true) WITH CHECK (true);
  `;

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  const data = await res.json();
  console.log('Migration response status:', res.status, data);
}

runMigration();
