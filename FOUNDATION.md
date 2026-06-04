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
| host (Cloudflare Pages) | sees `index.html`, treats `/about/` as canonical |
| Googlebot | fetches `/about`, gets a **308 → `/about/`** → "Page with redirect" |

**The contract: pick ONE URL shape and make all five agree.**

- Choose no-trailing-slash (`/about`) **or** trailing-slash (`/about/`). Either
  works; consistency is the whole game.
- **Astro static + Cloudflare Pages** (the stack this foundation targets):
  `trailingSlash: 'never'` **+** `build.format: 'file'`. The `'directory'`
  format builds `/about/index.html`, which Cloudflare's asset server
  auto-redirects `/about` → `/about/`, breaking your no-slash canonicals. See
  `templates/astro.config.mjs` for the battle-tested config.
- **Canonical tag self-references** the absolute, extensionless URL. Normalize
  the path you build it from — strip `/index.html`, `.html`, and any trailing
  slash — so it can't drift from the format setting.
- **Verify after every deploy:** fetch each sitemap URL with redirects
  disabled and assert `200`, not `3xx`. `scripts/verify-indexing.mjs` does this.

---

## 2. Crawlability — robots, sitemap, noindex

- **`robots.txt`** allows crawling and points to the sitemap. See
  `templates/robots.txt`.
- **Sitemap** is auto-generated, lists every indexable page, and emits absolute
  URLs in the *same shape* as your canonical tags (contract §1).
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

---

## 6. Enforcement machinery (so the above doesn't rot)

- **SessionStart hook** that (a) confirms you're not on a stale base — fetch and
  compare to the remote default branch before doing anything — and (b) verifies
  invariant markers still exist, warning on drift.
- **Regression registry** in `CLAUDE.md`: for each fix that took multiple tries
  and is non-obvious, record `file · marker-to-grep · why-fragile (1 sentence) ·
  verify-command`. This is per-repo, not portable — but the *pattern* is.
- **`verify-indexing.mjs` wired into CI** and run against every preview/prod
  deploy. It enforces contract §1 + §2 automatically.
- **Workflow discipline:** Sync → Explore → Plan → Code → Commit. Sync before
  exploring; designing on a stale base is the most expensive class of error.

---

## 7. Performance & accessibility baseline

- **Ship minimal JS.** Prefer static HTML + islands / vanilla over a framework
  runtime where you can. Less JS = faster + fewer hydration bugs.
- **WCAG 2.1 AA:** visible focus rings, full keyboard nav, sufficient color
  contrast, `prefers-reduced-motion` honored for any animation/effect, alt text
  on meaningful images, a "Plain"/reader mode if the design is effect-heavy.
- **Run Lighthouse / PageSpeed Insights** before launch; fix anything that drags
  LCP, CLS, or the a11y score below target.

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
- [ ] OG image renders in a social-card debugger (Twitter/LinkedIn/Slack)
- [ ] favicon is real, not a placeholder

Build & host
- [ ] `trailingSlash` ⊕ `build.format` ⊕ canonical ⊕ sitemap ⊕ host all agree (contract §1)
- [ ] custom domain + HTTPS (force) + HSTS
- [ ] a real `404` page exists and is styled
- [ ] analytics installed (Cloudflare Web Analytics or equivalent)
- [ ] environment variables set in **both** Production and Preview

Quality
- [ ] `prefers-reduced-motion` honored
- [ ] keyboard navigation works end-to-end; focus is always visible
- [ ] Lighthouse ≥ targets (Perf/A11y/Best-Practices/SEO)
- [ ] if there's a data sync: the health/dead-man's-switch monitor is live

---

*See `CLOUDFLARE.md` for the Cloudflare Pages + Workers setup that this baseline
assumes, and `templates/` for drop-in config.*
