import { getCollection } from 'astro:content';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { create } from 'fontkitten';

// sharp rasterises SVG through librsvg, which resolves text against the build machine's
// own fontconfig and ignores @font-face (embedded data: URIs included). Text is therefore
// converted to vector paths here, so a card renders identically wherever it is built.
// See src/assets/fonts/README.md.
// Resolved from the project root rather than import.meta.url: this module is bundled into
// dist/.prerender/ before it runs, so a path relative to the source file no longer exists.
const fontFile = (name: string) =>
  fs.readFileSync(path.join(process.cwd(), 'src/assets/fonts', name));

// Static instances rather than variable files: fontkitten cannot instance a variation
// out of a WOFF2, so each weight is its own file.
const faces = {
  display: create(fontFile('lora-latin-700-normal.woff2')) as any,
  body: create(fontFile('inter-latin-400-normal.woff2')) as any,
  bodyBold: create(fontFile('inter-latin-600-normal.woff2')) as any,
  wordmark: create(fontFile('inter-latin-700-normal.woff2')) as any,
};

type Face = typeof faces.display;

// These are Latin subsets, so a title carrying something outside their coverage would
// otherwise render as .notdef boxes. Substitute what has an obvious ASCII equivalent and
// drop the rest, rather than shipping a card full of tofu.
const SUBSTITUTIONS: Record<string, string> = {
  '\u2192': '->',
  '\u2190': '<-',
  '\u00d7': 'x',
  '\u2122': 'TM',
};

const supported = (face: Face, text: string): string =>
  [...text]
    .map(char =>
      face.hasGlyphForCodePoint(char.codePointAt(0)!) ? char : (SUBSTITUTIONS[char] ?? '')
    )
    .join('');

/** Advance width of a string at a given size, including any letter tracking. */
const measure = (face: Face, text: string, size: number, tracking = 0): number => {
  const scale = size / face.unitsPerEm;
  const safe = supported(face, text);
  let width = 0;
  for (const glyph of face.glyphsForString(safe)) width += glyph.advanceWidth * scale + tracking;
  return width - (safe.length ? tracking : 0);
};

/** SVG path data for a string, with its baseline origin at (x, y). */
const textPath = (face: Face, text: string, size: number, x: number, y: number, tracking = 0): string => {
  const scale = size / face.unitsPerEm;
  const parts: string[] = [];
  let cursor = x;

  for (const glyph of face.glyphsForString(supported(face, text))) {
    // Glyph outlines are y-up; SVG is y-down, hence the negative vertical scale.
    const d = glyph.path.scale(scale, -scale).translate(cursor, y).toSVG();
    if (d) parts.push(d);
    cursor += glyph.advanceWidth * scale + tracking;
  }

  return parts.join(' ');
};

