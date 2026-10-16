import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://digitags.netlify.app',
  trailingSlash: 'never',
  build: {
    format: 'file'
  }
});
