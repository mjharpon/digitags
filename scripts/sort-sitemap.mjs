// Réordonne dist/sitemap-0.xml par importance éditoriale :
// home → pages services → métiers → projets → cas clients → pages annexes
// → articles de blog → tags → politique. Lancé après `astro build`
// (npm run build). L'ordre n'influence pas Google mais garde un sitemap lisible.
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'dist/sitemap-0.xml';

// Plus le rang est bas, plus l'URL est haut dans le fichier.
const RANKS = [
  [/^\/$/, 0],
  [/^\/(equipe-ia|design|tech-data|product-et-project|sea-social-ads-seo|studios-et-collectifs|recrutement-freelance)$/, 1], // services
  [/^\/metiers$/, 2],
  [/^\/metiers\//, 3],
  [/^\/projets$/, 4],
  [/^\/projets\//, 5],
  [/^\/cas-clients$/, 6],
  [/^\/cas-client\//, 7],
  [/^\/(devenir-freelance|contact)$/, 8],
  [/^\/blog$/, 9],
  [/^\/blog\//, 10],
  [/^\/tag\//, 11],
  [/^\/politique-de-protection-des-donnees$/, 12],
];

const rankOf = (path) => {
  for (const [re, rank] of RANKS) if (re.test(path)) return rank;
  return 8.5; // pages non classées : avant le blog
};

const xml = readFileSync(FILE, 'utf8');
const entries = [...xml.matchAll(/<url>.*?<\/url>/gs)].map((m) => m[0]);
if (entries.length === 0) {
  console.error('sort-sitemap : aucun <url> trouvé, fichier inchangé.');
  process.exit(0);
}

const pathOf = (entry) => {
  const loc = entry.match(/<loc>https?:\/\/[^/<]+([^<]*)<\/loc>/)?.[1] ?? '/';
  return loc.replace(/\/$/, '') || '/';
};

entries.sort((a, b) => {
  const pa = pathOf(a), pb = pathOf(b);
  return rankOf(pa) - rankOf(pb) || pa.localeCompare(pb, 'fr');
});

const head = xml.slice(0, xml.indexOf('<url>'));
const tail = xml.slice(xml.lastIndexOf('</url>') + '</url>'.length);
writeFileSync(FILE, head + entries.join('') + tail);
console.log(`sort-sitemap : ${entries.length} URLs réordonnées (services → métiers → projets → blog).`);
