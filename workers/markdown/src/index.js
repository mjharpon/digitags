// Markdown pour agents — négociation de contenu sur digitags.work.
// GET + « Accept: text/markdown » → sert la version .md de la page (générée
// au build, scripts/build-markdown.mjs). Tout le reste passe tel quel.
const ORIGIN = 'https://digitags.pages.dev';

// Jamais de version markdown pour l'outil interne, les propales et les API.
const EXCLUDED = /^\/(api|p|talents|cms|merci)(\/|$)/;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const accept = request.headers.get('Accept') ?? '';

    const wantsMarkdown =
      request.method === 'GET' &&
      /\btext\/markdown\b/i.test(accept) &&
      !EXCLUDED.test(url.pathname) &&
      !/\.[a-z0-9]+$/i.test(url.pathname); // les fichiers (images, xml…) gardent leur format

    if (wantsMarkdown) {
      const path = url.pathname.replace(/\/$/, '');
      const mdUrl = `${ORIGIN}${path === '' ? '/index' : path}.md`;
      const md = await fetch(mdUrl, { cf: { cacheTtl: 600, cacheEverything: true } });
      if (md.ok) {
        return new Response(md.body, {
          status: 200,
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Vary': 'Accept',
            'Cache-Control': 'public, max-age=3600',
            'Content-Signal': 'ai-train=yes, search=yes, ai-input=yes',
          },
        });
      }
      // Pas de version .md : on sert le HTML normalement.
    }

    return fetch(request);
  },
};
