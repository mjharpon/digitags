// Références clients : missions staffées par digitags depuis 2018, issues des
// contrats (Drive « Clients »). On ne parle QUE du besoin du client et du profil
// trouvé : jamais du sujet de la mission, de ses résultats, des tarifs ni du
// freelance. `nom` = client affiché ; sans `nom`, la carte affiche `label`
// (client anonymisé : Publicis Media interdit d'être cité, contrat art. 19.4).

export type Expertise = 'product' | 'design' | 'tech' | 'marketing' | 'data';

export interface Profil {
  role: string;
  /** Nombre d'experts sur ce profil (défaut 1). */
  nb?: number;
  duree: string;
  annee: string;
  expertise: Expertise;
  /** Slug de la fiche métier (/metiers/<slug>) si elle existe. */
  metier?: string;
}

export interface Reference {
  secteur: string;
  label: string;
  /** Nom du client affiché (sinon `label`, anonyme). */
  nom?: string;
  /** Résumé des profils, pour les cartes compactes (home). */
  resume?: string;
  periode: string;
  besoin: string;
  profils: Profil[];
}

export const EXPERTISES: { key: Expertise; label: string }[] = [
  { key: 'product', label: 'Product & Projet' },
  { key: 'design', label: 'Design & UX' },
  { key: 'tech', label: 'Tech' },
  { key: 'marketing', label: 'Marketing & Acquisition' },
  { key: 'data', label: 'Data & Analytics' },
];

