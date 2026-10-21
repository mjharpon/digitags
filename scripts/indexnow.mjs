// Soumet des URLs à IndexNow (Bing, Yandex, Naver, Seznam, Yep).
//   npm run indexnow -- /blog/mon-article /metiers/ux-designer   → pages précises
//   npm run indexnow -- --all                                    → tout le sitemap
//   npm run indexnow -- --dry --all                              → affiche sans envoyer
//   npm run indexnow -- --new ancien-sitemap.xml                 → seulement les URLs absentes de l'ancien sitemap
//                                                                  (utilisé par le workflow de déploiement)
// Clé : INDEXNOW_KEY dans .env ; le fichier public/<clé>.txt doit être en ligne.
import { existsSync, readFileSync } from 'node:fs';

const HOST = 'digitags.work';
const KEY = process.env.INDEXNOW_KEY;
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const BATCH = 10000;

if (!KEY) {
  console.error('INDEXNOW_KEY manquante (.env).');
  process.exit(1);
}

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const all = args.includes('--all');
const newIdx = args.indexOf('--new');
const prevSitemap = newIdx >= 0 ? args[newIdx + 1] : null;
const paths = args.filter((a, i) => !a.startsWith('--') && i !== newIdx + 1);

const sitemapUrls = (file) =>
  [...readFileSync(file, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

const toUrl = (p) => (p.startsWith('http') ? p : `https://${HOST}${p.startsWith('/') ? '' : '/'}${p}`);

let urls;
if (prevSitemap) {
  // Ancien sitemap absent ou vide : on ne soumet rien plutôt que tout le site.
  if (!existsSync(prevSitemap) || !sitemapUrls(prevSitemap).length) {
    console.log(`Ancien sitemap introuvable (${prevSitemap}), rien à soumettre.`);
    process.exit(0);
  }
  const known = new Set(sitemapUrls(prevSitemap));
  urls = sitemapUrls('dist/sitemap-0.xml').filter((u) => !known.has(u));
  if (!urls.length) {
    console.log('Aucune nouvelle page.');
    process.exit(0);
  }
} else if (all) {
  urls = sitemapUrls('dist/sitemap-0.xml');
} else {
  urls = paths.map(toUrl);
}

if (!urls.length) {
  console.error('Aucune URL. Passe des chemins (/blog/x) ou --all (après npm run build).');
  process.exit(1);
}

const foreign = urls.filter((u) => new URL(u).host !== HOST);
if (foreign.length) {
  console.error(`URLs hors ${HOST} :\n${foreign.join('\n')}`);
  process.exit(1);
}

console.log(`${urls.length} URL(s)${dry ? ' (dry run)' : ''}`);
if (dry) {
  console.log(urls.join('\n'));
  process.exit(0);
}

for (let i = 0; i < urls.length; i += BATCH) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList: urls.slice(i, i + BATCH),
    }),
  });
  console.log(`Lot ${i / BATCH + 1} → HTTP ${res.status}`, res.ok ? '' : await res.text());
  if (!res.ok) process.exitCode = 1;
}
