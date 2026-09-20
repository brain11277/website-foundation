#!/usr/bin/env node
// verify-indexing.mjs — enforces FOUNDATION.md §1 (URL & Indexing Contract)
// against a live or preview deploy. No dependencies; Node 18+ (global fetch).
//
//   node verify-indexing.mjs https://example.com
//
// Reads the sitemap, then fetches every listed URL with redirects DISABLED and
// asserts (failing CI red):
//   1. status is 200 (not 3xx — the "Page with redirect" class)
//   2. the <link rel="canonical"> self-references the fetched URL
//   3. every JSON-LD @id the page REFERENCES resolves: defined on the page,
//      or on the same-origin document its @id URL points at
// and WARNS (non-fatal) on things that are usually, but not always, bugs:
//   - a missing canonical tag
//   - a <meta name="robots" content="noindex"> on a page that's in the sitemap
//   - no <lastmod> in the sitemap
//   - not exactly one <h1>; title outside 30-60; description outside 110-160
// Exits 1 on any assertion failure. This is the check that catches the indexing
// bug BEFORE Search Console does.
//
// On the regex: the JSON-LD check extracts the <script> block by pattern and
// then uses JSON.parse, so the part that matters is not pattern-matching. The
// <h1>/title/description checks ARE regex over HTML and will mis-handle
// pathological markup (a tag inside a comment, say). They warn rather than
// fail for exactly that reason: they are regression guards on markup you
// control, not a validator. Keeping this file dependency-free is deliberate.

const base = process.argv[2];
if (!base) {
  console.error('usage: node verify-indexing.mjs <base-url>');
  process.exit(2);
}
const origin = new URL(base).origin;

// Normalize for comparison: resolve to an absolute URL, drop a trailing slash
// on the path, and ignore a default port. This compares scheme + host + path so
// a canonical that differs only by host/scheme (e.g. www vs apex, http vs
// https) is caught as the mismatch it is — the exact host-split failure §1/§3
// warn about — rather than passing on a naive string strip.
const normalize = (u, baseUrl) => {
  const parsed = new URL(u, baseUrl);
  parsed.hash = '';
  parsed.search = '';
  parsed.pathname = parsed.pathname.replace(/\/$/, '') || '/';
  return parsed.href;
};

// Length contracts are about the RENDERED string, so entities have to come out
// first. `&amp;` is five characters of markup and one character of title, and
// counting the markup reports a 60-char title as 64 and fails it. Minimal by
// design: named entities that actually show up in titles, plus numeric.
function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&'); // last, so &amp;lt; decodes to &lt; not <
}

// Collect every @id a page DEFINES versus every @id it merely REFERENCES.
//
// A definition is a node carrying @id plus real properties (usually @type).
// A reference is a bare {"@id": "..."} used as a property value, e.g.
// `mainEntity: {"@id": ".../#person"}`. A reference whose target is defined
// nowhere on the page is a dangling edge: a crawler that follows it finds
// nothing, and absolutely nothing in the build warns you. That is the failure
// this check exists for (FOUNDATION §3).
//
// JSON-LD is real JSON, so once the <script> block is extracted this is
// JSON.parse rather than pattern-matching, which keeps it honest with no
// dependency.
function collectSchemaIds(html) {
  const defined = new Set();
  const referenced = new Map(); // @id -> true

  const blocks = [
    ...html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ];

  for (const block of blocks) {
    let parsed;
    try {
      parsed = JSON.parse(block[1].trim());
    } catch {
      // A block that doesn't parse is its own problem; report and move on.
      referenced.set('__unparseable__', true);
      continue;
    }

    const walk = (node) => {
      if (Array.isArray(node)) return node.forEach(walk);
      if (!node || typeof node !== 'object') return;

      const id = node['@id'];
      if (typeof id === 'string') {
        const keys = Object.keys(node).filter((k) => k !== '@id');
        // @type alone is enough to call it a definition; a node with other
        // real properties counts too (some vocabularies omit @type).
        if (keys.length > 0) defined.add(id);
        else referenced.set(id, true);
      }

      for (const value of Object.values(node)) walk(value);
    };

    walk(parsed);
  }

  return { defined, referenced: [...referenced.keys()] };
}

// Cache of documents already fetched while resolving cross-document @id
// references, so a set referenced from ten pages costs one request.
const docIdCache = new Map();

