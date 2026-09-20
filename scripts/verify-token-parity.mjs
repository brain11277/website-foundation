#!/usr/bin/env node
// verify-token-parity.mjs — enforces FOUNDATION.md §4 (theme/design-token
// parity) against a stylesheet. No dependencies; Node 18+.
//
//   node verify-token-parity.mjs src/styles/tokens.css
//   node verify-token-parity.mjs src/styles/*.css
//
// The contract: every custom property in `:root` whose value is a COLOR must
// be redefined in every theme block. A token with no override in a theme is
// silently the wrong color in that theme, and you find it by eye, on a page
// you were not looking at, weeks later.
//
// Size and type tokens are exempt. A spacing step does not change meaning per
// theme, and requiring it to be restated would make the rule noise.
//
// Exits 1 on any missing override. Warns, without failing, on a token that a
// theme block defines but `:root` does not, which is usually a typo or a
// leftover from a renamed token.
//
// A note on scope: this reads TOP-LEVEL rules only. A token redefined solely
// inside a media query is conditional by definition and cannot satisfy a
// parity contract, so it does not count as an override here.

import { readFile } from 'node:fs/promises';

const files = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!files.length) {
  console.error('usage: node verify-token-parity.mjs <file.css> [more.css ...]');
  process.exit(2);
}

/** Strip comments so a commented-out declaration never counts. */
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/**
 * Split a stylesheet into its top-level rules.
 *
 * Hand-rolled because the alternative is a CSS parser dependency, and this
 * file is meant to be copied into projects that should not inherit one. Brace
 * matching is enough: we only need depth-0 blocks, and anything nested (a
 * media query, a supports block) is deliberately skipped.
 */
function topLevelRules(css) {
  const rules = [];
  let depth = 0;
  let start = 0;
  let selector = '';

  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === '{') {
      if (depth === 0) {
        // Take only what follows the previous statement. A stylesheet often
        // opens with at-statements (`@charset`, `@import`, `@tailwind`) that
        // end in a semicolon rather than a block; without this the first
        // selector swallows all of them and matches nothing.
        const chunk = css.slice(start, i);
        const lastSemi = chunk.lastIndexOf(';');
        selector = chunk.slice(lastSemi + 1).trim();
        start = i + 1;
      }
      depth++;
    } else if (c === '}') {
      depth--;
      if (depth === 0) {
        rules.push({ selector, body: css.slice(start, i) });
        start = i + 1;
      }
    }
  }
  return rules;
}

/** Custom properties declared directly in a rule body, as name -> value. */
function customProps(body) {
  const out = new Map();
  for (const m of body.matchAll(/(^|[;{\s])(--[\w-]+)\s*:\s*([^;]+)/g)) {
    out.set(m[2], m[3].trim());
  }
  return out;
}

/**
 * Is this value a color?
 *
 * Covers hex, the functional notations, the handful of keywords that show up
 * in real token files, and bare channel triplets like `139, 92, 246`. That
 * last form is the one people forget: an `--accent-rgb` that is not themed
 * produces the wrong color anywhere it is composed with `rgba()`, and it does
 * not look like a color to a naive check.
 */
function isColor(value) {
  const v = value.trim().toLowerCase();
  if (/^#[0-9a-f]{3,8}$/.test(v)) return true;
  if (/^(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\(/.test(v)) return true;
  if (/^(transparent|currentcolor|white|black)$/.test(v)) return true;
  // Bare channel triplet, e.g. "139, 92, 246".
  if (/^\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}$/.test(v)) return true;
  return false;
}

/**
 * Does this selector introduce a theme?
 *
 * Restricted to root-level selectors on purpose. A component rule that happens
 * to declare a local custom property (`.card { --pad: 8px }`) is not a theme
 * block, and treating it as one would report every color token as missing.
 */
function isThemeSelector(sel) {
  const s = sel.trim();
  if (s === ':root' || s === 'html' || s === ':root, html' || s === 'html, :root') return false;
  if (s.startsWith('@')) return false;
  return s.split(',').some((part) => {
    const p = part.trim();
    // Blank out attribute contents first: they legitimately hold spaces and
    // quotes, and would otherwise look like a descendant combinator.
    const bare = p.replace(/\[[^\]]*\]/g, '[]');
    // A theme block is a ROOT selector. `html[data-mode='x'] a` is a rule
    // scoped BY a theme, not a declaration OF one, and demanding it restate
    // every token would flag every themed component as broken.
    if (/[\s>+~]/.test(bare)) return false;
    // A bare attribute selector only counts when it is a data-attribute with a
    // VALUE, which is how a theme is actually declared. Without the value
    // requirement `[tabindex]:not([tabindex="-1"]):focus-visible` reads as a
    // theme block and every color token is reported missing from it.
    if (/^\[data-[\w-]+\s*[~|^$*]?=/.test(p)) return true;
    return /^(html|:root)[.[:]/.test(bare);
  });
}

let failures = 0;
let checked = 0;

for (const file of files) {
  let css;
  try {
    css = stripComments(await readFile(file, 'utf8'));
  } catch (err) {
    console.error(`FAIL  unreadable      ${file}  (${err.message})`);
    failures++;
    continue;
  }

  const rules = topLevelRules(css);

  // `:root` may legitimately appear more than once; merge them.
  const base = new Map();
  for (const r of rules) {
    if (r.selector.split(',').some((p) => p.trim() === ':root' || p.trim() === 'html')) {
      for (const [k, v] of customProps(r.body)) base.set(k, v);
    }
  }

  if (!base.size) {
    console.log(`skip  ${file}  (no :root custom properties)`);
    continue;
  }

  // Two conditions, because a selector heuristic alone is brittle. A real
  // theme block both LOOKS like a root-level theme selector and actually
  // declares tokens. A rule that declares none has nothing to be out of
  // parity with.
  const themes = rules.filter((r) => isThemeSelector(r.selector) && customProps(r.body).size > 0);
  if (!themes.length) {
    console.log(`skip  ${file}  (no theme blocks; nothing to be out of parity with)`);
    continue;
  }

  const colorTokens = [...base].filter(([, v]) => isColor(v)).map(([k]) => k);
  checked++;

  console.log(
    `checking ${file}: ${colorTokens.length} color token(s) against ${themes.length} theme block(s)`,
  );

  for (const theme of themes) {
    const declared = customProps(theme.body);
    const missing = colorTokens.filter((t) => !declared.has(t));
    const orphans = [...declared.keys()].filter((t) => !base.has(t));

    if (missing.length) {
      console.error(`FAIL  ${theme.selector}`);
      console.error(`      missing ${missing.length} override(s): ${missing.join(', ')}`);
      failures++;
    } else {
      console.log(`ok    ${theme.selector}`);
    }

    if (orphans.length) {
      console.error(
        `WARN  ${theme.selector} defines ${orphans.join(', ')}, which :root does not. Typo, or a rename that missed a spot?`,
      );
    }
  }
}

if (failures) {
  console.error(`\n${failures} parity failure(s). A token with no override is the wrong color in that theme.`);
  process.exit(1);
}
if (!checked) {
  console.log('\nnothing to check.');
  process.exit(0);
}
console.log('\nall good — every color token is redefined in every theme block.');
