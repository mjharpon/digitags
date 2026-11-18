// Maillage contextuel FR + EN : insère des liens dans le corps des articles de
// blog (et des fiches métiers) là où un métier, un type de projet ou une offre
// est mentionné naturellement. Remplace link-metiers.mjs (FR, métiers seuls).
//
// Garde-fous :
//   - 1 lien max par cible et par page, 3 liens ajoutés max par page et par passage ;
//   - jamais dans un titre, un lien existant, un bloc de code, une image ou du HTML ;
//   - pas de lien vers une cible déjà liée dans la page, jamais d'auto-lien ;
//   - la casse d'origine du texte est conservée (seuls [ ] ( ) sont ajoutés).
// Relançable : les cibles déjà liées sont ignorées.
//   node scripts/link-contextual.mjs           → applique
//   node scripts/link-contextual.mjs --dry     → compte seulement
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const DRY = process.argv.includes('--dry');
const MAX_ADDED = 3;

// Cibles par ordre de priorité : d'abord les pages qui reçoivent peu de liens
// (projets, offre IA, métiers jamais liés), puis les métiers déjà bien servis.
const FR = {
  dirs: ['src/content/blog', 'src/content/metiers'],
  targets: [
    ['/projets/design-thinking', ['design thinking']],
    ['/projets/discovery-produit', ['discovery produit', 'product discovery', 'phase de discovery']],
    ['/projets/strategie-produit', ['stratégie produit']],
    ['/projets/audit-ux', ['audits? UX', 'audits? d[’\']expérience utilisateur']],
    ['/projets/mener-une-phase-dux-research', ['UX research', 'recherche utilisateur']],
    ['/projets/identite-visuelle-creation-ou-refonte', ['identité visuelle']],
    ['/projets/refonte-de-site-internet', ['refonte de (?:votre |son |leur )?site(?: web| internet)?']],
    ['/projets/concevoir-un-produit-digital', ['produits? digita(?:l|ux)', 'produits? numériques?']],
    ['/equipe-ia', ['IA générative', 'agents? IA']],
    ['/metiers/data-scientist-freelance', ['data scientists?', 'data science']],
    ['/metiers/data-engineer-freelance', ['data engineers?', 'data engineering']],
    ['/metiers/data-analyst-freelance', ['data analysts?', 'analystes? de données']],
    ['/metiers/devops-freelance', ['DevOps']],
    ['/metiers/developpeur-mobile-freelance', ['développeurs? mobiles?', 'applications? mobiles?']],
    ['/metiers/directeur-artistique-freelance', ['directeurs? artistiques?', 'direction artistique']],
    ['/metiers/growth-marketer-freelance', ['growth marketers?', 'growth hack(?:ers?|ing)', 'growth marketing']],
    ['/metiers/motion-designer-freelance', ['motion designers?', 'motion design']],
    ['/metiers/product-designer-freelance', ['product designers?']],
    ['/metiers/tech-lead-freelance', ['tech leads?', 'lead dev(?:eloppeurs?)?']],
    ['/metiers/product-owner-freelance', ['product owners?']],
    ['/metiers/product-manager-freelance', ['product managers?']],
    ['/metiers/chef-de-projet-freelance', ['chef(?:fe)?s? de projet']],
    ['/metiers/coach-agile', ['coach(?:ing)? agile', 'scrum masters?']],
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
  ],
};

