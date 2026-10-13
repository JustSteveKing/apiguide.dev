/**
 * The public path of the page being rendered.
 *
 * The build uses `format: 'file'`, so during a build `Astro.url.pathname` is
 * the emitted file, `/errors/account-frozen.html` or `/index.html`, not the
 * URL a reader sees. Anything that prints or compares the page's own URL
 * (canonical, Open Graph, JSON-LD, the active nav item) goes through here.
 */
export function pagePath(url: URL): string {
  const path = url.pathname
    .replace(/\.html$/, '')
    .replace(/\/index$/, '/')
    .replace(/(.)\/$/, '$1');
  return path || '/';
}

export function pageURL(url: URL, site: URL | undefined): URL {
  return new URL(pagePath(url), site ?? 'https://apiguide.dev');
}
