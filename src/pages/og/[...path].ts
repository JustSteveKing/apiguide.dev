import { getCollection } from 'astro:content';
import { toolCategories, toolCategoryThemes } from '@/config/themes';
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
  display: create(fontFile('inter-latin-700-normal.woff2')) as any,
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

// Left rule colour per status category: the 500 step of each hue, as on the
// pages (src/config/themes.ts, `marker`). Everything else gets Paper 400.
const statusMarker: Record<string, string> = {
  'informational': '#5A7CBF', // yinmn-500
  'success': '#50C878', // emerald-500
  'redirection': '#4D72CB', // chartres-500
  'client-error': '#E8BD3C', // ochre-500
  'server-error': '#D7350F', // uranium-500
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
      props: { title: 'Look up any part of an HTTP API', subtitle: 'Status codes, headers, methods and RFC 9457 problem types, each on its own page.', category: 'Reference' }
    },
    {
      params: { path: 'problem-json.png' },
      props: { title: 'Problem+JSON', subtitle: 'Content-Type: application/problem+json. How RFC 9457 problem responses work.', category: 'Guide' }
    },
    // Collection Index Pages
    {
      params: { path: 'errors.png' },
      props: { title: 'Errors', subtitle: 'Problem types to use as the type of an RFC 9457 response.', category: 'Index' }
    },
    {
      params: { path: 'status-codes.png' },
      props: { title: 'Status codes', subtitle: 'When to send each code, and which one to send instead.', category: 'Index' }
    },
    {
      params: { path: 'headers.png' },
      props: { title: 'Headers', subtitle: 'Request and response headers, with an example line for each.', category: 'Index' }
    },
    {
      params: { path: 'methods.png' },
      props: { title: 'Methods', subtitle: 'Whether each HTTP method is safe, idempotent and cacheable.', category: 'Index' }
    },
    {
      params: { path: 'guides.png' },
      props: { title: 'Guides', subtitle: 'Long-form guides to designing HTTP APIs, from the shape of a resource to what a model makes of it.', category: 'Index' }
    },
    {
      params: { path: 'specifications.png' },
      props: { title: 'Specifications', subtitle: 'OpenAPI, AsyncAPI, JSON Schema and the other formats that describe an API.', category: 'Index' }
    },
    {
      params: { path: 'tools.png' },
      props: { title: 'Tools', subtitle: 'Tools for designing, testing, running and watching HTTP APIs.', category: 'Index' }
    },
    // Tool category index pages, from the same blurbs the pages use.
    ...toolCategories.map(id => ({
      params: { path: `tools/${id}.png` },
      props: { title: toolCategoryThemes[id].label, subtitle: toolCategoryThemes[id].blurb, category: 'Tools' }
    })),
    ...errors.map(e => ({
      params: { path: `errors/${e.id}.png` },
      props: { title: e.data.title, subtitle: `${e.data.statusCode} ${e.data.statusText}. type: https://apiguide.dev/errors/${e.id}`, category: 'Problem type', marker: statusMarker[e.data.category] }
    })),
    ...statusCodes.map(sc => ({
      params: { path: `status-codes/${sc.data.code}.png` },
      props: { title: `${sc.data.code} ${sc.data.title}`, subtitle: sc.data.description, category: 'Status code', marker: statusMarker[sc.data.category] }
    })),
    ...headers.map(h => ({
      params: { path: `headers/${h.id}.png` },
      props: { title: h.data.name, subtitle: h.data.description, category: 'Header' }
    })),
    ...methods.map(m => ({
      params: { path: `methods/${m.id}.png` },
      props: { title: m.data.name, subtitle: m.data.description, category: 'Method' }
    })),
    ...guides.map(g => ({
      params: { path: `guides/${g.id}.png` },
      props: { title: g.data.title, subtitle: g.data.description, category: 'Guide' }
    })),
    ...specs.map(s => ({
      params: { path: `specifications/${s.id}.png` },
      props: { title: s.data.title, subtitle: `Current version ${s.data.currentVersion}. ${s.data.description}`, category: 'Specification' }
    })),
    ...tools.map(t => ({
      params: { path: `tools/${t.data.category}/${t.id}.png` },
      props: { title: t.data.name, subtitle: t.data.description, category: 'Tool' }
    }))
  ];

  return paths;
}

export async function GET({ props }: { props: { title: string; subtitle: string; category: string; marker?: string } }) {
  const { title, subtitle, category, marker = '#BBA98D' } = props;

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

  const titleLines = clamp(wrapText(faces.display, title, titleSize, 968), 3);
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
        <!-- Logo gradient, chartres-500 to chartres-700 as on the site -->
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4D72CB" />
          <stop offset="100%" stop-color="#1F3F8E" />
        </linearGradient>
      </defs>

      <!-- Paper 50, the site's page colour -->
      <rect width="1200" height="630" fill="#FAF6F0" />

      <!-- Category rule, as beside the wire line on each page -->
      <rect x="100" y="126" width="8" height="${titleEndY - 126 + 18}" fill="${marker}" />

      <!-- Category label -->
      <path fill="#665842" d="${textPath(faces.bodyBold, category, 22, 132, 150)}" />

      <!-- Title block -->
      <path fill="#1F1A12" d="${titleLines
        .map((line, idx) => textPath(faces.display, line, titleSize, 132, titleStartY + idx * titleLineHeight))
        .join(' ')}" />

      <!-- Subtitle description block -->
      <path fill="#665842" d="${subtitleLines
        .map((line, idx) => textPath(faces.body, line, subtitleSize, 132, subtitleStartY + idx * subtitleLineHeight))
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
            `<path fill="#31291D" d="${textPath(faces.wordmark, 'api', size, apiX, 27)}" />`,
            `<path fill="#2852B8" d="${textPath(faces.wordmark, 'guide', size, guideX, 27)}" />`,
            `<path fill="#71624A" d="${textPath(faces.body, '.dev', size, devX, 27)}" />`,
          ].join('');
        })()}
        ${(() => {
          // Right-aligned against the 100px bleed.
          const tagline = 'HTTP API reference';
          const size = 20;
          const x = 1000 - measure(faces.bodyBold, tagline, size);
          return `<path fill="#665842" d="${textPath(faces.bodyBold, tagline, size, x, 27)}" />`;
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