const EN = {
  dirs: ['src/content/blog-en', 'src/content/metiers-en'],
  targets: [
    ['/en/projects/design-thinking', ['design thinking']],
    ['/en/projects/product-discovery', ['product discovery', 'discovery phase']],
    ['/en/projects/product-strategy', ['product strategy']],
    ['/en/projects/ux-audit', ['UX audits?']],
    ['/en/projects/ux-research', ['UX research', 'user research']],
    ['/en/projects/visual-identity', ['visual identity', 'brand identity']],
    ['/en/projects/website-redesign', ['website redesigns?', 'redesign(?:ing)? (?:your |a |the )?website']],
    ['/en/projects/digital-product-design', ['digital products?']],
    ['/en/ai-product-team', ['generative AI', 'AI agents?']],
    ['/en/roles/freelance-data-scientist', ['data scientists?', 'data science']],
    ['/en/roles/freelance-data-engineer', ['data engineers?', 'data engineering']],
    ['/en/roles/freelance-data-analyst', ['data analysts?']],
    ['/en/roles/freelance-devops-engineer', ['DevOps']],
    ['/en/roles/freelance-mobile-developer', ['mobile developers?', 'mobile apps?']],
    ['/en/roles/freelance-art-director', ['art directors?', 'art direction']],
    ['/en/roles/freelance-growth-marketer', ['growth marketers?', 'growth hack(?:ers?|ing)', 'growth marketing']],
    ['/en/roles/freelance-motion-designer', ['motion designers?', 'motion design']],
    ['/en/roles/freelance-product-designer', ['product designers?']],
    ['/en/roles/freelance-tech-lead', ['tech leads?', 'lead developers?']],
    ['/en/roles/freelance-product-owner', ['product owners?']],
    ['/en/roles/freelance-product-manager', ['product managers?']],
    ['/en/roles/freelance-project-manager', ['project managers?']],
    ['/en/roles/freelance-agile-coach', ['agile coach(?:es|ing)?', 'scrum masters?']],
    ['/en/roles/freelance-ux-writer', ['UX writ(?:ers?|ing)']],
    ['/en/roles/freelance-ux-designer', ['UX designers?']],
    ['/en/roles/freelance-ui-designer', ['UI designers?']],
    ['/en/roles/freelance-front-end-developer', ['front[- ]end developers?']],
    ['/en/roles/freelance-back-end-developer', ['back[- ]end developers?']],
    ['/en/roles/freelance-full-stack-developer', ['full[- ]stack developers?', 'full[- ]stack']],
    ['/en/roles/freelance-web-developer', ['web developers?']],
    ['/en/roles/freelance-seo-consultant', ['SEO consultants?', 'SEO experts?', 'SEO freelancers?']],
    ['/en/roles/freelance-google-ads-expert', ['Google Ads']],
    ['/en/roles/freelance-social-ads-expert', ['social ads']],
    ['/en/roles/freelance-traffic-manager', ['traffic managers?']],
    ['/en/roles/freelance-community-manager', ['community managers?']],
    ['/en/roles/freelance-account-manager', ['account managers?']],
  ],
};

let filesTouched = 0;
let linksAdded = 0;
const perTarget = {};

for (const { dirs, targets } of [FR, EN]) {
  for (const dir of dirs) {
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
      const path = `${dir}/${file}`;
      const selfSlug = file.replace(/\.md$/, '');
      const src = readFileSync(path, 'utf8');
      const fmEnd = src.indexOf('\n---', 3);
      if (fmEnd === -1) continue;
      const head = src.slice(0, fmEnd + 4);
      let body = src.slice(fmEnd + 4);
      let added = 0;

      for (const [href, patterns] of targets) {
        if (added >= MAX_ADDED) break;
        if (href.endsWith(`/${selfSlug}`)) continue; // jamais d'auto-lien
        if (body.includes(`](${href})`) || body.includes(`](https://www.digitags.work${href})`)) continue;

        for (const pattern of patterns) {
          const re = new RegExp(`(^|[^\\p{L}\\p{N}/\\[\\]-])(${pattern})(?![\\p{L}\\p{N}-])`, 'iu');
          // On ne remplace que dans le texte « nu » : jamais dans un lien/image
          // markdown, un bloc de code, du code inline, un titre ou du HTML.
          const segments = body.split(/(```[\s\S]*?```|`[^`\n]*`|!?\[[^\]]*\]\([^)]*\)|<[^>]+>|^#+ .*$)/m);
          let done = false;
          for (let i = 0; i < segments.length && !done; i++) {
            const seg = segments[i];
            if (/^```|^`|^!?\[|^<|^#/.test(seg)) continue;
            if (!re.test(seg)) continue;
            segments[i] = seg.replace(re, (_, pre, word) => `${pre}[${word}](${href})`);
            done = true;
          }
          if (done) {
            body = segments.join('');
            added++;
            linksAdded++;
            perTarget[href] = (perTarget[href] ?? 0) + 1;
            break; // une seule expression par cible
          }
        }
      }

      if (added > 0) {
        if (!DRY) writeFileSync(path, head + body);
        filesTouched++;
      }
    }
  }
}

console.log(`${linksAdded} liens contextuels ${DRY ? 'possibles' : 'ajoutés'} dans ${filesTouched} pages.`);
console.log(Object.entries(perTarget).sort((a, b) => b[1] - a[1]).map(([h, n]) => `${n}\t${h}`).join('\n'));
