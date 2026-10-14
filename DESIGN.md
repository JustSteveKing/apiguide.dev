# DESIGN.md

Design reference for apiguide.dev: the colour palette, how it is applied, and
(further down) the typography and page structure.

## The palette

Replaced 2026-10-13. The site used to draw on Storied Colors pigments (Chartres
Blue, Yellow Ochre, Uranium Red, Emerald Green, YInMn Blue) over a warm cream
neutral called Paper. That read as warm and archival, close to the look many
generated sites share, and it was not what the site wanted to say.

The palette now is **Ultramarine field**: cool white and blue-grey slate
neutrals, and one saturated ultramarine used boldly as the brand. Status
classes each get their own hue, kept strong and flat.

| Role | Anchor |
| --- | --- |
| Page | `#F7F8FA` (slate-50) |
| Raised surface | `#ECEEF3` (slate-100) |
| Ink | `#111827` (slate-950) |
| Muted text | `#4B5563` (slate-600) |
| Brand | `#2B2FD9` (ultra-600) |
| Brand, deep | `#1A1D8F` (ultra-800) |
| 1xx | slate |
| 2xx | `#0B7A4B` (green-700) |
| 3xx | `#6D3FD1` (violet-600) |
| 4xx | `#B45309` (amber-700) |
| 5xx | `#C2261A` (red-600) |

Six families, each 50 (lightest) to 950 (darkest), defined once in
`src/styles/main.css`. Tailwind's default colours are switched off
(`--color-*: initial`), so a class naming any other colour fails rather than
inventing one.

### How the scales were built

Each ramp was generated in OKLCH so lightness falls evenly from 50 to 950 and
every family is monotonic. The anchors above are pinned exactly at their steps
and the steps between are interpolated through them. Two families are
adjusted by hand, for reasons worth keeping:

- **Amber shifts toward yellow as it lightens**, as real amber does. Held at
  one hue, its light steps went peach, which reads as terracotta.
- **Slate keeps the hue of its ink** (`#111827`) at every step, with low,
  even chroma, so dark surfaces stay blue-grey instead of drifting warm.

## The scales

### Slate (neutrals, 1xx)

| Step | Hex |
| --- | --- |
| 50 | #F7F8FA (anchor) |
| 100 | #ECEEF3 (anchor) |
| 200 | #D5DAE5 |
| 300 | #B9C0CF |
| 400 | #919AAC |
| 500 | #6D7688 |
| 600 | #4B5563 (anchor) |
| 700 | #3C4455 |
| 800 | #2E3545 |
| 900 | #1F2636 |
| 950 | #111827 (anchor) |

### Ultra (brand, links)

| Step | Hex |
| --- | --- |
| 50 | #F7F9FF |
| 100 | #E7EEFF |
| 200 | #CCD9FD |
| 300 | #A8BDFD |
| 400 | #7492FD |
| 500 | #465FFB |
| 600 | #2B2FD9 (anchor) |
| 700 | #26359C |
| 800 | #1A1D8F (anchor) |
| 900 | #1D2857 |
| 950 | #1C233A |

### Amber (4xx, client error)

| Step | Hex |
| --- | --- |
| 50 | #FDF9EE |
| 100 | #FAF1DE |
| 200 | #F6E2BB |
| 300 | #EECE97 |
| 400 | #E3AE65 |
| 500 | #D78D37 |
| 600 | #C66F0A |
| 700 | #B45309 (anchor) |
| 800 | #8A3F08 |
| 900 | #612D0C |
| 950 | #2F2119 |

### Red (5xx, server error, deprecation)

| Step | Hex |
| --- | --- |
| 50 | #FFF7F6 |
| 100 | #FFEAE7 |
| 200 | #FED3CC |
| 300 | #FEB3A6 |
| 400 | #FC7C6A |
| 500 | #E54D3C |
| 600 | #C2261A (anchor) |
| 700 | #A21F15 |
| 800 | #801D14 |
| 900 | #5C1E17 |
| 950 | #341E1B |

### Green (2xx, success, confirmation)

| Step | Hex |
| --- | --- |
| 50 | #F3FCF6 |
| 100 | #E6F6EB |
| 200 | #C9ECD6 |
| 300 | #AADDBE |
| 400 | #7DC59B |
| 500 | #54AC7C |
| 600 | #319261 |
| 700 | #0B7A4B (anchor) |
| 800 | #125F3B |
| 900 | #17442C |
| 950 | #1C2820 |

### Violet (3xx, secondary categories)

