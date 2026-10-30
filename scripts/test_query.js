const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const lines = env.split('\n');
const envVars = {};
for (const line of lines) {
  const [k, ...v] = line.split('=');
  if (k && v.length) envVars[k.trim()] = v.join('=').trim();
}

async function testSql() {
  const token = envVars.SUPABASE_ACCESS_TOKEN;
  const projectRef = 'csuifvyghfsibkrnxrby';
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: 'SELECT current_database(), version();'
    })
  });
  const data = await res.json();
  console.log('Management API SQL response:', res.status, data);
}
testSql();