export async function getStaticPaths() {
  const errors = await getCollection('errors');
  const statusCodes = await getCollection('statusCodes');
  const headers = await getCollection('headers');
  const methods = await getCollection('methods');
  const guides = await getCollection('guides');
  const specs = await getCollection('specifications');
  const tools = await getCollection('tools');

  const paths = [
    {
      params: { path: 'index.png' },
      props: { title: 'Authoritative design patterns for developer-friendly APIs', subtitle: 'HTTP status codes, headers, request methods and Problem+JSON error schemas.', category: 'Reference' }
    },
    {
      params: { path: 'problem-json.png' },
      props: { title: 'Problem+JSON (RFC 9457)', subtitle: 'The standard error response payload format for web APIs.', category: 'Guide' }
    },
    // Collection Index Pages
    {
      params: { path: 'errors.png' },
      props: { title: 'API Errors Reference', subtitle: 'A catalog of common HTTP API error patterns, Problem+JSON schemas, and design guidelines.', category: 'Index' }
    },
    {
      params: { path: 'status-codes.png' },
      props: { title: 'HTTP Status Codes', subtitle: 'A reference index of standard HTTP status codes, their semantics, and best practices.', category: 'Index' }
    },
    {
      params: { path: 'headers.png' },
      props: { title: 'HTTP Headers Reference', subtitle: 'A directory of request and response HTTP headers, standard usage, and code examples.', category: 'Index' }
    },
    {
      params: { path: 'methods.png' },
      props: { title: 'HTTP Request Methods', subtitle: 'An overview of HTTP methods, safety, idempotency, caching rules, and use cases.', category: 'Index' }
    },
    {
      params: { path: 'guides.png' },
      props: { title: 'Developer Guides', subtitle: 'Authoritative design guides on pagination, versioning, idempotency, caching, and webhooks.', category: 'Index' }
    },
    {
      params: { path: 'specifications.png' },
      props: { title: 'API Specifications', subtitle: 'Guides and references for OpenAPI, AsyncAPI, JSON Schema, JSON:API, and gRPC.', category: 'Index' }
    },
    {
      params: { path: 'tools.png' },
      props: { title: 'API Developer Tooling', subtitle: 'A catalog and review of API gateways, debugging proxies, testing frameworks, and observability suites.', category: 'Index' }
    },
    // Tool Category Index Pages
    {
      params: { path: 'tools/observability.png' },
      props: { title: 'Observability & Monitoring Tools', subtitle: 'Reviews of API monitoring, alerting, telemetry, and tracking tools.', category: 'Tool Category' }
    },
    {
      params: { path: 'tools/design-documentation.png' },
      props: { title: 'Design & Documentation Tools', subtitle: 'Reviews of editors, schema checkers, doc generators, and design suites.', category: 'Tool Category' }
    },
    {
      params: { path: 'tools/testing-mocking.png' },
      props: { title: 'Testing & Mocking Tools', subtitle: 'Reviews of load testers, API test runners, and mock servers.', category: 'Tool Category' }
    },
    {
      params: { path: 'tools/gateways-management.png' },
      props: { title: 'API Gateways & Management', subtitle: 'Reviews of reverse proxies, rate limiters, security gateways, and management tools.', category: 'Tool Category' }
    },
    {
      params: { path: 'tools/clients-debugging.png' },
      props: { title: 'API Clients & Debugging', subtitle: 'Reviews of HTTP desktop clients, CLI tools, and debugging proxies.', category: 'Tool Category' }
    },
    ...errors.map(e => ({
      params: { path: `errors/${e.id}.png` },
      props: { title: e.data.title, subtitle: `HTTP ${e.data.statusCode}, category ${e.data.category}. Standard error response pattern details.`, category: 'API Error' }
    })),
    ...statusCodes.map(sc => ({
      params: { path: `status-codes/${sc.data.code}.png` },
      props: { title: `${sc.data.code} ${sc.data.title}`, subtitle: sc.data.description, category: 'Status Code' }
    })),
    ...headers.map(h => ({
      params: { path: `headers/${h.id}.png` },
      props: { title: h.data.name, subtitle: h.data.description, category: 'HTTP Header' }
    })),
    ...methods.map(m => ({
      params: { path: `methods/${m.id}.png` },
      props: { title: m.data.name, subtitle: m.data.description, category: 'Request Method' }
    })),
    ...guides.map(g => ({
      params: { path: `guides/${g.id}.png` },
      props: { title: g.data.title, subtitle: g.data.description, category: 'Developer Guide' }
    })),
    ...specs.map(s => ({
      params: { path: `specifications/${s.id}.png` },
      props: { title: s.data.title, subtitle: `v${s.data.currentVersion} Standard Specification: ${s.data.description}`, category: 'API Spec' }
    })),
    ...tools.map(t => ({
      params: { path: `tools/${t.data.category}/${t.id}.png` },
      props: { title: t.data.name, subtitle: t.data.description, category: 'API Tool' }
    }))
  ];

  return paths;
}

