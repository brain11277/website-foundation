# Quickstart: nothing to a deployed site

The shortest correct path from an empty directory to a live, indexable site on
your own domain. Roughly 30 to 45 minutes, most of it waiting on DNS.

This gets you a site that is **structurally correct**. What makes it worth
visiting is [`BUILDING.md`](./BUILDING.md). Do this first, then go there.

**You need:** Node 20+, a Cloudflare account (free), git, and an AI coding tool
if you want one. A domain is optional until step 7.

*Verified end to end on 2026-09-20 against Astro 7.3.3 and @astrojs/sitemap
3.7.4: the config below builds clean, emits the right URL shape, and passes
`verify-indexing.mjs`.*

---

## 1. Scaffold

```bash
npm create astro@latest my-site
cd my-site
npm install @astrojs/sitemap
```

Pick the minimal or empty template when prompted, and say yes to TypeScript.
Astro is the recommendation here because it ships zero JavaScript by default,
which is most of the performance battle already won. The contracts in
`FOUNDATION.md` are not Astro-specific, so use something else if you prefer;
you will just be translating the config yourself.

## 2. Drop in the config

Copy these four out of [`templates/`](./templates/):

| File | Goes to | Change |
|---|---|---|
| `astro.config.mjs` | project root | `site:` to your domain |
| `robots.txt` | `public/robots.txt` | the `Sitemap:` domain |
| `_headers` | `public/_headers` | nothing, unless you add prefixes |
| `wrangler.jsonc` | project root | `name:` to your project |

The `trailingSlash: 'never'` plus `build.format: 'file'` pairing in the Astro
config is load-bearing. It is the fix for the bug that started this whole repo,
where Google reported "Page with redirect" on every page of a site that looked
completely fine. Do not change it without reading `FOUNDATION.md` §1.

## 3. Tell your AI what the rules are

If you are building with an AI tool, this is the highest-leverage two minutes in
the whole process. Create `CLAUDE.md` (or `AGENTS.md`) in the project root:

```markdown
# CLAUDE.md

## The baseline
Read and hold the structural contracts at:
https://raw.githubusercontent.com/brain11277/website-foundation/main/FOUNDATION.md

Deployment specifics:
https://raw.githubusercontent.com/brain11277/website-foundation/main/CLOUDFLARE.md

## Workflow (non-negotiable)
Sync (git fetch, confirm not behind) -> Explore -> Plan in plan mode, no code
-> Code only after I approve -> Commit.

## This site
<one paragraph: who it is for, what it is for, what it is not>

## Voice
<see BUILDING.md; write this before you write any copy>
```

Without this the model will cheerfully generate a site that violates half the
contracts, and you will not notice until Search Console tells you months later.

## 4. Build something

Stop here and read [`BUILDING.md`](./BUILDING.md) for the page set, the design
tokens, and the voice guide. Come back when you have pages worth deploying.

The minimum for this quickstart to mean anything: a homepage, a real `404.astro`,
and one content page.

## 5. Deploy

```bash
npm run build
npx wrangler deploy
```

That is the whole deploy. Workers Assets serves your `dist/` from Cloudflare's
edge with no Worker script involved.

For push-triggered deploys, connect the repo through **Workers Builds** in the
Cloudflare dashboard instead. See `CLOUDFLARE.md` for when you would want a
Worker script (you probably do not, yet).

## 6. Prove the 404 works

Do this now, not later. It is the single most common thing to get silently wrong
on this stack:

```bash
curl -s -o /dev/null -w '%{http_code} %{size_download}\n' https://<your-worker-url>/nope
```

You want a `404` **and a non-zero byte count**. A zero means `not_found_handling`
is missing from `wrangler.jsonc` and your styled 404 page is never being served.
Cloudflare Pages used to detect `404.html` automatically; Workers deliberately
does not.

## 7. Custom domain

Cloudflare dashboard, your Worker, **Settings → Domains & Routes → Add custom
domain**. If the domain's DNS is already on Cloudflare the records are created
for you.

Then pick **one** canonical host, apex or `www`, and 301 the other to it. Mixed
hosts split your ranking signal. `public/_redirects`:

```
https://www.example.com/*  https://example.com/:splat  301
```

Turn on **SSL/TLS → Always Use HTTPS**.

## 8. Verify before you tell anyone

```bash
node scripts/verify-indexing.mjs https://example.com
```

Every sitemap URL must be `200`, not a redirect, with a self-referencing
canonical and no dangling JSON-LD `@id`. This is the check that catches the
indexing bug class before Google does. Warnings about title and description
length are worth reading but will not fail you.

Then submit your sitemap to Google Search Console and Bing Webmaster Tools.
Nothing gets indexed if nobody knows it exists.

## 9. Install the machinery

So the contracts survive contact with your future self:

- `templates/hooks/session-start.sh` to `.claude/hooks/`, and register it as a
  SessionStart hook. It stops an AI session from designing against a stale base,
  which is the most expensive mistake in this whole workflow.
- `templates/workflows/data-health.yml` to `.github/workflows/`, but only if your
  site syncs data from somewhere on a schedule. Fill in the four values at the
  top. Skip it entirely if your content is all hand-written.

## 10. Walk the checklist

The **Pre-launch checklist** at the bottom of [`FOUNDATION.md`](./FOUNDATION.md).
It is short and every line on it is there because it broke something once.

---

## Where things go wrong

| Symptom | Almost always |
|---|---|
| Every page is "Page with redirect" in Search Console | `build.format` and `trailingSlash` disagree, §1 |
| 404 page never appears, empty body | `not_found_handling` missing from `wrangler.jsonc` |
| A cache header is malformed or ignored | Two `_headers` rules match and concatenated, §2 of `CLOUDFLARE.md` |
| Fonts silently fall back to system serif | `format('woff2-variations')` with no plain `woff2` fallback, §7 |
| Theme looks wrong in one mode only | A `:root` token with no override in that theme block, §4 |
| Sync went green but the site is stale | No dead-man's-switch, §5 |
