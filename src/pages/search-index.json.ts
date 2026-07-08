import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export async function GET() {
  const errors: CollectionEntry<'errors'>[] = await getCollection('errors');
  const statusCodes: CollectionEntry<'statusCodes'>[] = await getCollection('statusCodes');
  const headers: CollectionEntry<'headers'>[] = await getCollection('headers');
  const methods: CollectionEntry<'methods'>[] = await getCollection('methods');
  const guides: CollectionEntry<'guides'>[] = await getCollection('guides');
  const specs: CollectionEntry<'specifications'>[] = await getCollection('specifications');
  const tools: CollectionEntry<'tools'>[] = await getCollection('tools');

  const items = [
    ...errors.map(e => ({
      title: `${e.data.statusCode} ${e.data.title}`,
      description: e.data.statusText,
      url: `/errors/${e.id}/`,
      type: 'Error Schema'
    })),
    ...statusCodes.map(sc => ({
      title: `${sc.data.code} ${sc.data.title}`,
      description: sc.data.description,
      url: `/status-codes/${sc.data.code}/`,
      type: 'Status Code'
    })),
    ...headers.map(h => ({
      title: h.data.name,
      description: h.data.description,
      url: `/headers/${h.id}/`,
      type: 'HTTP Header'
    })),
    ...methods.map(m => ({
      title: m.data.name,
      description: m.data.description,
      url: `/methods/${m.id}/`,
      type: 'Request Verb'
    })),
    ...guides.map(g => ({
      title: g.data.title,
      description: g.data.description,
      url: `/guides/${g.id}/`,
      type: 'Developer Guide'
    })),
    ...specs.map(s => ({
      title: s.data.title,
      description: s.data.description,
      url: `/specifications/${s.id}/`,
      type: 'API Spec'
    })),
    ...tools.map(t => ({
      title: t.data.name,
      description: t.data.description,
      url: `/tools/${t.data.category}/${t.id}/`,
      type: 'API Tool'
    }))
  ];

  return new Response(JSON.stringify(items), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
