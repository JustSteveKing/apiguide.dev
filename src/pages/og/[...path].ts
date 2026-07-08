import { getCollection } from 'astro:content';
import sharp from 'sharp';

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
      props: { title: 'apiguide.dev', subtitle: 'Authoritative HTTP & API Reference Catalog.', category: 'Home' }
    },
    {
      params: { path: 'problem-json.png' },
      props: { title: 'Problem+JSON (RFC 9457)', subtitle: 'The standard error response payload format for web APIs.', category: 'Guide' }
    },
    ...errors.map(e => ({
      params: { path: `errors/${e.id}.png` },
      props: { title: e.data.title, subtitle: `HTTP ${e.data.statusCode} — Category: ${e.data.category}. Standard error response pattern details.`, category: 'API Error' }
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
  const escapeXml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const escapedTitle = escapeXml(title);
  const escapedSubtitle = escapeXml(subtitle);
  const escapedCategory = escapeXml(category.toUpperCase());

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
        <!-- Inline Styling -->
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@800&amp;family=Inter:wght@400;500;600&amp;display=swap');
          .wordmark { font-family: 'Outfit', 'Inter', sans-serif; font-weight: 800; font-size: 28px; fill: #FDFDFC; }
          .tagline { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 20px; fill: #837A67; }
        </style>
      </defs>

      <!-- Canvas background -->
      <rect width="1200" height="630" fill="url(#bgGrad)" />
      
      <!-- Glow layers -->
      <circle cx="200" cy="150" r="500" fill="url(#glow1)" />
      <circle cx="1000" cy="480" r="400" fill="url(#glow2)" />

      <!-- Framing border grids to visually establish bleed guidelines -->
      <line x1="100" y1="80" x2="1100" y2="80" stroke="#DDDAD5" stroke-opacity="0.1" stroke-width="2" />
      <line x1="100" y1="550" x2="1100" y2="550" stroke="#DDDAD5" stroke-opacity="0.1" stroke-width="2" />

      <!-- Content wrapper within safe bleed boundaries -->
      <foreignObject x="100" y="130" width="1000" height="360">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: 'Inter', system-ui, sans-serif; line-height: 1.4; color: #FDFDFC;">
          <!-- Category label -->
          <div style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 18px; color: #7392DD; letter-spacing: 4px; margin-bottom: 24px; text-transform: uppercase;">
            ${escapedCategory}
          </div>
          <!-- Title block -->
          <h1 style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 58px; line-height: 1.15; color: #FDFDFC; margin: 0 0 20px 0; max-height: 140px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
            ${escapedTitle}
          </h1>
          <!-- Subtitle description block -->
          <p style="font-size: 25px; font-weight: 400; line-height: 1.5; color: #C0BAAF; margin: 0; max-height: 115px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">
            ${escapedSubtitle}
          </p>
        </div>
      </foreignObject>

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
        <text x="48" y="27" class="wordmark">api<tspan fill="#7392DD">guide</tspan><tspan fill="#C0BAAF" font-weight="400">.dev</tspan></text>
        <text x="1000" y="27" text-anchor="end" class="tagline">The Flagship Web API Reference</text>
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
