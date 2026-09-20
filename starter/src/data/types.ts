// Shapes for content stored as TypeScript modules rather than Markdown.
//
// Why modules and not a content collection: this is structured data, not
// prose, and TypeScript catches a shape error at build time instead of
// rendering a blank card in production. Use Markdown collections for actual
// long-form writing; use these for lists of things.
//
// Delete what you do not need. An unused type is a promise the site does not
// keep.

/** Something you published, here or elsewhere. */
export interface Article {
  title: string;
  excerpt: string;
  /** ISO date. Render with fmtDate() inside a <time datetime={date}>. */
  date: string;
  url: string;
  tags: string[];
  /** Where it was published, matching a Publication slug. */
  pub?: string;
}

/** A place you publish. Useful when a writing page aggregates several. */
export interface Publication {
  slug: string;
  /** Internal name. */
  name: string;
  /** How it should appear on the page. */
  display: string;
  url: string;
}

/** Something you built. */
export interface Project {
  slug: string;
  name: string;
  /**
   * Keep this verbatim from the project's own page where one exists. Do not
   * invent a start date or a metric you have not verified; a projects page is
   * the easiest place on a personal site to overclaim.
   */
  tagline: string;
  description: string;
  url: string;
  repoUrl?: string;
  status: 'live' | 'building' | 'archived';
  tags: string[];
  stack?: string[];
}

/** A role, for a resume or CV page. */
export interface ExperienceItem {
  company: string;
  role: string;
  location?: string;
  /** "YYYY" or "YYYY-MM". */
  start: string;
  /** Same format, or null for a role you are still in. */
  end: string | null;
  bullets: string[];
}
