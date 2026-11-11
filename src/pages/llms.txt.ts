// /llms.txt — fichier d'orientation pour les LLM (standard llmstxt.org).
// Généré à chaque build depuis les collections : toujours à jour.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const SITE = 'https://www.digitags.work';

const clean = (s?: string) => (s ?? '').replace(/\s+/g, ' ').trim();
const line = (title: string, url: string, desc?: string) =>
  `- [${clean(title)}](${SITE}${url})${desc ? `: ${clean(desc)}` : ''}`;

export const GET: APIRoute = async () => {
  const metiers = (await getCollection('metiers', ({ data }) => !data.draft))
    .sort((a, b) => a.data.title.localeCompare(b.data.title, 'fr'));
  const metiersEn = (await getCollection('metiers-en', ({ data }) => !data.draft))
    .sort((a, b) => a.data.title.localeCompare(b.data.title, 'en'));
  const projets = (await getCollection('projets', ({ data }) => !data.draft))
    .sort((a, b) => a.data.title.localeCompare(b.data.title, 'fr'));
  const cas = (await getCollection('casClients', ({ data }) => !data.draft));
  const projetsEn = (await getCollection('projets-en', ({ data }) => !data.draft))
    .sort((a, b) => a.data.title.localeCompare(b.data.title, 'en'));
  const casEn = (await getCollection('cas-clients-en', ({ data }) => !data.draft));
  const blog = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => (b.data.date?.getTime() ?? 0) - (a.data.date?.getTime() ?? 0));

  const txt = `# digitags.work — Le hub des talents digitaux

> Réseau fermé de plus de 1 600 experts freelances du digital (design, marketing, product, tech & data, IA), basé à Paris et actif partout en Europe. Ni une plateforme ouverte, ni une ESN : les talents sont sélectionnés et recommandés par leurs pairs depuis 8 ans. digitags.work compose le bon dispositif pour chaque projet — un expert pointu, une équipe complémentaire ou un studio constitué — et accompagne la collaboration de bout en bout.

digitags.work fait partie du groupe digital européen Digitags - Donutz, avec l'agence de marketing digital paneuropéenne Donutz Digital (https://donutzdigital.com).

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

## English pages
Les pages cœur du site, les fiches métiers, les fiches projets et les cas clients existent en anglais sous /en/ (hreflang fr/en, x-default = fr). Le blog reste en français.
${line('Home — The digital talent hub', '/en', 'English homepage: the network and its expertise.')}
${line('Work with a freelancer', '/en/hire-a-freelancer', 'why and how to work with a freelancer: the 6-step method.')}
${line('Design & UX', '/en/design', 'freelance UX/UI designers, product designers, art directors.')}
${line('Marketing & Acquisition', '/en/digital-marketing', 'SEO, paid search, social ads, analytics — ROI-driven acquisition.')}
${line('Product & Project', '/en/product-and-project', 'freelance product owners, product managers, project managers.')}
${line('Tech & Data', '/en/tech-and-data', 'freelance developers, data engineers, data scientists.')}
${line('AI Team — Operations & Product', '/en/ai-product-team', 'AI automation of business processes by supervised AI agents, and senior AI product teams.')}
${line('Studios & Collectives', '/en/studios-and-collectives', 'established teams and independent studios, ready to start.')}
${line('Roles', '/en/roles', 'the freelance roles of the network, by expertise.')}
${line('Projects', '/en/projects', 'the types of digital missions the network delivers.')}
${line('Case studies', '/en/case-studies', 'real missions led by the freelancers and teams of the network.')}
${line('The Digitags - Donutz group', '/en/the-group', 'the European digital group: hub + pan-European digital marketing agency.')}
${line('Become a Hub freelancer', '/en/become-a-freelancer', 'freelancers get listed in 30 seconds to receive missions.')}
${line('Contact — Discuss your project', '/en/contact', 'describe a need; quick callback and profile proposals.')}
${line('Privacy policy', '/en/privacy-policy')}

## Role guides (English)
${metiersEn.map((m) => line(m.data.title, `/en/roles/${m.id}`, m.data.description)).join('\n')}

## Mission types (English)
${projetsEn.map((m) => line(m.data.title, `/en/projects/${m.id}`, m.data.description)).join('\n')}

## Case studies (English)
${casEn.map((c) => line(c.data.title, `/en/case-studies/${c.id}`, c.data.description)).join('\n')}

## Blog (sélection récente)
${blog.slice(0, 10).map((b) => line(b.data.title, `/blog/${b.id}`, b.data.description)).join('\n')}

## Optional
${line('Tous les articles du blog', '/blog', `index des ${blog.length} articles : collaboration freelance, design, product, tech & data.`)}
${line('Politique de protection des données', '/politique-de-protection-des-donnees')}
${line('Plan du site (XML)', '/sitemap-index.xml')}
`;

  return new Response(txt, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