export async function GET({ props }: { props: { title: string; subtitle: string; category: string } }) {
  const { title, subtitle, category } = props;

  // Escape text fields to prevent malformed SVG XML tag parsing errors

  // Wrapping by measured width rather than character count, now that the exact
  // advances are available: a proportional face makes character counts a poor proxy.
  const wrapText = (face: Face, text: string, size: number, maxWidth: number): string[] => {
    const lines: string[] = [];
    let currentLine = '';

    for (const word of text.split(' ')) {
      const candidate = (currentLine + ' ' + word).trim();
      if (!currentLine || measure(face, candidate, size) <= maxWidth) {
        currentLine = candidate;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  // The text block is top-anchored at a fixed y, so line counts have to be capped or a
  // long title walks down into the footer row. Three title lines plus two subtitle lines
  // is the most that fits above it.
  const clamp = (lines: string[], max: number): string[] => {
    if (lines.length <= max) return lines;
    const kept = lines.slice(0, max);
    kept[max - 1] = kept[max - 1].replace(/[\s,.:;-]+$/, '') + '\u2026';
    return kept;
  };

  const titleSize = 56;
  const subtitleSize = 24;

  const titleLines = clamp(wrapText(faces.display, title, titleSize, 1000), 3);
  const subtitleLines = clamp(wrapText(faces.body, subtitle, subtitleSize, 900), 2);

  // Layout positions
  const titleStartY = 230;
  const titleLineHeight = 65;
  const titleEndY = titleStartY + (titleLines.length - 1) * titleLineHeight;

  const subtitleStartY = titleEndY + 65;
  const subtitleLineHeight = 36;

  // Render a 1200x630 vector SVG inside a safe 100px bleed boundary
  const svg = `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Background Gradient -->
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#162750" /> <!-- chartres-900 -->
          <stop offset="50%" stop-color="#0F1933" /> <!-- chartres-950 -->
          <stop offset="100%" stop-color="#131D30" /> <!-- yinmn-950 -->
        </linearGradient>
        <!-- Accent Glows -->
        <radialGradient id="glow1" cx="20%" cy="30%" r="50%">
          <stop offset="0%" stop-color="#1F3F8E" stop-opacity="0.65" />
          <stop offset="100%" stop-color="#1F3F8E" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="glow2" cx="80%" cy="70%" r="40%">
          <stop offset="0%" stop-color="#2E5090" stop-opacity="0.45" />
          <stop offset="100%" stop-color="#2E5090" stop-opacity="0" />
        </radialGradient>
        <!-- Logo Gradient -->
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#2852B8" /> <!-- chartres-600 -->
          <stop offset="100%" stop-color="#162750" /> <!-- chartres-900 -->
        </linearGradient>

      </defs>

      <!-- Canvas background -->
      <rect width="1200" height="630" fill="url(#bgGrad)" />
      
      <!-- Glow layers -->
      <circle cx="200" cy="150" r="500" fill="url(#glow1)" />
      <circle cx="1000" cy="480" r="400" fill="url(#glow2)" />

      <!-- Framing border grids to visually establish bleed guidelines -->
      <line x1="100" y1="80" x2="1100" y2="80" stroke="#D6C8AF" stroke-opacity="0.1" stroke-width="2" />
      <line x1="100" y1="550" x2="1100" y2="550" stroke="#D6C8AF" stroke-opacity="0.1" stroke-width="2" />

      <!-- Category label -->
      <path fill="#7392DD" d="${textPath(faces.bodyBold, category.toUpperCase(), 18, 100, 150, 4)}" />

      <!-- Title block -->
      <path fill="#FAF6F0" d="${titleLines
        .map((line, idx) => textPath(faces.display, line, titleSize, 100, titleStartY + idx * titleLineHeight))
        .join(' ')}" />

      <!-- Subtitle description block -->
      <path fill="#D6C8AF" d="${subtitleLines
        .map((line, idx) => textPath(faces.body, line, subtitleSize, 100, subtitleStartY + idx * subtitleLineHeight))
        .join(' ')}" />

      <!-- Footer elements aligned with safe bleed -->
      <g transform="translate(100, 484)">
        <!-- Logo Icon Container (36x36 squircle) -->
        <g transform="translate(0, 0)">
          <rect width="36" height="36" rx="8" fill="url(#logoGrad)" />
          <!-- Lightning Bolt Path (scaled to fit 36x36 box) -->
          <svg viewBox="0 0 24 24" x="6" y="6" width="24" height="24">
            <path 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="0.75"
              stroke="#FAF6F0"
              fill="#FAF6F0"
              d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
            />
          </svg>
        </g>
        
        <!-- Wordmark text with inline gradient colors matching the site's logo -->
        ${(() => {
          // Three-tone wordmark, laid out by advancing through each run in turn.
          const size = 28;
          const apiX = 48;
          const guideX = apiX + measure(faces.wordmark, 'api', size);
          const devX = guideX + measure(faces.wordmark, 'guide', size);

          return [
            `<path fill="#FAF6F0" d="${textPath(faces.wordmark, 'api', size, apiX, 27)}" />`,
            `<path fill="#7392DD" d="${textPath(faces.wordmark, 'guide', size, guideX, 27)}" />`,
            `<path fill="#BBA98D" d="${textPath(faces.body, '.dev', size, devX, 27)}" />`,
          ].join('');
        })()}
        ${(() => {
          // Right-aligned against the same bleed line the framing rules use.
          const tagline = 'The Flagship Web API Reference';
          const size = 20;
          const x = 1000 - measure(faces.bodyBold, tagline, size);
          return `<path fill="#BBA98D" d="${textPath(faces.bodyBold, tagline, size, x, 27)}" />`;
        })()}
      </g>
    </svg>
  `;

  // Convert SVG string to high-quality PNG buffer using sharp
  const pngBuffer = await sharp(Buffer.from(svg))
    .png()
    .toBuffer();

  return new Response(pngBuffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
}
