import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const manifest = {
    name: "apiguide.dev",
    short_name: "API Guide",
    description: "The flagship reference site for modern, authoritative API design patterns.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF6F0", // paper-50
    theme_color: "#1F3F8E", // chartres-500
    icons: [
      {
        src: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png"
      },
      {
        src: "/favicon-192x192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png"
      },
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      }
    ]
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate'
    }
  });
};
