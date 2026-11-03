// One section of /llms-full.txt, because the whole file is too big for most
// agents to fetch in one go.
import type { APIRoute, GetStaticPaths } from 'astro';
import { SECTIONS, allEntries, inSection, toMarkdown, type Section } from '@/utils/markdown';

export const getStaticPaths = (() =>
  SECTIONS.map((section) => ({ params: { section: section.slug }, props: { section } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const section = props.section as Section;
  const pages = inSection(await allEntries(), section);
  const intro = [
    `# apiguide.dev: ${section.title}, full text`,
    '',
    `> ${section.about}`,
    '',
    `${pages.length} pages follow. The index is https://apiguide.dev/${section.slug}.md, and each page is also available alone by appending .md to its URL. Content is CC BY-SA 4.0.`,
    '',
  ].join('\n');
  return new Response(`${intro}\n---\n\n${pages.map(toMarkdown).join('\n---\n\n')}`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
