#!/usr/bin/env node
// Link + staleness checker. Confirms every external URL referenced in the
// content frontmatter still resolves (via Tabstack markdown extraction), and
// lists draft items to watch for promotion to a final standard.
// Exits 1 if any link fails to resolve.
//
// Usage: npm run check:links
import { extractMarkdown, pool } from './lib/tabstack.mjs';
import { listFiles } from './lib/content.mjs';
import { readFrontmatter } from './lib/frontmatter.mjs';

const CONCURRENCY = 4;

// Collect (url → [where it's referenced]) from specs.officialUrl and tools.url.
function collectUrls() {
  const map = new Map();
  const add = (url, where) => {
    if (!url) return;
    if (!map.has(url)) map.set(url, []);
    map.get(url).push(where);
  };
  for (const f of listFiles('specifications')) add(readFrontmatter(f.path).officialUrl, `specifications/${f.slug}`);
  for (const f of listFiles('tools')) add(readFrontmatter(f.path).url, `tools/${f.slug}`);
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

  const results = await pool(urls, CONCURRENCY, async (url) => {
    try {
      const { content } = await extractMarkdown(url);
      return { url, ok: !!content && content.trim().length > 0, note: content ? '' : 'empty content' };
    } catch (e) {
      return { url, ok: false, note: e.message };
    }
  });

  const failed = [];
  for (const r of results) {
    if (r.ok) {
      console.log(`  ✓ ${r.url}`);
    } else {
      failed.push(r);
      console.log(`  ✗ ${r.url}  — ${r.note}`);
      for (const w of urlMap.get(r.url)) console.log(`      ↳ ${w}`);
    }
  }

  const drafts = collectDrafts();
  if (drafts.length) {
    console.log('\n── Draft items to watch (verify they haven\'t been finalised) ──');
    for (const d of drafts) console.log(`   • ${d}`);
  }

  console.log(`\n${failed.length ? `✗ ${failed.length} link(s) failed` : '✓ all links resolved'}`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
