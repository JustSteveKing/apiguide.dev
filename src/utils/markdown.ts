// Plain Markdown versions of every reference page, for agents and anything
// else that wants the content without the HTML shell. Each page at
// /<collection>/<slug> has a sibling at /<collection>/<slug>.md, and
// /llms-full.txt is all of them concatenated.
import { getCollection, type CollectionEntry } from 'astro:content';

const SITE = 'https://apiguide.dev';

export type ReferenceEntry =
  | CollectionEntry<'errors'>
  | CollectionEntry<'statusCodes'>
  | CollectionEntry<'headers'>
  | CollectionEntry<'methods'>
  | CollectionEntry<'guides'>
  | CollectionEntry<'specifications'>
  | CollectionEntry<'tools'>;

const day = (d: Date) => d.toISOString().split('T')[0];

/** The page path for an entry, without a trailing slash or extension. */
export function entryPath(entry: ReferenceEntry): string {
  switch (entry.collection) {
    case 'statusCodes': return `/status-codes/${entry.data.code}`;
    case 'tools': return `/tools/${entry.data.category}/${entry.id}`;
    default: return `/${entry.collection}/${entry.id}`;
  }
}

function title(entry: ReferenceEntry): string {
  switch (entry.collection) {
    case 'statusCodes': return `${entry.data.code} ${entry.data.title}`;
    case 'headers': return `${entry.data.name} header`;
    case 'methods': return `${entry.data.name} method`;
    case 'tools': return entry.data.name;
    default: return entry.data.title;
  }
}

function summary(entry: ReferenceEntry): string | undefined {
  return entry.collection === 'errors' ? undefined : entry.data.description;
}

/** Key facts from the frontmatter, as "Label: value" lines. */
function facts(entry: ReferenceEntry): [string, string][] {
  const out: [string, string][] = [];
  const d = entry.data as Record<string, any>;
  switch (entry.collection) {
    case 'errors': {
      const alias = `${SITE}/errors/${entry.id}`;
      out.push(['Problem type URI', entry.data.registeredType ?? alias]);
      if (entry.data.registeredType) out.push(['Alias', `${alias} (registered with IANA; send the registered URI)`]);
      out.push(['Status', `${entry.data.statusCode} ${entry.data.statusText}`]);
      if (entry.data.deprecated) out.push(['Deprecated', 'yes']);
      break;
    }
    case 'statusCodes': out.push(['Class', entry.data.category]); break;
    case 'headers':
      out.push(['Direction', entry.data.category]);
      out.push(['Registered', entry.data.standard ? 'yes' : 'no (de facto)']);
      break;
    case 'methods':
      out.push(['Safe', entry.data.safe ? 'yes' : 'no']);
      out.push(['Idempotent', entry.data.idempotent ? 'yes' : 'no']);
      out.push(['Cacheable', entry.data.cacheable ? 'yes' : 'no']);
      break;
    case 'guides': out.push(['Category', entry.data.category]); break;
    case 'specifications':
      out.push(['Current version', entry.data.currentVersion]);
      out.push(['Official source', entry.data.officialUrl]);
      break;
    case 'tools':
      out.push(['Category', entry.data.category]);
      out.push(['Website', entry.data.url]);
      out.push(['Pricing', entry.data.pricing]);
      break;
  }
  if (d.reference?.title) out.push(['Defined in', d.reference.url ? `${d.reference.title} <${d.reference.url}>` : d.reference.title]);
  if (d.updatedDate instanceof Date) out.push(['Updated', day(d.updatedDate)]);
  return out;
}

/** One entry as a standalone Markdown document. */
export function toMarkdown(entry: ReferenceEntry): string {
  const lines = [`# ${title(entry)}`, ''];
  const s = summary(entry);
  if (s) lines.push(`> ${s}`, '');
  lines.push(`Source: ${SITE}${entryPath(entry)}`);
  for (const [k, v] of facts(entry)) lines.push(`${k}: ${v}`);
  lines.push('', (entry.body ?? '').trim(), '');
  return lines.join('\n');
}

export function markdownResponse(body: string): Response {
  return new Response(body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}

/** Every reference entry, in the order the site presents its sections. */
export async function allEntries(): Promise<ReferenceEntry[]> {
  const [errors, statusCodes, headers, methods, guides, specs, tools] = await Promise.all([
    getCollection('errors'),
    getCollection('statusCodes'),
    getCollection('headers'),
    getCollection('methods'),
    getCollection('guides'),
    getCollection('specifications'),
    getCollection('tools'),
  ]);
  return [
    ...errors.sort((a, b) => a.id.localeCompare(b.id)),
    ...statusCodes.sort((a, b) => a.data.code - b.data.code),
    ...headers.sort((a, b) => a.data.name.localeCompare(b.data.name)),
    ...methods.sort((a, b) => a.data.name.localeCompare(b.data.name)),
    ...guides.sort((a, b) => a.id.localeCompare(b.id)),
    ...specs.sort((a, b) => a.id.localeCompare(b.id)),
    ...tools.sort((a, b) => a.id.localeCompare(b.id)),
  ];
}
