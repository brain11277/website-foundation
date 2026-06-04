# Prompt: make `website-foundation` an SEO asset for brianrain.com

Two paste-ready prompts plus a phone-friendly settings checklist. The goal is
**honest** SEO value — entity/brand authority, referral traffic, and one genuine
dofollow link from brianrain.com — not link schemes or keyword stuffing
(those get penalized and cheapen the repo).

Why this works: GitHub renders README links as `nofollow`, so the public repo's
value to brianrain.com is (a) a credible engineering artifact that reinforces
"Brian Rain" as an entity Google trusts on this topic, (b) referral clicks, and
(c) the **reciprocal dofollow link from brianrain.com → repo**, which is the part
that actually passes ranking signals.

---

## Prompt 1 — run in the `website-foundation` repo

```
You are working in the public brain11277/website-foundation repo. Make it a
genuine, non-spammy SEO asset for brianrain.com. Do NOT use link schemes,
keyword stuffing, doorway content, or anything that reads unnaturally to a
human — every change must improve the repo for a real reader first.

Tasks:
1. README authorship / E-E-A-T signals:
   - Add an "About the author" section near the bottom: Brian Rain, Senior AI
     Product & Transformation Leader, with a one-line bio and a natural
     contextual link to https://brianrain.com (and /about, /writing where it
     reads naturally). Use descriptive anchor text — never "click here", never
     a wall of links. One or two links, placed where a reader would want them.
   - Where the README references the "Page with redirect" indexing incident,
     link it to a relevant brianrain.com writing piece if one exists (check the
     site); otherwise link to https://brianrain.com/writing.
2. Add a CITATION.cff at the repo root: title, author "Brian Rain", url
   https://brianrain.com, repository-code the GitHub URL, and relevant keywords.
   This gives the repo a machine-readable authorship/citation surface.
3. Keep FOUNDATION.md content-agnostic — authorship/attribution belongs in
   README + CITATION.cff, NOT woven into the doctrine.
4. Verify: all links resolve, no broken anchors, README still reads cleanly.
5. The repo description, topics, and homepage URL must be set in repo Settings
   (web UI) — you cannot edit those from code, so OUTPUT the exact recommended
   values for me to paste:
   - Description (≤350 chars, keyword-honest, names Brian Rain + brianrain.com)
   - Homepage URL: https://brianrain.com
   - Topics: astro, cloudflare-pages, technical-seo, seo, static-site,
     indexing, sitemap, web-performance, googlebot, web-development

Commit on a branch and open a PR. Show me the diff before merging.
```

---

## Prompt 2 — run in the `brian-rain-website` repo (the reciprocal link)

```
You are working in the brian-rain-website repo (brianrain.com). I want a single,
tasteful, genuine link from the site to my public engineering repo
https://github.com/brain11277/website-foundation, plus the entity signal in
schema. This is the part that passes real SEO value, so do it carefully and to
the letter of CLAUDE.md.

Follow the repo workflow: Sync → Explore → Plan (plan mode, no code yet) →
Code only after I approve → Commit. Hold the SEO baseline, the voice guide, the
cross-page consistency rules, and the /ground-truth secrecy contract — do not
touch /ground-truth.

Propose (in plan mode) the best home for ONE outbound link to the repo —
candidates: a "building in the open" mention on /about, or a credit in the
footer — chosen to read naturally in Brian's voice, not as SEO bait. Make it a
normal dofollow link (no rel="nofollow").

Also: add the GitHub profile (https://github.com/brain11277) to the Person
schema `sameAs` array in src/utils/seo.ts if it's not already there — that's a
legitimate entity signal linking the brand to the verified engineering account.

Before committing, run the voice-copy-reviewer on any new prose and the
design-system-auditor if any styling changed. Confirm the page still passes the
SEO baseline (one h1, schema valid, title/description lengths).
```

---

## Phone-friendly settings checklist (no session needed)

Do these in the GitHub web/mobile UI after publishing — they're the
highest-leverage discoverability levers and take two minutes:

- [ ] **About → Description**: a one-line, honest summary that names the stack and Brian Rain.
- [ ] **About → Website**: `https://brianrain.com`
- [ ] **About → Topics**: `astro` `cloudflare-pages` `technical-seo` `seo` `static-site` `indexing` `sitemap` `web-performance` `googlebot` `web-development`
- [ ] **Settings → Code security → Push protection**: on (the secret backstop).
- [ ] Pin the repo to your GitHub profile so it surfaces on the profile that brianrain.com's schema `sameAs` will point to.
