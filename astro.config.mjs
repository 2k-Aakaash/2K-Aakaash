import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://2k-aakaash.vercel.app',
  integrations: [sitemap()],
  build: { format: 'file' },
});
