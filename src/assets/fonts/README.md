# OG card fonts

These are the Latin subsets of the site's two typefaces, used **only** at build time by
`src/pages/og/[...path].ts` to convert social-card text into SVG paths.

They are not served to browsers. The site itself now self-hosts its typefaces as variable
fonts, imported from `@fontsource-variable/*` in `src/layouts/Layout.astro`; it used to load
them from Google Fonts, which changed on 2026-09-24.

These static instances stay because the OG pipeline still needs them, and because fontkitten
cannot instance a variation out of a WOFF2. So the two paths deliberately use different
files for the same typefaces: variable fonts for browsers, static instances at build time.

## Why they exist

Social cards are rasterised with sharp, which renders SVG through librsvg. librsvg resolves
text through the build machine's own fontconfig and ignores `@font-face`, including embedded
`data:` URIs. Cards therefore used to render in whatever sans the build machine happened to
have, rather than in the site's typefaces. Converting the text to vector paths removes font
resolution from the pipeline entirely, so a card looks the same wherever it is built.

## Files

| File | Used for | Licence |
| --- | --- | --- |
| `lora-latin-700-normal.woff2` | Card title, matching the site's `--font-display` | OFL 1.1, see `Lora-OFL.txt` |
| `inter-latin-400-normal.woff2` | Card subtitle and the `.dev` in the wordmark | OFL 1.1, see `Inter-OFL.txt` |
| `inter-latin-600-normal.woff2` | Category label and footer tagline | OFL 1.1, see `Inter-OFL.txt` |
| `inter-latin-700-normal.woff2` | `apiguide` in the wordmark | OFL 1.1, see `Inter-OFL.txt` |

One file per weight rather than two variable fonts: fontkitten cannot instance a variation
out of a WOFF2 (`getVariation()` returns an object whose tables are undefined), so static
instances are the workable form. Roughly 93KB in total, and build-time only.

These are Latin subsets. `src/pages/og/[...path].ts` substitutes or drops any code point
they do not cover, so a title carrying something exotic degrades rather than rendering
`.notdef` boxes.

## Updating

Static per-weight subsets come from the Fontsource mirror:

```
curl -L -o lora-latin-700-normal.woff2 \
  https://cdn.jsdelivr.net/npm/@fontsource/lora/files/lora-latin-700-normal.woff2
```

Google's own CDN now serves a variable file for every weight of both families, which is why
it is not the source here.