| Step | Hex |
| --- | --- |
| 50 | #F9F8FF |
| 100 | #EFEDFF |
| 200 | #DDD8FF |
| 300 | #C7BCFE |
| 400 | #A791FC |
| 500 | #8A62F5 |
| 600 | #6D3FD1 (anchor) |
| 700 | #5A37AC |
| 800 | #482E88 |
| 900 | #362861 |
| 950 | #252135 |

## Semantic usage rules

### Slate

Backgrounds, borders and text. slate-50 to 200 for backgrounds, 300 to 400 for
borders and dividers, 600 to 950 for text. **slate-600 is the floor for small
text**: 7.11:1 on slate-50 and 6.51:1 on slate-100. 400 and 500 are never text.

### Ultra

The brand. Links (ultra-600, 7.87:1 on slate-50), the active nav item, the logo,
the focus ring, and the glows. It is the default interactive colour.

### Status colours

Amber (4xx), red (5xx), green (2xx), violet (3xx) and slate (1xx) mean their
status class everywhere. Small text in any of them uses the 800 or 900 step;
badges are `bg-x-100 text-x-900 border-x-200`; the 500 step is for fills and
rules only (the `marker` beside a wire line).

**Amber, red and green are reserved for status.** A guide category, a tool
category or a price never uses them, because a badge in one of those reads as
a client error, a server error or a success wherever it appears. Red also marks
a deprecated error definition; green also confirms an action, such as a copy.
Categories draw on ultra, violet and slate in three treatments: solid
(`bg-x-100 text-x-900`), outline (`text-x-800 border-x-400`) and inverted
(`bg-x-700 text-x-50`). The live mapping is in `src/config/themes.ts`.

Navigation and index rows that do not represent a category use slate and ultra
only.

## Themes

Settled 2026-10-13, in the Linear-style pass. **Dark is the site's primary
look**: the one it is designed in first, and what a reader without JavaScript
gets. Which theme a reader sees follows their OS setting until they use the
toggle in the header; from then on their choice is stored in `localStorage`
and wins. An inline script in `Layout.astro` applies it before first paint,
again after each view transition (which replaces the `<html>` attributes), and
live when the OS setting changes, as long as no choice is stored.

The mechanism is one attribute: `data-theme="light"` on `<html>`. The light
values are the `@theme` scales; `:root:not([data-theme="light"])` redefines
them for dark. Code blocks follow the same attribute (`themeCssSelector` in
`astro.config.mjs`), not the OS.

Dark slate is its own scale, deeper than a mirror of the light one, so the
canvas is a true near-black:

| Step | Dark value |
| --- | --- |
| 50 | `#0A0C11` (canvas) |
| 100 | `#10131A` (surface) |
| 200 | `#181C25` |
| 300 | `#242A36` (borders) |
| 400 | `#363E4D` |
| 500 | `#6D7688` |
| 600 | `#98A1B3` (muted text) |
| 700 | `#B7BECB` |
| 800 | `#D7DBE4` (body text) |
| 900 | `#E9ECF2` |
| 950 | `#F7F8FA` (ink) |

The hue families are their light scales mirrored (50 with 950, 500 fixed), so
`bg-x-100 text-x-900` works in both. Measured on the dark canvas: body 14.1:1,
muted 7.53:1, links 6.77:1, every status hue above 6.7:1.

Anything that must differ by theme beyond tokens uses `.only-dark` /
`.only-light` (the sponsor wordmark does); never a `prefers-color-scheme` media
query, which would disagree with the toggle.

## Surfaces, depth and motion

The site's surfaces follow the Linear and Vercel vernacular, by request:

- **Hairlines, not solid borders**: `border-slate-950/[0.08]`, which is ink at
  8% in light mode and white at 8% in dark.
- **Glass**: `.surface` (a panel) and `.registry-card` (a linked card) share a
  faint top-lit gradient over a translucent surface. The header is frosted
  (`bg-slate-50/70 backdrop-blur-xl`); the mobile menu under it is opaque on
  purpose, because a translucent layer inside a blurred one let the page show
  through.
- **Glow**: ultramarine, used in three places only: the home hero (a beam from
  the top centre over a faint masked grid), the corner of each wire-line panel,
  and the hover shadow of a card. Glows are fills, never behind text that has
  to be read.
- **Motion**: one orchestrated entrance on the home hero (headline, intro,
  search, popular lookups, staggered 80ms). Everything else moves only in
  answer to the reader: card lift and pointer-following spotlight, chevron
  nudge, pill hovers. `prefers-reduced-motion` turns all of it off.
