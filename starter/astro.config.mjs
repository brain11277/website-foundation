// @ts-check
// The trailingSlash + build.format pairing below is load-bearing.
// See FOUNDATION.md §1 (URL & Indexing Contract) before changing it.
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { site } from './src/site.config';

// Date-only, so a rebuild that changes nothing does not churn every lastmod
// with a new timestamp. Crawlers read that churn as noise. (FOUNDATION §2)
const BUILD_DATE = new Date().toISOString().slice(0, 10);

export default defineConfig({
  // Read from site.config.ts so the domain is declared in exactly one place.
  // Canonical tags, the sitemap and every JSON-LD @id derive from it.
  site: site.url,

  output: 'static',

  // No-trailing-slash canonical shape. Must agree with build.format below,
  // your canonical tags, and the sitemap.
  trailingSlash: 'never',

  build: {
    // 'file' (NOT 'directory') so pages build as `/about.html`, served at
    // `/about` with no redirect. 'directory' builds `/about/index.html`, which
    // Cloudflare's asset server treats as canonical at `/about/` and redirects
    // `/about` to it, surfacing as "Page with redirect" on every page in
    // Search Console.
    format: 'file',
    inlineStylesheets: 'auto',
  },

  integrations: [
    sitemap({
      // Exclude intentionally hidden routes (FOUNDATION §2).
      // filter: (page) => !page.includes('/hidden-route'),

      // Hand-authored directories under public/ are not Astro routes, so the
      // integration cannot discover them. List them here, in the shape the
      // host actually serves (a folder index keeps its trailing slash).
      // customPages: [`${site.url}/tool/`],

      serialize: (item) => ({ ...item, lastmod: BUILD_DATE }),
    }),
  ],
});
