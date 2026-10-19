// Extrait le texte des CV (PDF du bucket privé docs-internes) vers profiles.cv_text
// pour la recherche plein-texte. Relançable : saute les profils déjà extraits.
// Usage : node --env-file=.env scripts/extract-cv-text.mjs

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
const H = { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` };

const rows = [];
for (let off = 0; ; off += 1000) {
  const page = await (await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,cv_url,cv_text&order=id`, {
    headers: { ...H, Range: `${off}-${off + 999}` },
  })).json();
  rows.push(...page);
  if (page.length < 1000) break;
}

const todo = rows.filter((r) => r.cv_url && !/^https?:/.test(r.cv_url) && r.cv_url.endsWith('.pdf') && !r.cv_text);
console.log(`${todo.length} CV PDF à extraire (sur ${rows.length} profils).`);

let done = 0, ok = 0;
const CONC = 6;
async function one(r) {
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${r.cv_url}`, { headers: H });
    if (!res.ok) throw new Error(`storage ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const { text } = await pdf(buf);
    const clean = text.replace(/\s+/g, ' ').trim().slice(0, 50000);
    if (!clean) return;
    const up = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${r.id}`, {
      method: 'PATCH',
      headers: { ...H, 'Content-Type': 'application/json' },
      body: JSON.stringify({ cv_text: clean }),
    });
    if (up.ok) ok++;
  } catch (e) {
    console.warn(`  ! ${r.id}: ${e.message.slice(0, 60)}`);
  }
}
for (let i = 0; i < todo.length; i += CONC) {
  await Promise.all(todo.slice(i, i + CONC).map(one));
  done += Math.min(CONC, todo.length - i);
  if (done % 120 < CONC) console.log(`  … ${done}/${todo.length}`);
}
console.log(`✓ ${ok} CV indexés pour la recherche plein-texte.`);
