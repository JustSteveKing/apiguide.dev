// Tiny frontmatter reader for this repo's simple YAML: strings, numbers,
// booleans, dates, single-line inline arrays ([200, 304] / ['a', 'b']), and
// one level of nested mapping (`reference:` followed by indented keys).
// NOT a general YAML parser — it only needs to cover the content collections.
import { readFileSync } from 'node:fs';

function parseScalar(s) {
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    return s.slice(1, -1);
  }
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return s;
}

function parseValue(val) {
  if (val === '') return '';
  if (val.startsWith('[') && val.endsWith(']')) {
    const inner = val.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(',').map((s) => parseScalar(s.trim()));
  }
  return parseScalar(val);
}

export function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const data = {};
  let parent = null; // the mapping an indented line belongs to
  for (const line of m[1].split('\n')) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (/^\s/.test(line)) {
      if (parent) parent[key] = parseValue(value);
      continue;
    }
    if (value === '') {
      parent = data[key] = {};
      continue;
    }
    parent = null;
    data[key] = parseValue(value);
  }
  return data;
}

export function bodyOf(raw) {
  const m = raw.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)$/);
  return (m ? m[1] : raw).trim();
}

export function readFrontmatter(path) {
  return parseFrontmatter(readFileSync(path, 'utf8'));
}
