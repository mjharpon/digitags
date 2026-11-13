// Allège le Storage Supabase : recompresse les gros PDF/images des CV et portfolios
// (bucket privé docs-internes) et les photos trop lourdes (bucket public photos).
//
// SÛR PAR DÉFAUT :
//   - sans option : simple rapport (aucune écriture, seulement des requêtes HEAD) ;
//   - avec --apply : sauvegarde l'original en local AVANT de le remplacer, et ne remplace que
//     si le fichier compressé est nettement plus léger (≥ 15 %) et garde son texte (PDF).
//   - même chemin, même nom, même format : aucune URL ni ligne en base ne change.
//
// Usage :
//   node --env-file=.env scripts/compress-storage.mjs                  # rapport
//   node --env-file=.env scripts/compress-storage.mjs --apply          # compresse
//   options : --min=1500 (Ko, seuil docs, défaut 1500) --photo-min=150 (Ko, défaut 150)
//             --limit=20 (n'en traite que 20, pour tester) --backup=/chemin
// Prérequis : ghostscript (gs), sips (macOS) ; pdftotext (poppler) recommandé pour vérifier le texte.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const run = promisify(execFile);
const { SUPABASE_URL: U, SUPABASE_SERVICE_KEY: K } = process.env;
if (!U || !K) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_KEY manquants (--env-file=.env)');
const H = { apikey: K, Authorization: `Bearer ${K}` };

const arg = (n, d) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split('=')[1] ?? d;
const APPLY = process.argv.includes('--apply');
const MIN_DOC = Number(arg('min', 1500)) * 1024;
const MIN_PHOTO = Number(arg('photo-min', 150)) * 1024;
const LIMIT = Number(arg('limit', Infinity));
const BACKUP = arg('backup', path.join(os.homedir(), 'digitags-storage-backup'));
const SKIP_FILE = path.join(BACKUP, 'skip.json'); // fichiers déjà tentés sans gain : on n'y revient pas
const tmp = path.join(os.tmpdir(), 'digitags-compress');
mkdirSync(tmp, { recursive: true });
mkdirSync(BACKUP, { recursive: true });
const skip = new Set(existsSync(SKIP_FILE) ? JSON.parse(readFileSync(SKIP_FILE, 'utf8')) : []);

const mb = (n) => (n / 1048576).toFixed(1);
const ext = (p) => (p.match(/\.([a-z0-9]{2,5})$/i)?.[1] ?? '').toLowerCase();
const TYPES = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' };

// 1) Fichiers référencés par les profils.
const rows = [];
for (let off = 0; ; off += 1000) {
  const page = await (await fetch(`${U}/rest/v1/profiles?select=photo_url,cv_url,portfolio_pdf_url&order=id`, {
    headers: { ...H, Range: `${off}-${off + 999}` },
  })).json();
  rows.push(...page);
  if (page.length < 1000) break;
}
const files = [];
for (const r of rows) {
  for (const f of ['cv_url', 'portfolio_pdf_url']) {
    if (r[f] && !/^https?:/.test(r[f])) {
      const [bucket, ...rest] = r[f].split('/');
      files.push({ bucket, key: rest.join('/'), kind: 'doc' });
    }
  }
  const m = r.photo_url?.match(/\/object\/public\/(photos)\/(.+)$/);
  if (m) files.push({ bucket: m[1], key: decodeURIComponent(m[2]), kind: 'photo' });
}

// 2) Tailles (HEAD, aucun octet téléchargé).
const sized = [];
let i = 0;
await Promise.all(Array.from({ length: 12 }, async () => {
  while (i < files.length) {
    const f = files[i++];
    try {
      const res = await fetch(`${U}/storage/v1/object/${f.bucket}/${f.key}`, { method: 'HEAD', headers: H });
      if (res.ok) sized.push({ ...f, size: +res.headers.get('content-length') || 0 });
    } catch { /* ignoré */ }
  }
}));

const total = sized.reduce((s, f) => s + f.size, 0);
const todo = sized
  .filter((f) => f.size >= (f.kind === 'photo' ? MIN_PHOTO : MIN_DOC) && !skip.has(`${f.bucket}/${f.key}`) && ['pdf', 'jpg', 'jpeg', 'png'].includes(ext(f.key)))
  .sort((a, b) => b.size - a.size)
  .slice(0, LIMIT);
console.log(`${sized.length} fichiers référencés, ${mb(total)} Mo au total.`);
console.log(`${todo.length} candidats à la compression (${mb(todo.reduce((s, f) => s + f.size, 0))} Mo) :`);
for (const f of todo.slice(0, 15)) console.log(`  ${mb(f.size).padStart(5)} Mo  ${f.bucket}/${f.key}`);
if (todo.length > 15) console.log(`  … et ${todo.length - 15} autres`);
if (!APPLY) {
  console.log('\nRapport seulement. Relancez avec --apply pour compresser (originaux sauvegardés dans ' + BACKUP + ').');
  process.exit(0);
}

