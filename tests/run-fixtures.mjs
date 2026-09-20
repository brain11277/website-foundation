#!/usr/bin/env node
// run-fixtures.mjs: exercises verify-indexing.mjs against local fixtures.
//
//   node tests/run-fixtures.mjs
//
// CI used to only `node --check` the verifier, which proves it parses and
// nothing else. A checker nobody runs is a checker that quietly stops working.
// This serves a tiny fixture site from Node's built-in http module (no
// dependency, in keeping with the script it tests), points the verifier at it,
// and asserts the exit code. No network, no live site to couple CI to.
//
// Fixtures use an __ORIGIN__ placeholder because the port is ephemeral; it is
// substituted at serve time, which also keeps the fixture files readable.

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serveDir, originOf, runVerifier, indent } from './lib/serve.mjs';

const here = dirname(fileURLToPath(import.meta.url));

async function check(dir, expected, label) {
  const server = await serveDir(join(here, 'fixtures', dir));
  const origin = originOf(server);
  const { code, out } = await runVerifier(origin);
  await new Promise((r) => server.close(r));

  if (code === expected) {
    console.log(`PASS  ${label} (exit ${code})`);
    return true;
  }
  console.error(`FAIL  ${label}: expected exit ${expected}, got ${code}`);
  console.error(indent(out));
  return false;
}

const results = [
  await check('good', 0, 'a correct site passes'),
  await check('bad', 1, 'an @id pointing at a document that does not exist fails'),
  // An @id is a URI, not a same-page label. Referencing a node defined on
  // another page of the same site is legitimate and sometimes the only
  // correct option, so the checker resolves it rather than assuming the worst.
  await check('cross-doc-ok', 0, 'an @id resolved on another page of the site passes'),
  // The original bug class, and the one that must stay a hard failure.
  await check('same-doc-dangling', 1, 'an @id referencing this same page, undefined, fails'),
];

if (results.every(Boolean)) {
  console.log('\nfixture suite green.');
  process.exit(0);
}
console.error('\nfixture suite red.');
process.exit(1);
