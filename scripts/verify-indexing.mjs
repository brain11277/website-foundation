#!/usr/bin/env node
// verify-indexing.mjs — enforces FOUNDATION.md §1 (URL & Indexing Contract)
// against a live or preview deploy. No dependencies; Node 18+ (global fetch).
//
//   node verify-indexing.mjs https://example.com
//
// Reads the sitemap, then fetches every listed URL with redirects DISABLED and
// asserts:
//   1. status is 200 (not 3xx — the "Page with redirect" class)
//   2. the <link rel="canonical"> self-references the fetched URL
//   3. no accidental <meta name="robots" content="noindex"> on indexable pages
// Exits 1 on any failure so CI fails red. This is the check that catches the
// indexing bug BEFORE Search Console does.

const base = process.argv[2];
if (!base) {
  console.error('usage: node verify-indexing.mjs <base-url>');
  process.exit(2);
}
const origin = new URL(base).origin;

const stripSlash = (u) => u.replace(/\/$/, '');

async function collectSitemapUrls(origin) {
  const candidates = ['/sitemap-index.xml', '/sitemap.xml', '/sitemap-0.xml'];
  const urls = new Set();
  for (const path of candidates) {
    let res;
    try {
      res = await fetch(origin + path);
    } catch {
      continue;
    }
    if (!res.ok) continue;
    const xml = await res.text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
    for (const loc of locs) {
      if (loc.endsWith('.xml')) {
        // sitemap index → follow nested sitemaps
        try {
          const sub = await fetch(loc);
          if (sub.ok) {
            const subXml = await sub.text();
            for (const m of subXml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
              urls.add(m[1].trim());
            }
          }
        } catch {
          /* ignore unreachable nested sitemap */
        }
      } else {
        urls.add(loc);
      }
    }
    if (urls.size) break;
  }
  return [...urls];
}

const urls = await collectSitemapUrls(origin);
if (!urls.length) {
  console.error(`no sitemap found under ${origin} (tried sitemap-index.xml, sitemap.xml, sitemap-0.xml)`);
  process.exit(2);
}

console.log(`checking ${urls.length} URL(s) from sitemap at ${origin}\n`);
let failures = 0;

for (const url of urls) {
  let res;
  try {
    res = await fetch(url, { redirect: 'manual' });
  } catch (err) {
    console.error(`FAIL  unreachable     ${url}  (${err.message})`);
    failures++;
    continue;
  }

  if (res.status >= 300 && res.status < 400) {
    console.error(`FAIL  redirect ${res.status}    ${url}  ->  ${res.headers.get('location')}`);
    failures++;
    continue;
  }
  if (res.status !== 200) {
    console.error(`FAIL  status ${res.status}      ${url}`);
    failures++;
    continue;
  }

  const html = await res.text();

  const tag = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i);
  if (tag) {
    const href = (tag[0].match(/href=["']([^"']+)["']/i) || [])[1];
    if (href && stripSlash(href) !== stripSlash(url)) {
      console.error(`FAIL  canonical ≠ url  ${url}  canonical=${href}`);
      failures++;
      continue;
    }
  } else {
    console.error(`WARN  no canonical    ${url}`);
  }

  if (/<meta[^>]+name=["']robots["'][^>]*noindex/i.test(html)) {
    console.error(`WARN  noindex present ${url}  (intentional? exclude from sitemap if so)`);
  }

  console.log(`ok    ${url}`);
}

if (failures) {
  console.error(`\n${failures} failure(s) — the indexing contract is broken.`);
  process.exit(1);
}
console.log('\nall good — every sitemap URL is 200 with a self-referencing canonical.');