// 3) Compression.
async function pdfChars(file) {
  try { return (await run('pdftotext', [file, '-'])).stdout.replace(/\s+/g, '').length; } catch { return null; }
}
// Rend les pages d'un PDF en niveaux de gris basse définition (PGM) pour les comparer.
let renderId = 0;
async function pages(file, tag) {
  const prefix = path.join(tmp, `r${tag}${++renderId}`);
  await run('pdftoppm', ['-gray', '-r', '15', '-l', '40', file, prefix]).catch(() => {});
  const base = path.basename(prefix) + '-';
  const names = readdirSync(tmp).filter((n) => n.startsWith(base) && n.endsWith('.pgm')).sort();
  return names.map((n) => {
    const b = readFileSync(path.join(tmp, n));
    rmSync(path.join(tmp, n), { force: true });
    const h = b.toString('latin1', 0, 30).split('\n'); // P5 / largeur hauteur / 255
    return { dim: h[1], px: b.subarray(h[0].length + h[1].length + h[2].length + 3) };
  });
}
async function compress(f, input, output) {
  const e = ext(f.key);
  if (e === 'pdf') {
    await run('gs', ['-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.5', '-dPDFSETTINGS=/ebook', '-dNOPAUSE', '-dQUIET', '-dBATCH', `-sOutputFile=${output}`, input], { timeout: 120000 });
    const before = await pdfChars(input);
    const after = await pdfChars(output);
    if (before && before > 200 && (after ?? 0) < before * 0.8) throw new Error('texte perdu');
    // Contrôle visuel de TOUTES les pages (≤ 40) : Ghostscript peut perdre des transparences ou des
    // scans (page blanche) sans toucher au texte. Écart moyen de niveaux de gris > 12/255 → on refuse.
    const [a, b] = [await pages(input, 'a'), await pages(output, 'b')];
    if (!a.length || a.length !== b.length) throw new Error('rendu impossible à vérifier');
    for (let p = 0; p < a.length; p++) {
      if (a[p].dim !== b[p].dim || a[p].px.length !== b[p].px.length) throw new Error('mise en page modifiée');
      let t = 0;
      for (let k = 0; k < a[p].px.length; k++) t += Math.abs(a[p].px[k] - b[p].px[k]);
      if (t / a[p].px.length > 12) throw new Error(`rendu différent (page ${p + 1})`);
    }
  } else {
    const long = f.kind === 'photo' ? '512' : '2000';
    const fmt = e === 'png' ? ['-s', 'format', 'png'] : ['-s', 'format', 'jpeg', '-s', 'formatOptions', '75'];
    await run('sips', ['-Z', long, ...fmt, input, '--out', output]);
  }
}

let saved = 0, replaced = 0;
let n = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (n < todo.length) {
    const f = todo[n++];
    const id = `${f.bucket}/${f.key}`;
    const input = path.join(tmp, `in-${n}.${ext(f.key)}`);
    const output = path.join(tmp, `out-${n}.${ext(f.key)}`);
    try {
      const res = await fetch(`${U}/storage/v1/object/${id}`, { headers: H });
      if (!res.ok) throw new Error(`téléchargement ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const bak = path.join(BACKUP, f.bucket, f.key);
      mkdirSync(path.dirname(bak), { recursive: true });
      writeFileSync(bak, buf); // sauvegarde AVANT toute modification
      writeFileSync(input, buf);
      await compress(f, input, output);
      const out = readFileSync(output);
      if (out.length > buf.length * 0.85) { skip.add(id); console.log(`  = ${id} : gain trop faible (${mb(buf.length)} → ${mb(out.length)} Mo), conservé`); continue; }
      const up = await fetch(`${U}/storage/v1/object/${id}`, {
        method: 'POST',
        headers: { ...H, 'Content-Type': TYPES[ext(f.key)], 'x-upsert': 'true' },
        body: out,
      });
      if (!up.ok) throw new Error(`envoi ${up.status}`);
      saved += buf.length - out.length; replaced++;
      console.log(`  ✓ ${id} : ${mb(buf.length)} → ${mb(out.length)} Mo`);
    } catch (err) {
      skip.add(id);
      console.log(`  ! ${id} : ${err.message.slice(0, 60)} (original conservé)`);
    } finally {
      rmSync(input, { force: true }); rmSync(output, { force: true });
    }
  }
}));
writeFileSync(SKIP_FILE, JSON.stringify([...skip]));
console.log(`\n${replaced} fichiers allégés, ${mb(saved)} Mo récupérés. Originaux dans ${BACKUP}.`);
console.log('Relancez ensuite : node --env-file=.env scripts/extract-cv-text.mjs si des CV ont été remplacés (le texte est conservé, donc facultatif).');
