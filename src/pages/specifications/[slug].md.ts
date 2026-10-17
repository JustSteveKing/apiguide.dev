// The Markdown sibling of each page: see src/utils/markdown.ts.
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { toMarkdown, markdownResponse, type ReferenceEntry } from '@/utils/markdown';

export const getStaticPaths = (async () =>
  (await getCollection('specifications')).map((entry) => ({ params: { slug: entry.id }, props: { entry } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => markdownResponse(toMarkdown(props.entry as ReferenceEntry));
