// i18n du site : mapping des routes FR ↔ EN et libellés du layout.
// Le français reste à la racine (URLs inchangées), l'anglais vit sous /en/.
// Ce mapping est la source unique des hreflang (head + sitemap) et du
// sélecteur de langue — importé par Base.astro ET astro.config.mjs.

export type Lang = 'fr' | 'en';

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
