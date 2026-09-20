// @ts-check
// Battle-tested Astro config for a static site on Cloudflare (Workers Assets
// or Pages). The trailingSlash + build.format pairing below is load-bearing:
// see FOUNDATION.md §1 (URL & Indexing Contract). Change `site` and go.
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Date-only, so a rebuild that changes nothing does not churn every lastmod
// with a new timestamp. Crawlers read that as noise. (FOUNDATION §2)
const BUILD_DATE = new Date().toISOString().slice(0, 10);

export default defineConfig({
  // Production origin, used by sitemap, canonical URLs, and OG tags.
  site: 'https://example.com',

  output: 'static',

  // No-trailing-slash canonical shape. Must agree with build.format below,
  // your canonical tags, and the sitemap. Pick one shape site-wide.
  trailingSlash: 'never',

  build: {
    // 'file' (NOT 'directory') so pages build as `/about.html`, served at
    // `/about` with no redirect. 'directory' builds `/about/index.html`, which
    // Cloudflare's asset server treats as canonical at `/about/` and redirects
    // `/about` to it, breaking the no-slash canonicals and surfacing "Page with
    // redirect" in Search Console.
    format: 'file',
    inlineStylesheets: 'auto',
  },

  integrations: [
    sitemap({
      // Exclude intentionally-hidden routes from the sitemap (FOUNDATION §2).
      // filter: (page) => !page.includes('/hidden-route'),

      // Hand-authored directories under public/ are not Astro routes, so the
      // integration cannot discover them. List them by hand, in the shape the
      // host actually serves (a folder index keeps its trailing slash).
      // customPages: ['https://example.com/tool/'],

      // Freshness signal (FOUNDATION §2). Build time is the honest value for a
      // static site: every page is regenerated on every deploy.
      serialize: (item) => ({ ...item, lastmod: BUILD_DATE }),
    }),
  ],
});
