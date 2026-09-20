# Website Foundation — Structural Baseline

Portable, **content-agnostic** contracts that every website has to satisfy, no
matter what's on it. These are the lessons that transfer between repos — the
ones you otherwise re-derive by hitting the same bug on each new site.

**How to use this:** at the start of a new site, copy the contracts below into
the new repo's `CLAUDE.md` (or `AGENTS.md`). Run the **Pre-launch checklist** at
the bottom before going live. Wire `scripts/verify-indexing.mjs` into CI so the
indexing contract is enforced by a machine, not by a Search Console alert weeks
later.

> The thing that does **not** transfer between repos is a regression registry —
> those entries are welded to specific files and line numbers. What transfers is
> this short list of structural contracts plus the machinery to enforce them.

---

## 1. URL & Indexing Contract — the #1 silent killer

A real incident: Google Search Console reported **"Page with redirect"** on
every page of a static Astro + Cloudflare site. Nothing was wrong with the
content. Five layers each looked correct but disagreed on the URL shape:

| Layer | What it emitted |
|---|---|
| `trailingSlash` config | `never` → `/about` |
| `build.format` config | `directory` → builds `/about/index.html` |
| canonical tag + sitemap | `/about` (no slash) |
| host (Cloudflare Pages, at the time) | sees `index.html`, treats `/about/` as canonical |
| Googlebot | fetches `/about`, gets a **308 → `/about/`** → "Page with redirect" |

**The contract: for any given URL, all five layers agree on its shape.**

- Choose no-trailing-slash (`/about`) **or** trailing-slash (`/about/`) as the
  default for your routes. Either works; agreement is the whole game.
- **Astro static on Cloudflare** (the stack this foundation targets):
  `trailingSlash: 'never'` **+** `build.format: 'file'`. The `'directory'`
  format builds `/about/index.html`, which Cloudflare's asset server
  auto-redirects `/about` → `/about/`, breaking your no-slash canonicals. See
  `templates/astro.config.mjs` for the battle-tested config.
- **On Workers Assets the host layer has its own knob:** `html_handling`
  defaults to `auto-trailing-slash`, which is why `build.format: 'file'` works
  there without extra config. Set `"drop-trailing-slash"` if you want the host
  to enforce it explicitly. The build-layer fix stays primary because it is
  portable to any host; the two agree, so setting both is fine.
- **"One shape" is per-URL, not site-wide.** A hand-authored directory under
  `public/` is a folder index and correctly serves with a trailing slash, even
  on a site whose routes are otherwise slashless. What matters is that the
  sitemap lists the form the host returns `200` for. Don't "fix" a correct
  folder index into a redirect.
- **Canonical tag self-references** the absolute URL as served. Normalize the
  path you build it from, stripping `/index.html` and `.html`, so it can't
  drift from the format setting.
- **Verify after every deploy:** fetch each sitemap URL with redirects
  disabled and assert `200`, not `3xx`. `scripts/verify-indexing.mjs` does this.

---

## 2. Crawlability — robots, sitemap, noindex

- **`robots.txt`** allows crawling and points to the sitemap. See
  `templates/robots.txt`.
- **Sitemap** is auto-generated, lists every indexable page, and emits absolute
  URLs in the *same shape* as your canonical tags (contract §1), specifically
  the shape the host returns `200` for, with no redirect in between.
- **Hand-authored static directories won't be discovered.** A sitemap
  integration only knows the framework's own routes. Anything you dropped into
  `public/` has to be listed explicitly (Astro: `customPages`).
- **`lastmod` is worth emitting**, but serialize it **date-only**. A full
  timestamp means every no-op rebuild churns every entry, which crawlers read as
  noise.
- **`llms.txt`** (optional) gives AI crawlers a curated entry point: a heading,
  a short summary, then links to the pages that matter. Keep it a curated index,
  not a dump of the site, or it stops being useful to anything.
- **`noindex` only on intentionally-hidden routes — never site-wide.** The
  classic failure is a staging `<meta name="robots" content="noindex">` shipped
  to production. If you have hidden routes, also exclude them from the sitemap.
- **One canonical per page, self-referencing,** absolute URL.
- Submit the sitemap to Google Search Console + Bing Webmaster Tools on launch.

---

## 3. Per-page SEO invariants

- **Exactly one `<h1>` per page.** Section labels are `<h2>`; sub-sections
  `<h3>`. No heading-level skips.
- **Title 30–60 chars** (including any ` | Brand` suffix). **Meta description
  110–160 chars**, framed as *"what you'll find here,"* not a mission statement.
- **Reuse one `pageDescription` constant** for both the meta description and the
  schema description so they can't drift.