- **Figures**: a guide may carry one interactive isometric figure, drawn
  with the Anatomy kit in `src/figures/` (see its README). A figure is a
  machine whose working is the concept, in the kit's monochrome tones taken
  from the slate scale, with status hues only where the status is the point
  (the idempotency figure's lamp: green for 2xx, amber for 4xx). It moves
  only when the reader presses one of its controls: no autoplay, no idle
  tour. Under `prefers-reduced-motion` a press jumps straight to the result.

## Typography and structure

Settled 2026-10-13, in the pass that replaced the card grids.

The site is a reference for HTTP, so its one bold element is HTTP itself.
Everything else is kept quiet so that one element can carry the page.

### Typefaces

Two families. **Inter** for everything a person reads, headings included, with
tracking tightened at display sizes (`letter-spacing: -0.02em` on headings).
**Fira Code** only for text that is literally on the wire or in code: status
lines, header names and values, methods, URIs, JSON. Lora was dropped: a serif
display on a cream background is the look generated reference sites arrive at,
and it said nothing about the subject.

### The wire line

Every reference page opens on the HTTP text it documents, set large in Fira
Code by `src/components/WireHero.astro`:

| Page | Wire line |
| --- | --- |
| Status code | `HTTP/1.1 409 Conflict` |
| Header | `Retry-After: 60`, the value taken from the page's own code blocks |
| Method | `GET request-target HTTP/1.1`, the RFC 9112 grammar term |
| Error | `"type": "https://apiguide.dev/errors/account-frozen"` |
| Problem+JSON | `Content-Type: application/problem+json` |

Protocol grammar is slate-600; the page's identity is full ink and is the `h1`
where that reads naturally. The line sits in a glass panel with the status dot
and label above it (the `dot` entries in `themes.ts`), an ultramarine glow in
its corner, and a copy button that confirms in green. The home page leads with
search instead: the headline, one oversized field, and popular lookups.

### Cards for entries

Indexes and related-entry lists are grids of linked cards: `RegistryGroup`
(status dot, heading, count pill) around `RegistryRow` (one card per entry, the
whole card the link; a status code in its hue above the name, or a header name
in mono as the title). Guides go two-up, everything else three-up. Methods are
a `<table>` in a glass panel, because their properties are boolean columns.

Metadata under a hero is a ruled record line, and its values are plain text: a
property such as "not idempotent" is not a status and does not get a status
hue.

### Chrome to leave out

These were removed and should not come back, because they are template
furniture rather than information:

- Tracked all-caps labels. Labels are sentence case.
- `->` or `→` appended to links. A link says where it goes.
- Boxes nested inside boxes. A card is one entry and one link.
- Title-case field names, and raw enum values dressed up by CSS `uppercase`.
- Decoration that is not one of the uses listed under "Surfaces, depth and
  motion". Glow and glass are allowed in those places, not sprinkled.

## Open questions

- Whether violet (3xx) and ultra (brand) are distinct enough at a glance for
  colour-blind readers. Both sit in the blue-violet range; 3xx is always
  labelled, so colour is never the only signal, but it is worth testing.

## Branding & Logo Specifications

The site uses a custom-designed logo based on a lightning bolt path. Below are the design specifications:

### Wordmark
- `api`: **slate-900** (`#1F2636`)
- `guide`: **ultra-600** (`#2B2FD9`)
- `.dev`: **slate-600** (`#4B5563`) in regular font weight (`font-normal`)

### Colors & Gradients
- **Logo Gradient background**: **ultra-500** (`#465FFB`) to **ultra-700** (`#26359C`).
- **Lightning Bolt color**: **slate-50** (`#F7F8FA`).

### Size Scale Mapping
| Size | Container Size | Icon Size | Typography Style |
| :--- | :--- | :--- | :--- |
| `sm` | `h-6 w-6` (24px) | `h-3.5 w-3.5` (14px) | `text-base font-bold` |
| `md` | `h-8 w-8` (32px) | `h-4.5 w-4.5` (18px) | `text-lg font-bold` |
| `lg` | `h-10 w-10` (40px) | `h-5.5 w-5.5` (22px) | `text-xl font-extrabold` |
| `xl` | `h-12 w-12` (48px) | `h-7 w-7` (28px) | `text-2xl font-extrabold` |

### Assets
- **Favicon**: Defined in `public/favicon.svg` with a 128x128px viewbox containing the lightning bolt squircle logo.
- **Dynamic Social OG Images**: Rendered via `src/pages/og/[...path].ts`, incorporating a 36x36px logo icon and styled wordmark matching the layout's visual theme.

