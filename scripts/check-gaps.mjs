#!/usr/bin/env node
// Gap detection: diff the content collections against the canonical IANA
// registries (status codes, methods, field names, problem types), fetched
// straight from IANA as CSV and XML.
//
// Entries omitted on purpose are listed, with the reason, in
// scripts/gaps-ignore.json, so what this prints is only what nobody has
// decided about yet. Gaps are advisory and exit 0. Failing to read a registry
// is not advisory: it exits 2, because a check that could not run must not
// look like a check that passed.
//
// Usage: bun run check:gaps
import { readFileSync } from 'node:fs';
import { fetchCsv, fetchProblemTypes, REGISTRY_URLS } from './lib/iana.mjs';
import { listFiles } from './lib/content.mjs';
import { readFrontmatter } from './lib/frontmatter.mjs';

const ignore = JSON.parse(readFileSync(new URL('./gaps-ignore.json', import.meta.url), 'utf8'));

// Every ignore entry is { names: [...], reason: "..." }; keys compare lowercased.
function ignored(registry) {
  const map = new Map();
  for (const group of ignore[registry] ?? []) {
    for (const name of group.names) map.set(String(name).toLowerCase(), group.reason);
  }
  return map;
}

const REGISTRIES = [
  {
    key: 'status-codes',
    label: 'HTTP status codes',
    remote: async () =>
      (await fetchCsv(REGISTRY_URLS.statusCodes))
        .filter((r) => /^\d{3}$/.test(r.Value) && !/unassigned/i.test(r.Description))
        .map((r) => ({ key: r.Value, label: `${r.Value} ${r.Description}` })),
    local: () => listFiles('status-codes').map((f) => String(readFrontmatter(f.path).code)),
  },
  {
    key: 'methods',
    label: 'HTTP methods',
    remote: async () =>
      (await fetchCsv(REGISTRY_URLS.methods))
        .filter((r) => r['Method Name'] && r['Method Name'] !== '*')
        .map((r) => ({ key: r['Method Name'].toLowerCase(), label: r['Method Name'] })),
    local: () => listFiles('methods').map((f) => String(readFrontmatter(f.path).name ?? '').toLowerCase()),
  },
  {
    key: 'headers',
    label: 'HTTP field names (permanent and provisional)',
    remote: async () =>
      (await fetchCsv(REGISTRY_URLS.fields))
        .filter((r) => ['permanent', 'provisional'].includes(r.Status) && r['Field Name'] !== '*')
        .map((r) => ({ key: r['Field Name'].toLowerCase(), label: `${r['Field Name']} [${r.Status}] ${r.Reference}` })),
    local: () => listFiles('headers').map((f) => String(readFrontmatter(f.path).name ?? '').toLowerCase()),
  },
  {
    key: 'problem-types',
    label: 'HTTP problem types',
    remote: async () =>
      (await fetchProblemTypes())
        .filter((r) => r.type !== 'about:blank')
        .map((r) => ({ key: r.type.toLowerCase(), label: `${r.type} (${r.name}, ${r.reference})` })),
    // A registered type is covered when an error page names it in registeredType.
    local: () => listFiles('errors').map((f) => String(readFrontmatter(f.path).registeredType ?? '').toLowerCase()),
  },
];

async function main() {
  let failures = 0;
  let total = 0;
  for (const reg of REGISTRIES) {
    process.stdout.write(`\n── ${reg.label} ──\n`);
    let remote;
    try {
      remote = await reg.remote();
    } catch (e) {
      failures++;
      console.error(`  ✗ could not read the registry: ${e.message}`);
      continue;
    }
    if (remote.length === 0) {
      failures++;
      console.error('  ✗ the registry parsed to nothing; the format has probably changed');
      continue;
    }
    const local = new Set(reg.local());
    const skip = ignored(reg.key);
    const seen = new Set();
    const missing = [];
    let skipped = 0;
    for (const r of remote) {
      if (seen.has(r.key)) continue;
      seen.add(r.key);
      if (local.has(r.key)) continue;
      if (skip.has(r.key)) { skipped++; continue; }
      missing.push(r.label);
    }
    console.log(`  registry: ${seen.size}  documented: ${seen.size - missing.length - skipped}  omitted on purpose: ${skipped}  undecided: ${missing.length}`);
    for (const m of missing) console.log(`   • ${m}`);
    if (!missing.length) console.log('   ✓ nothing undecided');
    total += missing.length;
  }
  if (failures) {
    console.error(`\n${failures} registr${failures === 1 ? 'y' : 'ies'} could not be read. This check did not run.`);
    process.exit(2);
  }
  console.log(`\nDone. ${total} undecided entr${total === 1 ? 'y' : 'ies'}: document each, or add it to scripts/gaps-ignore.json with a reason.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
