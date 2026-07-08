// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import expressiveCode from "astro-expressive-code";

// https://astro.build/config
export default defineConfig({
    integrations: [
        expressiveCode({
            themes: ['github-light']
        }), 
        sitemap()
    ],
    
    site: "https://apiguide.dev",

    vite: {
        plugins: [tailwindcss()]
    }
});
