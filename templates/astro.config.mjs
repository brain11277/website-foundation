// @ts-check
// Battle-tested Astro config for a static site on Cloudflare Pages.
// The trailingSlash + build.format pairing below is load-bearing — see
// FOUNDATION.md §1 (URL & Indexing Contract). Change the `site` value and go.
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Production origin — used by sitemap, canonical URLs, and OG tags.
  site: 'https://example.com',

  output: 'static',

  // No-trailing-slash canonical shape. Must agree with build.format below,
  // your canonical tags, and the sitemap. Pick one shape site-wide.
  trailingSlash: 'never',

  build: {
    // 'file' (NOT 'directory') so pages build as `/about.html`, served at
    // `/about` with no redirect. 'directory' builds `/about/index.html`, which
    // Cloudflare Pages 308-redirects `/about` -> `/about/`, breaking the
    // no-slash canonicals and surfacing "Page with redirect" in Search Console.
    format: 'file',
    inlineStylesheets: 'auto',
  },

  integrations: [
    sitemap({
      // Exclude intentionally-hidden routes from the sitemap (FOUNDATION §2).
      // filter: (page) => !page.includes('/hidden-route'),
    }),
  ],
});
