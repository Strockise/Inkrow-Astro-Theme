// @ts-check
import { defineConfig, envField } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Set your production URL (used for canonical and Open Graph URLs)
  site: process.env.SITE_URL || 'https://example.com',
  env: {
    schema: {
      STRAPI_URL: envField.string({ context: 'server', access: 'secret', default: 'http://localhost:1337' }),
      // Optional read-only API token; leave empty when the Public role can read the content types
      STRAPI_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Copy Strapi media into public/uploads at build time, so the static site works without Strapi online
      STRAPI_DOWNLOAD_MEDIA: envField.boolean({ context: 'server', access: 'public', default: true }),
    },
  },
});
