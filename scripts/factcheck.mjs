#!/usr/bin/env node
// Fact-check content against the live web using Tabstack's research agent.
// For each target file it sends the body's factual claims to `agent research`
// and prints the cited verdict. Flags reports that mention likely errors.
//
// Usage:
//   npm run factcheck                       # files changed vs HEAD~1
//   npm run factcheck -- methods/trace      # explicit collection/slug(s)
//   npm run factcheck -- src/content/...    # explicit path(s)
//   FACTCHECK_BASE=origin/main npm run factcheck   # diff base override
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { research, pool } from './lib/tabstack.mjs';
import { readFile } from './lib/content.mjs';
import { bodyOf, parseFrontmatter } from './lib/frontmatter.mjs';

const CONCURRENCY = 2;
const MAX_BODY = 2500; // cap characters sent to control cost/latency
const CONTENT_ROOT = fileURLToPath(new URL('../src/content/', import.meta.url));
const FLAG = /\b(incorrect|inaccurate|wrong|error|mistake|outdated|misleading|false)\b/i;

function resolveTarget(arg) {
  // Accept a path or a "collection/slug" shorthand.
  if (arg.endsWith('.md') || arg.endsWith('.mdx')) return existsSync(arg) ? arg : null;
  const p = join(CONTENT_ROOT, `${arg}.md`);
  return existsSync(p) ? p : null;
}

function changedFiles() {
  const base = process.env.FACTCHECK_BASE ?? 'HEAD~1';
  try {
    const out = execFileSync('git', ['diff', '--name-only', `${base}`, '--', 'src/content'], {
      encoding: 'utf8',
    });
    return out
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.endsWith('.md') || s.endsWith('.mdx'))
      .filter((s) => existsSync(s));
  } catch {
    return [];
  }
}

function buildQuery(path) {
  const raw = readFile(path);
  const fm = parseFrontmatter(raw);
  const label = fm.name ?? fm.title ?? `HTTP ${fm.code ?? ''}`.trim() ?? basename(path, extname(path));
  const body = bodyOf(raw).slice(0, MAX_BODY);
  return (
    `Fact-check this HTTP API reference note about "${label}". ` +
    `Identify any factual errors: wrong RFC numbers, incorrect safety/idempotency/cacheability, ` +
    `wrong status-code semantics, or misstated header behaviour. ` +
    `If everything is accurate, begin your answer with "NO ERRORS FOUND". ` +
    `Otherwise list each error with the correct fact.\n\n---\n${body}`
  );
}

async function main() {
  const args = process.argv.slice(2);
  let targets;
  if (args.length) {
    targets = args.map(resolveTarget);
    const bad = args.filter((a, i) => targets[i] === null);
    if (bad.length) {
      console.error(`✗ could not resolve: ${bad.join(', ')}`);
      process.exit(2);
    }
  } else {
    targets = changedFiles();
    if (!targets.length) {
      console.log('No changed content files vs HEAD~1. Pass files/slugs explicitly, e.g.:');
      console.log('  npm run factcheck -- methods/trace specifications/jwt');
      return;
    }
  }

  console.log(`Fact-checking ${targets.length} file(s) via Tabstack research…\n`);

  let flagged = 0;
  const rel = (p) => p.replace(`${process.cwd()}/`, '');
  await pool(targets, CONCURRENCY, async (path) => {
    let report, citedPages;
    try {
      ({ report, citedPages } = await research(buildQuery(path), 'fast'));
    } catch (e) {
      console.log(`\n■ ${rel(path)}\n   ✗ research failed: ${e.message}`);
      return;
    }
    const clean = /^\s*NO ERRORS FOUND/i.test(report);
    const suspicious = !clean && FLAG.test(report);
    if (suspicious) flagged++;
    const mark = clean ? '✓' : suspicious ? '⚠' : '·';
    console.log(`\n■ ${rel(path)}  ${mark}`);
    console.log(report.trim().split('\n').map((l) => `   ${l}`).join('\n'));
    if (citedPages?.length) {
      const src = citedPages.map((c) => c.url ?? c.id).filter(Boolean).slice(0, 5);
      if (src.length) console.log(`   sources: ${src.join(', ')}`);
    }
  });

  console.log(`\n${flagged ? `⚠ ${flagged} file(s) flagged for review` : '✓ no files flagged'}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
