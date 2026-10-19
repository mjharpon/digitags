import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

// Priorité SEO par type de page (sitemap).
const PRIORITY_RULES = [
  { re: /^\/$/, priority: 1.0, changefreq: 'weekly' },
  { re: /^\/blog$/, priority: 0.8, changefreq: 'weekly' },
  { re: /^\/(metiers|projets|cas-clients|equipe-ia|design|tech-data|product-et-project|sea-social-ads-seo|recrutement-freelance|studios-et-collectifs|devenir-freelance)$/, priority: 0.8, changefreq: 'monthly' },
  { re: /^\/(metiers|projets|cas-client)\//, priority: 0.7, changefreq: 'monthly' },
  { re: /^\/blog\//, priority: 0.6, changefreq: 'monthly' },
  { re: /^\/contact$/, priority: 0.5, changefreq: 'yearly' },
  { re: /^\/tag\//, priority: 0.3, changefreq: 'monthly' },
  { re: /^\/politique-de-protection-des-donnees$/, priority: 0.2, changefreq: 'yearly' },
];

export default defineConfig({
  site: 'https://digitags.work',
  trailingSlash: 'never',
  // Site statique par défaut ; les pages marquées `prerender = false`
  // (propales /p/<token>) sont rendues à la demande par un Pages Function
  // via l'adaptateur Cloudflare. En dev, Astro rend ces pages lui-même.
  adapter: process.argv.includes('dev') ? undefined : cloudflare(),
  build: {
    format: 'file'
  },
  integrations: [
    sitemap({
      // Pages hors SEO : outil interne, confirmation, propales privées.
      filter: (page) => !/\/(talents|merci)$/.test(page) && !page.includes('/p/'),
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
        return item;
      },
    }),
  ],
});
