# Prompt: earn honest SEO for your name

A paste-ready pair of prompts plus a settings checklist, for when you have a
personal site **and** a public repo and want them to reinforce each other.

The goal is honest value: entity and brand authority, referral traffic, and one
genuine link. Not link schemes, not keyword stuffing, not doorway pages. Those
get penalized, and they make a repo worse for the humans who find it.

**Why this works.** GitHub renders README links as `nofollow`, so a public repo
does not pass ranking signal to your site directly. What it does give you is
(a) a credible engineering artifact that reinforces your name as an entity
search engines can trust on a topic, (b) referral clicks from people who found
the repo, and (c) a reciprocal link **from your site to the repo**, which is the
part that actually carries signal, plus the `sameAs` entity connection in your
schema.

No public repo? Skip to prompt 2 and use the schema half. The `sameAs` advice
stands on its own.

---

## Prompt 1: run this in your public repo

Replace `<REPO>`, `<YOUR SITE>`, `<YOUR NAME>` and `<YOUR ROLE>` before pasting.

```
You are working in the public repo <REPO>. Make it a genuine, non-spammy SEO
asset for <YOUR SITE>. Do NOT use link schemes, keyword stuffing, doorway
content, or anything that reads unnaturally to a human. Every change must
improve the repo for a real reader first; if a change only makes sense to a
crawler, do not make it.

Tasks:
1. README authorship and E-E-A-T signals:
   - Add an "About the author" section near the bottom: <YOUR NAME>, <YOUR
     ROLE>, a one-line bio, and a natural contextual link to <YOUR SITE>. Use
     descriptive anchor text, never "click here", never a wall of links. One or
     two links, placed where a reader would actually want them.
   - If the README describes a problem you have written about publicly, link
     that mention to the specific piece. Confirm the page exists first; do not
     invent URLs.
2. Add a CITATION.cff at the repo root: title, author, url, repository-code,
   license, version, date-released, and honest keywords. This gives the repo a
   machine-readable authorship surface that tools and indexes can read.
3. Keep the technical documentation content-agnostic. Authorship and
   attribution belong in README and CITATION.cff, never woven into the
   doctrine, where it reads as self-promotion and ages badly.
4. Verify: every link resolves, no broken anchors, and the README still reads
   cleanly top to bottom for someone who has never heard of me.
5. Repo description, topics and homepage URL can only be set in repo Settings,
   which you cannot edit from code. OUTPUT the exact recommended values for me
   to paste:
   - Description (<=350 chars, honest, names the stack and me)
   - Homepage URL
   - Topics (8 to 10, the ones someone would actually search)

Work on a branch and open a PR. Show me the diff before merging.
```

## Prompt 2: run this in your site repo

```
You are working in the repo for <YOUR SITE>. I want one tasteful, genuine link
from the site to my public repo <REPO>, plus the entity signal in schema.

Follow this repo's workflow: sync, explore, plan with no code, code only after
I approve, then commit. Hold the SEO baseline, the voice guide, and any
cross-page consistency rules already documented here.

In plan mode, propose the single best home for ONE outbound link to the repo.
Candidates: a "building in the open" mention on the About page, or a credit in
the footer. Choose whichever reads naturally in my voice rather than as SEO
bait. Make it a normal dofollow link; do not add rel="nofollow".

Also add my profile URLs to the Person schema `sameAs` array: the code-hosting
profile, and any publication or professional profile that is genuinely mine.
`sameAs` is how a search engine connects separate accounts to one entity, so
include only profiles I control and that are actually about me.

Before committing, confirm the page still passes the SEO baseline: one h1,
valid schema, title and description within their length windows.
```

---

## Settings checklist

The highest-leverage two minutes, and none of it needs a coding session. Do it
in the GitHub web or mobile UI:

- [ ] **About → Description**: one honest line that names the stack and you.
- [ ] **About → Website**: your site.
- [ ] **About → Topics**: 8 to 10 real ones. For a site baseline, something like
      `astro` `cloudflare-workers` `technical-seo` `seo` `static-site`
      `indexing` `sitemap` `web-performance` `accessibility` `web-development`
- [ ] **Settings → Code security → Push protection**: on.
- [ ] Pin the repo to your profile, so it surfaces on the account your site's
      schema `sameAs` points at.
- [ ] Tag a release. A repo people copy from should let them say which version
      they copied.

## What not to do

- Do not add links to your site from unrelated repos, or from issue and PR
  comments. That is a link scheme and it is detectable.
- Do not put keyword lists in your README, your alt text, or your schema.
- Do not claim credentials, awards or affiliations you do not have. Structured
  data that contradicts reality is the fastest way to lose trust signals, and it
  is the one mistake that is genuinely hard to walk back.
