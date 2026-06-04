# Cloudflare Pages + Workers — New-Site Setup

The deployment half of the foundation. Pairs with `FOUNDATION.md` (the structural
contracts) and `templates/` (drop-in config). Assumes a static Astro build, but
the indexing/redirect notes apply to any static host on Cloudflare Pages.

## Why this stack

- **Pages:** zero-JS-by-default static hosting on Cloudflare's edge, free TLS,
  Git-connected auto-deploys, preview deploys per branch/PR.
- **Workers:** server-side only where you actually need it — API proxying, cron
  jobs, hostname-branching for microsite subdomains, KV-backed caches.

Static where possible, a Worker only where dynamic behavior is genuinely
required. Don't reach for a Worker for things a static build can do.

---

## 1. Create the Pages project

Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.

| Setting | Value |
|---|---|
| Framework preset | Astro (or *None* for a custom build) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | repo root (or the subdir if monorepo) |
| Node version | pin via `NODE_VERSION` env var (e.g. `20`) to match local |

- Production branch = `main`. Every other branch gets a **preview deploy** at
  `<branch>.<project>.pages.dev` — run `verify-indexing.mjs` against these.
- Set environment variables in **both** Production *and* Preview. A var missing
  from Preview is the most common "works in prod, broken in preview" cause.
  Public, build-time vars are conventionally prefixed `PUBLIC_`.

---

## 2. The trailing-slash gotcha (FOUNDATION §1, restated because it bites here)

Cloudflare Pages' asset server has an **auto-trailing-slash** behavior. If your
build emits `/about/index.html` (Astro's `build.format: 'directory'`), Pages
treats `/about/` as canonical and **308-redirects `/about` → `/about/`**. If
your canonical tags + sitemap emit `/about` (no slash), Googlebot fetches the
submitted URL, gets a redirect, and files **"Page with redirect"** on every page.

**Fix:** `trailingSlash: 'never'` **+** `build.format: 'file'` so pages build as
`/about.html`, served at `/about` with no redirect. Config in
`templates/astro.config.mjs`.

`public/_redirects` and `public/_headers` (copied verbatim into `dist/`) control
redirects and headers:

```
# public/_redirects — one canonical host; 301 the other.
https://www.example.com/*  https://example.com/:splat  301
```

```
# public/_headers — security + caching baseline
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

---

## 3. Custom domain & DNS

- Pages project → **Custom domains → Set up a domain.** If the domain's DNS is
  already on Cloudflare, records are added automatically (apex + `www`).
- **Pick one canonical host** (apex `example.com` *or* `www.example.com`) and
  301 the other to it — via the `_redirects` rule above or a Bulk Redirect.
  Mixed hosts split your SEO signal and trip the contract in FOUNDATION §1.
- SSL/TLS → **Always Use HTTPS: On.** Add HSTS once you're sure HTTPS is solid.

---

## 4. Workers — when (and only when) you need them

Reach for a Worker for:

- **API proxying** — calling an upstream that blocks browser CORS, or one with
  IP/TLS-fingerprint restrictions your CI runners hit but edge IPs don't.
- **Scheduled jobs** (`triggers.crons`) — keeping a KV cache warm, pinging a
  health check, periodic data sync.
- **Hostname branching** — serving microsite subdomains
  (`tool.example.com`) from one Worker by switching on the `Host` header.
- **KV-backed read caches** — store a merged/deduped dataset; **read-then-merge,
  never replace wholesale** (FOUNDATION §5), so records don't roll off.

Config lives in `wrangler.jsonc`:

```jsonc
{
  "name": "example-worker",
  "main": "worker/index.ts",
  "compatibility_date": "2026-01-01",
  "kv_namespaces": [{ "binding": "CACHE", "id": "<kv-id>" }],
  "triggers": { "crons": ["0 * * * *"] }
}
```

- Secrets: `npx wrangler secret put <NAME>` (never commit them). Build-time
  public config goes in Pages env vars; runtime secrets go in Worker secrets.
- Set `Cache-Control` deliberately on Worker responses, and add a cache-buster
  query param on any internal fetch that must bypass an edge cache.

---

## 5. Deploy verification (don't trust green)

After the first production deploy and on every meaningful change:

```bash
node scripts/verify-indexing.mjs https://example.com
```

It fetches the sitemap, then every URL with redirects disabled, and fails on any
`3xx`, non-`200`, or canonical mismatch — catching the "Page with redirect"
class *before* Search Console does. Wire it into CI as a post-deploy step against
the preview URL.

---

## Cloudflare launch checklist

- [ ] Pages project connected; build command `npm run build`, output `dist`
- [ ] `NODE_VERSION` pinned to match local
- [ ] env vars set in **both** Production and Preview
- [ ] `trailingSlash: 'never'` + `build.format: 'file'` (no "Page with redirect")
- [ ] `_redirects` picks one canonical host; other host 301s to it
- [ ] `_headers` security + cache baseline in place
- [ ] custom domain live; Always Use HTTPS on
- [ ] Cloudflare Web Analytics enabled
- [ ] `verify-indexing.mjs` green against the production domain
- [ ] any Worker: secrets set via `wrangler secret put`, cron schedule confirmed
