# CLAUDE.md

Context for an AI coding assistant working in this repo. Read this first.

This file ships pre-written. Fill in the three marked sections before you write
any real content; they are the ones that decide whether the site sounds like
you or like a language model.

---

## The baseline

This site is built on `website-foundation`. Hold these contracts:

- Structural contracts and the pre-launch checklist:
  https://raw.githubusercontent.com/brain11277/website-foundation/main/FOUNDATION.md
- Deployment specifics:
  https://raw.githubusercontent.com/brain11277/website-foundation/main/CLOUDFLARE.md

Read them before making structural changes. The short version of what bites:

- **URL shape.** `trailingSlash: 'never'` plus `build.format: 'file'` in
  `astro.config.mjs` are load-bearing together. Changing one without the other
  produces "Page with redirect" on every page in Search Console.
- **The entity graph.** `SEOHead.astro` emits Person and WebSite on every
  indexable page, because page schemas reference them by `@id` and a reference
  with no definition on the same page resolves to nothing. Do not make the
  definers conditional.
- **Token parity.** Every color token in `:root` must have an override in every
  theme block in `tokens.css`. A missing one is silently the wrong color in
  that theme.
- **`_headers` rules are additive**, not override. Two matching rules that set
  the same header produce a comma-joined value, not the more specific one.

---

## Workflow (non-negotiable)

1. **Sync.** `git fetch origin`, confirm the branch is not behind. Designing
   against a stale base is the most expensive error available here.
2. **Explore.** Read the relevant files before proposing anything.
3. **Plan.** Describe the change in plain language. No code yet.
4. **Code.** Only after I approve the plan.
5. **Commit.** Small, with a message written for whoever runs `git blame` on
   this line in a year.

---

## FILL THIS IN: what this site is

> This site is for **\<who\>**, so they can **\<do what\>**.
> It is explicitly not **\<the thing you keep being tempted to add\>**.

The second sentence is the one that does the work. When a suggestion pushes the
site toward that thing, push back. I want you to push back.

---

## FILL THIS IN: voice

Without this you will write prose that could be about anyone, which is the one
thing a personal site cannot afford. Be specific and include examples.

- Tone:
- Never use these words:
- Sentence rules:
- Good: "..."
- Bad: "..."

Read every generated paragraph and ask whether a specific human could have
written it. If a sentence would work equally well on someone else's site, cut
it or make it specific.

---

## FILL THIS IN: regression registry

For each fix that took more than one attempt and looks redundant afterwards,
add a row. Write **why fragile** for the person about to delete the thing on
purpose because it looks pointless. That person is the entire audience.

| # | Fix | File / marker | Why fragile | Verify |
|---|-----|---------------|-------------|--------|
| 1 | `tabindex="-1"` on `<main>` | `BaseLayout.astro` | Looks redundant next to `id="main"`. Without it the skip link moves the viewport but not focus, so the next Tab returns to the nav. | Tab from page load, activate skip link, Tab again. Focus should be inside main. |

Wire these into a SessionStart hook so a missing marker is a warning at the
start of a session rather than a discovery weeks later. See
`templates/hooks/session-start.sh` in website-foundation.

---

## Where things live

| What | Where |
|---|---|
| Site identity, nav, profiles | `src/site.config.ts` |
| Design tokens and themes | `src/styles/tokens.css` |
| Reset and a11y boilerplate | `src/styles/base.css` |
| Meta tags and JSON-LD | `src/components/SEOHead.astro`, `src/utils/seo.ts` |
| Page shell, theme restore | `src/layouts/BaseLayout.astro` |
| Font pipeline (off by default) | `src/components/Fonts.astro` |
| Pages | `src/pages/` |
| Structured content shapes | `src/data/types.ts` |

## Conventions

- One `<h1>` per page. Section headings are `<h2>`. No level skips.
- Titles 30 to 60 characters including the suffix; descriptions 110 to 160.
  Reuse one `pageDescription` constant for both the meta tag and the schema so
  they cannot drift.
- Dates render as `<time datetime={iso}>{fmtDate(iso)}</time>`, always from
  `src/utils/formatDate.ts`.
- Shared visual styles live in `base.css` or `tokens.css`. Before changing a
  class, grep for it; if it appears in more than one file, consolidate first.
- No hardcoded colors. Use a token, or `rgba(var(--accent-rgb), <alpha>)`.

## Before committing

- `npm run build` clean.
- `npm run type-check` clean.
- Tab through anything you changed; focus must always be visible.
- If you touched deployment or routing, re-run the indexing check:
  `node path/to/website-foundation/scripts/verify-indexing.mjs https://yoursite`