/**
 * Does `docUrl` define `id` in its own JSON-LD?
 *
 * An @id is a URI, not a same-page label. It is legitimate, and sometimes the
 * only correct option, to reference a node defined on another page: a
 * hand-authored page that cannot emit the site-wide entity graph still needs
 * to say which set its term belongs to, and `inDefinedTermSet` has to
 * reference by @id because a bare URL string there resolves to the wrong type.
 *
 * So a reference to another document is only dangling if that document really
 * does not define it. Fetch and find out rather than assuming.
 */
async function documentDefines(docUrl, id) {
  if (!docIdCache.has(docUrl)) {
    let ids = new Set();
    try {
      const res = await fetch(docUrl, { redirect: 'follow' });
      if (res.ok) ids = collectSchemaIds(await res.text()).defined;
    } catch {
      /* unreachable: treat as defining nothing */
    }
    docIdCache.set(docUrl, ids);
  }
  return docIdCache.get(docUrl).has(id);
}

// Set when any sitemap in the chain carries a <lastmod>. Freshness is a
// quality signal rather than a correctness break, so a miss warns (FOUNDATION §2).
let sawLastmod = false;

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
    if (/<lastmod>/i.test(xml)) sawLastmod = true;
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
    for (const loc of locs) {
      if (loc.endsWith('.xml')) {
        // sitemap index → follow nested sitemaps
        try {
          const sub = await fetch(loc);
          if (sub.ok) {
            const subXml = await sub.text();
            if (/<lastmod>/i.test(subXml)) sawLastmod = true;
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
if (!sawLastmod) {
  console.error('WARN  no <lastmod> in the sitemap (freshness signal; emit it date-only)\n');
}
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
    if (href && normalize(href, url) !== normalize(url)) {
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

  // Schema graph integrity (FOUNDATION §3). A hard failure: an unresolved
  // reference is always wrong, and it is invisible without a check like this.
  const { defined, referenced } = collectSchemaIds(html);
  if (referenced.includes('__unparseable__')) {
    console.error(`FAIL  bad JSON-LD     ${url}  (a ld+json block does not parse)`);
    failures++;
    continue;
  }
  const unresolved = [];
  for (const id of referenced.filter((i) => !defined.has(i))) {
    // Which document is this @id claiming to live in?
    let target;
    try {
      target = new URL(id, url);
    } catch {
      unresolved.push(id);
      continue;
    }
    const targetDoc = `${target.origin}${target.pathname}`;
    const thisDoc = (() => {
      const u = new URL(url);
      return `${u.origin}${u.pathname}`;
    })();

    // Same document, not defined here: this is the real bug class, a page
    // referencing an entity nothing ever declares.
    if (normalize(targetDoc) === normalize(thisDoc)) {
      unresolved.push(id);
      continue;
    }
    // Off-site: not ours to verify.
    if (target.origin !== origin) continue;

    if (!(await documentDefines(targetDoc, id))) unresolved.push(id);
  }

  if (unresolved.length) {
    console.error(`FAIL  dangling @id    ${url}  referenced but never defined: ${unresolved.join(', ')}`);
    failures++;
    continue;
  }

  // The §3 per-page invariants. These are regex-based, so they are regression
  // guards on markup you control, not a validator: an <h1> inside a comment or
  // a CDATA block would fool the count. They warn rather than fail for that
  // reason, except where the contract is unambiguous.
  const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
  if (h1Count !== 1) {
    console.error(`WARN  ${h1Count} <h1> tags    ${url}  (contract says exactly 1)`);
  }

  const titleText = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1];
  if (titleText) {
    const len = decodeEntities(titleText).trim().length;
    if (len < 30 || len > 60) {
      console.error(`WARN  title ${len} chars  ${url}  (contract says 30-60)`);
    }
  }

  // Backreference the opening quote rather than excluding both quote
  // characters. A description containing an apostrophe ("Brian Rain's
  // background...") otherwise truncates at the apostrophe and reports an
  // absurdly short length.
  const descTag = html.match(/<meta[^>]+name=["']description["'][^>]*>/i);
  const descText = descTag && (descTag[0].match(/content=(["'])([\s\S]*?)\1/i) || [])[2];
  if (descText) {
    const len = decodeEntities(descText).trim().length;
    if (len < 110 || len > 160) {
      console.error(`WARN  description ${len} chars  ${url}  (contract says 110-160)`);
    }
  } else {
    console.error(`WARN  no description  ${url}`);
  }

  console.log(`ok    ${url}`);
}

if (failures) {
  console.error(`\n${failures} failure(s) — the indexing contract is broken.`);
  process.exit(1);
}
console.log('\nall good — every sitemap URL is 200 with a self-referencing canonical.');
