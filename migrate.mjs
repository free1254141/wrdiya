import fs from 'fs';

const token = process.env.SUPABASE_ACCESS_TOKEN || '';
const projectRef = 'csuifvyghfsibkrnxrby';

async function runSql(sql, label = '') {
  console.log(`Executing ${label}...`);
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Error in ${label}:`, res.status, errText);
    return false;
  }
  const data = await res.json();
  console.log(`Success ${label}:`, data);
  return true;
}

async function main() {
  // Test connection
  await runSql('SELECT 1 as test', 'Connection Test');

  // Schema creation
  const schemaSql = fs.readFileSync('supabase_schema_real_estate.sql', 'utf8');
  await runSql(schemaSql, 'Schema Migration');

  // Seed insertion
  const seedSql = fs.readFileSync('supabase_seed_real_estate.sql', 'utf8');
  await runSql(seedSql, 'Seed Migration');

  // Verify
  await runSql('SELECT count(*) FROM public.properties;', 'Properties Count');
  await runSql('SELECT count(*) FROM public.compounds_projects;', 'Compounds Count');
  await runSql('SELECT count(*) FROM public.developers;', 'Developers Count');
}

main().catch(console.error);
