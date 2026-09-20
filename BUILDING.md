# Building a personal site worth visiting

`FOUNDATION.md` keeps a site from being broken. This is about the other
problem: most personal sites are not broken, they are forgettable. An AI tool
will happily generate a forgettable one in about four minutes, and it will pass
every check in this repo.

Everything here is method rather than taste. None of it tells you what your site
should look like or sound like. It tells you how to decide, and which decisions
are expensive to reverse later.

---

## 1. Decide what the site is for before you open an editor

Write two sentences and keep them where your AI can read them:

> This site is for **\<who\>**, so they can **\<do what\>**.
> It is explicitly not **\<the thing you keep being tempted to add\>**.

That second sentence does more work than the first. "Not a blog, the writing
lives elsewhere and this reflects it." "Not a lead-gen funnel." "Not a portfolio
in the case-study sense." Without it, every session adds one more thing and in
six months you have a site with no center.

Put it in your `CLAUDE.md` and expect to enforce it. When a suggestion pushes
the site toward one of those things, the right answer is to push back, and your
AI should be told to push back too.

## 2. Pick a small page set and cut hard

One page per question a visitor actually has. For most personal sites that is
four or five:

| Page | The question | Cut it when |
|---|---|---|
| Home | Who is this and why should I care? | never |
| About | What is their actual story? | never |
| Writing / Work | What have they made? | you have nothing to put there yet |
| Contact | How do I reach them, and should I? | never |
| 404 | (they got lost) | never, and test it, see `QUICKSTART.md` §6 |

Add a Resume or Projects page only when you have enough to fill it. An
almost-empty page reads worse than an absent one. A nav with nine links reads as
an org chart, not a person.

The Contact page is the one people get wrong. It is not a form, it is a filter.
Say who you want to hear from and who you do not. That single act of
specificity does more for how the site reads than any amount of design.

## 3. Build the token system before the first screen

This is the most expensive thing to retrofit, so do it on day one even though it
feels premature.

Define every color, and every size that repeats, as a custom property in
`:root`. Not because it is tidy, but because the moment you add a second theme
(a light mode, a high-contrast reader mode, a print style) every hardcoded value
becomes a bug you have to find by eye.

```css
:root {
  --bg: #0F0D17;
  --text: #EDEAF5;
  --accent: #8B5CF6;

  /* Channel triplets, so you can compose rgba() at any alpha without
     hardcoding the brand color into a gradient. */
  --accent-rgb: 139, 92, 246;
}
```

Four rules, each of which exists because breaking it costs a day:

- **Every color token in `:root` gets a matching override in every theme block.**
  A token with no override is silently the wrong color in that theme. This is the
  single largest source of multi-theme drift (`FOUNDATION.md` §4).
- **Check contrast against the lightest surface the token actually lands on**,
  not just the page background. Muted text that clears AA on `--bg` routinely
  fails on a card. Do this while choosing the color, not during an audit.
- **Never put `opacity` on a container of text.** It composites every descendant
  down at once, and you get four contrast failures from one rule.
- **Shared visual classes live in one stylesheet.** Before you change a class,
  grep for it. If it is defined in more than one file, consolidate first and
  change second. Skipping this is how two pages slowly stop matching.

Pick a type scale and a spacing scale and write them down. Two typefaces is
plenty. Self-host them, and read `FOUNDATION.md` §7 first, because there are
three ways to self-host fonts that fail silently.

## 4. Write the voice guide before you write any copy

This is the highest-leverage document on an AI-built site, and almost nobody
writes it.

Without one you get the house style of the model: confident, symmetrical,
adjective-stacked, and completely anonymous. It is not bad writing exactly. It
is writing that could be about anyone, on a site that is supposed to be about
you.

A usable voice guide is mostly prohibitions and examples:

```markdown
## Voice
- Direct, practitioner-grade, anti-corporate.
- No exclamation points unless quoting someone.
- Banned: "leverage", "revolutionary", "game-changing", "passionate about",
  "I'm excited to share".
- No three-adjective stacks. No paragraph that opens the same way as the
  one above it.
- Proper nouns that matter here: <yours>.

Good: "I spent two years failing at this before it worked."
Bad:  "I'm passionate about leveraging transformative solutions."
```

Then actually hold the line. Read every generated paragraph and ask whether a
specific human could have written it. If a sentence would work equally well on
anyone else's site, cut it or make it specific. Specificity is the entire
difference between a personal site and a template.

## 5. Work in a loop that catches mistakes early

The loop that holds up over months:

**Sync → Explore → Plan → Code → Commit**

- **Sync first, always.** `git fetch`, confirm you are not behind. Designing
  against a stale base is the most expensive error in this workflow, because
  everything downstream is built on code that does not exist. Install
  `templates/hooks/session-start.sh` so this is checked for you rather than
  remembered.
- **Plan before code.** Make your AI describe the change in plain language and
  approve it before a line is written. Reviewing a paragraph takes thirty
  seconds; reviewing a 400-line diff you did not expect takes an hour, and you
  will do it badly.
- **Commit in small, explained pieces.** Write the commit message for the person
  who will `git blame` this line in a year and want to know why. That person is
  you, and you will not remember.

## 6. Keep a regression registry

Some fixes are non-obvious. They took four tries, they look redundant, and the
next refactor will delete them with total confidence.

Keep a table in your `CLAUDE.md`, one row per fix:

| # | Fix | File / marker | Why fragile | Verify |
|---|-----|---------------|-------------|--------|

Write the **why fragile** column for someone who is about to delete the thing on
purpose because it looks pointless. That reader is the entire audience. "Looks
redundant given the flex direction, but removing it re-inherits `align-items`
from the base rule and silently centers every title."

Then wire the markers into the SessionStart hook so a missing one is a warning
at the start of the session rather than a discovery three weeks later.

## 7. Personality is allowed, but it has a bill

Animation, canvas effects, and interaction flourishes are a large part of what
separates a site people remember from one they close. They also carry real
obligations, and if you skip them the effect becomes the reason someone leaves:

- **Honor `prefers-reduced-motion`.** Not a nice-to-have. Motion triggers
  physical symptoms for some people.
- **Gate expensive work on visibility.** A canvas painter mounted eagerly
  rasterizes its sprites even on pages where CSS has already hidden the canvas.
  Mount it parked and start it on an `IntersectionObserver` (`FOUNDATION.md` §7).
- **Offer a plain mode** if the design is effect-heavy, and make it genuinely
  readable rather than the same page with the animation paused.
- **Keyboard and focus still work.** Every interactive flourish needs a visible
  focus state and a keyboard path.

The test: turn on reduced motion, tab through the whole site, and see whether it
is still good. If it collapses, the effects were carrying the design.

## 8. Know when it is done

A personal site is finished when it is **specific, fast, accessible, and
yours**, not when it has every page you can imagine.

Before you call it:

- Read every page aloud. Anything you would not say out loud, rewrite.
- Show one person who does not know what you do and ask what they think you do.
- Run the `FOUNDATION.md` pre-launch checklist.
- Run `verify-indexing.mjs` against production, and `verify-token-parity.mjs`
  against your token stylesheet.
- Tab through every page. Turn on reduced motion. Check it on a phone.

Then stop, and ship it. The version that exists beats the version you are still
refining.
