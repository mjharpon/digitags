// One-time Webflow CMS → Markdown extraction des fiches Métiers, Projets et Cas Clients.
// Usage: node --env-file=.env scripts/extract-webflow-fiches.mjs [--dry-run]
// Requires WEBFLOW_TOKEN in .env (site token with CMS read + assets read scopes).

import { mkdir, writeFile } from 'node:fs/promises';
import { createWriteStream, existsSync } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import TurndownService from 'turndown';

const TOKEN = process.env.WEBFLOW_TOKEN;
const DRY = process.argv.includes('--dry-run');
if (!TOKEN) {
  console.error('WEBFLOW_TOKEN manquant. Ajoutez-le dans .env puis relancez avec: node --env-file=.env scripts/extract-webflow-fiches.mjs');
  process.exit(1);
}

const API = 'https://api.webflow.com/v2';

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

const sanitize = (s) => String(s ?? '').replace(/"/g, '\\"').replace(/\s+/g, ' ').trim();

async function downloadImage(url, outDir, publicPrefix, slug, index) {
  try {
    const ext = (new URL(url).pathname.match(/\.(png|jpe?g|webp|gif|avif|svg)$/i)?.[0] ?? '.jpg').toLowerCase();
    const filename = `${slug}-${index}${ext}`;
    const dest = path.join(outDir, filename);
    if (!DRY && !existsSync(dest)) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
    }
    return `${publicPrefix}/${filename}`;
  } catch (e) {
    console.warn(`  ! image non téléchargée (${url}): ${e.message}`);
    return url; // keep the remote URL as fallback
  }
}

// Describes, per collection, how to map Webflow fields to the markdown output.
// `sections` are appended to the body as `## header` + image + rich text.
const TARGETS = [
  {
    slug: 'metiers',
    contentDir: 'src/content/metiers',
    uploadsDir: 'public/uploads/metiers',
    publicPrefix: '/uploads/metiers',
    intro: 'page-intro',
    sections: [
      { header: 'blue-section-header', image: 'blue-section-image', body: 'blue-section-description' },
    ],
  },
  {
    slug: 'projets',
    contentDir: 'src/content/projets',
    uploadsDir: 'public/uploads/projets',
    publicPrefix: '/uploads/projets',
    intro: 'page-intro',
    sections: [
      { header: 'red-section-header', image: 'red-section-image', body: 'red-section-description' },
      { header: 'blue-section-header', image: 'blue-section-image', body: 'blue-section-description' },
    ],
  },
  {
    slug: 'cas-client',
    contentDir: 'src/content/cas-clients',
    uploadsDir: 'public/uploads/cas-clients',
    publicPrefix: '/uploads/cas-clients',
    intro: 'header-intro',
    descriptionField: 'title', // the `title` field holds a long SEO sentence, not a display title
    coverField: 'background-image',
    sections: [
      { header: 'blue-section-title', image: 'blue-section-image', body: 'blue-section-description' },
    ],
  },
];

async function main() {
  const { sites } = await wf('/sites');
  const site = sites.find((s) => /digitags/i.test(s.displayName + s.shortName)) ?? sites[0];
  console.log(`→ Site: ${site.displayName}`);

  const { collections } = await wf(`/sites/${site.id}/collections`);

  // Resolve blog-category references → tag slugs (Tags collection).
  const tagCol = collections.find((c) => c.slug === 'tag');
  const tagSlugs = {};
  if (tagCol) {
    const page = await wf(`/collections/${tagCol.id}/items?limit=100`);
    for (const it of page.items) tagSlugs[it.id] = it.fieldData.slug ?? it.fieldData.name;
  }

  for (const target of TARGETS) {
    const col = collections.find((c) => c.slug === target.slug);
    if (!col) {
      console.warn(`!! Collection "${target.slug}" introuvable — ignorée.`);
      continue;
    }
    await mkdir(target.contentDir, { recursive: true });
    await mkdir(target.uploadsDir, { recursive: true });

    const all = [];
    let offset = 0;
    for (;;) {
      const page = await wf(`/collections/${col.id}/items?limit=100&offset=${offset}`);
      all.push(...page.items);
      offset += page.items.length;
      if (offset >= (page.pagination?.total ?? 0) || page.items.length === 0) break;
    }
    console.log(`\n=== ${col.displayName} [${target.slug}] : ${all.length} éléments`);

    let written = 0;
    for (const item of all) {
      const f = item.fieldData;
      const slug = f.slug;
      if (item.isArchived || !item.lastPublished) {
        console.log(`– ${slug} ignoré (${item.isArchived ? 'archivé' : 'jamais publié'})`);
        continue;
      }

      const title = (f.name ?? '').trim();
      const description = f[target.descriptionField ?? 'meta-description'];
      let imgIndex = 0;

      // Body: intro, then each colored section as `## header` + image + text.
      const parts = [f[target.intro] ?? ''];
      for (const s of target.sections) {
        const header = (f[s.header] ?? '').trim();
        const img = f[s.image]?.url;
        const body = f[s.body] ?? '';
        if (!header && !img && !body) continue;
        let block = header ? `<h2>${header}</h2>` : '';
        if (img) block += `<p><img src="${img}" alt="${sanitize(f[s.image]?.alt ?? header)}"></p>`;
        block += body;
        parts.push(block);
      }
      let html = parts.join('\n');

      // The live domain will point to this site: make internal links relative.
      html = html.replace(/https?:\/\/(www\.)?digitags\.work(\/|(?=["#?]))/g, '/');

      // Download every image and rewrite URLs.
      const imgUrls = [...new Set([...html.matchAll(/src="(https?:\/\/[^"]+)"/g)].map((m) => m[1]))];
      for (const url of imgUrls) {
        const local = await downloadImage(url, target.uploadsDir, target.publicPrefix, slug, imgIndex++);
        html = html.replaceAll(url, local);
      }

      let cover = f[target.coverField ?? 'image']?.url;
      if (cover) cover = await downloadImage(cover, target.uploadsDir, target.publicPrefix, slug, 'cover');

      const blogCategory = tagSlugs[f['blog-category']] ?? null;
      const md = td.turndown(html);

      const fm = [
        '---',
        `title: "${sanitize(title)}"`,
        f['meta-title'] ? `metaTitle: "${sanitize(f['meta-title'])}"` : null,
        description ? `description: "${sanitize(description)}"` : null,
        cover ? `image: "${cover}"` : null,
        Number.isFinite(f.order) ? `order: ${f.order}` : null,
        blogCategory ? `blogCategory: "${blogCategory}"` : null,
        '---',
      ].filter(Boolean).join('\n');

      if (!DRY) await writeFile(path.join(target.contentDir, `${slug}.md`), `${fm}\n\n${md}\n`);
      written++;
      console.log(`✓ ${slug}`);
    }
    console.log(`→ ${written} fiches écrites dans ${target.contentDir}/`);
  }

  console.log('\nTerminé. Pensez à vérifier le build : npm run build');
}

main().catch((e) => { console.error(e); process.exit(1); });
