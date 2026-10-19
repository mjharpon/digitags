import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://digitags.work',
  trailingSlash: 'never',
  // Site statique par défaut ; les pages marquées `prerender = false`
  // (propales /p/<token>) sont rendues à la demande par un Pages Function
  // via l'adaptateur Cloudflare. En dev, Astro rend ces pages lui-même.
  adapter: process.argv.includes('dev') ? undefined : cloudflare(),
  build: {
    format: 'file'
  }
});
