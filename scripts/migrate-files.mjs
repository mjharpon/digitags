// Rapatriement des fichiers Webflow CDN → Supabase Storage.
// Usage : node --env-file=.env scripts/migrate-files.mjs
// - photos → bucket public « photos », recompressées (sips, 512px, jpeg q75)
// - cv anonymisés → bucket public « docs-anonymes »
// - cv complets + portfolios PDF → bucket privé « docs-internes »
//   (stockés en chemin nu, sans https — l'outil génère des URLs signées)
// Relançable : saute les fichiers déjà migrés.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execFileP = promisify(execFile);
import { writeFileSync, readFileSync, mkdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
const H = { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` };
const tmp = path.join(os.tmpdir(), 'digitags-migrate');
mkdirSync(tmp, { recursive: true });

const ext = (u, fallback) => {
  const m = new URL(u).pathname.match(/\.([a-z0-9]{2,5})$/i);
  return m ? m[1].toLowerCase() : fallback;
};

async function upload(bucket, key, buf, contentType) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${key}`, {
    method: 'POST',
    headers: { ...H, 'Content-Type': contentType, 'x-upsert': 'true' },
    body: buf,
  });
  if (!res.ok) throw new Error(`upload ${res.status}: ${(await res.text()).slice(0, 100)}`);
}

const TYPES = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };

async function migrateOne(p) {
  const updates = {};
  const jobs = [
    { field: 'photo_url', bucket: 'photos', name: 'photo', compress: true, publicUrl: true },
    { field: 'cv_anonyme_url', bucket: 'docs-anonymes', name: 'cv-anonyme', publicUrl: true },
    { field: 'cv_url', bucket: 'docs-internes', name: 'cv', publicUrl: false },
    { field: 'portfolio_pdf_url', bucket: 'docs-internes', name: 'portfolio', publicUrl: false },
  ];
  for (const j of jobs) {
    const u = p[j.field];
    if (!u || !/webflow\.com|website-files\.com/.test(u)) continue; // déjà migré ou absent
    try {
      const res = await fetch(u);
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      let buf = Buffer.from(await res.arrayBuffer());
      let e = ext(u, j.compress ? 'jpg' : 'pdf');
      if (j.compress && ['jpg', 'jpeg', 'png', 'webp'].includes(e)) {
        const fin = path.join(tmp, `${p.id}-in.${e}`);
        const fout = path.join(tmp, `${p.id}-out.jpg`);
        writeFileSync(fin, buf);
        try {
          await execFileP('sips', ['-Z', '512', '-s', 'format', 'jpeg', '-s', 'formatOptions', '75', fin, '--out', fout]);
          buf = readFileSync(fout);
          e = 'jpg';
        } catch { /* compression échouée : original conservé */ }
        rmSync(fin, { force: true }); rmSync(fout, { force: true });
      }
      const key = `${p.id}/${j.name}.${e}`;
      await upload(j.bucket, key, buf, TYPES[e] ?? 'application/octet-stream');
      updates[j.field] = j.publicUrl
        ? `${SUPABASE_URL}/storage/v1/object/public/${j.bucket}/${key}`
        : `${j.bucket}/${key}`; // chemin nu → URL signée côté outil
    } catch (err) {
      console.warn(`  ! ${p.id} ${j.field}: ${err.message}`);
    }
  }
  if (Object.keys(updates).length) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${p.id}`, {
      method: 'PATCH',
      headers: { ...H, 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) console.warn(`  ! update ${p.id}: ${res.status}`);
  }
  return Object.keys(updates).length;
}

async function main() {
  const rows = [];
  for (let off = 0; ; off += 1000) {
    const page = await (await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,photo_url,cv_url,cv_anonyme_url,portfolio_pdf_url&order=id`, { headers: { ...H, Range: `${off}-${off + 999}` } })).json();
    rows.push(...page);
    if (page.length < 1000) break;
  }
  const todo = rows.filter((p) =>
    ['photo_url', 'cv_url', 'cv_anonyme_url', 'portfolio_pdf_url'].some((k) => p[k] && /webflow\.com|website-files\.com/.test(p[k])));
  console.log(`${todo.length} profils avec fichiers à migrer (sur ${rows.length}).`);
  let done = 0, files = 0;
  const CONC = 8;
  for (let i = 0; i < todo.length; i += CONC) {
    const batch = todo.slice(i, i + CONC);
    const counts = await Promise.all(batch.map(migrateOne));
    files += counts.reduce((a, b) => a + b, 0);
    done += batch.length;
    if (done % 80 < CONC) console.log(`  … ${done}/${todo.length} profils (${files} fichiers)`);
  }
  console.log(`✓ Terminé : ${files} fichiers migrés vers Supabase Storage.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
