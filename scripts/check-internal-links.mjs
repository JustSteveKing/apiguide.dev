#!/usr/bin/env node
// Internal link checker. Walks the built site and confirms every internal
// href resolves to something that was actually emitted.
//
// This works on dist rather than on the Markdown source, which costs a build
// but covers links in layouts and components as well as in content, and needs
// no knowledge of how routes are generated. Astro does not check these: a
// link to a page that does not exist builds clean and 404s in production.
//
// Usage: bun run build && bun run check:internal-links
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';

if (!existsSync(DIST)) {
  console.error(`No ${DIST}/. Run \`bun run build\` first.`);
  process.exit(2);
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path));
    else if (entry.name.endsWith('.html')) out.push(path);
  }
  return out;
}

// Anything that is not a path into this site: protocol-relative, absolute
// with a scheme, fragments, and the non-http schemes a page may legitimately
// use.
function isExternal(href) {
  return (
    href.startsWith('//') ||
    href.startsWith('#') ||
    /^[a-z][a-z0-9+.-]*:/i.test(href)
  );
}

/**
 * Does this path exist in the build?
 *
 * Astro emits a directory with an index.html for a page route, so /guides/
 * and /guides are the same page. A file route such as /llms.txt is emitted
 * at its own name. Both count.
 */
function resolves(urlPath) {
  const clean = decodeURIComponent(urlPath.split('#')[0].split('?')[0]);
  const base = join(DIST, clean);
  if (existsSync(base)) {
    return statSync(base).isDirectory() ? existsSync(join(base, 'index.html')) : true;
  }
  return existsSync(`${base}.html`) || existsSync(join(base, 'index.html'));
}

const pages = walk(DIST);
const dead = new Map(); // href -> Set of pages referencing it
let checked = 0;

for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const href = match[1];
    if (!href.startsWith('/') || isExternal(href)) continue;
    checked++;
    if (resolves(href)) continue;
    if (!dead.has(href)) dead.set(href, new Set());
    dead.get(href).add(relative(DIST, page).replace(/index\.html$/, '') || '/');
  }
}

console.log(`checked ${checked} internal references across ${pages.length} pages`);

if (dead.size === 0) {
  console.log('all resolve');
  process.exit(0);
}

console.error(`\n${dead.size} dead internal ${dead.size === 1 ? 'link' : 'links'}:\n`);
for (const [href, sources] of [...dead].sort()) {
  const list = [...sources].sort();
  const shown = list.slice(0, 5).join(', ');
  const more = list.length > 5 ? ` (+${list.length - 5} more)` : '';
  console.error(`  ${href}\n    on: ${shown}${more}`);
}
process.exit(1);
