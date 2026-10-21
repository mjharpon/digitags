// Soumet des URLs à IndexNow (Bing, Yandex, Naver, Seznam, Yep).
//   npm run indexnow -- /blog/mon-article /metiers/ux-designer   → pages précises
//   npm run indexnow -- --all                                    → tout le sitemap
//   npm run indexnow -- --dry --all                              → affiche sans envoyer
// Clé : INDEXNOW_KEY dans .env ; le fichier public/<clé>.txt doit être en ligne.
import { readFileSync } from 'node:fs';

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
const paths = args.filter((a) => !a.startsWith('--'));

const toUrl = (p) => (p.startsWith('http') ? p : `https://${HOST}${p.startsWith('/') ? '' : '/'}${p}`);

let urls;
if (all) {
  const xml = readFileSync('dist/sitemap-0.xml', 'utf8');
  urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
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
