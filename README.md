<div align="center">

# 🧱 website-foundation

**The structural baseline for shipping a new website — so each one doesn't start from scratch.**

The content-agnostic lessons that transfer between sites: indexing correctness,
SEO invariants, Cloudflare deployment, and the machinery to keep them enforced.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Dependencies](https://img.shields.io/badge/dependencies-none-brightgreen.svg)](./scripts/verify-indexing.mjs)
[![Secret scan](https://img.shields.io/badge/secret--scan-gitleaks-blueviolet.svg)](./.github/workflows/ci.yml)
[![CI](https://github.com/brain11277/website-foundation/actions/workflows/ci.yml/badge.svg)](https://github.com/brain11277/website-foundation/actions/workflows/ci.yml)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#contributing)

</div>

---

## Why this exists

Every new site re-learns the same structural lessons by re-hitting the same
bugs. The headline one that motivated this repo: a static site went live and
Google Search Console reported **"Page with redirect"** on *every page*. Nothing
was wrong with the content — five layers (`trailingSlash`, `build.format`,
canonical tag, sitemap, and the host's redirect behavior) each looked correct
but disagreed on the URL shape, so Googlebot fetched every submitted URL and got
a 308.

That bug has nothing to do with what's *on* a site, which means it'll bite the
next one too. This repo captures that class of lesson once, as enforceable
contracts — not as tribal memory.

> The thing that does **not** transfer between repos is a per-file regression
> registry. What transfers is this short list of structural contracts plus the
> machinery that enforces them.

## Contents

- [Repo layout](#repo-layout)
- [Start a new site](#start-a-new-site)
- [What's inside](#whats-inside)
- [For a future AI session](#for-a-future-ai-session)
- [Keeping it clean — no secrets](#keeping-it-clean--no-secrets)
- [Contributing](#contributing)
- [License](#license)

## Repo layout

```
website-foundation/
├── FOUNDATION.md              # structural contracts + pre-launch checklist
├── CLOUDFLARE.md              # Pages + Workers setup, the trailing-slash gotcha
├── templates/
│   ├── astro.config.mjs       # trailingSlash:'never' + build.format:'file'
│   └── robots.txt             # allow crawl + point to sitemap
├── scripts/
│   └── verify-indexing.mjs    # zero-dep CI check: no redirects, canonical match
├── .github/workflows/
│   └── ci.yml                 # gitleaks secret scan + script syntax check
├── .gitignore                 # blocks env files, keys, secrets
└── LICENSE                    # MIT
```

## Start a new site

1. Copy the contracts from **[`FOUNDATION.md`](./FOUNDATION.md)** into the new
   repo's `CLAUDE.md` / `AGENTS.md`.
2. Drop **[`templates/astro.config.mjs`](./templates/astro.config.mjs)** and
   **[`templates/robots.txt`](./templates/robots.txt)** in (swap the domain).
3. Follow **[`CLOUDFLARE.md`](./CLOUDFLARE.md)** to stand up Pages (and a Worker
   only if you actually need server-side behavior).
4. Add **[`scripts/verify-indexing.mjs`](./scripts/verify-indexing.mjs)** and run
   it against the preview deploy in CI:
   ```bash
   node scripts/verify-indexing.mjs https://your-preview-url.pages.dev
   ```
5. Walk the **Pre-launch checklist** at the bottom of `FOUNDATION.md` before
   going live.

## What's inside

| File | What it gives you |
|---|---|
| [`FOUNDATION.md`](./FOUNDATION.md) | The contracts: URL/indexing, crawlability, per-page SEO, theme-token parity, pipeline health, enforcement machinery, a11y — **plus a pre-launch checklist.** |
| [`CLOUDFLARE.md`](./CLOUDFLARE.md) | Cloudflare Pages + Workers setup: project config, the trailing-slash gotcha, DNS / custom domain, when a Worker is justified, deploy verification. |
| [`templates/astro.config.mjs`](./templates/astro.config.mjs) | Astro config with the load-bearing `trailingSlash: 'never'` + `build.format: 'file'` pairing. |
| [`templates/robots.txt`](./templates/robots.txt) | Allows crawl, points at the sitemap. |
| [`scripts/verify-indexing.mjs`](./scripts/verify-indexing.mjs) | Zero-dependency Node script that fetches every sitemap URL and fails on any redirect / non-200 / canonical mismatch. **The check that catches the indexing bug before Google does.** |

## For a future AI session

This repo is **public** specifically so any future coding session can pull the
baseline in with zero setup — fetch the raw files directly, no repo scoping
required:

```
https://raw.githubusercontent.com/brain11277/website-foundation/main/FOUNDATION.md
https://raw.githubusercontent.com/brain11277/website-foundation/main/CLOUDFLARE.md
```

> **Reusable kickoff prompt:**
> *"Read the structural baseline at
> `https://raw.githubusercontent.com/brain11277/website-foundation/main/FOUNDATION.md`
> and apply its contracts to this repo's CLAUDE.md and Cloudflare setup."*

## Keeping it clean — no secrets

This repo holds only generic engineering guidance; it should **never** contain a
credential. Three layers enforce that:

1. **`.gitignore`** blocks env files, `*.pem` / `*.key`, `.dev.vars`, service
   accounts, and `.wrangler/` before they're ever staged.
2. **`gitleaks`** runs in CI (`.github/workflows/ci.yml`) on every push and PR
   and fails the build if any secret pattern slips through.
3. **GitHub native secret scanning + push protection** is automatic on public
   repos — enable *Push protection* under **Settings → Code security** as the
   final backstop.

Real secrets belong in Cloudflare: `wrangler secret put <NAME>` for Workers,
Pages environment variables for build-time public config. Never in Git.

## Contributing

When a new site teaches a portable lesson, fold it back into `FOUNDATION.md`
**here** — not just into that one site's regression registry. The whole point is
that the next site inherits it. Keep entries content-agnostic: if a rule only
makes sense for one specific site, it belongs in that site's docs, not this
baseline.

## License

[MIT](./LICENSE) © Brian Rain. Use it, fork it, adapt it for any project.
