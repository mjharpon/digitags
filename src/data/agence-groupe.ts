// Liens contextuels vers Donutz Digital, l'agence de marketing digital
// paneuropéenne du groupe Digitags - Donutz (voir /le-groupe).
//
// Sur les fiches métiers marketing (FR et EN), un bloc « L'agence du groupe »
// renvoie vers la page de service de l'agence qui correspond au métier : le
// freelance pour renforcer une équipe, l'agence pour déléguer le pilotage.
// Liens suivis (dofollow) volontairement : relation de groupe publique.
// Ancres variées et propres à chaque fiche ; pages FR → pages /fr/ de l'agence,
// pages EN → pages anglaises. Clés = slugs des fiches (src/content/metiers*).

type Lien = { href: string; ancre: string; texte: string };

const FR: Record<string, Lien> = {
  'expert-social-ads-freelance': {
    href: 'https://donutzdigital.com/fr/agence-social-ads/',
    ancre: 'agence Social Ads',
    texte: "Vous préférez déléguer la stratégie et le pilotage de vos campagnes Meta, LinkedIn ou TikTok, sur un ou plusieurs marchés européens ? Donutz Digital, l'agence de marketing digital paneuropéenne du groupe, prend le relais comme",
  },
  'traffic-manager-freelance': {
    href: 'https://donutzdigital.com/fr/agence-programmatique/',
    ancre: 'offre programmatique',
    texte: "Pour l'achat média programmatique (display, vidéo, audio, CTV) piloté de bout en bout, Donutz Digital, l'agence de marketing digital paneuropéenne du groupe, propose son",
  },
  'freelance-seo': {
    href: 'https://donutzdigital.com/fr/agence-seo-multilingue-europe/',
    ancre: 'SEO multilingue en Europe',
    texte: "Votre référencement doit se déployer sur plusieurs pays et plusieurs langues ? Donutz Digital, l'agence de marketing digital paneuropéenne du groupe, accompagne les marques sur le",
  },
  'expert-sea-freelance': {
    href: 'https://donutzdigital.com/fr/agence-google-ads/',
    ancre: 'agence Google Ads',
    texte: "Pour confier la gestion complète de vos campagnes Search, Shopping et Performance Max, Donutz Digital, l'agence de marketing digital paneuropéenne du groupe, intervient comme",
  },
  'growth-marketer-freelance': {
    href: 'https://donutzdigital.com/fr/agence-paid-media-europe/',
    ancre: 'paid media sur les marchés européens',
    texte: "Quand la croissance passe par des campagnes payantes à grande échelle, Donutz Digital, l'agence de marketing digital paneuropéenne du groupe, pilote le",
  },
};

const EN: Record<string, Lien> = {
  'freelance-social-ads-expert': {
    href: 'https://donutzdigital.com/european-paid-social-agency/',
    ancre: 'paid social agency',
    texte: "Would you rather hand over the strategy and management of your Meta, LinkedIn or TikTok campaigns across one or several European markets? Donutz Digital, the group's pan-European digital marketing agency, takes over as a",
  },
  'freelance-traffic-manager': {
    href: 'https://donutzdigital.com/programmatic-ads/',
    ancre: 'programmatic advertising',
    texte: "For fully managed programmatic media buying (display, video, audio, CTV), Donutz Digital, the group's pan-European digital marketing agency, runs your",
  },
  'freelance-seo-consultant': {
    href: 'https://donutzdigital.com/european-seo-agency/',
    ancre: 'European SEO agency',
    texte: "Does your SEO need to scale across several countries and languages? Donutz Digital, the group's pan-European digital marketing agency, works as a",
  },
  'freelance-google-ads-expert': {
    href: 'https://donutzdigital.com/european-google-ads-agency/',
    ancre: 'Google Ads agency',
    texte: "To hand over the full management of your Search, Shopping and Performance Max campaigns, Donutz Digital, the group's pan-European digital marketing agency, steps in as a European",
  },
  'freelance-growth-marketer': {
    href: 'https://donutzdigital.com/pan-european-paid-media-agency/',
    ancre: 'pan-European paid media',
    texte: "When growth depends on paid campaigns at scale, Donutz Digital, the group's digital marketing agency, runs",
  },
};

export function lienAgence(ficheId: string, en: boolean): Lien | undefined {
  return (en ? EN : FR)[ficheId];
}
