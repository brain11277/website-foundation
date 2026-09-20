# Starter

A minimal, correct Astro site. Copy this whole folder and make it yours.

It is deliberately plain. The structure, the accessibility and the indexing are
handled; the taste is the part you bring. See `BUILDING.md` in
website-foundation for how to decide the rest.

**Requires Node 22.12 or newer**, which is Astro 7's floor. On an older Node
the install succeeds and the build fails with an unsupported-version error.

```bash
npm install
npm run dev
```

## Change these, in this order

1. **`src/site.config.ts`.** Your domain, name, and profiles. Everything else
   reads from here, including the structured data. Nothing else hardcodes any
   of it.
2. **`wrangler.jsonc`.** The `name` field, and read the `not_found_handling`
   comment before you touch anything in `assets`.
3. **`public/_redirects`.** Pick a canonical host, delete the other.
4. **`CLAUDE.md`.** Three sections marked FILL THIS IN. Do the voice one before
   you write any copy, not after.
5. **`src/styles/tokens.css`.** Your colors. Re-measure contrast when you change
   them; the file lists the ratios the current values were verified at. Then run
   `npm run verify:tokens`, which catches a token you themed in one block and
   forgot in another.
6. **`src/pages/`.** Replace the placeholder copy with something only you could
   have written.
7. **`public/og/default.png`.** A real 1200x630 card. A social link with a
   missing image renders blank, which is worse than a plain one.

## What is already handled

| | |
|---|---|
| Indexing | Canonical URLs, sitemap with date-only `lastmod`, `robots.txt`, no-redirect URL shape |
| Structured data | A resolving `@id` entity graph. Person and WebSite on every indexable page, so page schemas never dangle |
| Accessibility | Skip link with a focusable target, visible focus rings, `prefers-reduced-motion`, 24px targets, `aria-current`, `aria-expanded` kept in step |
| Themes | Two themes plus a reader mode, restored before first paint so there is no flash, with a parity contract you can check mechanically |
| Headers | Security baseline and cache policy, with the additive-rules trap documented |
| 404 | A styled page **and** the host config that makes it actually render |

## Deploy

```bash
npm run build
npx wrangler deploy
```

Then verify rather than trusting it:

```bash
# Your 404 must have a non-zero byte count.
curl -s -o /dev/null -w '%{http_code} %{size_download}\n' https://yoursite/nope

# Every sitemap URL 200, canonical self-referencing, no dangling @id.
npm run verify -- https://yoursite

# Every color token redefined in every theme block. Run this after any
# change to tokens.css, not just before a deploy.
npm run verify:tokens
```

## Fonts

A system stack is active by default: zero bytes, no flash, native everywhere.
`src/components/Fonts.astro` has the whole self-hosting setup commented out,
with the three ways it silently fails. Read it before adding a typeface.

## Structure

```
src/
├── site.config.ts        identity, nav, profiles
├── layouts/BaseLayout    shell, pre-paint theme restore, skip link
├── components/
│   ├── SEOHead.astro     meta tags + the entity graph
│   ├── Fonts.astro       self-hosting pattern, off by default
│   ├── Header.astro      nav, theme and mode toggles
│   └── Footer.astro      rel="me" profile links
├── utils/
│   ├── seo.ts            canonical URLs + schema builders
│   ├── formatDate.ts     UTC-pinned, and that pin matters
│   └── contrast.ts       WCAG ratio math
├── styles/
│   ├── tokens.css        every color: a base plus two themes
│   └── base.css          reset + a11y boilerplate
├── data/types.ts         shapes for structured content
└── pages/                index, about, contact, 404

scripts/
├── verify-indexing.mjs   bundled, so `npm run verify` needs
│                         nothing installed
└── verify-token-parity.mjs   `npm run verify:tokens`
```
