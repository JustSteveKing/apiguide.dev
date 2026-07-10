#!/usr/bin/env node
// Enrich tool entries using Tabstack `generate json` against each tool's
// official URL. Writes PROPOSED files to scripts/out/tools/ for human review —
// it never overwrites the curated originals in src/content/tools/. Also warns
// when the page's apparent pricing differs from the frontmatter.
//
// Usage:
//   npm run enrich:tools                 # all tools
//   npm run enrich:tools -- insomnia k6  # specific slugs
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateJson, pool } from './lib/tabstack.mjs';
import { listFiles } from './lib/content.mjs';
import { parseFrontmatter } from './lib/frontmatter.mjs';

const OUT_DIR = fileURLToPath(new URL('./out/tools/', import.meta.url));
const CONCURRENCY = 3;

const SCHEMA = {
  type: 'object',
  properties: {
    overview: {
      type: 'string',
      description: '2-3 sentence neutral, encyclopedic description of what the tool is and its purpose',
    },
    features: {
      type: 'array',
      description: '4-6 concrete, distinct capabilities specific to HTTP/API work',
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, detail: { type: 'string' } },
        required: ['title', 'detail'],
      },
    },
    bestPractices: {
      type: 'array',
      items: { type: 'string' },
      description:
        '2-4 actionable workflow recommendations that are DISTINCT from the features list — how to use it well, not a restatement of what it can do',
    },
    pricing: { type: 'string', enum: ['free', 'freemium', 'paid', 'open-source'] },
  },
  required: ['overview', 'features', 'bestPractices'],
};

const INSTRUCTIONS =
  'Enrich a neutral, factual developer-reference entry for this API tool using only the page content. ' +
  'Write in a plain, encyclopedic tone: strip marketing adjectives such as "powerful", "seamless", ' +
  '"AI-native", "leading", "blazing-fast", "effortless" — state capabilities plainly. ' +
  'features: concrete capabilities specific to HTTP/API work, each a distinct capability. ' +
  'bestPractices: actionable recommendations for using the tool well in a real workflow, ' +
  'clearly DISTINCT from the features list (not a restatement of what the tool can do). ' +
  'Do not invent facts, numbers, pricing, or integrations that are not on the page.';

const rawFrontmatter = (raw) => {
  const m = raw.match(/^---\n[\s\S]*?\n---/);
  return m ? m[0] : '';
};

function renderBody(name, d) {
  const feats = d.features.map((f) => `* **${f.title}**: ${f.detail}`).join('\n');
  const tips = d.bestPractices.map((b) => `* ${b}`).join('\n');
  return (
    `## What is ${name}?\n\n${d.overview}\n\n` +
    `## Why use it in the API Lifecycle?\n\n${feats}\n\n` +
    `## Best Practices\n\n${tips}\n`
  );
}

async function main() {
  const args = process.argv.slice(2);
  let tools = listFiles('tools');
  if (args.length) tools = tools.filter((t) => args.includes(t.slug));
  if (!tools.length) {
    console.error(`No matching tools. Available slugs live in src/content/tools/.`);
    process.exit(2);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Enriching ${tools.length} tool(s) → ${OUT_DIR}\n`);

  const warnings = [];
  await pool(tools, CONCURRENCY, async (t) => {
    const raw = readFileSync(t.path, 'utf8');
    const fm = parseFrontmatter(raw);
    if (!fm.url) {
      console.log(`  ⚠ ${t.slug}: no url in frontmatter, skipped`);
      return;
    }
    let data;
    try {
      data = await generateJson(fm.url, INSTRUCTIONS, SCHEMA);
    } catch (e) {
      console.log(`  ✗ ${t.slug}: ${e.message}`);
      return;
    }
    const out = `${rawFrontmatter(raw)}\n\n${renderBody(fm.name ?? t.slug, data)}`;
    writeFileSync(join(OUT_DIR, `${t.slug}.md`), out);
    let line = `  ✓ ${t.slug}`;
    if (data.pricing && fm.pricing && data.pricing !== fm.pricing) {
      const w = `${t.slug}: frontmatter pricing "${fm.pricing}" vs page "${data.pricing}"`;
      warnings.push(w);
      line += `  (⚠ pricing: ${fm.pricing} → ${data.pricing})`;
    }
    console.log(line);
  });

  if (warnings.length) {
    console.log(`\n── Pricing drift to review ──`);
    for (const w of warnings) console.log(`   • ${w}`);
  }
  console.log(
    `\nProposed files written to scripts/out/tools/. Review, then copy approved ones into src/content/tools/.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
