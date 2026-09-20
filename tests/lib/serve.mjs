// Shared test helpers: a static server that behaves like the real host, and a
// harness that runs verify-indexing.mjs and reports its exit code.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const VERIFIER = fileURLToPath(new URL('../../scripts/verify-indexing.mjs', import.meta.url));

const TYPES = {
  '.html': 'text/html',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
};

/**
 * Candidate files for a request path, in the order a static host tries them.
 *
 * This matters more than it looks. With `build.format: 'file'`, Astro emits
 * `about.html` and the host serves it at `/about`. A server that reads the
 * request path literally returns 404 for every route, and the verifier then
 * reports a page-not-found failure that has nothing to do with the site.
 *
 * Cloudflare Workers Assets does the same resolution under its default
 * `html_handling: "auto-trailing-slash"`, so matching it here is what makes a
 * local pass mean something about production.
 */
function candidates(urlPath) {
  const clean = urlPath.split('?')[0].replace(/^\/+/, '');
  if (clean === '') return ['index.html'];
  if (extname(clean)) return [clean];
  return [clean, `${clean}.html`, `${clean}/index.html`];
}

/**
 * Serve `root` on an ephemeral port.
 *
 * `__ORIGIN__` in any served text file is replaced with the real origin, so
 * fixtures can reference absolute URLs without knowing the port in advance.
 * Returns the server; read `server.address().port` for the origin.
 */
export function serveDir(root, { notFoundFile = null, rewriteOrigin = null } = {}) {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const origin = `http://127.0.0.1:${server.address().port}`;

      // A real build bakes the production domain into its sitemap, canonical
      // tags and schema. Without rewriting it the verifier would dutifully
      // walk off to the real site on the internet and report on that instead,
      // which is both wrong and slow.
      const localize = (s) => {
        const out = s.replaceAll('__ORIGIN__', origin);
        return rewriteOrigin ? out.replaceAll(rewriteOrigin, origin) : out;
      };

      for (const name of candidates(req.url)) {
        try {
          const body = await readFile(join(root, name));
          const type = TYPES[extname(name)] || 'application/octet-stream';
          const isText = /^(text|application\/(xml|json|javascript))/.test(type);
          res.writeHead(200, { 'content-type': type });
          res.end(isText ? localize(body.toString('utf8')) : body);
          return;
        } catch {
          /* try the next candidate */
        }
      }

      // Emulate `not_found_handling: "404-page"` when asked, so a test can
      // assert the 404 body is real rather than empty.
      if (notFoundFile) {
        try {
          const body = await readFile(join(root, notFoundFile), 'utf8');
          res.writeHead(404, { 'content-type': 'text/html' });
          res.end(localize(body));
          return;
        } catch {
          /* fall through */
        }
      }

      res.writeHead(404, { 'content-type': 'text/html' });
      res.end('');
    });

    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

export const originOf = (server) => `http://127.0.0.1:${server.address().port}`;

/** Run verify-indexing.mjs against an origin. Resolves `{ code, out }`. */
export function runVerifier(origin) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [VERIFIER, origin], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (out += d));
    child.on('close', (code) => resolve({ code, out }));
  });
}

export const indent = (s) => s.split('\n').map((l) => `        ${l}`).join('\n');
