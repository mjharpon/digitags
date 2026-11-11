import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import { ROUTES, ROUTES_EN_FR } from './src/lib/i18n.ts';

// Priorité SEO par type de page (sitemap).
const PRIORITY_RULES = [
  { re: /^\/$/, priority: 1.0, changefreq: 'weekly' },
  { re: /^\/blog$/, priority: 0.8, changefreq: 'weekly' },
  { re: /^\/(metiers|projets|cas-clients|equipe-ia|design|tech-data|product-et-project|sea-social-ads-seo|recrutement-freelance|studios-et-collectifs|devenir-freelance)$/, priority: 0.8, changefreq: 'monthly' },
  { re: /^\/(metiers|projets|cas-client)\//, priority: 0.7, changefreq: 'monthly' },
  { re: /^\/blog\//, priority: 0.6, changefreq: 'monthly' },
  { re: /^\/contact$/, priority: 0.5, changefreq: 'yearly' },
  { re: /^\/le-groupe$/, priority: 0.5, changefreq: 'yearly' },
  { re: /^\/tag\//, priority: 0.3, changefreq: 'monthly' },
  { re: /^\/politique-de-protection-des-donnees$/, priority: 0.2, changefreq: 'yearly' },
  // Pages anglaises (/en/) : miroir des priorités FR, un cran en dessous.
  { re: /^\/en$/, priority: 0.9, changefreq: 'weekly' },
  { re: /^\/en\/roles\//, priority: 0.7, changefreq: 'monthly' },
  { re: /^\/en\/(contact|the-group)$/, priority: 0.5, changefreq: 'yearly' },
  { re: /^\/en\/privacy-policy$/, priority: 0.2, changefreq: 'yearly' },
  { re: /^\/en\//, priority: 0.6, changefreq: 'monthly' },
];

export default defineConfig({
  // Hôte canonique : www (celui indexé par Google) ; l'apex est redirigé en 301 vers www.
  site: 'https://www.digitags.work',
  trailingSlash: 'never',
  // Site statique par défaut ; les pages marquées `prerender = false`
  // (propales /p/<token>) sont rendues à la demande par un Pages Function
  // via l'adaptateur Cloudflare. En dev, Astro rend ces pages lui-même.
  adapter: process.argv.includes('dev') ? undefined : cloudflare(),
  build: {
    format: 'file'
  },
  // Version anglaise sous /en/ ; le français reste à la racine, URLs inchangées.
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      // Pages hors SEO : outil interne, confirmations, propales privées.
      filter: (page) => !/\/(talents|merci|en\/thank-you)$/.test(page) && !page.includes('/p/'),
      serialize(item) {
        const path = new URL(item.url).pathname.replace(/\/$/, '') || '/';
        const rule = PRIORITY_RULES.find((r) => r.re.test(path));
        if (rule) {
          item.priority = rule.priority;
          item.changefreq = rule.changefreq;
        } else {
          item.priority = 0.5;
          item.changefreq = 'monthly';
        }
        // hreflang : alternates fr/en (x-default = fr) pour les pages traduites,
        // depuis le même mapping que les <link rel="alternate"> du head.
        const en = ROUTES[path];
        const fr = en ? path : ROUTES_EN_FR[path];
        if (fr && (en || ROUTES[fr])) {
          const abs = (p) => new URL(p === '/' ? '/' : p, 'https://www.digitags.work').href;
          item.links = [
            { lang: 'fr', url: abs(fr) },
            { lang: 'en', url: abs(en ?? ROUTES[fr]) },
            { lang: 'x-default', url: abs(fr) },
          ];
        }
        return item;
      },
    }),
  ],
});
