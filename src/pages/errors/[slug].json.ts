// Each problem type as JSON: see src/utils/problemType.ts.
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { toProblemType, jsonResponse } from '@/utils/problemType';

export const getStaticPaths = (async () =>
  (await getCollection('errors')).map((entry) => ({ params: { slug: entry.id }, props: { entry } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => jsonResponse(toProblemType(props.entry as CollectionEntry<'errors'>));
