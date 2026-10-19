// Synchronise uniquement les champs cdi / salesforces depuis Webflow
// (sans toucher aux URLs de fichiers déjà migrées vers Supabase Storage).
// Usage : node --env-file=.env scripts/sync-filter-fields.mjs

const { WEBFLOW_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
const H = { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json' };
const wf = async (p) => (await fetch(`https://api.webflow.com/v2${p}`, { headers: { Authorization: `Bearer ${WEBFLOW_TOKEN}` } })).json();
const yes = (v) => ['oui', 'yes', 'true'].includes(String(v ?? '').toLowerCase());

const { sites } = await wf('/sites');
const { collections } = await wf(`/sites/${sites[0].id}/collections`);
const col = collections.find((c) => c.displayName === 'Profiles');
const detail = await wf(`/collections/${col.id}`);
const sfOptions = new Map((detail.fields.find((f) => f.slug === 'salesforces')?.validations?.options ?? []).map((o) => [o.id, o.name]));

let offset = 0, updated = 0;
for (;;) {
  const page = await wf(`/collections/${col.id}/items?limit=100&offset=${offset}`);
  for (const it of page.items) {
    const f = it.fieldData;
    const body = {
      cdi: yes(f.cdi),
      salesforce: yes(sfOptions.get(f.salesforces) ?? f.salesforces),
    };
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?webflow_id=eq.${it.id}`, {
      method: 'PATCH', headers: H, body: JSON.stringify(body),
    });
    if (res.ok) updated++;
  }
  offset += page.items.length;
  if (offset >= (page.pagination?.total ?? 0) || page.items.length === 0) break;
  process.stdout.write(`\r  … ${offset}`);
}
console.log(`\n✓ ${updated} profils synchronisés (cdi, salesforce).`);