- **JSON-LD schema on every page.** Person/Organization for bio pages;
  `CollectionPage` + `BreadcrumbList` for index/aggregation pages; `Blog` for
  article lists. Validate with Google's Rich Results Test.
- **Every `@id` reference must resolve.** The failure is silent: a page emits
  `mainEntity: {"@id": ".../#person"}` while defining `#person` nowhere, and a
  crawler following the reference finds nothing. Emit the shared entities
  (Person, WebSite) from **one head component on every indexable page**, so a
  reference is never orphaned by which page it appears on. `verify-indexing.mjs`
  checks this.
- **Don't cap structured data at an arbitrary slice.** A list schema built from
  the first 50 of 63 items leaves 13 with no structured data and no error.
- **Republished work: `url` is the page you are on**, and the original elsewhere
  goes in `sameAs`. Pointing `url` offsite while `mainEntityOfPage` points at
  your page is a mixed canonical signal.
- **Freshness:** emit sitemap `lastmod` and schema `dateModified`, both
  date-only (§2).
- **OG image 1200×630.** A per-page image for pillar pages; a default fallback
  for the rest. Set Twitter `site` + `creator` site-wide.
- **Semantic dates:** wrap every rendered date in
  `<time datetime="YYYY-MM-DD">` sourced from a single formatter util.
- **Decode HTML entities** from any external/RSS-sourced text before render —
  numeric entities (`&#xNNNN;`) included.

---

## 4. Theme / design-token parity (any themed site)

- **Every color custom property in `:root` must be redefined in every theme/mode
  block.** A `:root` token without matching overrides in each theme = the wrong
  color in those themes. This is the #1 source of multi-theme visual drift.
- **Shared visual classes live in ONE global stylesheet.** Per-page `<style>`
  blocks are for layout-only declarations.
- **Audit-before-edit:** grep a class before changing it. If it appears in >1
  file, consolidate into the global sheet *first*, then change it.
- **No hardcoded brand colors** in gradients/`rgba()`. Define RGB-channel vars
  (`--accent-rgb`, etc.) so you can compose `rgba(var(--accent-rgb), <alpha>)`.
- **No `!important` on filter chains.** Compose filters additively via a
  `--theme-filter` custom property; `!important` strips per-instance values.
- **Check contrast against the lightest surface a token actually lands on**,
  not just the page background. A muted text token can clear AA on `--bg` and
  fail on the card it also sits in.
- **`opacity` on a container composites every text node inside it.** A wrapper
  at `0.5` or `0.75` drags all of its descendants below AA at once, and the
  failures show up on each text node rather than on the rule that caused them.
- **Don't assume white ink on a brand-colored surface.** Compute the readable
  ink per color; a mid-tone brand blue gives white about 3:1.

---

## 5. Automated data pipelines need a dead-man's-switch

If the site pulls from any cron/sync (RSS, API, scraped feed):

- **A separate health monitor asserts freshness and SCREAMS** — opens an issue,
  fails the run red — when data goes stale past a calibrated threshold. The
  dangerous failure is a sync that goes *green while doing nothing*.
- **Never `cmd || (commit && push)`** in CI — that swallows push failures and
  shows green. Use `set -euo pipefail` + explicit branched logic.
- **Merge-on-write, never replace-wholesale** when the source is a rolling
  window (e.g. RSS keeps ~10 items) but the site is an archive. Read existing
  data, dedupe, merge, write — so items never silently roll off.
- **Prefer the direct source; keep the proxy as insurance.** If you proxy a
  feed through a cache (Worker + KV), fetch direct first to avoid a staleness
  window, and fall back to the cache only when direct fails.
- **Every runtime that writes the dataset must normalize it identically.** If
  the sync script strips tracking params from a URL and the fallback path
  doesn't, and the merge dedupes by URL, the fallback silently duplicates every
  item instead of matching it. Two runtimes that don't share a module graph but
  do share a dedupe key are load-bearing coupling: say so in both copies.

---

## 6. Enforcement machinery (so the above doesn't rot)

- **SessionStart hook** that (a) confirms you're not on a stale base, fetching
  and comparing to the remote default branch before anything else, and (b)
  verifies invariant markers still exist, warning on drift. Drop-in:
  `templates/hooks/session-start.sh`.
- **Regression registry** in `CLAUDE.md`: for each fix that took multiple tries
  and is non-obvious, record one row. The entries are per-repo and do not
  transfer; the columns do:

  | # | Fix | Files / markers | Why fragile | Verify |
  |---|-----|-----------------|-------------|--------|
  | 1 | what the fix does, in a phrase | the specific string to grep, and where | one sentence on what a plausible refactor would break | a command whose output you can eyeball, or a visual check |

  Write **why fragile** for someone who is about to delete the thing on purpose
  because it looks redundant. That reader is the whole audience.
