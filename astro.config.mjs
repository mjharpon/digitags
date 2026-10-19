import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  site: 'https://digitags.netlify.app',
  trailingSlash: 'never',
  // Site statique par défaut ; les pages marquées `prerender = false`
  // (propales /p/<token>) sont rendues à la demande via l'adaptateur Netlify.
  // L'adaptateur n'est actif qu'au build : en dev, Astro rend ces pages lui-même
  // (l'émulation Netlify du mode dev exige Deno, absent ici).
  adapter: process.argv.includes('dev') ? undefined : netlify(),
  build: {
    format: 'file'
  }
});
