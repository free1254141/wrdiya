async function test(query, locale = 'ar') {
  console.log(`\n========================================`);
  console.log(`Testing query: "${query}" (locale: ${locale})`);
  const res = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: query, locale })
  });
  const data = await res.json();
  console.log('Intent:', data.intent);
  console.log('Filter:', data.filterApplied);
  console.log('Returned Properties count:', data.properties?.length);
  if (data.properties) {
    data.properties.forEach((p, i) => {
      console.log(`  [${i+1}] [${p.platform}] ${p.title} | ${p.currency} | ${p.compound?.name || p.compound?.area_name}`);
    });
  }
}

async function runAll() {
  await test('عايز شقة في التجمع', 'ar');
  await test('عايز عقار في دبي', 'ar');
  await test('apartment in Istanbul', 'en');
  await test('عايز فيلا في الشيخ زايد', 'ar');
  await test('عايز شقة في العاصمة الإدارية', 'ar');
  await test('Istanbul dairesi', 'tr');
}

runAll();
