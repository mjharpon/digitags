// Génère les images de partage des articles : un JPEG 1200×630 par couverture
// (frontmatter `image` de src/content/blog et blog-en) dans public/og/, dossier
// non versionné. Lancé en tête de `npm run build`.
// - Incrémental : une image n'est refaite que si sa couverture est plus récente.
// - Recadrage centré sur la zone la plus « intéressante » de la couverture.
// - Une couverture illisible reçoit l'image par défaut : l'URL annoncée dans les
//   balises og:image existe donc toujours.
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { OG_WIDTH, OG_HEIGHT, ogCoverPath } from '../src/lib/og.mjs';

const CONTENT = ['src/content/blog', 'src/content/blog-en'];
const OUT_DIR = 'public/og';
const FALLBACK = 'public/assets/og-default.png';

// couverture (chemin public) → fichier de sortie
const covers = new Map();
for (const dir of CONTENT) {
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
    const image = readFileSync(join(dir, file), 'utf8').match(/^image:\s*"?([^"\n]+?)"?\s*$/m)?.[1];
    if (!image) continue;
    const out = join('public', ogCoverPath(image));
    const known = [...covers].find(([src, o]) => o === out && src !== image);
    if (known) throw new Error(`Deux couvertures donnent la même image de partage : ${known[0]} et ${image}`);
    covers.set(image, out);
  }
}

mkdirSync(OUT_DIR, { recursive: true });
const toJpeg = (input) =>
  sharp(input)
    .rotate()
    .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover', position: sharp.strategy.attention })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 80, mozjpeg: true });

let made = 0;
let kept = 0;
const failed = [];
for (const [image, out] of covers) {
  const src = join('public', image);
  if (existsSync(src) && existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs) {
    kept++;
    continue;
  }
  try {
    await toJpeg(src).toFile(out);
  } catch (err) {
    failed.push(`${image} (${err.message})`);
    await toJpeg(FALLBACK).toFile(out);
  }
  made++;
}

// Ménage : images de partage dont la couverture n'est plus utilisée.
const wanted = new Set([...covers.values()]);
let removed = 0;
for (const f of readdirSync(OUT_DIR)) {
  if (!wanted.has(join(OUT_DIR, f))) {
    unlinkSync(join(OUT_DIR, f));
    removed++;
  }
}

console.log(`build-og-covers : ${covers.size} images de partage (${made} générées, ${kept} à jour, ${removed} supprimées)`);
if (failed.length) console.warn(`  couvertures illisibles, image par défaut utilisée :\n  ${failed.join('\n  ')}`);
