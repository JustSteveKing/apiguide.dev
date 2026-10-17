// Every reference page as Markdown, in one file, for agents that would rather
// read the catalogue once than crawl it. /llms.txt is the index; this is the
// content behind it.
import type { APIRoute } from 'astro';
import { allEntries, toMarkdown } from '@/utils/markdown';

export const GET: APIRoute = async () => {
  const entries = await allEntries();
  const intro = [
    '# apiguide.dev, full text',
    '',
    '> A language-agnostic reference for HTTP API design: problem types, status codes, headers, methods, guides, specifications and tools.',
    '',
    `${entries.length} pages follow, each starting with a level-one heading and its source URL. The index is https://apiguide.dev/llms.txt, and every page is also available alone by appending .md to its URL. Content is CC BY-SA 4.0.`,
    '',
  ].join('\n');
  const body = entries.map(toMarkdown).join('\n---\n\n');
  return new Response(`${intro}\n---\n\n${body}`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
