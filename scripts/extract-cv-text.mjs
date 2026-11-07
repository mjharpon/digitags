// Extrait le texte des CV (PDF du bucket privé docs-internes) vers profiles.cv_text
// pour la recherche plein-texte. Relançable : saute les profils déjà traités.
// cv_text = '' signifie « traité mais illisible » (PDF scanné, corrompu, introuvable) : on ne
// le retélécharge plus. Seuls les profils à cv_text NULL sont retentés (≈ rien à chaque cron).
// Usage : node --env-file=.env scripts/extract-cv-text.mjs

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
const H = { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` };

const rows = [];
for (let off = 0; ; off += 1000) {
  const page = await (await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,cv_url&cv_text=is.null&cv_url=like.*.pdf&order=id`, {
    headers: { ...H, Range: `${off}-${off + 999}` },
  })).json();
  rows.push(...page);
  if (page.length < 1000) break;
}

const todo = rows.filter((r) => r.cv_url && !/^https?:/.test(r.cv_url) && r.cv_url.endsWith('.pdf'));
console.log(`${todo.length} CV PDF à extraire (sur ${rows.length} profils).`);

let done = 0, ok = 0;
const CONC = 6;
async function save(r, cv_text) {
  const up = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${r.id}`, {
    method: 'PATCH',
    headers: { ...H, 'Content-Type': 'application/json' },
    body: JSON.stringify({ cv_text }),
  });
  return up.ok;
}
async function one(r) {
  let buf;
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${r.cv_url}`, { headers: H });
    if (!res.ok) {
      // 4xx = fichier absent/refusé : définitif. 5xx = panne passagère : on retentera au prochain cron.
      if (res.status < 500) await save(r, '');
      throw new Error(`storage ${res.status}`);
    }
    buf = Buffer.from(await res.arrayBuffer());
  } catch (e) {
    console.warn(`  ! ${r.id}: ${e.message.slice(0, 60)}`);
    return;
  }
  let clean = '';
  try {
    const { text } = await pdf(buf);
    clean = text.replace(/\s+/g, ' ').trim().slice(0, 50000);
  } catch (e) {
    console.warn(`  ! ${r.id}: PDF illisible (${e.message.slice(0, 40)})`);
  }
  // Texte vide (scan, image) ou PDF illisible → '' pour ne plus jamais retélécharger ce fichier.
  if (await save(r, clean) && clean) ok++;
}
for (let i = 0; i < todo.length; i += CONC) {
  await Promise.all(todo.slice(i, i + CONC).map(one));
  done += Math.min(CONC, todo.length - i);
  if (done % 120 < CONC) console.log(`  … ${done}/${todo.length}`);
}
console.log(`✓ ${ok} CV indexés pour la recherche plein-texte.`);
