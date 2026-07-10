// Helpers to enumerate the Astro content collections on disk.
import { readdirSync, readFileSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../src/content/', import.meta.url));

export function contentDir(collection) {
  return join(ROOT, collection);
}

export function listFiles(collection) {
  return readdirSync(contentDir(collection))
    .filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))
    .map((f) => ({
      collection,
      slug: basename(f, extname(f)),
      path: join(contentDir(collection), f),
    }));
}

export function readFile(path) {
  return readFileSync(path, 'utf8');
}
