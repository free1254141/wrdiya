import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
for (const line of env.split('\n')) {
  const [k, ...v] = line.split('=');
  if (k && v.length) envVars[k.trim()] = v.join('=').trim();
}

async function dropLegacyTables() {
  const token = envVars.SUPABASE_ACCESS_TOKEN;
  const projectRef = 'csuifvyghfsibkrnxrby';
  const query = `
    DROP TABLE IF EXISTS downtime_logs CASCADE;
    DROP TABLE IF EXISTS production_logs CASCADE;
    DROP TABLE IF EXISTS shift_notes CASCADE;
    DROP TABLE IF EXISTS staff_roster CASCADE;
    DROP TABLE IF EXISTS machines CASCADE;
    DROP TABLE IF EXISTS production_lines CASCADE;
    DROP TABLE IF EXISTS factories CASCADE;
    DROP TABLE IF EXISTS users_profile CASCADE;
  `;
  
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });

  const data = await res.json();
  console.log('Drop Legacy Tables Status:', res.status, data);
}

dropLegacyTables();
