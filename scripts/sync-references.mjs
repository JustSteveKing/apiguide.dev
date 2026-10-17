#!/usr/bin/env node
// Fill in `reference` (where the thing is defined) for status codes, methods
// and headers from the IANA registries, which record the defining document
// and section for every registered entry.
//
// Only pages without a `reference` are touched, so a hand-written one always
// wins. Unregistered headers and drafts the registry does not know about are
// left for a human, and listed.
//
// Usage: bun run sync:references [--dry-run]
import { readFileSync, writeFileSync } from 'node:fs';
import { fetchCsv, REGISTRY_URLS } from './lib/iana.mjs';
import { listFiles } from './lib/content.mjs';
import { readFrontmatter } from './lib/frontmatter.mjs';

const dryRun = process.argv.includes('--dry-run');

// Non-RFC documents the field registry cites by short name.
const NAMED = {
  HTML: { title: 'WHATWG HTML Living Standard', url: 'https://html.spec.whatwg.org/multipage/' },
  Fetch: { title: 'WHATWG Fetch Standard', url: 'https://fetch.spec.whatwg.org/' },
  'Linked Data Platform 1.0': { title: 'W3C Linked Data Platform 1.0', url: 'https://www.w3.org/TR/ldp/' },
  'Server Timing': { title: 'W3C Server Timing', url: 'https://www.w3.org/TR/server-timing/' },
  'Trace Context': { title: 'W3C Trace Context', url: 'https://www.w3.org/TR/trace-context/' },
  'Content Security Policy Level 3': { title: 'W3C Content Security Policy Level 3', url: 'https://www.w3.org/TR/CSP3/' },
  'Referrer Policy': { title: 'W3C Referrer Policy', url: 'https://www.w3.org/TR/referrer-policy/' },
};

/** Turn an IANA "Reference" cell into { title, url }. */
export function parseReference(cell) {
  const first = (cell.match(/\[([^\]]+)\]/) ?? [])[1]?.trim();
  if (!first) return undefined;
  const rfc = first.match(/^RFC\s?(\d+)(?:,\s*(Section|Appendix)\s+([A-Z0-9.]+))?/i);
  if (rfc) {
    const [, n, kind, where] = rfc;
    const title = `RFC ${n}${where ? `, ${kind[0].toUpperCase()}${kind.slice(1).toLowerCase()} ${where}` : ''}`;
    const anchor = where ? `#${kind.toLowerCase()}-${where}` : '';
    return { title, url: `https://www.rfc-editor.org/rfc/rfc${n}.html${anchor}` };
  }
  // A draft in the RFC Editor queue (RFC-ietf-x-NN) or still a draft (draft-ietf-x-NN).
  const draft = first.match(/^(?:RFC-|draft-)(ietf-[a-z0-9-]+?)(?:-\d{2})?(?=[,:\s]|$)/i);
  if (draft) {
    const name = `draft-${draft[1]}`;
    return { title: first.replace(/:.*$/, ''), url: `https://datatracker.ietf.org/doc/${name}/` };
  }
  const named = first.replace(/:.*$/, '').trim();
  if (NAMED[named]) return NAMED[named];
  return undefined;
}

function insertReference(path, ref) {
  const text = readFileSync(path, 'utf8');
  const end = text.indexOf('\n---', 3);
  if (!text.startsWith('---') || end === -1) throw new Error(`${path}: no frontmatter`);
  const block = `\nreference:\n  title: ${JSON.stringify(ref.title)}\n  url: ${ref.url}`;
  writeFileSync(path, text.slice(0, end) + block + text.slice(end));
}

const TARGETS = [
  {
    collection: 'status-codes',
    url: REGISTRY_URLS.statusCodes,
    key: (r) => r.Value,
    local: (fm) => String(fm.code),
  },
  {
    collection: 'methods',
    url: REGISTRY_URLS.methods,
    key: (r) => r['Method Name'].toUpperCase(),
    local: (fm) => String(fm.name).toUpperCase(),
  },
  {
    collection: 'headers',
    url: REGISTRY_URLS.fields,
    key: (r) => r['Field Name'].toLowerCase(),
    local: (fm) => String(fm.name).toLowerCase(),
  },
];

let written = 0;
const unresolved = [];
for (const t of TARGETS) {
  const rows = new Map((await fetchCsv(t.url)).map((r) => [t.key(r), r]));
  if (rows.size === 0) throw new Error(`${t.url} parsed to nothing`);
  for (const f of listFiles(t.collection)) {
    const fm = readFrontmatter(f.path);
    if (fm.reference) continue;
    const row = rows.get(t.local(fm));
    const ref = row && parseReference(row.Reference);
    if (!ref) {
      unresolved.push(`${t.collection}/${f.slug}${row ? ` (registry says ${row.Reference})` : ' (not in the registry)'}`);
      continue;
    }
    written++;
    console.log(`  ${t.collection}/${f.slug}: ${ref.title}`);
    if (!dryRun) insertReference(f.path, ref);
  }
}
console.log(`\n${dryRun ? 'Would write' : 'Wrote'} ${written} reference(s).`);
if (unresolved.length) {
  console.log(`\n${unresolved.length} page(s) need a reference written by hand, or have none to give:`);
  for (const u of unresolved) console.log(`   • ${u}`);
}
