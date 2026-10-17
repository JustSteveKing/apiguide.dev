// The Markdown sibling of each page: see src/utils/markdown.ts.
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { toMarkdown, markdownResponse, type ReferenceEntry } from '@/utils/markdown';

export const getStaticPaths = (async () =>
  (await getCollection('statusCodes')).map((entry) => ({ params: { code: String(entry.data.code) }, props: { entry } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => markdownResponse(toMarkdown(props.entry as ReferenceEntry));
