// ─────────────────────────────────────────────────────────────────────────────
// SEO meta and structured data. Used by SEOHead.astro on every page.
// Single source of truth for canonical URLs, titles, and the entity graph.
//
// Everything identifying comes from site.config.ts. Nothing here is about a
// particular person, so you should not need to edit this file at all.
// ─────────────────────────────────────────────────────────────────────────────

import { site } from '../site.config';

const SITE_URL = site.url.replace(/\/$/, '');

// ── The entity graph ─────────────────────────────────────────────────────────
//
// These three `@id` values are anchors. A JSON-LD node either DEFINES an anchor
// (it carries the @id alongside real properties) or REFERENCES one (a bare
// `{ "@id": ... }` used as a property value).
//
// A reference whose target is defined nowhere on the same page is a dangling
// edge. A crawler follows it and finds nothing, and absolutely nothing in your
// build will warn you. This is a real bug that shipped on the site this starter
// came from: several pages emitted `mainEntity: {@id #person}` and
// `isPartOf: {@id #website}` while defining neither.
//
// The fix is structural, and it lives in SEOHead.astro: the definers are
// prepended to every indexable page, so any page schema can reference them
// safely. Do not "optimize" that by emitting Person only on the About page.
//
// `verify-indexing.mjs` in website-foundation fails the build on a dangling
// reference, so this stays honest.
const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const TERMSET_ID = `${SITE_URL}/#terms`;

export interface SEOMeta {
  title: string;
  description: string;
  canonicalUrl: string;
  ogImage: string;
  ogType: 'website' | 'article';
  twitterCard: 'summary_large_image' | 'summary';
  twitterHandle: string;
}

export interface BuildSEOOptions {
  title: string;
  description: string;
  /** `Astro.url.pathname`. */
  pathname: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noSuffix?: boolean;
}

const isAbsolute = (u: string) => /^https?:\/\//i.test(u);

/**
 * Normalize `Astro.url.pathname` into the canonical no-slash, no-extension
 * path, independent of `build.format`.
 *
 * With `build.format: 'file'` the pathname carries a `.html` suffix
 * ('/about.html'); with 'directory' it carries a trailing slash. Either would
 * leak into your canonical and OG URLs and recreate the exact "Page with
 * redirect" mismatch the config is set up to avoid (FOUNDATION.md §1).
 */
export function normalizePath(pathname: string): string {
  return (
    pathname
      .replace(/\/index\.html$/, '')
      .replace(/\.html$/, '')
      .replace(/\/$/, '') || '/'
  );
}

/** Absolute URL for a site-relative path, with the root collapsing to no slash. */
function absolute(pathname: string): string {
  const path = normalizePath(pathname);
  return `${SITE_URL}${path === '/' ? '' : path}`;
}

export function buildSEOMeta(opts: BuildSEOOptions): SEOMeta {
  const canonicalUrl = absolute(opts.pathname);
  const title = opts.noSuffix ? opts.title : `${opts.title} | ${site.titleSuffix}`;

  const raw = opts.ogImage || site.defaultOgImage;
  const ogImage = isAbsolute(raw) ? raw : `${SITE_URL}${raw}`;

  return {
    title,
    description: opts.description,
    canonicalUrl,
    ogImage,
    ogType: opts.ogType ?? 'website',
    twitterCard: 'summary_large_image',
    twitterHandle: site.twitter,
  };
}

// ── Definers ─────────────────────────────────────────────────────────────────

