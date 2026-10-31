/**
 * Migration Script: Updates all generic Aqarmap /ar/compounds/ affiliate URLs
 * to direct, targeted compound search URLs on Aqarmap Egypt with Partner Code 759279.
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const AQARMAP_PARTNER_CODE = '759279';

function extractCleanCompoundQuery(title, compoundName) {
  let text = (title || '').trim();

  // 1. Strip developer after '|' (e.g. '| اي جي اي ريل استيت')
  if (text.includes('|')) {
    text = text.split('|')[0].trim();
  }

  // 2. Strip location after ' - '
  if (text.includes(' - ')) {
    const parts = text.split(' - ');
    text = parts[0].trim();
  }

  // 3. Strip boilerplate prefixes
  const boilerplatePrefixes = [
    /^(شقة|فيلا|مكتب|دوبلكس|بنتهاوس|تاون هاوس|توين هاوس|شاليه|تجاري|محل|عيادة|صيدلية|استوديو|وحدة|ارض|أرض|مقر اداری|مقر إداري)\s+(للبيع\s+)?(في|فى)\s+(كمبوند\s+)?/i,
    /^(شقة|فيلا|مكتب|دوبلكس|بنتهاوس|تاون هاوس|توين هاوس|شاليه|تجاري|محل|عيادة|صيدلية|استوديو|وحدة|ارض|أرض)\s+(للبيع\s+)?/i,
    /^(للبيع\s+في|للبيع\s+فى)\s+(كمبوند\s+)?/i,
  ];

  let cleaned = text;
  const hadCompound = text.includes('كمبوند');

  for (const rx of boilerplatePrefixes) {
    if (rx.test(cleaned)) {
      cleaned = cleaned.replace(rx, '').trim();
      break;
    }
  }

  // Ensure "كمبوند" prefix
  if (!cleaned.startsWith('كمبوند') && (hadCompound || (compoundName && compoundName.includes('كمبوند')))) {
    cleaned = `كمبوند ${cleaned}`.trim();
  } else if (!cleaned.startsWith('كمبوند') && cleaned.length > 0) {
    cleaned = `كمبوند ${cleaned}`.trim();
  }

  if (!cleaned || cleaned.length < 3) {
    if (compoundName && compoundName.trim().length >= 3) {
      cleaned = compoundName.startsWith('كمبوند') ? compoundName.trim() : `كمبوند ${compoundName.trim()}`;
    } else {
      cleaned = (text || title || '').trim();
    }
  }

  return cleaned.trim();
}

function buildTargetedUrl(cleanQuery) {
  return `https://aqarmap.com.eg/ar/for-sale/property/all/egypt/?default=false&searchQuery=${encodeURIComponent(
    cleanQuery
  )}&utm_source=partners&utm_medium=dynamic&utm_campaign=affiliate_${AQARMAP_PARTNER_CODE}&partner_code=${AQARMAP_PARTNER_CODE}`;
}

async function migrate() {
  console.log('🚀 Starting migration of generic Aqarmap affiliate URLs...');

  let totalUpdated = 0;
  const pageSize = 200;

  while (true) {
    // Fetch a batch of rows still containing /ar/compounds
    const { data, error } = await supabase
      .from('properties')
      .select('id, title, affiliate_url')
      .ilike('affiliate_url', '%aqarmap.com.eg/ar/compounds%')
      .limit(pageSize);

    if (error) {
      console.error('Fetch error:', error);
      break;
    }

    if (!data || data.length === 0) {
      console.log('✨ No more rows matching /ar/compounds to update!');
      break;
    }

    console.log(`Processing batch of ${data.length} rows...`);

    // Perform individual or small chunk updates
    const updates = data.map(async (row) => {
      const clean = extractCleanCompoundQuery(row.title);
      const newUrl = buildTargetedUrl(clean);
      const { error: updateErr } = await supabase
        .from('properties')
        .update({ affiliate_url: newUrl })
        .eq('id', row.id);

      if (updateErr) {
        console.error(`Failed to update ${row.id}:`, updateErr.message);
        return false;
      }
      return true;
    });

    const results = await Promise.all(updates);
    const successCount = results.filter(Boolean).length;
    totalUpdated += successCount;
    console.log(`Batch finished: updated ${successCount}/${data.length} rows (Cumulative: ${totalUpdated})`);
  }

  console.log(`\n🎉 Migration complete! Total rows updated: ${totalUpdated}`);

  // Verification step
  const { count: remainingCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .ilike('affiliate_url', '%aqarmap.com.eg/ar/compounds%');

  const { count: targetedCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .ilike('affiliate_url', '%searchQuery=%');

  console.log(`Remaining /ar/compounds rows: ${remainingCount}`);
  console.log(`Total properties with targeted searchQuery: ${targetedCount}`);
}

migrate().catch(console.error);
