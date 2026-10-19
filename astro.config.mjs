import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  site: 'https://digitags.netlify.app',
  trailingSlash: 'never',
  // Site statique par défaut ; les pages marquées `prerender = false`
  // (propales /p/<token>) sont rendues à la demande via l'adaptateur Netlify.
  adapter: netlify(),
  build: {
    format: 'file'
  }
});
