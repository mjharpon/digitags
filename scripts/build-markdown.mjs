// Génère une version Markdown de chaque page construite (dist/**/*.html → .md),
// servie aux agents via la négociation de contenu « Accept: text/markdown »
// (Worker workers/markdown). Format calqué sur « Markdown for Agents » de
// Cloudflare : frontmatter YAML (title/description), corps converti depuis
// <main> (nav, footer, scripts et décors exclus), JSON-LD en bloc ```json.
// Lancé par `npm run build` après le tri du sitemap.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import TurndownService from 'turndown';

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : []
  );

const EXCLUDE = /^dist\/(404|talents|merci)\.html$|^dist\/cms\//;

const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
td.remove(['script', 'style', 'noscript', 'form', 'button', 'svg', 'iframe']);

const meta = (html, re) => html.match(re)?.[1]?.trim();
const unescape = (s) =>
  s?.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');

let count = 0;
for (const file of walk('dist')) {
  if (EXCLUDE.test(file)) continue;
  const html = readFileSync(file, 'utf8');

  const title = unescape(meta(html, /<title>([\s\S]*?)<\/title>/i));
  const description = unescape(meta(html, /<meta name="description" content="([\s\S]*?)"/i));
  const jsonLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1].trim());

  const main = html.match(/<main>([\s\S]*?)<\/main>/i)?.[1] ?? html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? '';
  // Le fil d'Ariane et les blocs purement décoratifs n'apportent rien en Markdown.
  const cleaned = main
    .replace(/<nav class="crumbs"[\s\S]*?<\/nav>/g, '')
    .replace(/<svg[\s\S]*?<\/svg>/g, '')
    .replace(/ aria-hidden="true"[^>]*>[\s\S]*?(?=<)/g, '>');

  let md = td.turndown(cleaned).replace(/\n{3,}/g, '\n\n').trim();

  const fm = ['---'];
  if (title) fm.push(`title: ${JSON.stringify(title)}`);
  if (description) fm.push(`description: ${JSON.stringify(description)}`);
  fm.push('---');

  let out = `${fm.join('\n')}\n\n${md}\n`;
  if (jsonLd.length) out += `\n\`\`\`json\n${jsonLd.join('\n')}\n\`\`\`\n`;

  writeFileSync(file.replace(/\.html$/, '.md'), out);
  count++;
}
console.log(`build-markdown : ${count} pages converties en .md`);
