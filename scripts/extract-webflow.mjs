// One-time Webflow CMS → Markdown extraction.
// Usage: node --env-file=.env scripts/extract-webflow.mjs [--dry-run]
// Requires WEBFLOW_TOKEN in .env (site token with CMS read + assets read scopes).

import { mkdir, writeFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import TurndownService from 'turndown';

const TOKEN = process.env.WEBFLOW_TOKEN;
const DRY = process.argv.includes('--dry-run');
if (!TOKEN) {
  console.error('WEBFLOW_TOKEN manquant. Ajoutez-le dans .env puis relancez avec: node --env-file=.env scripts/extract-webflow.mjs');
  process.exit(1);
}

const API = 'https://api.webflow.com/v2';
const OUT_BLOG = 'src/content/blog';
const OUT_UPLOADS = 'public/uploads/blog';

async function wf(pathname) {
  const res = await fetch(`${API}${pathname}`, {
    headers: { Authorization: `Bearer ${TOKEN}`, accept: 'application/json' },
  });
  if (res.status === 429) {
    const wait = Number(res.headers.get('retry-after') ?? 10);
    console.log(`  … rate limit, pause ${wait}s`);
    await new Promise((r) => setTimeout(r, wait * 1000));
    return wf(pathname);
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} on ${pathname}: ${await res.text()}`);
  return res.json();
}

const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
td.keep(['iframe', 'video']);

const sanitize = (s) => String(s ?? '').replace(/"/g, '\\"').trim();

async function downloadImage(url, slug, index) {
  try {
    const ext = (new URL(url).pathname.match(/\.(png|jpe?g|webp|gif|avif|svg)$/i)?.[0] ?? '.jpg').toLowerCase();
    const filename = `${slug}-${index}${ext}`;
    const dest = path.join(OUT_UPLOADS, filename);
    if (!DRY) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
    }
    return `/uploads/blog/${filename}`;
  } catch (e) {
    console.warn(`  ! image non téléchargée (${url}): ${e.message}`);
    return url; // keep the remote URL as fallback
  }
}

async function main() {
  await mkdir(OUT_BLOG, { recursive: true });
  await mkdir(OUT_UPLOADS, { recursive: true });

  const { sites } = await wf('/sites');
  console.log('Sites:', sites.map((s) => `${s.displayName} (${s.id})`).join(', '));
  const site = sites.find((s) => /digitags/i.test(s.displayName + s.shortName)) ?? sites[0];
  console.log(`→ Site retenu: ${site.displayName}`);

  const { collections } = await wf(`/sites/${site.id}/collections`);
  console.log('Collections:', collections.map((c) => `${c.displayName} [${c.slug}]`).join(' | '));

  const blogCol = collections.find((c) => /blog|article|post/i.test(c.displayName + c.slug));
  if (!blogCol) throw new Error('Collection blog introuvable — vérifiez la liste ci-dessus.');

  // Inspect the schema to find the right field keys.
  const colDetail = await wf(`/collections/${blogCol.id}`);
  console.log('Champs:', colDetail.fields.map((f) => `${f.slug}(${f.type})`).join(', '));
  const richTextField = colDetail.fields.find((f) => f.type === 'RichText')?.slug;
  const imageField = colDetail.fields.find((f) => f.type === 'Image')?.slug;
  const summaryField = colDetail.fields.find((f) => /summary|resume|excerpt|description|meta/i.test(f.slug) && f.type === 'PlainText')?.slug;
  const refTagField = colDetail.fields.find((f) => f.type === 'Reference' || f.type === 'MultiReference')?.slug;

  // Resolve tag/category references if present.
  const tagNames = {};
  for (const col of collections) {
    if (/tag|categor/i.test(col.displayName + col.slug)) {
      let offset = 0;
      for (;;) {
        const page = await wf(`/collections/${col.id}/items?limit=100&offset=${offset}`);
        for (const it of page.items) tagNames[it.id] = it.fieldData.slug ?? it.fieldData.name;
        offset += page.items.length;
        if (offset >= (page.pagination?.total ?? 0) || page.items.length === 0) break;
      }
    }
  }

  let offset = 0;
  const all = [];
  for (;;) {
    const page = await wf(`/collections/${blogCol.id}/items?limit=100&offset=${offset}`);
    all.push(...page.items);
    offset += page.items.length;
    if (offset >= (page.pagination?.total ?? 0) || page.items.length === 0) break;
  }
  console.log(`\n${all.length} articles trouvés.\n`);

  const report = [];
  for (const item of all) {
    const f = item.fieldData;
    const slug = f.slug;
    const title = f.name;
    let html = richTextField ? (f[richTextField] ?? '') : '';

    // Download body images and rewrite URLs.
    let imgIndex = 0;
    const imgUrls = [...html.matchAll(/src="(https?:\/\/[^"]+)"/g)].map((m) => m[1]);
    for (const url of imgUrls) {
      const local = await downloadImage(url, slug, imgIndex++);
      html = html.replaceAll(url, local);
    }

    let cover = imageField ? f[imageField]?.url : undefined;
    if (cover) cover = await downloadImage(cover, slug, 'cover');

    const refs = refTagField ? [].concat(f[refTagField] ?? []) : [];
    const tags = refs.map((id) => tagNames[id]).filter(Boolean);

    const md = td.turndown(html);
    const date = item.lastPublished ?? item.createdOn;
    const isDraft = item.isDraft || !item.lastPublished;

    const fm = [
      '---',
      `title: "${sanitize(title)}"`,
      summaryField && f[summaryField] ? `description: "${sanitize(f[summaryField])}"` : null,
      date ? `date: ${date.slice(0, 10)}` : null,
      tags.length ? `tags: [${tags.join(', ')}]` : null,
      cover ? `image: "${cover}"` : null,
      isDraft ? 'draft: true' : null,
      '---',
    ].filter(Boolean).join('\n');

    if (!DRY) await writeFile(path.join(OUT_BLOG, `${slug}.md`), `${fm}\n\n${md}\n`);
    report.push(`${isDraft ? '[brouillon] ' : ''}${slug}`);
    console.log(`✓ ${slug}${isDraft ? ' (brouillon)' : ''}`);
  }

  console.log(`\nTerminé : ${report.length} articles écrits dans ${OUT_BLOG}/`);
  console.log('Pensez à vérifier le build : npm run build');
}

main().catch((e) => { console.error(e); process.exit(1); });
