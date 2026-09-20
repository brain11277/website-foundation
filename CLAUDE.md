# CLAUDE.md — website-foundation

## What this repo is

A portable, **content-agnostic** baseline for building a personal website,
especially with AI coding tools: a zero-to-deployed quickstart, the design and
voice decisions that separate a site worth visiting from a generated one, the
URL/indexing contract and SEO invariants, Cloudflare setup, and the machinery
that keeps it all enforced.

It is not *a* site; it is the thing a new site copies *from*. It does ship a
`starter/`, which is a real working Astro site, because a baseline that cannot
start a site is only half a baseline. The rule that still holds absolutely:
**nothing here carries personal content.** The starter has placeholder copy and
neutral tokens. The moment something would need a specific person's name,
palette or voice, it belongs in their repo, not this one.

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
- **The starter must stay green and stay neutral.** It is verified in CI on
  every commit: it builds, its output passes `verify-indexing.mjs`, its 404
  returns a real body, its entity graph resolves, its theme blocks are in
  parity, and no personal identifier appears in the build. If you change it,
  run `node tests/verify-starter.mjs --build` before opening the PR.
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
