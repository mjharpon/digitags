// Maillage contextuel : insère des liens vers les fiches métiers dans le corps
// des articles de blog, là où le métier est mentionné naturellement.
// Garde-fous :
//   - 1 lien max par fiche et par article, 3 liens ajoutés max par article ;
//   - jamais dans un titre, un lien existant, un bloc de code ou une image ;
//   - pas de lien vers une fiche déjà liée dans l'article ;
//   - la casse d'origine du texte est conservée (seul un [ ] ( ) est ajouté).
// Relançable : les occurrences déjà liées sont ignorées.
import { readFileSync, writeFileSync } from 'node:fs';
import { readdirSync } from 'node:fs';

const DIR = 'src/content/blog';

// Expressions par fiche, de la plus spécifique à la plus générique.
const TARGETS = [
  ['/metiers/product-owner-freelance', ['product owners?']],
  ['/metiers/product-manager-freelance', ['product managers?']],
  ['/metiers/chef-de-projet-freelance', ['chef(?:fe)?s? de projet']],
  ['/metiers/coach-agile', ['coach(?:ing)? agile']],
  ['/metiers/ux-writer-freelance', ['UX writ(?:ers?|ing)']],
  ['/metiers/ux-designer-freelance', ['UX designers?', 'designers? UX']],
  ['/metiers/ui-designer-freelance', ['UI designers?']],
  ['/metiers/developpeur-front-end-freelance', ['développeurs? front[- ]end']],
  ['/metiers/developpeur-back-end-freelance', ['développeurs? back[- ]end']],
  ['/metiers/full-stack-developpeur-freelance', ['développeurs? full[- ]stack', 'full[- ]stack']],
  ['/metiers/developeur-web-freelance', ['développeurs? web']],
  ['/metiers/freelance-seo', ['consultants? SEO', 'freelances? SEO', 'expert SEO', 'référencement naturel']],
  ['/metiers/expert-sea-freelance', ['experts? SEA', 'Google Ads']],
  ['/metiers/expert-social-ads-freelance', ['Social Ads']],
  ['/metiers/traffic-manager-freelance', ['traffic managers?']],
  ['/metiers/community-manager-freelance', ['community managers?']],
  ['/metiers/account-manager-freelance', ['account managers?']],
];

let filesTouched = 0;
let linksAdded = 0;

for (const file of readdirSync(DIR).filter((f) => f.endsWith('.md'))) {
  const path = `${DIR}/${file}`;
  const src = readFileSync(path, 'utf8');
  const fmEnd = src.indexOf('---', 3);
  if (fmEnd === -1) continue;
  const head = src.slice(0, fmEnd + 3);
  let body = src.slice(fmEnd + 3);

  let added = 0;

  for (const [href, patterns] of TARGETS) {
    if (added >= 3) break;
    if (body.includes(`](${href})`) || body.includes(`](https://digitags.work${href})`)) continue;

    for (const pattern of patterns) {
      if (added >= 3) break;
      const re = new RegExp(`(^|[^\\w/\\[\\]-])(${pattern})(?![\\w-])`, 'iu');

      // Découpage : on ne remplace que dans le texte « nu », jamais dans un
      // lien/image markdown, un bloc de code, un titre ou du HTML inline.
      const segments = body.split(/(```[\s\S]*?```|!?\[[^\]]*\]\([^)]*\)|<[^>]+>|^#+ .*$)/m);
      let done = false;
      for (let i = 0; i < segments.length && !done; i++) {
        const seg = segments[i];
        if (/^```|^!?\[|^<|^#/.test(seg)) continue; // segment protégé
        const m = seg.match(re);
        if (!m) continue;
        segments[i] = seg.replace(re, (_, pre, word) => `${pre}[${word}](${href})`);
        done = true;
      }
      if (done) {
        body = segments.join('');
        added++;
        linksAdded++;
        break; // une seule expression par fiche
      }
    }
  }

  if (added > 0) {
    writeFileSync(path, head + body);
    filesTouched++;
  }
}

console.log(`${linksAdded} liens contextuels ajoutés dans ${filesTouched} articles.`);