/** Person. DEFINES `#person`. Emitted site-wide from SEOHead. */
export function personSchema() {
  const a = site.author;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': PERSON_ID,
    name: a.name,
    url: SITE_URL,
  };

  if (a.jobTitle) schema.jobTitle = a.jobTitle;
  if (a.description) schema.description = a.description;

  // Omitted entirely when unset. An entity pointing at a 404 image is worse
  // than one with no image.
  if (a.image) {
    schema.image = {
      '@type': 'ImageObject',
      url: isAbsolute(a.image) ? a.image : `${SITE_URL}${a.image}`,
      caption: a.name,
    };
  }

  if (a.address?.locality) {
    schema.address = {
      '@type': 'PostalAddress',
      addressLocality: a.address.locality,
      ...(a.address.region ? { addressRegion: a.address.region } : {}),
      ...(a.address.country ? { addressCountry: a.address.country } : {}),
    };
  }

  if (a.sameAs.length) schema.sameAs = [...a.sameAs];
  if (a.knowsAbout.length) schema.knowsAbout = [...a.knowsAbout];

  return schema;
}

/**
 * WebSite. DEFINES `#website`, REFERENCES `#person`.
 *
 * `description` is an argument rather than a constant because a hardcoded one
 * drifts from the homepage's actual meta description, and §3 exists precisely
 * to stop those two from disagreeing.
 */
export function websiteSchema({ description }: { description: string }) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: site.name,
    url: SITE_URL,
    description,
    inLanguage: site.locale,
    publisher: { '@id': PERSON_ID },
  };

  // Only claim a searchbox when a page can genuinely act on the query.
  if (site.searchPath) {
    schema.potentialAction = {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}${site.searchPath}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    };
  }

  return schema;
}

/**
 * DefinedTermSet. DEFINES `#terms`, REFERENCES `#person`.
 *
 * Returns null when you have no coined terms, and SEOHead drops it. Worth
 * using if you have named a concept: it gives answer engines something to bind
 * to, where prose alone gives them nothing.
 */
export function termsSchema() {
  if (!site.frameworks.length) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    '@id': TERMSET_ID,
    name: `${site.name} terms`,
    url: SITE_URL,
    creator: { '@id': PERSON_ID },
    hasDefinedTerm: site.frameworks.map((f) => ({
      '@type': 'DefinedTerm',
      '@id': `${SITE_URL}/${f.slug}/#term`,
      name: f.name,
      description: f.description,
      url: `${SITE_URL}/${f.slug}`,
      inDefinedTermSet: { '@id': TERMSET_ID },
    })),
  };
}

// ── Page types. These REFERENCE the anchors above and define none. ───────────

/** For an about or profile page. */
export function profilePageSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: { '@id': PERSON_ID },
    isPartOf: { '@id': WEBSITE_ID },
  };
}

export function contactPageSchema(opts: { pathname: string; description: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `Contact ${site.name}`,
    description: opts.description,
    url: absolute(opts.pathname),
    isPartOf: { '@id': WEBSITE_ID },
    mainEntity: { '@id': PERSON_ID },
  };
}

/** For an index or aggregation page. */
export function collectionPageSchema(opts: {
  pathname: string;
  name: string;
  description: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: opts.name,
    description: opts.description,
    url: absolute(opts.pathname),
    isPartOf: { '@id': WEBSITE_ID },
    author: { '@id': PERSON_ID },
  };
}

export interface BlogPostInput {
  title: string;
  /** Site-relative path or absolute URL. */
  url: string;
  /** ISO date. */
  date: string;
  excerpt: string;
}

/**
 * Blog index with its posts.
 *
 * Pass every post, not a slice. Capping this at the first N leaves the rest
 * with no structured data and produces no error anywhere.
 */
export function blogSchema(opts: { pathname: string; posts: BlogPostInput[] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `Writing by ${site.name}`,
    url: absolute(opts.pathname),
    isPartOf: { '@id': WEBSITE_ID },
    author: { '@id': PERSON_ID },
    blogPost: opts.posts.map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: isAbsolute(p.url) ? p.url : absolute(p.url),
      datePublished: p.date,
      description: p.excerpt,
      author: { '@id': PERSON_ID },
    })),
  };
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: isAbsolute(item.url) ? item.url : absolute(item.url),
    })),
  };
}
