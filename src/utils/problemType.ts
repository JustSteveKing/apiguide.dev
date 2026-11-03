// The errors catalogue as JSON, in the format of the errors CLI
// (https://github.com/JustSteveKing/errors), whose schemas this site publishes
// under /schemas/errors/v1/. Each /errors/<slug>.json validates against
// problem-type.schema.json; /errors/index.json carries a catalogue.schema.json
// object and every type.
import type { CollectionEntry } from 'astro:content';

export const BASE_URL = 'https://apiguide.dev/errors/';
export const PROBLEM_TYPE_SCHEMA = 'https://apiguide.dev/schemas/errors/v1/problem-type.schema.json';
export const CATALOGUE_SCHEMA = 'https://apiguide.dev/schemas/errors/v1/catalogue.schema.json';

type JsonType = 'string' | 'integer' | 'number' | 'boolean' | 'array' | 'object';
interface Shape { type: JsonType; items?: Shape }

const STANDARD = new Set(['type', 'title', 'status', 'detail', 'instance']);
const MEMBER_NAME = /^[A-Za-z][A-Za-z0-9_]{2,}$/;

function shapeOf(value: unknown): Shape | undefined {
  if (value === null || value === undefined) return undefined;
  if (Array.isArray(value)) {
    const items = value.length ? shapeOf(value[0]) : undefined;
    return items ? { type: 'array', items } : { type: 'array' };
  }
  switch (typeof value) {
    case 'string': return { type: 'string' };
    case 'boolean': return { type: 'boolean' };
    case 'number': return { type: Number.isInteger(value) ? 'integer' : 'number' };
    // Object members are deliberately not described: an example shows one
    // instance, and keys like a validation error's field names vary per call.
    case 'object': return { type: 'object' };
  }
  return undefined;
}

/**
 * Extension members, read from the page's example response. Only the JSON
 * type of each member is claimed, since an example cannot say which members
 * are always present or what an object's keys will be.
 */
function extensions(body: string | undefined): Record<string, Shape> | undefined {
  const section = body?.split(/^## Example response\s*$/m)[1];
  const block = section?.match(/```json\s*\n([\s\S]*?)```/)?.[1];
  if (!block) return undefined;
  let example: Record<string, unknown>;
  try {
    example = JSON.parse(block);
  } catch {
    return undefined;
  }
  const out: Record<string, Shape> = {};
  for (const [name, value] of Object.entries(example)) {
    if (STANDARD.has(name) || !MEMBER_NAME.test(name)) continue;
    const shape = shapeOf(value);
    if (shape) out[name] = shape;
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * The first sentence of "When to use it", as plain text. It is what tells apart
 * the types that share a status, so the JSON, llms.txt and search all carry it.
 */
export function problemSummary(entry: CollectionEntry<'errors'>): string {
  const section = entry.body?.split(/^## When to use it\s*$/m)[1] ?? '';
  const paragraph = section.trim().split(/\n\s*\n/)[0] ?? '';
  const plain = paragraph
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .replace(/\b(e\.g|i\.e)\./g, '$1\u0000');
  const sentence = plain.split(/(?<=[.!?])\s+(?=[A-Z`])/)[0].replace(/\u0000/g, '.').trim();
  if (!sentence) throw new Error(`${entry.id}: no "When to use it" paragraph to summarise`);
  return sentence;
}

/** One problem type, conforming to problem-type.schema.json. */
export function toProblemType(entry: CollectionEntry<'errors'>) {
  const ext = extensions(entry.body);
  return {
    type: entry.id,
    title: entry.data.title,
    status: entry.data.statusCode,
    summary: problemSummary(entry),
    ...(entry.data.registeredType ? { registered_type: entry.data.registeredType } : {}),
    ...(ext ? { extensions: ext } : {}),
  };
}

export function jsonResponse(value: unknown, extra: Record<string, string> = {}): Response {
  return new Response(`${JSON.stringify(value, null, 2)}\n`, {
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extra },
  });
}
