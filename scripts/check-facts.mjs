#!/usr/bin/env node
// Check what can be checked against a source without a model:
//
// - registry: a method's safety and idempotency, a status code's name and that a
//   standard header is registered, against the IANA registries
// - reference: a page's `reference` section exists, and mentions the page's topic
// - section: every "RFC N, Section X" in the prose exists in that RFC
// - defined-in: an RFC said to define the page's topic mentions it at all
// - normative: "RFC N says ... MUST" uses the keyword the RFC uses for that wording
//
// The last is a heuristic, comparing words, so it reports only when the RFC's
// closest sentence clearly uses a different keyword. It cannot judge meaning, which
// is what `factcheck` is for. Exceptions live in scripts/facts-ignore.json with
// their reason. Exits 1 on a mismatch and 2 if a source cannot be read.
//
// Usage: bun run check:facts                 # every page
//        node scripts/check-facts.mjs <path>  # pages, under a directory named for their collection
import { readFileSync } from 'node:fs';
import { basename, dirname, extname } from 'node:path';
import { fetchCsv, REGISTRY_URLS } from './lib/iana.mjs';
import { listFiles, readFile } from './lib/content.mjs';
import { bodyOf, parseFrontmatter } from './lib/frontmatter.mjs';
import { pool } from './lib/pool.mjs';
import { rfcRaw, rfcSections } from './lib/rfc.mjs';

const COLLECTIONS = ['errors', 'status-codes', 'headers', 'methods', 'guides', 'specifications', 'tools'];
const ignore = JSON.parse(readFileSync(new URL('./facts-ignore.json', import.meta.url), 'utf8'));
const ignored = new Set(ignore.flatMap((group) => group.items));

const STOP = new Set('a an and any are as at be been but by can cannot could do does for from has have if in into is it its may might must not of on one or other shall should so such than that the their then there these this those to was were when where which while who will with would you your says say said requires require states state notes note recommends recommend allows allow defines define rfc also only'.split(' '));
const KEYWORD = /\b(MUST NOT|SHALL NOT|SHOULD NOT|NOT RECOMMENDED|MUST|SHALL|SHOULD|MAY|REQUIRED|RECOMMENDED)\b/g;
const CANON = { 'SHALL NOT': 'MUST NOT', SHALL: 'MUST', REQUIRED: 'MUST', RECOMMENDED: 'SHOULD', 'NOT RECOMMENDED': 'SHOULD NOT' };
const canon = (k) => CANON[k] ?? k;

const words = (text) => new Set(text.toLowerCase().match(/[a-z0-9-]+/g)?.filter((w) => !STOP.has(w) && w.length > 1) ?? []);

const rfcSentenceCache = new Map();
function rfcSentences(number) {
  if (!rfcSentenceCache.has(number)) {
    rfcSentenceCache.set(
      number,
      rfcRaw(number).then((raw) =>
        raw
          .replace(/\n[^\n]*\[Page \d+\]\s*\n\f?[^\n]*\n/g, '\n')
          .replace(/\s+/g, ' ')
          .split(/(?<=[.;:])\s+(?=[A-Za-z])/),
      ),
    );
  }
  return rfcSentenceCache.get(number);
}

/** What the page is about, as a word its defining section has to mention. */
function topicOf(collection, fm) {
  if (collection === 'status-codes') return String(fm.code);
  if (collection === 'headers' || collection === 'methods') return String(fm.name);
  return null;
}

const prose = (body) =>
  body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^\s*\|.*$/gm, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

async function checkRegistry(page, collection, fm, registries) {
  const out = [];
  if (collection === 'methods') {
    const row = registries.methods.get(String(fm.name).toUpperCase());
    if (!row) return out;
    for (const [field, column] of [['safe', 'Safe'], ['idempotent', 'Idempotent']]) {
      const want = row[column].toLowerCase() === 'yes';
      if (typeof fm[field] === 'boolean' && fm[field] !== want) {
        out.push({ check: 'registry', detail: `${field}: ${fm[field]}, but IANA says ${column} is ${row[column]}` });
      }
    }
  }
  if (collection === 'status-codes') {
    const row = registries.statusCodes.get(String(fm.code));
    // IANA marks status in brackets: "(Unused)", "Not Extended (OBSOLETED)".
    const plain = (t) => t.replace(/\([^)]*\)/g, (m) => (t.trim() === m ? m.slice(1, -1) : '')).trim().toLowerCase();
    if (row && row.Description && String(fm.title).toLowerCase() !== plain(row.Description)) {
      out.push({ check: 'registry', detail: `title "${fm.title}", but IANA calls ${fm.code} "${row.Description}"` });
    }
  }
  if (collection === 'headers') {
    const row = registries.fields.get(String(fm.name).toLowerCase());
    // The other direction is fine: a draft or a W3C working draft can be registered
    // as permanent without being a finished standard, so standard: false says nothing here.
    if (fm.standard === true && !row) out.push({ check: 'registry', detail: 'standard: true, but the header is not in the IANA registry' });
  }
  return out;
}

async function checkReference(collection, fm) {
  const m = fm.reference?.title?.match(/^RFC[ -]?(\d{3,5}),? Section ([\d.]*\d)/);
  if (!m) return [];
  const sections = await rfcSections(m[1]);
  const section = sections.get(m[2]);
  if (!section) return [{ check: 'reference', detail: `reference names RFC ${m[1]} Section ${m[2]}, which does not exist` }];
  const topic = topicOf(collection, fm);
  if (topic && !`${section.heading}\n${section.text}`.toLowerCase().includes(topic.toLowerCase())) {
    return [{ check: 'reference', detail: `reference names RFC ${m[1]} Section ${m[2]} ("${section.heading}"), which does not mention ${topic}` }];
  }
  return [];
}

