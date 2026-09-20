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

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const verifier = join(here, '..', 'scripts', 'verify-indexing.mjs');

function serveFixture(dir) {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const name = req.url === '/' ? 'index.html' : req.url.slice(1).split('?')[0];
      const origin = `http://127.0.0.1:${server.address().port}`;
      try {
        const body = await readFile(join(here, 'fixtures', dir, name), 'utf8');
        const type = name.endsWith('.xml') ? 'application/xml' : 'text/html';
        res.writeHead(200, { 'content-type': type });
        res.end(body.replaceAll('__ORIGIN__', origin));
      } catch {
        res.writeHead(404, { 'content-type': 'text/html' });
        res.end('<!DOCTYPE html><title>Not found</title>');
      }
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function runVerifier(origin) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [verifier, origin], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (out += d));
    child.on('close', (code) => resolve({ code, out }));
  });
}

async function check(dir, expected, label) {
  const server = await serveFixture(dir);
  const origin = `http://127.0.0.1:${server.address().port}`;
  const { code, out } = await runVerifier(origin);
  await new Promise((r) => server.close(r));

  if (code === expected) {
    console.log(`PASS  ${label} (exit ${code})`);
    return true;
  }
  console.error(`FAIL  ${label}: expected exit ${expected}, got ${code}`);
  console.error(out.split('\n').map((l) => `        ${l}`).join('\n'));
  return false;
}

const results = [
  await check('good', 0, 'a correct site passes'),
  await check('bad', 1, 'a dangling JSON-LD @id fails the build'),
];

if (results.every(Boolean)) {
  console.log('\nfixture suite green.');
  process.exit(0);
}
console.error('\nfixture suite red.');
process.exit(1);
