// The way in for an agent: what the site is, the rule for using its problem
// types, the problem types themselves, and where each section lives. Kept small
// enough to read in one fetch, so the other sections are links, each with its
// size so the reader can decide whether to fetch the full text.
import type { APIRoute } from 'astro';
import { SECTIONS, allEntries, directory, inSection, toMarkdown } from '@/utils/markdown';

const SITE = 'https://apiguide.dev';

const words = (text: string) => text.split(/\s+/).length.toLocaleString('en-GB');

export const GET: APIRoute = async () => {
  const entries = await allEntries();
  const sections = SECTIONS.map((section) => {
    const pages = inSection(entries, section);
    const size = words(pages.map(toMarkdown).join('\n'));
    return `- [${section.title}](${SITE}/${section.slug}.md): ${section.about} ${pages.length} pages. [Full text](${SITE}/llms/${section.slug}.txt), ${size} words.`;
  });
  const errors = inSection(entries, SECTIONS[0]);

  const txt = `# apiguide.dev

> A language-agnostic reference for HTTP API design: problem types, status codes, headers, methods, guides, specifications and tools. Content is CC BY-SA 4.0.

Every reference page is available as Markdown by appending \`.md\` to its URL. The problem type pages also answer \`Accept: text/markdown\` and \`Accept: application/json\` at the URL itself. The HTTP interface is described in [OpenAPI](${SITE}/openapi.json) and listed in the [API catalog](${SITE}/.well-known/api-catalog).

## Using the problem types

Any API may use these as the \`type\` of an RFC 9457 problem response, without asking.

- Send \`${SITE}/errors/<slug>\` as the \`type\`.
- If the type has a \`registered_type\`, send that URI instead. IANA has registered those problems, and this site's URI is only an alias.
- Read "When not to use it" on the page before choosing between types that share a status.

The whole catalogue, as JSON: [/errors/index.json](${SITE}/errors/index.json). One type: \`${SITE}/errors/<slug>.json\`. Background: [Problem+JSON](${SITE}/problem-json.md).

## Sections

${sections.join('\n')}

Everything in one file: [/llms-full.txt](${SITE}/llms-full.txt), ${words(entries.map(toMarkdown).join('\n'))} words. Prefer a section or a single page. To look up a page by title or description, use [/search-index.json](${SITE}/search-index.json).

## Guides on agents

- [Agent-Ready API Checklist](${SITE}/guides/agent-ready-checklist.md)
- [Tool definitions](${SITE}/guides/tool-definitions.md)
- [MCP servers](${SITE}/guides/mcp-servers.md)
- [Making API documentation readable by agents](${SITE}/guides/agent-readable-documentation.md)

## Problem types

Each line gives the HTTP status, then when to use the type.

${directory(errors)}
`;

  return new Response(txt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
};
