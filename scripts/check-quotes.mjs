#!/usr/bin/env node
// Check that text quoted from an RFC is really in that RFC. No model and no
// judgement: a sentence naming an RFC and containing a double-quoted phrase is
// compared with the RFC's text, so a misquotation or a wrong RFC number fails.
//
// Phrases that only sit beside an RFC name without quoting it are listed in
// scripts/quotes-ignore.json, each with its reason. Exits 1 on a quotation that
// is not found and 2 if an RFC cannot be read.
//
// Usage: bun run check:quotes
import { readFileSync } from 'node:fs';
import { listFiles, readFile } from './lib/content.mjs';
import { bodyOf } from './lib/frontmatter.mjs';
import { pool } from './lib/pool.mjs';
import { normalise, rfcText } from './lib/rfc.mjs';

const COLLECTIONS = ['errors', 'status-codes', 'headers', 'methods', 'guides', 'specifications', 'tools'];
const ignore = JSON.parse(readFileSync(new URL('./quotes-ignore.json', import.meta.url), 'utf8'));
const ignored = new Set(ignore.flatMap((group) => group.quotes.map((q) => `${q.page}|${q.quote}`)));

/** Every sentence in a page that names an RFC and quotes something. */
function quotations(body) {
  const out = [];
  const prose = body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`\n]*`/g, (code) => code.replace(/"/g, '\u0001'))
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  for (const paragraph of prose.split(/\n\s*\n/)) {
    for (const sentence of paragraph.split(/(?<=[.!?:])["”]?\s+(?=[A-Z])/)) {
      const rfcs = [...sentence.matchAll(/RFC[ -]?(\d{3,5})/g)].map((m) => m[1]);
      if (!rfcs.length) continue;
      for (const [, quote] of sentence.matchAll(/"([^"\n]+)"/g)) {
        if (quote.trim().split(/\s+/).length < 4) continue;
        out.push({ quote: quote.trim(), rfcs: [...new Set(rfcs)] });
      }
    }
  }
  return out;
}

/** Whether every part of a quotation, split at any ellipsis, is in one of the RFCs. */
async function found({ quote, rfcs }) {
  const parts = quote
    .split(/\.\.\.|…|\[[^\]]*\]/)
    .map((p) => normalise(p).replace(/[.,;:]$/, '').trim())
    .filter(Boolean);
  for (const rfc of rfcs) {
    const text = await rfcText(rfc);
    if (parts.every((p) => text.includes(p))) return true;
  }
  return false;
}

async function main() {
  const items = [];
  for (const collection of COLLECTIONS) {
    for (const file of listFiles(collection)) {
      const page = `${collection}/${file.slug}`;
      for (const q of quotations(bodyOf(readFile(file.path)))) {
        if (!ignored.has(`${page}|${q.quote}`)) items.push({ page, ...q });
      }
    }
  }

  let failed = 0;
  const results = await pool(items, 6, async (item) => {
    try {
      return { ...item, ok: await found(item) };
    } catch (e) {
      failed++;
      console.log(`✗ ${item.page}: could not read a source: ${e.message}`);
      return { ...item, ok: true };
    }
  });

  const missing = results.filter((r) => !r.ok);
  for (const m of missing) console.log(`✗ ${m.page}\n    RFC ${m.rfcs.join(', ')}: "${m.quote}"`);
  console.log(`\nchecked ${results.length} quotation(s), ${missing.length} not found`);
  if (failed) {
    console.log(`✗ ${failed} could not be checked`);
    process.exit(2);
  }
  process.exit(missing.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
