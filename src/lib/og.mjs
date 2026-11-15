// Image de partage (Open Graph / Twitter) d'un article : dérivé JPEG 1200×630 de sa
// couverture, généré au build par scripts/build-og-covers.mjs dans public/og/.
// Les couvertures sont en WebP ou AVIF, formats que tous les réseaux sociaux
// n'acceptent pas ; le JPEG passe partout.
// Partagé entre le script de build et src/components/BlogPost.astro.
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** '/uploads/blog/mon-article-cover.webp' → '/og/mon-article-cover.jpg' */
export const ogCoverPath = (image) => `/og/${image.split('/').pop().replace(/\.[a-z0-9]+$/i, '')}.jpg`;
