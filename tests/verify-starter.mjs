#!/usr/bin/env node
// verify-starter.mjs: proves the starter actually works.
//
//   node tests/verify-starter.mjs           (assumes starter/dist exists)
//   node tests/verify-starter.mjs --build   (builds it first)
//
// The starter is a real Astro site, which means it can be broken by a release
// of something it depends on without anyone touching this repo. Documentation
// that says "verified against Astro 7.3.3" goes stale silently; this does not.
//
// It builds the starter, serves dist/ the way the real host would, runs the
// indexing contract against it, and asserts the contracts the starter claims
// to satisfy out of the box.

import { spawn } from 'node:child_process';
import { readFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serveDir, originOf, runVerifier, indent } from './lib/serve.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const starter = join(here, '..', 'starter');
const dist = join(starter, 'dist');

const run = (cmd, args, cwd) =>
  new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (out += d));
    child.on('close', (code) => resolve({ code, out }));
  });

const results = [];
const check = (ok, label, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok && detail) console.error(indent(detail));
};

// ── Build ────────────────────────────────────────────────────────────────────
if (process.argv.includes('--build')) {
  console.log('building starter...\n');
  const install = await run('npm', ['install', '--no-audit', '--no-fund'], starter);
  if (install.code !== 0) {
    console.error('npm install failed');
    console.error(indent(install.out));
    process.exit(1);
  }
  const build = await run('npm', ['run', 'build'], starter);
  check(build.code === 0, 'starter builds', build.out);

  // A build that emits warnings still "works", but deprecation warnings are
  // how a config rots quietly across major versions. Surface them.
  const warned = /\[WARN\]|deprecat/i.test(build.out);
  check(!warned, 'starter builds without warnings', warned ? build.out : '');
  if (build.code !== 0) {
    console.error('\nstarter verification red.');
    process.exit(1);
  }
}

try {
  await access(dist);
} catch {
  console.error(`no build output at ${dist}. Run with --build, or build the starter first.`);
  process.exit(2);
}

// ── Indexing contract ────────────────────────────────────────────────────────
// The build bakes site.config.ts's `url` into the sitemap, canonicals and
// schema. Read it back and rewrite it to the local origin, or the verifier
// walks off to the real domain instead of testing what we just built.
const configured = (await readFile(join(starter, 'src/site.config.ts'), 'utf8'))
  .match(/url:\s*'([^']+)'/)?.[1]
  ?.replace(/\/$/, '');

if (!configured) {
  console.error('could not read `url` from starter/src/site.config.ts');
  process.exit(2);
}

const server = await serveDir(dist, {
  notFoundFile: '404.html',
  rewriteOrigin: configured,
});
const origin = originOf(server);
const { code, out } = await runVerifier(origin);
check(code === 0, 'starter output passes verify-indexing', out);

// ── The 404 actually renders ─────────────────────────────────────────────────
// The contract is about behavior, not about the file existing. This is the
// Workers Assets `not_found_handling` trap: dist/404.html can be perfect while
// every unmatched URL returns an empty body.
const res = await fetch(`${origin}/definitely-not-a-real-page`);
const body = await res.text();
check(res.status === 404, `unmatched path returns 404 (got ${res.status})`);
check(body.length > 0, `404 response has a real body (got ${body.length} bytes)`);

await new Promise((r) => server.close(r));

// ── Per-page invariants ──────────────────────────────────────────────────────
const pages = ['index.html', 'about.html', 'contact.html'];
for (const p of pages) {
  const html = await readFile(join(dist, p), 'utf8');

  // Strip HTML comments first. A comment that mentions a tag is not a tag,
  // and counting one is how a correct page gets reported as broken.
  const markup = html.replace(/<!--[\s\S]*?-->/g, '');
  const h1s = (markup.match(/<h1[\s>]/gi) || []).length;
  check(h1s === 1, `${p}: exactly one <h1> (got ${h1s})`);

  // Every indexable page must define the anchors its page schema references,
  // or the reference dangles. This is the whole point of emitting Person and
  // WebSite from the shared head component.
  const hasPerson = html.includes('"@type":"Person"');
  const hasWebsite = html.includes('"@type":"WebSite"');
  check(hasPerson && hasWebsite, `${p}: defines #person and #website`);
}

// noIndex pages deliberately carry no entity graph.
const notFound = await readFile(join(dist, '404.html'), 'utf8');
check(!notFound.includes('application/ld+json'), '404.html emits no entity graph');
check(notFound.includes('noindex'), '404.html is noindex');

// ── Token parity (FOUNDATION §4) ─────────────────────────────────────────────
// Every color token in :root must be redefined in every theme block. This is
// the contract that has no other enforcement anywhere.
const css = await readFile(join(starter, 'src/styles/tokens.css'), 'utf8');
const blockOf = (re) => {
  const m = css.match(re);
  return m ? new Set([...m[1].matchAll(/^\s*(--[\w-]+):/gm)].map((x) => x[1])) : null;
};
const isColor = (t) => !/^--(step|font|gutter|shell|measure)/.test(t);

const root = blockOf(/:root\s*\{([\s\S]*?)\n\}/);
const themes = [
  ["html[data-theme='light']", blockOf(/html\[data-theme='light'\]\s*\{([\s\S]*?)\n\}/)],
  ["html[data-mode='reader']", blockOf(/html\[data-mode='reader'\]\s*\{([\s\S]*?)\n\}/)],
];

if (!root) {
  check(false, 'tokens.css: found a :root block');
} else {
  const rootColors = [...root].filter(isColor);
  for (const [name, block] of themes) {
    if (!block) {
      check(false, `tokens.css: found ${name}`);
      continue;
    }
    const missing = rootColors.filter((t) => !block.has(t));
    check(missing.length === 0, `tokens.css: ${name} has parity`, `missing: ${missing.join(', ')}`);
  }
}

// ── Nothing personal leaked in ───────────────────────────────────────────────
const leaked = [];
for (const p of [...pages, '404.html']) {
  const html = await readFile(join(dist, p), 'utf8');
  for (const needle of ['brianrain', 'brain1127', 'inventive_flex', 'brain.prefs']) {
    if (html.toLowerCase().includes(needle)) leaked.push(`${p}: ${needle}`);
  }
}
check(leaked.length === 0, 'no personal identifiers in the built output', leaked.join('\n'));

// ─────────────────────────────────────────────────────────────────────────────
if (results.every(Boolean)) {
  console.log('\nstarter verification green.');
  process.exit(0);
}
console.error('\nstarter verification red.');
process.exit(1);
