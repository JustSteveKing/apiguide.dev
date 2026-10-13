// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import expressiveCode from "astro-expressive-code";

// https://astro.build/config
export default defineConfig({
    integrations: [
        // Options are in ec.config.mjs.
        expressiveCode(),
        sitemap()
    ],
    
    site: "https://apiguide.dev",

    // One URL per page, without a trailing slash. Emitting /errors/x.html rather
    // than /errors/x/index.html lets Cloudflare Pages serve /errors/x directly;
    // the directory form 307s it to /errors/x/, which put a redirect in front of
    // every internal link and every RFC 9457 `type` URI pointing at this site.
    trailingSlash: "never",
    build: { format: "file" },

    vite: {
        plugins: [tailwindcss()]
    }
});
