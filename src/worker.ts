// Runs in front of /errors/* only (run_worker_first in wrangler.json); every
// other URL is served straight from static assets and never invokes this.
//
// A problem type URI is the one URL on this site that software follows on its
// own, usually after receiving it in an error, so it answers in the format the
// caller asks for, and a miss is an RFC 9457 problem rather than an HTML page.

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

type Kind = 'html' | 'markdown' | 'json';

const KINDS: Record<string, Kind> = {
  'text/markdown': 'markdown',
  'application/json': 'json',
  'text/html': 'html',
  'application/xhtml+xml': 'html',
  'text/*': 'html',
  '*/*': 'html',
};

/**
 * The representation the Accept header prefers: highest q, then the order the
 * client listed them in, with wildcards last. A wildcard means HTML, so a
 * browser and a caller that states no preference both get the page.
 */
function negotiate(accept: string | null): Kind {
  const ranges = (accept ?? '')
    .split(',')
    .map((part, index) => {
      const [range, ...params] = part.split(';').map((s) => s.trim().toLowerCase());
      const q = params.find((p) => p.startsWith('q='));
      return { kind: KINDS[range], q: q ? Number(q.slice(2)) : 1, wild: range.includes('*'), index };
    })
    .filter((r) => r.kind && r.q > 0)
    .sort((a, b) => b.q - a.q || Number(a.wild) - Number(b.wild) || a.index - b.index);
  return ranges[0]?.kind ?? 'html';
}

function notFound(request: Request, pathname: string): Response {
  const body = JSON.stringify(
    {
      type: 'https://apiguide.dev/errors/resource-not-found',
      title: 'Resource Not Found',
      status: 404,
      detail: `There is no problem type at ${pathname}. The catalogue is at https://apiguide.dev/errors/index.json.`,
      instance: pathname,
    },
    null,
    2,
  );
  return new Response(request.method === 'HEAD' ? null : `${body}\n`, {
    status: 404,
    headers: {
      'Content-Type': 'application/problem+json',
      'Access-Control-Allow-Origin': '*',
      Vary: 'Accept',
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'GET' && request.method !== 'HEAD') return env.ASSETS.fetch(request);

    const url = new URL(request.url);
    const { pathname } = url;

    // /errors/<slug> is the only form that negotiates. Anything else, a sibling
    // such as forbidden.md or a trailing slash redirect, is served as it is.
    if (!/^\/errors\/[^/.]+$/.test(pathname)) {
      const response = await env.ASSETS.fetch(request);
      return response.status === 404 && /\.(md|json)$/.test(pathname) ? notFound(request, pathname) : response;
    }

    const kind = negotiate(request.headers.get('Accept'));
    if (kind !== 'html') {
      // No address or token: which formats get asked for, and by what.
      console.log(JSON.stringify({ negotiated: kind, path: pathname, ua: request.headers.get('User-Agent') }));
    }

    const sibling = kind === 'markdown' ? `${pathname}.md` : kind === 'json' ? `${pathname}.json` : pathname;
    const asset = await env.ASSETS.fetch(new Request(new URL(sibling, url), request));
    if (asset.status === 404 && kind !== 'html') return notFound(request, pathname);

    const response = new Response(asset.body, asset);
    response.headers.append('Vary', 'Accept');
    if (kind !== 'html') response.headers.set('Content-Location', sibling);
    else if (asset.ok) {
      response.headers.set(
        'Link',
        `<${pathname}.md>; rel="alternate"; type="text/markdown", <${pathname}.json>; rel="alternate"; type="application/json"`,
      );
    }
    return response;
  },
};
