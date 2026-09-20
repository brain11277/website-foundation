# Quickstart: nothing to a deployed site

The shortest correct path from an empty directory to a live, indexable site on
your own domain. Roughly 30 to 45 minutes, most of it waiting on DNS.

This gets you a site that is **structurally correct**. What makes it worth
visiting is [`BUILDING.md`](./BUILDING.md). Do this first, then go there.

**You need:** Node 22.12+ (what Astro 7 requires), a Cloudflare account (free), git, and an AI coding tool
if you want one. A domain is optional until step 7.

*The starter is built and checked against these contracts on every commit to
this repo, so this page cannot quietly go stale.*

---

## 1. Get the starter

Pull just the starter folder, with no git history attached to it:

```bash
npx degit brain11277/website-foundation/starter my-site
cd my-site
npm install
npm run dev
```

Or clone the whole repo and copy it out, if you want the docs locally too:

```bash
git clone https://github.com/brain11277/website-foundation.git
cp -R website-foundation/starter my-site
cd my-site && npm install && npm run dev
```

That is a complete, working site: correct URL shape, a resolving structured
data graph, a token system with two themes, full accessibility boilerplate, and
a 404 that actually renders. It is deliberately plain, because the structure is
what transfers and the taste is yours.

Astro is the choice here because it ships zero JavaScript by default, which is
most of the performance battle already won. The contracts in `FOUNDATION.md`
are not Astro-specific; use something else if you prefer and translate the
config yourself.

## 2. Make it yours

Open **`src/site.config.ts`** and work down it. Your domain, your name, your
profiles. Everything else in the site reads from that one file, including the
structured data, so there is nothing else to find and replace.

Then `wrangler.jsonc` (the `name` field) and `public/_redirects` (pick a
canonical host, delete the other).

The `trailingSlash: 'never'` plus `build.format: 'file'` pairing in
`astro.config.mjs` is load-bearing. It is the fix for the bug that started this
whole repo, where Google reported "Page with redirect" on every page of a site
that looked completely fine. Do not change it without reading `FOUNDATION.md`
§1.

## 3. Tell your AI what the rules are

The starter already ships a `CLAUDE.md` wired to the baseline: it points at the
raw contracts, states the workflow, and carries the conventions and a starter
regression registry.

Three sections in it are marked **FILL THIS IN**, and they are the highest
leverage two minutes in this whole process:

- **What this site is**, and explicitly what it is not.
- **Voice.** Do this before any copy exists.
- **Regression registry.** Starts with one worked row; add to it as you go.

Without those filled in, the model will cheerfully generate a site that reads
like every other generated site, and it will pass every automated check in this
repo while doing it.

## 4. Build something

The starter ships a homepage, an about page, a contact page and a 404 with
placeholder copy. Replace them with something only you could have written.

Before you write any of it, read **[`BUILDING.md`](./BUILDING.md)**: the page
set, the token system, and the voice guide. The voice guide in particular is
worth doing first rather than after, because rewriting generated copy costs
more than steering it did.

`CLAUDE.md` in the starter has three sections marked FILL THIS IN for exactly
this.

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
npm run verify -- https://example.com
```

The starter bundles the checker so this works from your own project, with no
dependency and nothing to install.

Every sitemap URL must be `200`, not a redirect, with a self-referencing
canonical and no dangling JSON-LD `@id`. This is the check that catches the
indexing bug class before Google does. Warnings about title and description
length are worth reading but will not fail you.

Then submit your sitemap to Google Search Console and Bing Webmaster Tools.
Nothing gets indexed if nobody knows it exists.

## 9. Install the machinery

So the contracts survive contact with your future self. These two live in
this repo rather than in the starter, because whether you want either depends
on how you work. Copy them from `templates/`:

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
