// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import expressiveCode from "astro-expressive-code";

// https://astro.build/config
export default defineConfig({
    integrations: [
        expressiveCode({
            // Dark first, as the site is. Themes follow the data-theme attribute
            // the header toggle sets, not the OS preference, so code blocks
            // always match the page around them.
            themes: ['github-dark', 'github-light'],
            useDarkModeMediaQuery: false,
            themeCssSelector: (theme) => `[data-theme='${theme.type}']`,
            styleOverrides: {
                borderRadius: '0.75rem',
                borderColor: 'color-mix(in oklab, var(--color-slate-950) 10%, transparent)',
                codeBackground: ({ theme }) => (theme.type === 'dark' ? 'var(--color-slate-100)' : theme.bg),
            },
        }),
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
