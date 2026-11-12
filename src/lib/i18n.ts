// i18n du site : mapping des routes FR ↔ EN et libellés du layout.
// Le français reste à la racine (URLs inchangées), l'anglais vit sous /en/.
// Ce mapping est la source unique des hreflang (head + sitemap) et du
// sélecteur de langue — importé par Base.astro ET astro.config.mjs.

export type Lang = 'fr' | 'en';

/** Fiches métiers traduites : slug FR (collection metiers) → slug EN (collection metiers-en). */
export const METIER_SLUGS: Record<string, string> = {
  'freelance-seo': 'freelance-seo-consultant',
  'expert-sea-freelance': 'freelance-google-ads-expert',
  'expert-social-ads-freelance': 'freelance-social-ads-expert',
  'traffic-manager-freelance': 'freelance-traffic-manager',
  'community-manager-freelance': 'freelance-community-manager',
  'account-manager-freelance': 'freelance-account-manager',
  'ux-designer-freelance': 'freelance-ux-designer',
  'ui-designer-freelance': 'freelance-ui-designer',
  'ux-writer-freelance': 'freelance-ux-writer',
  'product-manager-freelance': 'freelance-product-manager',
  'product-owner-freelance': 'freelance-product-owner',
  'chef-de-projet-freelance': 'freelance-project-manager',
  'coach-agile': 'freelance-agile-coach',
  'developeur-web-freelance': 'freelance-web-developer',
  'developpeur-front-end-freelance': 'freelance-front-end-developer',
  'developpeur-back-end-freelance': 'freelance-back-end-developer',
  'full-stack-developpeur-freelance': 'freelance-full-stack-developer',
  'product-designer-freelance': 'freelance-product-designer',
  'directeur-artistique-freelance': 'freelance-art-director',
  'motion-designer-freelance': 'freelance-motion-designer',
  'growth-marketer-freelance': 'freelance-growth-marketer',
  'developpeur-mobile-freelance': 'freelance-mobile-developer',
  'tech-lead-freelance': 'freelance-tech-lead',
  'devops-freelance': 'freelance-devops-engineer',
  'data-scientist-freelance': 'freelance-data-scientist',
  'data-engineer-freelance': 'freelance-data-engineer',
  'data-analyst-freelance': 'freelance-data-analyst',
};

/** Fiches projets traduites : slug FR (collection projets) → slug EN (collection projets-en). */
export const PROJET_SLUGS: Record<string, string> = {
  'audit-ux': 'ux-audit',
  'concevoir-un-produit-digital': 'digital-product-design',
  'design-thinking': 'design-thinking',
  'discovery-produit': 'product-discovery',
  'identite-visuelle-creation-ou-refonte': 'visual-identity',
  'mener-une-phase-dux-research': 'ux-research',
  'refonte-de-site-internet': 'website-redesign',
  'strategie-produit': 'product-strategy',
};

/** Articles de blog traduits : slug FR (collection blog) → slug EN (collection blog-en). */
export const BLOG_SLUGS: Record<string, string> = {
  'audit-flash-evaluer-votre-maturite-freelance-ready-en-10-questions': 'freelance-ready-flash-audit',
  'notre-processus-de-matching-freelance-entreprise': 'our-freelance-matching-process',
  'matching-humain-et-recrutement-freelance': 'human-matching-freelance-hiring',
  'reussir-collaboration-long-terme-avec-un-freelance': 'long-term-freelance-collaboration',
  'evaluer-un-freelance-tech-methode-rapide-et-efficace': 'how-to-evaluate-a-tech-freelancer',
  'pourquoi-recruter-des-freelances-en-2026': 'why-hire-freelancers-in-2026',
  'freelancing-2026-chiffres-cles': 'freelancing-2026-key-figures',
  'recrutement-freelance-remote-hybride-ou-on-site': 'freelance-remote-hybrid-or-on-site',
  'ia-generative-mission-freelance-type-et-profils-cles': 'generative-ai-freelance-missions',
  'tjm-freelance': 'freelance-day-rates',
  'les-meilleurs-outils-pour-collaborer-avec-des-freelances': 'best-tools-to-collaborate-with-freelancers',
  'conseils-pour-integrer-des-freelances-a-une-equipe-existante': 'integrating-freelancers-into-your-team',
};

/** Cas clients traduits : slug FR (collection casClients) → slug EN (collection cas-clients-en). */
export const CAS_SLUGS: Record<string, string> = {
  'mon-compte-formation': 'mon-compte-formation',
};

/** Pages traduites : chemin FR → chemin EN (sans slash final). */
export const ROUTES: Record<string, string> = {
  '/': '/en',
  '/design': '/en/design',
  '/sea-social-ads-seo': '/en/digital-marketing',
  '/product-et-project': '/en/product-and-project',
  '/tech-data': '/en/tech-and-data',
  '/equipe-ia': '/en/ai-product-team',
  '/recrutement-freelance': '/en/hire-a-freelancer',
  '/studios-et-collectifs': '/en/studios-and-collectives',
  '/metiers': '/en/roles',
  '/projets': '/en/projects',
  '/blog': '/en/blog',
  '/cas-clients': '/en/case-studies',
  '/le-groupe': '/en/the-group',
  '/contact': '/en/contact',
  '/devenir-freelance': '/en/become-a-freelancer',
  '/merci': '/en/thank-you',
  '/politique-de-protection-des-donnees': '/en/privacy-policy',
};

// Les fiches métiers rejoignent le mapping global (hreflang, sitemap, sélecteur).
for (const [fr, en] of Object.entries(METIER_SLUGS)) {
  ROUTES[`/metiers/${fr}`] = `/en/roles/${en}`;
}
for (const [fr, en] of Object.entries(PROJET_SLUGS)) {
  ROUTES[`/projets/${fr}`] = `/en/projects/${en}`;
}
for (const [fr, en] of Object.entries(CAS_SLUGS)) {
  ROUTES[`/cas-client/${fr}`] = `/en/case-studies/${en}`;
}
for (const [fr, en] of Object.entries(BLOG_SLUGS)) {
  ROUTES[`/blog/${fr}`] = `/en/blog/${en}`;
}

/** Chemin EN → chemin FR (mapping inverse). */
export const ROUTES_EN_FR: Record<string, string> = Object.fromEntries(
  Object.entries(ROUTES).map(([fr, en]) => [en, fr])
);

/** Langue d'une page d'après son chemin (normalisé, sans slash final). */
export const langOf = (path: string): Lang =>
  path === '/en' || path.startsWith('/en/') ? 'en' : 'fr';

/** Chemin de la même page dans l'autre langue, ou null si pas d'alternate. */
export const alternateOf = (path: string): string | null => {
  const p = path.replace(/\/$/, '') || '/';
  return (langOf(p) === 'en' ? ROUTES_EN_FR[p] : ROUTES[p]) ?? null;
};
