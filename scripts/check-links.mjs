#!/usr/bin/env node
// Link + staleness checker. Confirms every external URL referenced in content
// frontmatter still resolves, and lists draft items to watch for promotion to
// a final standard.
//
// Each URL is fetched directly. Only when a site answers with a bot wall
// (401, 403, 429, 503) is it retried through Tabstack, which renders it like
// a browser. A URL neither can confirm is reported as unverified rather than
// dead, so a Tabstack outage cannot turn every bot-walled link into a failure
// or into a pass. Exits 1 if any link is dead.
//
// Usage: bun run check:links
import { extractMarkdown, pool } from './lib/tabstack.mjs';
import { listFiles } from './lib/content.mjs';
import { readFrontmatter } from './lib/frontmatter.mjs';

const UA = 'Mozilla/5.0 (compatible; apiguide.dev link check; +https://apiguide.dev)';
const BOT_WALL = new Set([401, 403, 429, 503]);

async function direct(url) {
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(20000) });
    return { status: res.status };
  } catch (e) {
    return { status: 0, note: e.cause?.code ?? e.message };
  }
}

async function check(url) {
  const { status, note } = await direct(url);
  if (status >= 200 && status < 400) return { url, state: 'ok' };
  if (!BOT_WALL.has(status)) return { url, state: 'dead', note: status ? `HTTP ${status}` : note };
  try {
    const { content } = await extractMarkdown(url);
    if (content && content.trim()) return { url, state: 'ok', note: `HTTP ${status} directly, rendered via Tabstack` };
    return { url, state: 'unverified', note: `HTTP ${status} directly, Tabstack returned nothing` };
  } catch (e) {
    return { url, state: 'unverified', note: `HTTP ${status} directly, Tabstack failed: ${e.message.split('\n').find((l) => /api error/i.test(l))?.trim() ?? e.message.slice(0, 120)}` };
  }
}

const CONCURRENCY = 4;

// Collect (url → [where it's referenced]) from specs.officialUrl, tools.url and reference.url.
function collectUrls() {
  const map = new Map();
  const add = (url, where) => {
    if (!url) return;
    if (!map.has(url)) map.set(url, []);
    map.get(url).push(where);
  };
  for (const f of listFiles('specifications')) add(readFrontmatter(f.path).officialUrl, `specifications/${f.slug}`);
  for (const f of listFiles('tools')) add(readFrontmatter(f.path).url, `tools/${f.slug}`);
  for (const c of ['status-codes', 'headers', 'methods']) {
    for (const f of listFiles(c)) add(readFrontmatter(f.path).reference?.url, `${c}/${f.slug} (reference)`);
  }
  return map;
}

function collectDrafts() {
  const drafts = [];
  for (const f of listFiles('methods')) {
    if (readFrontmatter(f.path).draft === true) drafts.push(`methods/${f.slug} (draft: true)`);
  }
  for (const f of listFiles('specifications')) {
    const v = String(readFrontmatter(f.path).currentVersion ?? '');
    if (/draft/i.test(v)) drafts.push(`specifications/${f.slug} (currentVersion: ${v})`);
  }
  return drafts;
}

async function main() {
  const urlMap = collectUrls();
  const urls = [...urlMap.keys()];
  console.log(`Checking ${urls.length} external URL(s)…\n`);

  const results = await pool(urls, CONCURRENCY, check);

  const dead = [];
  const unverified = [];
  for (const r of results) {
    const where = () => { for (const w of urlMap.get(r.url)) console.log(`      ↳ ${w}`); };
    if (r.state === 'ok') {
      console.log(`  ✓ ${r.url}${r.note ? `  (${r.note})` : ''}`);
    } else if (r.state === 'unverified') {
      unverified.push(r);
      console.log(`  ? ${r.url}  — ${r.note}`);
      where();
    } else {
      dead.push(r);
      console.log(`  ✗ ${r.url}  — ${r.note}`);
      where();
    }
  }

  const drafts = collectDrafts();
  if (drafts.length) {
    console.log('\n── Draft items to watch (verify they haven\'t been finalised) ──');
    for (const d of drafts) console.log(`   • ${d}`);
  }

  if (unverified.length) console.log(`\n? ${unverified.length} link(s) could not be verified either way; check them by hand`);
  console.log(`${dead.length ? `✗ ${dead.length} link(s) dead` : '✓ no dead links'}`);
  process.exit(dead.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
