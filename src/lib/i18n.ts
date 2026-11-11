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
