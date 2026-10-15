// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

// Forks can publish under their own Pages URL without editing this file.
const site = process.env.ICC_SITE ?? 'https://dgomesbr.github.io';
const base = process.env.ICC_BASE ?? '/india-compliance-calendar';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  // Astro 7 defaults to JSX whitespace rules; keep single spaces between inline elements.
  compressHTML: true,
  integrations: [preact()],
  build: { format: 'directory' },
});
