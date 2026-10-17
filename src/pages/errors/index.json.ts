// The whole errors catalogue as one JSON document: see src/utils/problemType.ts.
//
// `catalogue` validates against catalogue.schema.json and each item of `types`
// against problem-type.schema.json. Types IANA has registered are listed in
// `registered`, slug to registry URI, because the problem type schema has no
// member for it: send the registered URI, not BASE_URL + slug, for those.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { BASE_URL, CATALOGUE_SCHEMA, PROBLEM_TYPE_SCHEMA, toProblemType, jsonResponse } from '@/utils/problemType';

export const GET: APIRoute = async () => {
  const errors = (await getCollection('errors')).sort((a, b) => a.id.localeCompare(b.id));
  const registered = Object.fromEntries(
    errors.filter((e) => e.data.registeredType).map((e) => [e.id, e.data.registeredType as string]),
  );
  return jsonResponse({
    schemas: { catalogue: CATALOGUE_SCHEMA, type: PROBLEM_TYPE_SCHEMA },
    catalogue: { schema: 'v1', base_url: BASE_URL },
    registered,
    types: errors.map(toProblemType),
  });
};
