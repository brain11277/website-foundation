// ─────────────────────────────────────────────────────────────────────────────
// THE ONE FILE YOU EDIT FIRST.
//
// Everything identifying about this site lives here: the domain, your name,
// your profiles, the default social card. Nothing else in src/ hardcodes any
// of it, so changing this file changes the whole site, including the
// structured data.
//
// Work top to bottom. Every placeholder below is wrong for you.
// ─────────────────────────────────────────────────────────────────────────────

export const site = {
  /**
   * Production origin, no trailing slash.
   *
   * This is load-bearing well beyond cosmetics: canonical tags, the sitemap,
   * OG URLs and every JSON-LD `@id` are built from it. If it disagrees with
   * the domain you actually deploy to, Google sees a site whose pages all
   * claim to live somewhere else. See FOUNDATION.md §1.
   */
  url: 'https://example.com',

  /** Site name. Used in `og:site_name` and the WebSite entity. */
  name: 'Your Name',

  /**
   * Appended to every page title as ` | suffix`, unless a page passes
   * `noSuffix`. Count it toward the 30 to 60 character budget in §3.
   */
  titleSuffix: 'Your Name',

  /** Used when a page provides no description of its own. 110 to 160 chars. */
  description:
    'A short, concrete description of what a visitor will find here. Aim for what the site is, not a mission statement.',

  /** `lang` attribute and JSON-LD `inLanguage`. */
  locale: 'en',
  /** OpenGraph locale. Note the underscore: `en_US`, not `en-US`. */
  ogLocale: 'en_US',

  /**
   * Default social card, 1200x630, relative to the site root. Per-page images
   * are better for pillar pages; this is the fallback for everything else.
   * Drop a real file at `public/og/default.png` before launch: a social card
   * that 404s is worse than none, because the link renders blank.
   */
  defaultOgImage: '/og/default.png',

  /** Twitter/X handle including the `@`, or empty to omit the tags entirely. */
  twitter: '',

  author: {
    name: 'Your Name',
    /** Shown in the Person entity. Keep it to what you would say out loud. */
    jobTitle: 'What you actually do',
    description:
      'One or two sentences about you, in your own voice. This is what answer engines quote.',

    /**
     * A portrait, not your social card. Leave empty to omit `image` from the
     * Person entity entirely, which is correct: an entity whose image 404s is
     * worse than an entity with no image.
     */
    image: '',

    /** Optional. Omitted from the schema when locality is empty. */
    address: { locality: '', region: '', country: '' },

    /**
     * Profiles you control. This is how a search engine connects separate
     * accounts into one entity, so include only profiles that are genuinely
     * yours and genuinely about you. Pair each with a `rel="me"` link in the
     * footer; the two together are what make the claim verifiable.
     */
    sameAs: [] as string[],

    /** Topics you can credibly claim. Be honest; this is a trust signal. */
    knowsAbout: [] as string[],
  },

  /**
   * Optional. Terms you coined and want machine-readable, emitted as a
   * DefinedTermSet so answer engines have something to bind to rather than
   * inferring from prose. Leave empty and the schema is skipped entirely.
   *
   * Each entry needs a real page at `/{slug}` that explains the term.
   */
  frameworks: [] as Array<{ slug: string; name: string; description: string }>,

  /**
   * Optional. A page with a real client-side search or filter, used to offer
   * a sitelinks searchbox. Leave empty unless the page can genuinely act on
   * `?q=`; claiming a search that does not work is a bad signal.
   */
  searchPath: '',

  /**
   * Primary navigation. Rendered into both the desktop and mobile menus from
   * this one array, so the two cannot drift apart.
   *
   * Keep it short. BUILDING.md §2 makes the case: one page per question a
   * visitor actually has. A nav with nine links reads as an org chart rather
   * than a person.
   */
  nav: [
    { href: '/about', label: 'About', key: 'about' },
    { href: '/contact', label: 'Contact', key: 'contact' },
  ] as Array<{ href: string; label: string; key: string }>,
} as const;

export type Site = typeof site;
