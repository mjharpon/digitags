// Informations légales de l'éditeur du site (mentions légales FR + EN).
// Source : annuaire officiel des entreprises (recherche-entreprises.api.gouv.fr),
// consulté le 21 nov. 2026. Le capital social et le téléphone ne figurent pas
// dans l'annuaire : à renseigner par MJ (null = ligne masquée).
export const SOCIETE = {
  denomination: 'DIGITAGS',
  formeFr: 'Société par actions simplifiée (SAS)',
  formeEn: 'Simplified joint-stock company (SAS, French law)',
  capital: null as string | null, // ex. '1 000 €'
  siege: '101 rue de Clignancourt, 75018 Paris, France',
  rcs: 'RCS Paris 820 329 134',
  siren: '820 329 134',
  siret: '820 329 134 00028',
  tva: 'FR26820329134',
  email: 'contact@digitags.work',
  telephone: null as string | null,
  directeurPublication: 'Hugo Couturier',
  hebergeur: {
    nom: 'Cloudflare, Inc.',
    adresse: '101 Townsend St, San Francisco, CA 94107, United States',
    telephone: '+1 (650) 319-8930',
    site: 'https://www.cloudflare.com',
  },
};
