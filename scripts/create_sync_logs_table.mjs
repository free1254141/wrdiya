const token = process.env.SUPABASE_ACCESS_TOKEN || '';
const projectRef = 'csuifvyghfsibkrnxrby';

async function main() {
  const sql = `
    CREATE TABLE IF NOT EXISTS public.sync_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      source TEXT NOT NULL,
      status TEXT NOT NULL,
      items_synced INT DEFAULT 0,
      details JSONB DEFAULT '{}'::jsonb,
      synced_at TIMESTAMPTZ DEFAULT now()
    );

    ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public can view sync logs" ON public.sync_logs;
    CREATE POLICY "Public can view sync logs" ON public.sync_logs FOR SELECT USING (true);
    DROP POLICY IF EXISTS "Service role full access on sync logs" ON public.sync_logs;
    CREATE POLICY "Service role full access on sync logs" ON public.sync_logs FOR ALL USING (true);
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
  console.log('Sync logs table status:', res.status, data);
}

main().catch(console.error);
