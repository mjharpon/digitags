// Optimise les images de public/uploads : redimensionne (1600 px max de large),
// recompresse, et convertit les PNG/GIF en WebP. Idempotent : un fichier n'est
// réécrit que s'il devient plus léger.
//
// Les PNG/GIF changent d'extension : les références sont réécrites dans src/
// et une redirection 301 est ajoutée dans public/_redirects pour les anciennes URLs.
//
// Usage : node scripts/optimize-images.mjs [--dry]
import { readdir, readFile, writeFile, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const DRY = process.argv.includes('--dry');
const UPLOADS = 'public/uploads';
const MAX_WIDTH = 1600;
const WEBP_QUALITY = 80;
const JPEG_QUALITY = 80;
const TEXT_ROOTS = ['src'];
const TEXT_EXT = new Set(['.md', '.mdx', '.astro', '.ts', '.js', '.mjs', '.json', '.yml', '.yaml', '.html', '.css']);
const REDIRECTS = 'public/_redirects';

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const mb = (n) => (n / 1048576).toFixed(1);
const renamed = new Map(); // ancienne URL -> nouvelle URL
let before = 0;
let after = 0;
const skipped = [];

const files = (await walk(UPLOADS)).sort();
const existing = new Set(files);

for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  if (!['.png', '.gif', '.jpg', '.jpeg', '.webp'].includes(ext)) continue;

  const original = await readFile(file);
  let meta;
  try {
    meta = await sharp(original, { animated: true }).metadata();
  } catch {
    skipped.push(file); // pas une vraie image (ex. fichiers HTML nommés .jpg)
    continue;
  }
  if (meta.format === 'heif') continue; // AVIF déjà compressé, ignoré

  const animated = (meta.pages ?? 1) > 1;
  const width = meta.width ?? 0;
  let pipeline = sharp(original, { animated }).rotate();
  if (width > MAX_WIDTH) pipeline = pipeline.resize({ width: MAX_WIDTH });

  const toWebp = ext === '.png' || ext === '.gif';
  const target = toWebp ? file.slice(0, -ext.length) + '.webp' : file;
  if (toWebp && existing.has(target)) {
    skipped.push(file + ' (collision avec ' + target + ')');
    continue;
  }

  let buf;
  if (toWebp || ext === '.webp') buf = await pipeline.webp({ quality: WEBP_QUALITY, effort: 5, smartSubsample: true }).toBuffer();
  else buf = await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();

  before += original.length;
  // Un fichier converti est toujours remplacé (même extension = même poids n'a pas de sens) ;
  // les autres ne sont réécrits que s'ils sont plus légers.
  if (!toWebp && buf.length >= original.length) {
    after += original.length;
    continue;
  }
  after += buf.length;

  if (!DRY) {
    await writeFile(target, buf);
    if (target !== file) await unlink(file);
  }
  if (target !== file) {
    renamed.set('/' + path.relative('public', file), '/' + path.relative('public', target));
  }
  console.log(`${path.relative(UPLOADS, file)}  ${mb(original.length)} → ${mb(buf.length)} Mo${target !== file ? '  (→ .webp)' : ''}`);
}

console.log(`\nTotal : ${mb(before)} Mo → ${mb(after)} Mo (${renamed.size} fichiers renommés)`);
if (skipped.length) console.log('Ignorés :\n  ' + skipped.join('\n  '));

if (renamed.size && !DRY) {
  // Réécriture des références dans le contenu et le code.
  const textFiles = [];
  for (const root of TEXT_ROOTS) {
    for (const f of await walk(root)) if (TEXT_EXT.has(path.extname(f))) textFiles.push(f);
  }
  let touched = 0;
  for (const f of textFiles) {
    let txt = await readFile(f, 'utf8');
    let next = txt;
    for (const [from, to] of renamed) next = next.split(from).join(to);
    if (next !== txt) {
      await writeFile(f, next);
      touched++;
    }
  }
  console.log(`${touched} fichiers de contenu mis à jour`);

  // Redirections 301 pour les anciennes URLs déjà indexées.
  let redirects = await readFile(REDIRECTS, 'utf8');
  const lines = [...renamed].filter(([from]) => !redirects.includes(from + ' ')).map(([from, to]) => `${from} ${to} 301`);
  if (lines.length) {
    redirects = redirects.replace(/\n*$/, '\n') + '\n# Images converties en WebP (scripts/optimize-images.mjs)\n' + lines.join('\n') + '\n';
    await writeFile(REDIRECTS, redirects);
    console.log(`${lines.length} redirections ajoutées dans ${REDIRECTS}`);
  }
}
