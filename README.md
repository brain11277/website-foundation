<div align="center">

# 🧱 website-foundation

**Build your own personal site, with everything the last three taught me already in it.**

A zero-to-deployed quickstart, the design and voice decisions that separate a
site worth visiting from a generated one, and the structural contracts that keep
it correct. Written to be handed straight to an AI coding tool.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Checker: zero deps](https://img.shields.io/badge/checker-zero--deps-brightgreen.svg)](./scripts/verify-indexing.mjs)
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

- [Start here](#start-here)
- [Repo layout](#repo-layout)
- [What's inside](#whats-inside)
- [Handing this to an AI tool](#handing-this-to-an-ai-tool)
- [Keeping it clean — no secrets](#keeping-it-clean--no-secrets)
- [Contributing](#contributing)
- [About the author](#about-the-author)
- [Using this](#using-this)
- [License](#license)

## Start here

**Building a site?** Copy **[`starter/`](./starter/)** and follow
**[`QUICKSTART.md`](./QUICKSTART.md)**. That is the shortest correct path from
nothing to a live site on your domain, roughly 30 to 45 minutes, most of it
waiting on DNS.

**Want it to be good, not just correct?** **[`BUILDING.md`](./BUILDING.md)** is
the page set, the design token system, the voice guide, and the working loop.
This is the part most personal sites skip, and it is why most of them are
forgettable.

**Hardening a site you already have?** Skip both. Read
**[`FOUNDATION.md`](./FOUNDATION.md)**, run the checklist at the bottom, and
point `verify-indexing.mjs` at production.

```
starter/       ->  a working site to copy
QUICKSTART.md  ->  nothing to a deployed site
BUILDING.md    ->  deployed to worth visiting
FOUNDATION.md  ->  the contracts, and why each one exists
CLOUDFLARE.md  ->  the deployment specifics for both Cloudflare stacks
```

Everything here is MIT and meant to be copied. See
[Using this](#using-this) if you want the short version of what that allows.

## Repo layout

```
website-foundation/
├── starter/                   # a complete working site: copy it, make it yours
├── QUICKSTART.md              # nothing -> a deployed site on your domain
├── BUILDING.md                # deployed -> worth visiting: pages, tokens, voice, loop
├── FOUNDATION.md              # structural contracts + pre-launch checklist
├── CLOUDFLARE.md              # Workers Assets / Pages setup, the contracts that bite on both
├── templates/
│   ├── astro.config.mjs       # trailingSlash:'never' + build.format:'file', date-only lastmod
│   ├── wrangler.jsonc         # Workers Assets config, incl. the not_found_handling trap
│   ├── _headers               # security + cache baseline; why the rules are additive
│   ├── robots.txt             # allow crawl + point to sitemap
│   ├── _redirects             # one canonical host; 301 the other
│   ├── hooks/
│   │   └── session-start.sh   # stale-base check + regression-marker verification (§6)
│   └── workflows/
│       └── data-health.yml    # dead-man's-switch for an automated sync (§5)
├── scripts/
│   ├── verify-indexing.mjs    # zero-dep CI check: redirects, canonical, JSON-LD @id graph
│   └── verify-token-parity.mjs # zero-dep CI check: every color token themed (§4)
├── tests/
│   ├── run-fixtures.mjs       # runs both checkers against local fixtures; no network
│   ├── verify-starter.mjs     # builds the starter and asserts the contracts it claims
│   ├── lib/serve.mjs          # static server that resolves paths the way the host does
│   └── fixtures/              # sites and stylesheets that must pass, and must fail
├── prompts/
│   └── seo-cross-optimize.md  # paste-ready prompts for honest E-E-A-T / authorship signals
├── .github/workflows/
│   └── ci.yml                 # gitleaks, the fixture suite, and a real starter build
├── .gitignore                 # blocks env files, keys, secrets
└── LICENSE                    # MIT
```

## What's inside

| File | What it gives you |
|---|---|
| [`starter/`](./starter/) | **A complete, working Astro site.** Correct URL shape, a resolving JSON-LD entity graph, a token system with two themes in parity, full a11y boilerplate, security headers, and a 404 that actually renders. Deliberately plain: the structure is done, the taste is yours. Built and checked in CI on every commit. |
| [`QUICKSTART.md`](./QUICKSTART.md) | The shortest correct path from an empty directory to a live site: scaffold, config, deploy, custom domain, verify. Includes the "where things go wrong" table for the six failures that account for most of them. |
| [`BUILDING.md`](./BUILDING.md) | The part that decides whether anyone comes back: choosing a page set and cutting hard, building a design token system before the first screen, **writing a voice guide so your AI stops generating anonymous copy**, the Sync→Plan→Code loop, and what personality costs in accessibility terms. |
| [`FOUNDATION.md`](./FOUNDATION.md) | The contracts: URL/indexing, crawlability, per-page SEO, theme-token parity, pipeline health, enforcement machinery, a11y — **plus a pre-launch checklist.** |
| [`CLOUDFLARE.md`](./CLOUDFLARE.md) | Cloudflare setup, Workers Assets by default with Pages as a supported alternative: stack choice, the contracts that bite on both (URL shape, additive `_headers`, one canonical host), config for each path, deploy verification. |
| [`templates/astro.config.mjs`](./templates/astro.config.mjs) | Astro config with the load-bearing `trailingSlash: 'never'` + `build.format: 'file'` pairing. |
| [`templates/wrangler.jsonc`](./templates/wrangler.jsonc) | Workers Assets config, with `not_found_handling` (the setting whose default silently kills your 404 page) explained and a verify command inline. |
| [`templates/_headers`](./templates/_headers) | Security and cache baseline, documenting why a more specific rule does **not** override a broader one. |
| [`templates/robots.txt`](./templates/robots.txt) | Allows crawl, points at the sitemap. |
| [`templates/_redirects`](./templates/_redirects) | Picks one canonical host and 301s the other, because mixed hosts split your ranking signal. |
| [`templates/hooks/session-start.sh`](./templates/hooks/session-start.sh) | FOUNDATION §6 as a real hook: refuses to let a session start on a stale base, then verifies your regression markers still exist. |
| [`templates/workflows/data-health.yml`](./templates/workflows/data-health.yml) | FOUNDATION §5 as a real workflow: asserts your synced data is fresh and **opens an issue** when it isn't, because the dangerous failure is a sync that goes green while doing nothing. |
| [`scripts/verify-indexing.mjs`](./scripts/verify-indexing.mjs) | Zero-dependency Node script that fetches every sitemap URL and fails on any redirect, non-200, canonical mismatch, or **unresolved JSON-LD `@id`**. Warns on missing `lastmod`, stray `noindex`, `<h1>` count, and title/description length. **The check that catches the indexing bug before Google does.** |
| [`scripts/verify-token-parity.mjs`](./scripts/verify-token-parity.mjs) | Zero-dependency checker for §4: every color token in `:root` must be redefined in every theme block. Knows that a bare `139, 92, 246` channel triplet is a color, which is the token people forget. |
| [`tests/verify-starter.mjs`](./tests/verify-starter.mjs) | Builds the starter and asserts what it claims: the indexing contract, a 404 with a real body, one `<h1>` per page, a resolving entity graph, token parity, and no personal identifier in the output. |
| [`tests/run-fixtures.mjs`](./tests/run-fixtures.mjs) | Runs the verifier for real against local fixtures over Node's built-in http server, so the enforcement machinery is itself enforced. No network, no live site. |
| [`prompts/seo-cross-optimize.md`](./prompts/seo-cross-optimize.md) | Paste-ready prompts + a settings checklist for earning *honest* SEO value (entity/authorship signals, one reciprocal dofollow link) — no link schemes, no keyword stuffing. |

## Handing this to an AI tool

The repo is **public** precisely so a coding session can pull it in with zero
setup. No cloning, no repo scoping, just fetch the raw files:

```
https://raw.githubusercontent.com/brain11277/website-foundation/main/FOUNDATION.md
https://raw.githubusercontent.com/brain11277/website-foundation/main/CLOUDFLARE.md
https://raw.githubusercontent.com/brain11277/website-foundation/main/BUILDING.md
```

**Starting a new site:**

> *"Read https://raw.githubusercontent.com/brain11277/website-foundation/main/QUICKSTART.md
> and walk me through it for a site at `<my domain>`. Plan each step before you
> run it, and stop at step 4 so we can do the design and voice work together."*

**Hardening a site you already have:**

> *"Read the structural baseline at
> `https://raw.githubusercontent.com/brain11277/website-foundation/main/FOUNDATION.md`
> and audit this repo against every contract in it. Report what fails before
> changing anything."*

Point your `CLAUDE.md` at the raw URL rather than pasting the contracts in, so
you pick up fixes as they land. Paste them in only if you want a version frozen
against a tag.

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

## About the author

This foundation is maintained by **Brian Rain**, an AI Product & Partner
Success Leader working on Responsible AI, who builds and ships production
websites. The contracts
here are distilled from launching real sites and watching where they break —
the kind of structural debugging he writes about at
[brianrain.com](https://brianrain.com). For more on the thinking behind these
practices, see his [writing on building in the open](https://brianrain.com/writing).

## Using this

Everything here is [MIT](./LICENSE), and the point of the repo is that you copy
it. To be unambiguous about what that means in practice:

- **Copy the templates and config snippets freely.** No attribution expected for
  a `wrangler.jsonc`, a `_headers` file, or an Astro config. They are starting
  points, not a library.
- **Adapt the docs into your own `CLAUDE.md`.** That is the intended use, not a
  grey area. Rewrite them in your own words, cut what does not apply.
- **Build commercial things with it.** MIT, no restrictions, no notice needed on
  your deployed site.
- If you redistribute a substantial copy of the documentation itself, keep the
  MIT notice with it. That is the one thing the license actually asks for.

If the repo was useful and you want to say so, a link back or a
[citation](./CITATION.cff) is appreciated and never required.

## A site built this way

[brianrain.com](https://brianrain.com) is the reference implementation. Every
contract here was extracted from building and breaking it: the indexing
incident in §1, the additive `_headers` bug, the fonts that silently fell back,
the canvas that rasterized 97 MiB of sprites for a hidden element. If you want
to see what the end of this path looks like, that is it.

This repo is listed on its [projects page](https://brianrain.com/projects)
alongside the other things built there, if you want the short version of what
it is before reading any of the docs.

## License

[MIT](./LICENSE) © Brian Rain. Use it, fork it, adapt it for any project.
