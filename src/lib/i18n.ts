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

/** Articles de blog traduits (tout le blog depuis nov. 2026) : slug FR (collection blog) → slug EN (collection blog-en). */
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
  '10-astuces-pour-ameliorer-la-vitesse-de-votre-site-web': '10-tips-to-speed-up-your-website',
  'a-la-decouverte-de-figma': 'discovering-figma',
  'code-durable': 'sustainable-code',
  'combien-coute-un-site-web': 'how-much-does-a-website-cost',
  'comment-ameliorer-laccessibilite-web-de-mon-site': 'how-to-improve-website-accessibility',
  'comment-attirer-les-meilleurs-talents-freelances-et-les-fideliser': 'attract-and-retain-top-freelance-talent',
  'comment-choisir-la-meilleure-agence-de-creation-de-sites-web': 'how-to-choose-a-web-design-agency',
  'comment-creer-son-statut-dautoentrepreneur': 'how-to-register-as-an-auto-entrepreneur-in-france',
  'comment-definir-le-budget-et-les-delais-pour-un-projet-necessitant-des-freelances': 'budget-and-timeline-for-a-freelance-project',
  'comment-preparer-un-entretien-freelance': 'how-to-prepare-a-freelance-interview',
  'comment-tourner-les-tendances-du-recrutement-a-son-avantage': 'turning-talent-trends-to-your-advantage',
  'comment-trouver-le-bon-designer-en-freelance': 'how-to-find-the-right-freelance-designer',
  'comment-trouver-le-bon-traffic-manager-en-freelance': 'how-to-find-the-right-freelance-traffic-manager',
  'comment-trouver-le-meilleur-freelance-adapte-au-projet': 'how-to-find-the-best-freelancer-for-your-project',
  'contrat-freelance': 'freelance-contract',
  'dgitags-io-trouve-en-24h-votre-designer-freelance': 'find-your-freelance-designer-in-24-hours',
  'entreprises-du-digital-3-axes-pour-se-preparer-a-la-rse': 'digital-companies-3-ways-to-prepare-for-csr',
  'expert-en-webmarketing-freelance-strategies-et-developpement-marketing-numerique': 'freelance-web-marketing-expert',
  'facturation-electronique-pret-pour-septembre-2026': 'e-invoicing-ready-for-september-2026',
  'figma-vs-sketch-quel-est-le-meilleur-outil-pour-les-designers': 'figma-vs-sketch',
  'freelance-community-manager-b2b': 'freelance-b2b-community-manager',
  'freelance-designer-trouvez-le-bon-professionnel-pour-votre-projet': 'freelance-designer-find-the-right-professional',
  'freelance-senior-vs-junior-comment-choisir': 'senior-vs-junior-freelancer',
  'freelance-tech-competences': 'freelance-tech-skills',
  'guide-complet-pour-la-creation-dun-site-e-commerce': 'complete-guide-to-building-an-e-commerce-site',
  'la-vie-de-digital-nomade': 'digital-nomad-life',
  'le-bitcoin-est-il-vraiment-decentralise': 'is-bitcoin-really-decentralised',
  'le-design-ethique-quest-ce-que-cest': 'what-is-ethical-design',
  'le-growth-recruiting-cest-quoi': 'what-is-growth-recruiting',
  'le-portage-salarial': 'umbrella-companies-portage-salarial',
  'les-12-meilleurs-plugins-wordpress-pour-votre-site': '12-best-wordpress-plugins',
  'les-5-langages-de-programmation-incontournables-en-2025': '5-essential-programming-languages-in-2025',
  'les-6-outils-incontournables-pour-gerer-vos-projets-web': '6-essential-web-project-management-tools',
  'les-6-tendances-de-conception-de-sites-web-a-suivre-en-2024': '6-web-design-trends-2024',
  'les-avantages-de-faire-appel-a-des-freelances': 'benefits-of-working-with-freelancers',
  'les-avantages-de-webflow-pour-creer-son-site-internet': 'benefits-of-webflow',
  'les-avantages-de-wordpress-pour-la-creation-de-sites-web': 'benefits-of-wordpress',
  'les-avantages-dun-collectif-de-freelances-pour-votre-projet': 'benefits-of-a-freelance-collective',
  'les-criteres-pour-choisir-une-agence-de-developpement-web': 'how-to-choose-a-web-development-agency',
  'les-ecoles-de-demain': 'schools-of-tomorrow',
  'les-erreurs-a-eviter-lors-dune-collaboration-avec-des-freelances': 'mistakes-to-avoid-when-working-with-freelancers',
  'les-etapes-cles-pour-la-refonte-de-votre-site-web': 'key-steps-of-a-website-redesign',
  'les-meilleures-plateformes-pour-recruter-des-freelances-en-2025': 'best-freelance-platforms-2025',
  'les-metiers-de-lux': 'ux-careers',
  'les-tendances-de-lia-en-developpement-web': 'ai-trends-in-web-development',
  'les-tendances-sur-le-recrutement-de-freelance': 'freelance-hiring-trends',
  'lexique-freelance': 'freelance-glossary',
  'linterview-de-melanie-michou-ux-writer-freelance': 'interview-melanie-michou-freelance-ux-writer',
  'methode-scrum-vs-cycle-en-v-quelle-methode-adopter': 'scrum-vs-v-model',
  'on-parle-de-nous-dans-forbes-us': 'featured-in-forbes-us',
  'onboarding-freelance-full-remote': 'fully-remote-freelance-onboarding',
  'onboarding-freelance': 'freelance-onboarding',
  'optimiser-sa-comptabilite-en-tant-quauto-entrepreneur': 'accounting-tips-for-auto-entrepreneurs',
  'plateforme-freelance': 'freelance-platform',
  'pourquoi-dgitags-io-et-comment-ca-marche': 'why-digitags-and-how-it-works',
  'pourquoi-embaucher-un-cmo-part-time': 'why-bring-in-a-part-time-cmo',
  'pourquoi-faire-appel-a-un-developpeur-freelance': 'why-work-with-a-freelance-developer',
  'pourquoi-integrer-un-blog-a-votre-site-web': 'why-add-a-blog-to-your-website',
  'pourquoi-recruter-un-freelance-plutot-quun-cdi': 'freelancer-vs-permanent-hire',
  'product-manager-freelance-roadmap': 'freelance-product-manager-roadmap',
  'product-owner-freelance-trouvez-la-personne-ideale-pour-mon-projet': 'freelance-product-owner-find-the-right-fit',
  'product-owner-vs-chef-de-projet': 'product-owner-vs-project-manager',
  'proteger-la-confidentialite-des-donnees-de-votre-entreprise-lorsque-vous-travaillez-avec-des-freelances': 'protecting-data-confidentiality-with-freelancers',
  'quest-ce-que-le-bitcoin': 'what-is-bitcoin',
  'recrutement-freelance-adapter-sa-strategie-selon-la-taille-dentrreprise': 'freelance-strategy-by-company-size',
  'recrutement-freelance-faq': 'working-with-freelancers-faq',
  'recrutement-freelance-scorecard': 'freelance-selection-scorecard',
  'recruter-les-meilleurs-talents-europeens-pour-vos-projets-digitaux': 'top-european-talent-for-digital-projects',
  'rediger-un-cv-percutant-et-faire-la-difference-aupres-des-recruteurs': 'how-to-write-a-standout-cv',
  'revue-sur-bubble': 'bubble-review',
  'roadmap-produit-product-manager-freelance': 'product-roadmap-with-a-freelance-product-manager',
  'scrum-master-freelance-boostez-vos-sprints': 'freelance-scrum-master',
  'securiser-une-mission-freelance-guide-juridique-complet': 'securing-a-freelance-engagement-legal-guide',
  'securiser-vos-donnees-avec-un-freelance-it': 'securing-your-data-with-an-it-freelancer',
  'studios-de-freelances-pour-start-ups-scale-ups': 'freelance-studios-for-startups-and-scale-ups',
  'time-to-market-accelerer-grace-au-recrutement-freelance': 'faster-time-to-market-with-freelancers',
  'tout-savoir-sur-le-back-end-le-front-end-et-le-full-stack': 'back-end-front-end-and-full-stack-explained',
  'un-visa-pour-digital-nomade': 'digital-nomad-visas',
  'webflow-le-cms-du-designer-en-2020': 'webflow-the-designers-cms',
  'webflow-vs-wordpress-quelle-est-la-meilleure-plateforme-de-creation-de-site-web-en-2021': 'webflow-vs-wordpress',
};

/** Libellés EN des tags du blog (les clés restent en français : taxonomie commune FR/EN). */
export const TAG_LABELS_EN: Record<string, string> = {
  design: 'design',
  freelancer: 'freelancing',
  product: 'product',
  recrutement: 'hiring',
  'tech-et-data': 'tech-and-data',
  webmarketing: 'digital-marketing',
};

/** Libellé d'un tag côté EN (repli : la clé elle-même). */
export const tagLabelEn = (tag: string): string => TAG_LABELS_EN[tag] ?? tag;

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
