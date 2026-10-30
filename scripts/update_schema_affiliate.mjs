const token = process.env.SUPABASE_ACCESS_TOKEN || '';
const projectRef = 'csuifvyghfsibkrnxrby';

async function runSql(sql, label = '') {
  console.log(`Running: ${label}...`);
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  const data = await res.json();
  if (!res.ok) {
    console.error(`Error in ${label}:`, res.status, data);
    return false;
  }
  console.log(`Success ${label}:`, data);
  return true;
}

async function main() {
  const alterSql = `
    ALTER TABLE public.compounds_projects 
      ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'مصر',
      ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'Aqarmap';

    ALTER TABLE public.properties 
      ADD COLUMN IF NOT EXISTS affiliate_url TEXT,
      ADD COLUMN IF NOT EXISTS partner_code TEXT,
      ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'Aqarmap';

    -- Update existing Egypt properties with Aqarmap partner code and affiliate link
    UPDATE public.properties 
    SET partner_code = '759279',
        platform = 'Aqarmap',
        affiliate_url = 'https://launches.aqarmap.com/ar/expos/saudi-projects?utm_source=partners&utm_medium=dynamic&utm_campaign=affiliate_759279&partner_code=759279'
    WHERE partner_code IS NULL;
  `;

  await runSql(alterSql, 'Add affiliate columns and backfill Aqarmap code');
}

main().catch(console.error);
