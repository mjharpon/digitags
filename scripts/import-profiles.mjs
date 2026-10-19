// Import des profils Webflow → Supabase.
// Usage : node --env-file=.env scripts/import-profiles.mjs
// Requiert WEBFLOW_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY dans .env.
// Relançable : upsert sur webflow_id. Les fichiers (photos, CV) gardent
// pour l'instant leurs URLs CDN Webflow — à migrer vers Supabase Storage
// avant toute résiliation de Webflow (script séparé à prévoir).

const { WEBFLOW_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
if (!WEBFLOW_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Variables manquantes dans .env (WEBFLOW_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY).');
  process.exit(1);
}

const API = 'https://api.webflow.com/v2';

// Client REST minimal (PostgREST) — évite supabase-js, incompatible Node 20 côté script.
async function sbRest(method, path, body, headers = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${method} ${path}: ${text}`);
  return text ? JSON.parse(text) : null;
}
const upsert = (table, rows) =>
  sbRest('POST', `${table}?on_conflict=webflow_id`, rows, { Prefer: 'resolution=merge-duplicates,return=minimal' });

async function wf(pathname) {
  const res = await fetch(`${API}${pathname}`, {
    headers: { Authorization: `Bearer ${WEBFLOW_TOKEN}`, accept: 'application/json' },
  });
  if (res.status === 429) {
    const wait = Number(res.headers.get('retry-after') ?? 10);
    await new Promise((r) => setTimeout(r, wait * 1000));
    return wf(pathname);
  }
  if (!res.ok) throw new Error(`${res.status} on ${pathname}: ${await res.text()}`);
  return res.json();
}

async function allItems(collectionId) {
  const items = [];
  let offset = 0;
  for (;;) {
    const page = await wf(`/collections/${collectionId}/items?limit=100&offset=${offset}`);
    items.push(...page.items);
    offset += page.items.length;
    if (offset >= (page.pagination?.total ?? 0) || page.items.length === 0) break;
  }
  return items;
}

const yes = (v) => v === true || v === 'Yes' || v === 'yes' || v === 'Oui' || v === 'oui' || v === 'TRUE';

async function main() {
  const { sites } = await wf('/sites');
  const site = sites[0];
  const { collections } = await wf(`/sites/${site.id}/collections`);
  const jobsCol = collections.find((c) => c.displayName === 'Job Types');
  const profilesCol = collections.find((c) => c.displayName === 'Profiles');

  // 1. Job groups
  const jobs = await allItems(jobsCol.id);
  const jobRows = jobs.map((j) => ({
    webflow_id: j.id,
    name: j.fieldData.name,
    slug: j.fieldData.slug,
    sort: j.fieldData.order ?? 0,
  }));
  await upsert('job_groups', jobRows);
  const jgRows = await sbRest('GET', 'job_groups?select=id,webflow_id');
  const jgMap = new Map(jgRows.map((r) => [r.webflow_id, r.id]));
  console.log(`✓ ${jobRows.length} familles de métiers`);

  // 2. Profiles — résolution des champs Option (l'API renvoie des ids, pas les libellés)
  const colDetail = await wf(`/collections/${profilesCol.id}`);
  const optionMaps = {};
  for (const field of colDetail.fields) {
    if (field.type === 'Option') {
      optionMaps[field.slug] = new Map((field.validations?.options ?? []).map((o) => [o.id, o.name]));
    }
  }
  const opt = (f, slug) => optionMaps[slug]?.get(f[slug]) ?? f[slug] ?? null;

  const items = await allItems(profilesCol.id);
  console.log(`${items.length} profils récupérés depuis Webflow…`);
  const rows = items.map((it) => {
    const f = it.fieldData;
    return {
      webflow_id: it.id,
      name: f.name ?? 'Sans nom',
      slug: f.slug,
      email: f.email || null,
      job: f.job || null,
      job_group_id: jgMap.get(f['job-group']) ?? null,
      photo_url: f['profile-photo']?.url ?? null,
      disponible: f.disponible === true,
      dispo_from: f['dispo-a-partir-de-2'] ? f['dispo-a-partir-de-2'].slice(0, 10) : null,
      fluent_english: yes(opt(f, 'fluent-english1')),
      dgitags_experience: opt(f, 'dgitags-experience1'),
      experience: opt(f, 'experience'),
      stars: f.stars ?? null,
      tarif_jour: f['tarif-jour'] ?? null,
      tjm_free: f['tjm-free'] ?? null,
      salary: f.salary || null,
      preferences_html: f.preferences || null,
      reference_html: f.reference || null,
      formation_html: f.formation || null,
      notes_html: f['text-note'] || null,
      notes_tags_html: f['notes-tags'] || null,
      cv_url: f.cv?.url ?? null,
      cv_anonyme_url: f['cv-no-contact-details']?.url ?? null,
      portfolio_url: f['portfolio-website-link']?.url ?? f['portfolio-website-link-clean'] ?? null,
      portfolio_pdf_url: f['portfolio-pdf']?.url ?? null,
      show_on_website: yes(opt(f, 'show-profile-from-website')),
      updated_at: new Date().toISOString(),
    };
  });

  for (let i = 0; i < rows.length; i += 200) {
    await upsert('profiles', rows.slice(i, i + 200));
    console.log(`  … ${Math.min(i + 200, rows.length)}/${rows.length}`);
  }
  console.log(`✓ ${rows.length} profils importés dans Supabase.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
