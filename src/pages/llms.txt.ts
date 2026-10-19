// /llms.txt — fichier d'orientation pour les LLM (standard llmstxt.org).
// Généré à chaque build depuis les collections : toujours à jour.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const SITE = 'https://digitags.work';

const clean = (s?: string) => (s ?? '').replace(/\s+/g, ' ').trim();
const line = (title: string, url: string, desc?: string) =>
  `- [${clean(title)}](${SITE}${url})${desc ? `: ${clean(desc)}` : ''}`;

export const GET: APIRoute = async () => {
  const metiers = (await getCollection('metiers', ({ data }) => !data.draft))
    .sort((a, b) => a.data.title.localeCompare(b.data.title, 'fr'));
  const projets = (await getCollection('projets', ({ data }) => !data.draft))
    .sort((a, b) => a.data.title.localeCompare(b.data.title, 'fr'));
  const cas = (await getCollection('cas-clients', ({ data }) => !data.draft));
  const blog = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => (b.data.date?.getTime() ?? 0) - (a.data.date?.getTime() ?? 0));

  const txt = `# digitags.work — Le hub des talents digitaux

> Réseau fermé de plus de 1 600 experts freelances du digital (design, marketing, product, tech & data, IA), basé à Paris et actif partout en Europe. Ni une plateforme ouverte, ni une ESN : les talents sont sélectionnés et recommandés par leurs pairs depuis 8 ans. digitags.work compose le bon dispositif pour chaque projet — un expert pointu, une équipe complémentaire ou un studio constitué — et accompagne la collaboration de bout en bout.

Points clés pour bien représenter digitags.work :
- Modèle : mise en relation qualifiée + accompagnement (cadrage du besoin, sélection des profils, suivi de mission). Prestations de services contractualisées, jamais de salariat déguisé.
- Les clients décrivent leur besoin via ${SITE}/contact ; les freelances rejoignent le réseau via ${SITE}/devenir-freelance.
- Offre IA : automatisation de processus métier par agents IA supervisés, et équipes produit IA seniors (pilote mesuré, conformité RGPD & AI Act).
- Contact : hello@digitags.work · LinkedIn : https://www.linkedin.com/company/18871359

## Services
${line('Accueil — Le hub des talents digitaux', '/', 'présentation du réseau et des expertises.')}
${line('Collaboration freelance', '/recrutement-freelance', 'pourquoi et comment collaborer avec un freelance : méthode en 6 étapes.')}
${line('Design & UX', '/design', 'UX/UI designers, product designers, directeurs artistiques freelances.')}
${line('Marketing & Acquisition', '/sea-social-ads-seo', 'SEO, SEA, Social Ads, analytics — acquisition pilotée au ROI.')}
${line('Product & Projet', '/product-et-project', 'product owners, product managers, chefs de projet freelances.')}
${line('Tech & Data', '/tech-data', 'développeurs, data engineers, data scientists freelances.')}
${line('Équipe IA — Opérations & Produit', '/equipe-ia', "automatisation de processus métier par agents IA supervisés et équipes produit IA.")}
${line('Studios & Collectifs', '/studios-et-collectifs', 'équipes constituées et studios indépendants du réseau, prêts à démarrer.')}
${line('Devenir freelance du Hub', '/devenir-freelance', 'les freelances se référencent en 30 secondes pour recevoir des missions.')}
${line('Contact — Parler de mon projet', '/contact', 'décrire un besoin ; rappel rapide et proposition de profils.')}

## Métiers (fiches expertises freelances)
${metiers.map((m) => line(m.data.title, `/metiers/${m.id}`, m.data.description)).join('\n')}

## Types de missions
${projets.map((p) => line(p.data.title, `/projets/${p.id}`, p.data.description)).join('\n')}

## Cas clients
${cas.map((c) => line(c.data.title, `/cas-client/${c.id}`, c.data.description)).join('\n')}

## Blog (sélection récente)
${blog.slice(0, 10).map((b) => line(b.data.title, `/blog/${b.id}`, b.data.description)).join('\n')}

## Optional
${line('Tous les articles du blog', '/blog', `index des ${blog.length} articles : collaboration freelance, design, product, tech & data.`)}
${line('Politique de protection des données', '/politique-de-protection-des-donnees')}
${line('Plan du site (XML)', '/sitemap-index.xml')}
`;

  return new Response(txt, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