- **Health monitor** for any automated data sync, separate from the sync
  itself. Drop-in: `templates/workflows/data-health.yml` (§5).
- **`verify-indexing.mjs` wired into CI** and run against every preview/prod
  deploy. It enforces contract §1 + §2 automatically.
- **Workflow discipline:** Sync → Explore → Plan → Code → Commit. Sync before
  exploring; designing on a stale base is the most expensive class of error.

---

## 7. Performance & accessibility baseline

- **Ship minimal JS.** Prefer static HTML + islands / vanilla over a framework
  runtime where you can. Less JS = faster + fewer hydration bugs.
- **Self-host fonts.** A hosted font stylesheet is render-blocking on the
  critical path, worth roughly a second of FCP/LCP on a slow connection. Three
  silent failures to avoid: don't import a font package's CSS if it renames the
  family (variable packages often do, e.g. `'Inter Variable'`), since none of
  your `font-family` declarations will match it; always pair
  `format('woff2-variations')` with a plain `format('woff2')` source, because
  the `-variations` keyword was dropped from CSS Fonts 4 and a UA that doesn't
  recognize it skips that `src` entirely; and preload only the faces the default
  view uses, since an unmatched `@font-face` costs nothing but preloading one
  costs a full download.
- **Gate expensive visual work on visibility.** An eagerly-mounted canvas
  painter rasterizes its sprites even on pages where CSS has already hidden the
  canvas. Mount parked, start on an `IntersectionObserver`. The gate sees
  **layout**, not paint: it catches `display: none` and geometry, never
  `visibility: hidden` or `opacity: 0`, so the hide rules it relies on must keep
  using `display: none`.
- **WCAG 2.1 AA:** visible focus rings, full keyboard nav, sufficient color
  contrast, `prefers-reduced-motion` honored for any animation/effect, alt text
  on meaningful images, a "Plain"/reader mode if the design is effect-heavy.
  Three that get missed: an **`aria-label` must contain the visible text** it
  labels (WCAG 2.5.3) rather than paraphrase it; **`role="tablist"` requires
  real tab children**, so a group of plain buttons fails
  `aria-required-children` and should be `role="group"` with `aria-pressed`
  when it re-lays-out one region instead of swapping panels; and **24px minimum
  target size** (WCAG 2.5.8), usually a desktop-only failure on header toggles.
- **Run Lighthouse / PageSpeed Insights** before launch; fix anything that drags
  LCP, CLS, or the a11y score below target. **Audit every page on both form
  factors.** A single mobile run on the homepage is not representative and
  routinely finds under half the real defects.

---

## Pre-launch checklist

Indexing & crawl
- [ ] `verify-indexing.mjs` passes against the live domain — every sitemap URL is `200`, not `3xx`
- [ ] canonical tag self-references the fetched URL on every page
- [ ] `robots.txt` allows crawl + points to the sitemap; sitemap submitted to GSC + Bing
- [ ] no stray `noindex` on any indexable page; hidden routes excluded from sitemap
- [ ] one canonical host chosen (apex **or** www) and the other 301s to it

SEO
- [ ] exactly one `<h1>` per page; no heading-level skips
- [ ] titles 30–60 chars; meta descriptions 110–160 chars
- [ ] JSON-LD validates in the Rich Results Test
- [ ] every `@id` referenced in JSON-LD is also defined
- [ ] OG image renders in a social-card debugger (Twitter/LinkedIn/Slack)
- [ ] favicon is real, not a placeholder

Build & host
- [ ] `trailingSlash` ⊕ `build.format` ⊕ canonical ⊕ sitemap ⊕ host all agree (contract §1)
- [ ] custom domain + HTTPS (force) + HSTS
- [ ] **requesting a nonexistent path returns your styled 404 page**, not an
      empty body. Check the behavior, not that the file exists
- [ ] assets referenced with prefix-absolute paths, so moving the site under a
      path prefix doesn't 404 them
- [ ] analytics installed (Cloudflare Web Analytics or equivalent)
- [ ] environment variables set in **both** Production and Preview

Quality
- [ ] `prefers-reduced-motion` honored
- [ ] keyboard navigation works end-to-end; focus is always visible
- [ ] Lighthouse ≥ targets (Perf/A11y/Best-Practices/SEO), every page, both form factors
- [ ] any claim in your copy about analytics, cookies or tracking checked
      against the live page in devtools, not against the repo
- [ ] if there's a data sync: the health/dead-man's-switch monitor is live

---

*See `CLOUDFLARE.md` for the Cloudflare setup this baseline assumes (Workers
Assets by default, Pages as a supported alternative), and `templates/` for
drop-in config.*
