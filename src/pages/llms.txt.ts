import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const errors = await getCollection('errors');
  const statusCodes = await getCollection('statusCodes');
  const headers = await getCollection('headers');
  const methods = await getCollection('methods');
  const guides = await getCollection('guides');
  const specs = await getCollection('specifications');
  const tools = await getCollection('tools');

  // Sort alphabetically or numerically
  errors.sort((a, b) => a.data.title.localeCompare(b.data.title));
  statusCodes.sort((a, b) => a.data.code - b.data.code);
  headers.sort((a, b) => a.data.name.localeCompare(b.data.name));
  methods.sort((a, b) => a.data.name.localeCompare(b.data.name));
  guides.sort((a, b) => a.data.title.localeCompare(b.data.title));
  specs.sort((a, b) => a.data.title.localeCompare(b.data.title));
  tools.sort((a, b) => a.data.name.localeCompare(b.data.name));

  let txt = `# apiguide.dev\n\n`;
  txt += `> The flagship reference site for modern, authoritative API design patterns, Problem+JSON error schemas, and integration guides.\n\n`;

  txt += `## Core Sections\n\n`;
  txt += `- [Errors](/errors/): Detailed documentation of common HTTP API error patterns.\n`;
  txt += `- [Status Codes](/status-codes/): Comprehensive catalog of HTTP response status codes with schemas and examples.\n`;
  txt += `- [Headers](/headers/): Reference guide for HTTP request and response headers.\n`;
  txt += `- [Methods](/methods/): Explanation of HTTP request methods, semantics, and safety properties.\n`;
  txt += `- [Developer Guides](/guides/): Best practices on Pagination, Versioning, Idempotency, Webhooks, Caching, and Error Handling.\n`;
  txt += `- [Specifications](/specifications/): Deep dives into OpenAPI, AsyncAPI, JSON Schema, JSON:API, and gRPC.\n`;
  txt += `- [Tooling](/tools/): Reviews and comparisons of gateway, debugging, testing, and observability API tools.\n\n`;

  txt += `## Reference Directory\n\n`;

  txt += `### API Errors\n`;
  for (const e of errors) {
    txt += `- [${e.data.title}](/errors/${e.id}/): HTTP ${e.data.statusCode} — ${e.data.statusText}\n`;
  }
  txt += `\n`;

  txt += `### HTTP Status Codes\n`;
  for (const sc of statusCodes) {
    txt += `- [${sc.data.code} ${sc.data.title}](/status-codes/${sc.data.code}/): ${sc.data.description}\n`;
  }
  txt += `\n`;

  txt += `### HTTP Headers\n`;
  for (const h of headers) {
    txt += `- [${h.data.name}](/headers/${h.id}/): ${h.data.description}\n`;
  }
  txt += `\n`;

  txt += `### Request Methods\n`;
  for (const m of methods) {
    txt += `- [${m.data.name}](/methods/${m.id}/): ${m.data.description}\n`;
  }
  txt += `\n`;

  txt += `### Developer Guides\n`;
  for (const g of guides) {
    txt += `- [${g.data.title}](/guides/${g.id}/): ${g.data.description}\n`;
  }
  txt += `\n`;

  txt += `### Specifications\n`;
  for (const s of specs) {
    txt += `- [${s.data.title}](/specifications/${s.id}/): ${s.data.description}\n`;
  }
  txt += `\n`;

  txt += `### API Tooling\n`;
  for (const t of tools) {
    txt += `- [${t.data.name}](/tools/${t.data.category}/${t.id}/): ${t.data.description}\n`;
  }

  return new Response(txt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate'
    }
  });
};
