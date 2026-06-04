# CLAUDE.md — website-foundation

## What this repo is

A portable, **content-agnostic** structural baseline for building new websites:
the URL/indexing contract, SEO invariants, Cloudflare Pages setup, and the
machinery that keeps them enforced. It is *not* a site — it carries no copy,
no design, no per-site data. It is the thing a new site copies *from*.

## The rules

- **`FOUNDATION.md` stays content-agnostic.** It holds only contracts that
  transfer between any site. If a rule only makes sense for one specific site,
  it belongs in that site's docs — not here. Authorship/attribution lives in
  `README.md` and `CITATION.cff`, never woven into the doctrine.
- **Portable lessons get folded in here.** When any new site teaches a
  structural lesson that would bite the next site too, add it to `FOUNDATION.md`
  in this repo — not only into that one site's per-file regression registry.
  The whole point is that the next site inherits it. (Regression registries are
  per-repo and do not transfer; the *pattern* does.)
- **No secrets, ever.** This repo is public and holds only generic guidance.
  `.gitignore` + gitleaks (CI) + GitHub push protection enforce it.

## Upstream relationship

This repo is the **upstream** for brianrain.com (`brian-rain-website`). That
site pulls the baseline in directly from raw GitHub — keep the raw paths stable:

```
https://raw.githubusercontent.com/brain11277/website-foundation/main/FOUNDATION.md
https://raw.githubusercontent.com/brain11277/website-foundation/main/CLOUDFLARE.md
```

## Workflow

Public repo: branch, never commit to `main`, open a PR, show the diff before
merging. Every change must read naturally to a human first — no link schemes,
no keyword stuffing.
