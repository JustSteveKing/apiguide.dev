// @ts-check
// Expressive Code options live here rather than inline in astro.config.mjs:
// they contain functions, and the <Code> component (used by hand-written pages
// such as /problem-json) can only load options from this file.
import { defineEcConfig } from 'astro-expressive-code';

export default defineEcConfig({
    // Dark first, as the site is. Themes follow the data-theme attribute the
    // header toggle and the inline script in Layout.astro set, not the OS
    // preference, so code blocks always match the page around them.
    themes: ['github-dark', 'github-light'],
    useDarkModeMediaQuery: false,
    themeCssSelector: (theme) => `[data-theme='${theme.type}']`,
    styleOverrides: {
        borderRadius: '0.75rem',
        // The site's mono, so code blocks match the wire lines and inline code.
        codeFontFamily: "'Fira Code Variable', 'Fira Code', ui-monospace, SFMono-Regular, monospace",
        borderColor: 'color-mix(in oklab, var(--color-slate-950) 10%, transparent)',
        codeBackground: ({ theme }) => (theme.type === 'dark' ? 'var(--color-slate-100)' : theme.bg),
    },
});