export const references: Reference[] = [
  {
    secteur: 'Banque',
    label: "Digital factory d'un grand groupe bancaire français",
    nom: "Crédit Agricole · Digital Factory",
    resume: "Product Owners, designers UX/UI, développeurs",
    periode: '2018 – 2025',
    besoin: "Renforcer en continu ses squads produit avec des profils seniors, opérationnels en quelques jours, sur site à Paris.",
    profils: [
      { role: 'Product Owner', duree: '10 mois', annee: '2018', expertise: 'product', metier: 'product-owner-freelance' },
      { role: 'Product Owner data', duree: '16 mois', annee: '2018', expertise: 'data', metier: 'product-owner-freelance' },
      { role: 'Product Owner', duree: '11 mois', annee: '2019', expertise: 'product', metier: 'product-owner-freelance' },
      { role: 'UI Designer senior', duree: '8 mois', annee: '2019', expertise: 'design', metier: 'ui-designer-freelance' },
      { role: 'UX/UI Designer senior', duree: '4 ans', annee: '2019', expertise: 'design', metier: 'ux-designer-freelance' },
      { role: 'Développeur mobile', duree: '7 mois', annee: '2019', expertise: 'tech', metier: 'developpeur-mobile-freelance' },
      { role: 'Product Manager senior', duree: '6 mois', annee: '2020', expertise: 'product', metier: 'product-manager-freelance' },
      { role: 'Product Owner', duree: '6 mois', annee: '2020', expertise: 'product', metier: 'product-owner-freelance' },
      { role: 'Intégrateur front-end senior', duree: '3 mois', annee: '2020', expertise: 'tech', metier: 'developpeur-front-end-freelance' },
      { role: 'Product Owner senior', duree: '2 mois', annee: '2021', expertise: 'product', metier: 'product-owner-freelance' },
      { role: 'Équipe WordPress (PO, UX/UI, dev)', nb: 3, duree: '50 jours au forfait', annee: '2021', expertise: 'tech', metier: 'developeur-web-freelance' },
      { role: 'Développeur Vue.js', duree: '4 mois', annee: '2021', expertise: 'tech', metier: 'developpeur-front-end-freelance' },
      { role: 'UX/UI Designer', duree: '6 mois', annee: '2021', expertise: 'design', metier: 'ux-designer-freelance' },
      { role: 'Product Owners seniors', nb: 2, duree: '12 mois', annee: '2023', expertise: 'product', metier: 'product-owner-freelance' },
      { role: 'Équipe Drupal (studio du réseau)', duree: '3 mois', annee: '2023', expertise: 'tech', metier: 'developeur-web-freelance' },
      { role: 'Web Analyst', duree: 'Mission courte', annee: '2025', expertise: 'data', metier: 'data-analyst-freelance' },
    ],
  },
  {
    secteur: 'Banque · Crédit',
    label: "Filiale de crédit à la consommation d'un groupe bancaire",
    nom: "Sofinco · Crédit Agricole Consumer Finance",
    periode: '2020 – 2025',
    besoin: "Des profils produit, design et tech pour renforcer ses équipes digitales, sur plusieurs années et souvent en parallèle.",
    profils: [
      { role: 'UX/UI Designer', duree: '33 mois', annee: '2020', expertise: 'design', metier: 'ux-designer-freelance' },
      { role: 'UX/UI Designer', duree: '6 mois', annee: '2021', expertise: 'design', metier: 'ux-designer-freelance' },
      { role: 'Product Owner', duree: '10 mois', annee: '2021', expertise: 'product', metier: 'product-owner-freelance' },
      { role: 'Directeur artistique & UX/UI senior', duree: '5 mois, à distance', annee: '2022', expertise: 'design', metier: 'directeur-artistique-freelance' },
      { role: 'UX Researcher senior', duree: '3 mois, à distance', annee: '2022', expertise: 'design', metier: 'ux-designer-freelance' },
      { role: 'Product Owner', duree: '5 mois', annee: '2022', expertise: 'product', metier: 'product-owner-freelance' },
      { role: 'UX Writer senior', duree: '2 mois', annee: '2022', expertise: 'design', metier: 'ux-writer-freelance' },
      { role: 'UX/UI Designer senior', duree: '3 mois', annee: '2022', expertise: 'design', metier: 'ux-designer-freelance' },
      { role: 'Web Analyst senior', duree: '30 mois', annee: '2023', expertise: 'data', metier: 'data-analyst-freelance' },
      { role: 'Développeurs Vue.js seniors (squad)', nb: 3, duree: '12 mois', annee: '2024', expertise: 'tech', metier: 'developpeur-front-end-freelance' },
    ],
  },
  {
    secteur: 'Banque · Bourse en ligne',
    label: "Courtier en ligne d'un groupe bancaire",
    nom: "Crédit Agricole Titres",
    periode: '2026',
    besoin: "Un binôme produit et design senior, disponible vite, trois jours par semaine sur site en région.",
    profils: [
      { role: 'Product Manager senior', duree: '6 mois', annee: '2026', expertise: 'product', metier: 'product-manager-freelance' },
      { role: 'UX/UI Designer senior', duree: '8 mois', annee: '2026', expertise: 'design', metier: 'ux-designer-freelance' },
    ],
  },
  {
    secteur: 'Luxe',
    label: 'Maison de luxe parisienne',
    nom: "Roger Vivier",
    resume: "Chefs de projet digital et e-commerce, community manager",
    periode: '2018 – 2022',
    besoin: "Des chefs de projet digitaux à temps plein, sur site, pour épauler ses équipes e-commerce et communication.",
    profils: [
      { role: 'Chef de projet digital', duree: '6 mois', annee: '2018', expertise: 'product', metier: 'chef-de-projet-freelance' },
      { role: 'Chefs de projet e-commerce', nb: 2, duree: '10 mois', annee: '2018', expertise: 'product', metier: 'chef-de-projet-freelance' },
      { role: 'Chef de projet communication & community manager', duree: '5 mois', annee: '2022', expertise: 'marketing', metier: 'community-manager-freelance' },
    ],
  },
  {
    secteur: 'Média',
    label: 'Agence média internationale',
    periode: '2021 – 2023',
    besoin: "Huit experts de l'acquisition payante à mobiliser en quelques semaines pour absorber une montée en charge.",
    profils: [
      { role: 'Traffic managers Google Ads', nb: 3, duree: '2 à 5 mois', annee: '2021', expertise: 'marketing', metier: 'traffic-manager-freelance' },
      { role: 'Account manager SEA', duree: '2 mois', annee: '2021', expertise: 'marketing', metier: 'account-manager-freelance' },
      { role: 'Team leader Google Ads', duree: '2 mois', annee: '2021', expertise: 'marketing', metier: 'expert-sea-freelance' },
      { role: 'Consultant SEA (Google & Amazon Ads)', duree: '13 mois', annee: '2021', expertise: 'marketing', metier: 'expert-sea-freelance' },
      { role: 'Consultant programmatique', duree: '3 mois', annee: '2021', expertise: 'marketing' },
      { role: 'Consultant Social Ads', duree: '3 mois, à distance', annee: '2021', expertise: 'marketing', metier: 'expert-social-ads-freelance' },
    ],
  },
  {
    secteur: 'Assurance',
    label: 'Assureur-crédit international',
    nom: "Allianz Trade",
    resume: "Product Owners, profils marketing",
    periode: '2023 – 2025',
    besoin: "Des Product Owners et des profils marketing, en hybride à La Défense, pour des missions de quelques semaines à plusieurs mois.",
    profils: [
      { role: 'Product Owner', duree: '7 mois', annee: '2023', expertise: 'product', metier: 'product-owner-freelance' },
      { role: 'Product Owner', duree: '20 jours', annee: '2025', expertise: 'product', metier: 'product-owner-freelance' },
      { role: 'Chef de projet marketing', duree: '4 mois', annee: '2025', expertise: 'marketing', metier: 'chef-de-projet-freelance' },
      { role: 'Consultant marketing digital', duree: '22 jours', annee: '2025', expertise: 'marketing' },
    ],
  },
  {
    secteur: 'Média · Études',
    label: "Leader de la mesure d'audience",
    nom: "Kantar Media",
    resume: "Consultant CRM senior",
    periode: '2023 – 2024',
    besoin: "Un consultant CRM senior maîtrisant Salesforce et Pardot, à temps partiel.",
    profils: [
      { role: 'Consultant CRM senior', duree: '6 mois', annee: '2023', expertise: 'marketing' },
    ],
  },
  {
    secteur: 'Institution publique',
    label: 'Institution financière publique',
    nom: "Caisse des Dépôts",
    periode: '2019',
    besoin: "Une équipe SEO constituée rapidement pour accompagner le lancement d'une plateforme publique.",
    profils: [
      { role: 'Consultant SEO', duree: '4 mois', annee: '2019', expertise: 'marketing', metier: 'freelance-seo' },
      { role: 'Rédacteurs SEO seniors', nb: 2, duree: '2 mois', annee: '2019', expertise: 'marketing', metier: 'freelance-seo' },
    ],
  },
  {
    secteur: 'Télécom',
    label: 'Opérateur télécom français',
    nom: "Bouygues Telecom",
    periode: '2018 – 2019',
    besoin: "Un chef de projet digital senior, sur site, disponible immédiatement.",
    profils: [
      { role: 'Chef de projet digital', duree: '3 mois', annee: '2018', expertise: 'product', metier: 'chef-de-projet-freelance' },
    ],
  },
  {
    secteur: 'Télécom · IoT',
    label: 'Opérateur mobile et IoT B2B',
    nom: "Transatel",
    periode: '2019 – 2020',
    besoin: "Un profil marketing produit B2B polyvalent, sur site, pour une mission longue.",
    profils: [
      { role: 'Product marketing manager B2B', duree: '10 mois', annee: '2019', expertise: 'marketing', metier: 'growth-marketer-freelance' },
    ],
  },
  {
    secteur: 'E-commerce · Mode',
    label: 'Leader des ventes privées en ligne',
    nom: "Showroomprivé",
    periode: '2022',
    besoin: "Deux renforts en quelques jours pour ses équipes social media et acquisition.",
    profils: [
      { role: 'Community manager mode', duree: '2 mois', annee: '2022', expertise: 'marketing', metier: 'community-manager-freelance' },
      { role: 'Assistant traffic manager', duree: '2 mois', annee: '2022', expertise: 'marketing', metier: 'traffic-manager-freelance' },
    ],
  },
  {
    secteur: 'Luxe · E-commerce',
    label: 'Marque de cachemire haut de gamme',
    nom: "Eric Bompard",
    periode: '2022 – 2023',
    besoin: "Un expert Salesforce Commerce Cloud pour faire tourner son e-shop au quotidien.",
    profils: [
      { role: 'Tech lead Salesforce Commerce Cloud', duree: '5 mois', annee: '2022', expertise: 'tech', metier: 'tech-lead-freelance' },
    ],
  },
  {
    secteur: 'E-commerce',
    label: 'Épicerie en ligne',
    nom: "MyPanier",
    periode: '2022',
    besoin: "Un profil hybride UX et intégration, capable de concevoir et de livrer.",
    profils: [
      { role: 'Consultant UX & intégration', duree: '4 mois', annee: '2022', expertise: 'design', metier: 'ux-designer-freelance' },
    ],
  },
  {
    secteur: 'Industrie · Énergie',
    label: "Groupe industriel de l'énergie, via une agence UX",
    nom: "Framatome, via l'agence Zee Group",
    periode: '2021',
    besoin: "Un UX designer senior pour une mission courte au forfait.",
    profils: [
      { role: 'UX Designer senior', duree: '22 jours', annee: '2021', expertise: 'design', metier: 'ux-designer-freelance' },
    ],
  },
  {
    secteur: 'Fintech',
    label: 'Fintech de paiement (banking-as-a-service)',
    nom: "Xpollens",
    periode: '2025',
    besoin: "Un growth marketer à temps partiel, sur plusieurs mois.",
    profils: [
      { role: 'Growth marketer', duree: '7 mois', annee: '2025', expertise: 'marketing', metier: 'growth-marketer-freelance' },
    ],
  },
  {
    secteur: 'Mode',
    label: 'Marque de mode resort',
    nom: "Poupette St Barth",
    periode: '2025',
    besoin: "Un social media manager à distance, quelques jours par mois, toute l'année.",
    profils: [
      { role: 'Social media & community manager', duree: '11 mois, à distance', annee: '2025', expertise: 'marketing', metier: 'community-manager-freelance' },
    ],
  },
];

export const nbProfils = (r: Reference) => r.profils.reduce((n, p) => n + (p.nb ?? 1), 0);
export const totalProfils = references.reduce((n, r) => n + nbProfils(r), 0);