async function checkSections(text) {
  const out = [];
  const cited = new Set();
  for (const m of text.matchAll(/RFC[ -]?(\d{3,5}),? (?:Section|§) ?(\d+(?:\.\d+)*)/g)) cited.add(`${m[1]}|${m[2]}`);
  for (const m of text.matchAll(/Section (\d+(?:\.\d+)*) of (?:the )?RFC[ -]?(\d{3,5})/g)) cited.add(`${m[2]}|${m[1]}`);
  for (const c of cited) {
    const [rfc, section] = c.split('|');
    if (!(await rfcSections(rfc)).has(section)) out.push({ check: 'section', detail: `cites RFC ${rfc} Section ${section}, which does not exist` });
  }
  return out;
}

async function checkDefinedIn(collection, fm, text) {
  const topic = topicOf(collection, fm);
  if (!topic) return [];
  const out = [];
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    if (!sentence.toLowerCase().includes(topic.toLowerCase())) continue;
    for (const m of sentence.matchAll(/defined (?:in|by) (?:the )?RFC[ -]?(\d{3,5})/g)) {
      // A different field named just before "defined in" is the subject, not this page's topic.
      const before = sentence.slice(0, m.index).match(/`([^`]+)`[^`]*$/)?.[1];
      if (before && before.toLowerCase() !== topic.toLowerCase()) continue;
      const raw = (await rfcRaw(m[1])).toLowerCase();
      if (!raw.includes(topic.toLowerCase())) out.push({ check: 'defined-in', detail: `says ${topic} is defined in RFC ${m[1]}, which never mentions it` });
    }
  }
  return out;
}

async function checkNormative(text) {
  const out = [];
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    const named = [...sentence.matchAll(/RFC[ -]?(\d{3,5})/g)];
    if (!named.length) continue;
    for (const k of sentence.matchAll(KEYWORD)) {
      const rfc = named.filter((n) => n.index < k.index).pop();
      if (!rfc) continue;
      const claim = words(sentence.slice(rfc.index + rfc[0].length).replace(KEYWORD, ' '));
      if (claim.size < 3) continue;
      const score = (s) => [...claim].filter((w) => s.has(w)).length / claim.size;
      let same = 0;
      let other = 0;
      let otherKeyword = '';
      let otherSentence = '';
      for (const candidate of await rfcSentences(rfc[1])) {
        const keywords = [...candidate.matchAll(KEYWORD)].map((m) => canon(m[1]));
        if (!keywords.length) continue;
        const s = score(words(candidate));
        if (keywords.includes(canon(k[1]))) same = Math.max(same, s);
        else if (s > other) {
          other = s;
          otherKeyword = keywords[0];
          otherSentence = candidate;
        }
      }
      if (other >= 0.5 && other >= same + 0.2) {
        out.push({
          check: 'normative',
          detail: `says RFC ${rfc[1]} uses ${k[1]}, but its closest wording uses ${otherKeyword}: "${otherSentence.trim().slice(0, 160)}"`,
          claim: sentence.trim().slice(0, 200),
        });
      }
    }
  }
  return out;
}

function targets() {
  const args = process.argv.slice(2);
  if (args.length) {
    return args.map((path) => ({
      path,
      collection: basename(dirname(path)),
      page: `${basename(dirname(path))}/${basename(path, extname(path))}`,
    }));
  }
  return COLLECTIONS.flatMap((collection) =>
    listFiles(collection).map((f) => ({ path: f.path, collection, page: `${collection}/${f.slug}` })),
  );
}

async function main() {
  const [methods, statusCodes, fields] = await Promise.all([
    fetchCsv(REGISTRY_URLS.methods),
    fetchCsv(REGISTRY_URLS.statusCodes),
    fetchCsv(REGISTRY_URLS.fields),
  ]);
  const registries = {
    methods: new Map(methods.map((r) => [r['Method Name'].toUpperCase(), r])),
    statusCodes: new Map(statusCodes.map((r) => [r.Value, r])),
    fields: new Map(fields.map((r) => [r['Field Name'].toLowerCase(), r])),
  };

  let failed = 0;
  let found = 0;
  const pages = targets();
  await pool(pages, 8, async ({ path, collection, page }) => {
    const raw = readFile(path);
    const fm = parseFrontmatter(raw);
    const text = prose(bodyOf(raw));
    let results = [];
    try {
      results = [
        ...(await checkRegistry(page, collection, fm, registries)),
        ...(await checkReference(collection, fm)),
        ...(await checkSections(text)),
        ...(await checkDefinedIn(collection, fm, text)),
        ...(await checkNormative(text)),
      ];
    } catch (e) {
      failed++;
      console.log(`✗ ${page}: could not read a source: ${e.message}`);
      return;
    }
    for (const r of results) {
      if (ignored.has(`${page}|${r.detail}`)) continue;
      found++;
      console.log(`✗ ${page} [${r.check}]\n    ${r.detail}${r.claim ? `\n    page: ${r.claim}` : ''}`);
    }
  });

  console.log(`\nchecked ${pages.length} page(s), ${found} mismatch(es)`);
  if (failed) {
    console.log(`✗ ${failed} page(s) could not be checked`);
    process.exit(2);
  }
  process.exit(found ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
