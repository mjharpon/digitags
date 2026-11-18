// Liens « À lire aussi » / « Read also » dans le corps des articles (FR + EN).
// Pour chaque article, insère avant son 2e intertitre (##) un encadré pointant
// vers un article proche (même calcul de pertinence que le bloc « À lire
// ensuite », src/lib/related-core.mjs), en privilégiant les articles qui ne
// sont encore cités dans le texte d'aucun autre article.
//
// Garde-fous : 1 encadré par article ; jamais un article déjà lié dans le texte
// ni un des 3 articles du bloc « À lire ensuite » (pour diversifier les liens) ;
// rien si l'article a moins de 2 intertitres. Relançable : un article qui a
// déjà son encadré est ignoré.
//   node scripts/link-read-also.mjs [--dry]
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { pickRelated } from '../src/lib/related-core.mjs';

const DRY = process.argv.includes('--dry');
// Articles « maison » (présentation de digitags, presse) : vocabulaire très
// général, ils ressortaient comme voisins d'articles sans rapport. Jamais cibles.
const NO_TARGET = new Set([
  'pourquoi-dgitags-io-et-comment-ca-marche', 'on-parle-de-nous-dans-forbes-us',
  'why-digitags-and-how-it-works', 'featured-in-forbes-us',
]);
const LANGS = [
  { dir: 'src/content/blog', prefix: '/blog/', label: '**À lire aussi :**' },
  { dir: 'src/content/blog-en', prefix: '/en/blog/', label: '**Read also:**' },
];

const field = (fm, name) => {
  const m = fm.match(new RegExp(`^${name}:\\s*(.*)$`, 'm'));
  if (!m) return undefined;
  return m[1].trim().replace(/^["']|["']$/g, '');
};

for (const { dir, prefix, label } of LANGS) {
  const posts = readdirSync(dir).filter((f) => f.endsWith('.md')).sort().map((file) => {
    const path = `${dir}/${file}`;
    const src = readFileSync(path, 'utf8');
    const fmEnd = src.indexOf('\n---', 3);
    const fm = src.slice(0, fmEnd);
    const tags = (fm.match(/^tags:\s*\[(.*)\]/m)?.[1] ?? '').split(',').map((t) => t.trim()).filter(Boolean);
    return {
      id: file.replace(/\.md$/, ''), path, src, fmEnd,
      body: src.slice(fmEnd + 4),
      draft: /^draft:\s*true/m.test(fm),
      data: { title: field(fm, 'title') ?? '', description: field(fm, 'description') ?? '', tags },
    };
  }).filter((p) => !p.draft);

  const { ranked, picks, sim } = pickRelated(posts, 3);
  const linksTo = (p, q) => p.body.includes(`](${prefix}${q.id})`) || p.body.includes(`](https://www.digitags.work${prefix}${q.id})`);
  const inbound = posts.map((q) => posts.filter((p) => p !== q && linksTo(p, q)).length);

  let added = 0;
  posts.forEach((p, i) => {
    if (p.body.includes(label)) return;
    const h2 = [...p.body.matchAll(/^## .*$/gm)];
    if (h2.length < 2) return;
    // Candidats : les plus proches hors bloc « à lire ensuite », et au moins
    // 85 % aussi pertinents que le meilleur d'entre eux (la pertinence prime).
    const pool = ranked[i].slice(0, 10).filter((j) => !picks[i].includes(j) && !NO_TARGET.has(posts[j].id) && !linksTo(p, posts[j]));
    // Seuil absolu : un article sans voisin vraiment proche (sujet isolé) n'a pas d'encadré.
    if (!pool.length || sim[i][pool[0]] < 0.135) return;
    const candidates = pool.filter((j) => sim[i][j] >= 0.85 * sim[i][pool[0]]).slice(0, 4);
    const j = candidates.reduce((a, b) => (inbound[b] < inbound[a] ? b : a), candidates[0]);
    const q = posts[j];
    const box = `> ${label} [${q.data.title}](${prefix}${q.id})\n\n`;
    const at = h2[1].index;
    p.body = p.body.slice(0, at) + box + p.body.slice(at);
    inbound[j]++;
    added++;
    if (!DRY) writeFileSync(p.path, p.src.slice(0, p.fmEnd + 4) + p.body);
  });
  const zero = inbound.filter((n) => n === 0).length;
  console.log(`${dir} : ${added} encadrés ${DRY ? 'possibles' : 'ajoutés'} ; articles jamais cités dans un texte : ${zero}/${posts.length}`);
}
