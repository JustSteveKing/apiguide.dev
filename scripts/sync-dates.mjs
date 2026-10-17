#!/usr/bin/env node
// Keep each page's `updatedDate` honest: set it to the date the file last
// changed in git, or to today if it has uncommitted changes, whenever that is
// later than what the frontmatter says. Run it before committing content.
//
// It never moves a date backwards, so a hand-set date for a review that did
// not change the file survives. Changes that only touch the frontmatter this
// tooling maintains (reference, updatedDate) do not count as an update, so
// running sync:references does not make every page look freshly edited.
//
// Usage: bun run sync:dates [--dry-run]
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { listFiles } from './lib/content.mjs';
import { readFrontmatter } from './lib/frontmatter.mjs';

const dryRun = process.argv.includes('--dry-run');
const COLLECTIONS = ['errors', 'status-codes', 'headers', 'methods', 'guides', 'specifications', 'tools'];
const today = new Date().toISOString().slice(0, 10);

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const dirty = new Set(
  git('status', '--porcelain', '--', 'src/content').split('\n').filter(Boolean).map((l) => l.slice(3)),
);
const root = git('rev-parse', '--show-toplevel');

// A diff line that only maintains metadata rather than changing the page.
const MAINTENANCE = /^[+-](reference:|  title:|  url:|updatedDate:)/;

function substantive(diff) {
  return diff.split('\n').some((l) => /^[+-]/.test(l) && !/^(\+\+\+|---)/.test(l) && !MAINTENANCE.test(l));
}

function lastChanged(path) {
  const rel = path.replace(`${root}/`, '');
  if (dirty.has(rel) && substantive(git('diff', 'HEAD', '--', rel))) return today;
  for (const line of git('log', '--format=%H %as', '--', rel).split('\n').filter(Boolean)) {
    const [sha, date] = line.split(' ');
    if (substantive(git('show', '--format=', sha, '--', rel))) return date;
  }
  return dirty.has(rel) ? today : '';
}

function setDate(path, date) {
  let text = readFileSync(path, 'utf8');
  const end = text.indexOf('\n---', 3);
  const fm = text.slice(0, end);
  if (/^updatedDate:.*$/m.test(fm)) {
    text = fm.replace(/^updatedDate:.*$/m, `updatedDate: ${date}`) + text.slice(end);
  } else {
    text = `${fm}\nupdatedDate: ${date}${text.slice(end)}`;
  }
  writeFileSync(path, text);
}

let changed = 0;
for (const c of COLLECTIONS) {
  for (const f of listFiles(c)) {
    const current = readFrontmatter(f.path).updatedDate;
    const currentDay = current ? new Date(current).toISOString().slice(0, 10) : '';
    const last = lastChanged(f.path);
    if (!last || currentDay >= last) continue;
    changed++;
    if (!dryRun) setDate(f.path, last);
  }
}
console.log(`${dryRun ? 'Would update' : 'Updated'} ${changed} page(s).`);
