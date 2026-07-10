#!/usr/bin/env node
// Gap detection: pull the canonical IANA registries via Tabstack's structured
// extraction and diff them against the content collections on disk. Reports
// registry entries we do not yet document. Advisory — always exits 0 (many
// niche entries are intentionally omitted).
//
// Usage: npm run check:gaps
import { extractJson } from './lib/tabstack.mjs';
import { listFiles } from './lib/content.mjs';
import { readFrontmatter } from './lib/frontmatter.mjs';

const REGISTRIES = [
  {
    label: 'HTTP status codes',
    url: 'https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml',
    schema: {
      type: 'object',
      properties: {
        codes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value: { type: 'string', description: 'The status code, e.g. "200"' },
              description: { type: 'string', description: 'The reason phrase' },
            },
            required: ['value'],
          },
        },
      },
      required: ['codes'],
    },
    local: () => new Set(listFiles('status-codes').map((f) => String(readFrontmatter(f.path).code))),
    remote: (d) =>
      (d.codes ?? [])
        .map((c) => ({ key: (c.value ?? '').trim(), label: `${(c.value ?? '').trim()} ${c.description ?? ''}`.trim() }))
        .filter((c) => /^\d+$/.test(c.key) && !/unassigned/i.test(c.label)),
  },
  {
    label: 'HTTP methods',
    url: 'https://www.iana.org/assignments/http-methods/http-methods.xhtml',
    schema: {
      type: 'object',
      properties: {
        methods: {
          type: 'array',
          items: {
            type: 'object',
            properties: { method: { type: 'string' } },
            required: ['method'],
          },
        },
      },
      required: ['methods'],
    },
    local: () => new Set(listFiles('methods').map((f) => String(readFrontmatter(f.path).name ?? '').toUpperCase())),
    remote: (d) =>
      (d.methods ?? [])
        .map((m) => ({ key: (m.method ?? '').trim().toUpperCase(), label: (m.method ?? '').trim() }))
        .filter((m) => /^[A-Z*-]+$/.test(m.key) && m.key !== '*'),
  },
  {
    label: 'HTTP fields (headers)',
    url: 'https://www.iana.org/assignments/http-fields/http-fields.xhtml',
    schema: {
      type: 'object',
      properties: {
        fields: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              status: { type: 'string', description: 'e.g. permanent, provisional, deprecated' },
            },
            required: ['name'],
          },
        },
      },
      required: ['fields'],
    },
    local: () => new Set(listFiles('headers').map((f) => String(readFrontmatter(f.path).name ?? '').toLowerCase())),
    remote: (d) =>
      (d.fields ?? [])
        .map((f) => ({ key: (f.name ?? '').trim().toLowerCase(), label: `${(f.name ?? '').trim()}${f.status ? ` [${f.status}]` : ''}` }))
        .filter((f) => f.key),
    noisy: true, // registry is large; missing list needs human triage
  },
];

const CAP = 60;

async function main() {
  for (const reg of REGISTRIES) {
    process.stdout.write(`\n── ${reg.label} ──\n`);
    let data;
    try {
      data = await extractJson(reg.url, reg.schema);
    } catch (e) {
      console.error(`  ✗ extraction failed: ${e.message}`);
      continue;
    }
    const local = reg.local();
    const remote = reg.remote(data);
    const seen = new Set();
    const missing = [];
    for (const r of remote) {
      if (seen.has(r.key)) continue;
      seen.add(r.key);
      if (!local.has(r.key)) missing.push(r.label);
    }
    console.log(`  registry: ${seen.size}  documented: ${local.size}  missing: ${missing.length}`);
    if (missing.length) {
      const shown = missing.slice(0, CAP);
      for (const m of shown) console.log(`   • ${m}`);
      if (missing.length > CAP) console.log(`   …and ${missing.length - CAP} more`);
      if (reg.noisy) console.log('   (large registry — many entries are niche/experimental; triage before adding)');
    } else {
      console.log('   ✓ nothing missing');
    }
  }
  console.log('\nDone. Gaps are advisory, not failures.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
