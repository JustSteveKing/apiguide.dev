# DESIGN.md

Design reference for apiguide.dev. This covers the colour palette and how it should be applied across the site. Structure and content take priority over visual polish at this stage, so treat this as the agreed foundation to build on rather than a finished design system.

## Source and rationale

The palette is derived from real pigment colours documented on Storied Colors, a catalogue of named colours with historical provenance. Rather than picking arbitrary brand colours, each accent in this palette traces back to a specific, real hue with its own history. This fits an errors reference site that is meant to feel authoritative and permanent rather than trendy.

Five accent families were pulled from the source:

- Chartres Blue, hex 1F3F8E
- Yellow Ochre, hex CB9D06
- Uranium Red, hex D7350F
- Emerald Green, hex 50C878
- YInMn Blue, hex 2E5090

A sixth family, Paper, is a warm neutral scale built for this project rather than pulled directly from a single pigment. It replaces standard grey throughout the site, since a clinical grey works against the archival, catalogued feel the rest of the palette is going for.

## The scales

Each family runs from 50 (lightest) to 950 (darkest), following the Tailwind v4 convention of a numeric scale defined via the theme directive.

### Paper (warm neutral)

| Step | Hex |
| --- | --- |
| 50 | FDFDFC |
| 100 | F7F6F5 |
| 200 | EDEBE9 |
| 300 | DDDAD5 |
| 400 | C0BAAF |
| 500 | A19887 |
| 600 | 837A67 |
| 700 | 615A4D |
| 800 | 443F37 |
| 900 | 2D2A25 |
| 950 | 191815 |

### Chartres (brand)

| Step | Hex |
| --- | --- |
| 50 | F7F8FB |
| 100 | ECEFF6 |
| 200 | CED7EE |
| 300 | A6B8E5 |
| 400 | 7392DD |
| 500 | 1F3F8E |
| 600 | 2852B8 |
| 700 | 204193 |
| 800 | 1B336F |
| 900 | 162750 |
| 950 | 0F1933 |

### Ochre (client error)

| Step | Hex |
| --- | --- |
| 50 | FCFAF6 |
| 100 | F9F5E9 |
| 200 | F5EAC6 |
| 300 | F4DE98 |
| 400 | F6D25B |
| 500 | CB9D06 |
| 600 | DAA906 |
| 700 | AD8605 |
| 800 | 836607 |
| 900 | 5E4A08 |
| 950 | 3C2F07 |

### Uranium (server error)

| Step | Hex |
| --- | --- |
| 50 | FBF7F6 |
| 100 | F8ECEA |
| 200 | F3D0C8 |
| 300 | F0AB9B |
| 400 | F07C61 |
| 500 | D7350F |
| 600 | D2340F |
| 700 | A7290C |
| 800 | 7E220C |
| 900 | 5B1A0B |
| 950 | 3A1209 |

### Emerald (success)

| Step | Hex |
| --- | --- |
| 50 | F7FAF8 |
| 100 | EDF5F0 |
| 200 | D1EBDA |
| 300 | ACDFBD |
| 400 | 7DD39A |
| 500 | 50C878 |
| 600 | 36AB5D |
| 700 | 2B884A |
| 800 | 236739 |
| 900 | 1B4B2B |
| 950 | 12301C |

### Yinmn (secondary blue, informational)

| Step | Hex |
| --- | --- |
| 50 | F7F8FA |
| 100 | EDF0F5 |
| 200 | D1DAEB |
| 300 | ACBEDF |
| 400 | 7E9BD3 |
| 500 | 2E5090 |
| 600 | 365EAA |
| 700 | 2B4B87 |
| 800 | 233B67 |
| 900 | 1B2C4B |
| 950 | 131D30 |

## Tailwind v4 setup

Defined once via the theme directive, no config file required.

```css
@import "tailwindcss";

@theme {
  --color-paper-50: #FDFDFC;
  --color-paper-100: #F7F6F5;
  --color-paper-200: #EDEBE9;
  --color-paper-300: #DDDAD5;
  --color-paper-400: #C0BAAF;
  --color-paper-500: #A19887;
  --color-paper-600: #837A67;
  --color-paper-700: #615A4D;
  --color-paper-800: #443F37;
  --color-paper-900: #2D2A25;
  --color-paper-950: #191815;

  --color-chartres-50: #F7F8FB;
  --color-chartres-100: #ECEFF6;
  --color-chartres-200: #CED7EE;
  --color-chartres-300: #A6B8E5;
  --color-chartres-400: #7392DD;
  --color-chartres-500: #1F3F8E;
  --color-chartres-600: #2852B8;
  --color-chartres-700: #204193;
  --color-chartres-800: #1B336F;
  --color-chartres-900: #162750;
  --color-chartres-950: #0F1933;

  --color-ochre-50: #FCFAF6;
  --color-ochre-100: #F9F5E9;
  --color-ochre-200: #F5EAC6;
  --color-ochre-300: #F4DE98;
  --color-ochre-400: #F6D25B;
  --color-ochre-500: #CB9D06;
  --color-ochre-600: #DAA906;
  --color-ochre-700: #AD8605;
  --color-ochre-800: #836607;
  --color-ochre-900: #5E4A08;
  --color-ochre-950: #3C2F07;

  --color-uranium-50: #FBF7F6;
  --color-uranium-100: #F8ECEA;
  --color-uranium-200: #F3D0C8;
  --color-uranium-300: #F0AB9B;
  --color-uranium-400: #F07C61;
  --color-uranium-500: #D7350F;
  --color-uranium-600: #D2340F;
  --color-uranium-700: #A7290C;
  --color-uranium-800: #7E220C;
  --color-uranium-900: #5B1A0B;
  --color-uranium-950: #3A1209;

  --color-emerald-50: #F7FAF8;
  --color-emerald-100: #EDF5F0;
  --color-emerald-200: #D1EBDA;
  --color-emerald-300: #ACDFBD;
  --color-emerald-400: #7DD39A;
  --color-emerald-500: #50C878;
  --color-emerald-600: #36AB5D;
  --color-emerald-700: #2B884A;
  --color-emerald-800: #236739;
  --color-emerald-900: #1B4B2B;
  --color-emerald-950: #12301C;

  --color-yinmn-50: #F7F8FA;
  --color-yinmn-100: #EDF0F5;
  --color-yinmn-200: #D1DAEB;
  --color-yinmn-300: #ACBEDF;
  --color-yinmn-400: #7E9BD3;
  --color-yinmn-500: #2E5090;
  --color-yinmn-600: #365EAA;
  --color-yinmn-700: #2B4B87;
  --color-yinmn-800: #233B67;
  --color-yinmn-900: #1B2C4B;
  --color-yinmn-950: #131D30;
}
```

## Semantic usage rules

These are the rules to follow when building components and templates, so colour choice stays consistent and predictable rather than picked per page.

### Paper

Use in place of grey for all backgrounds, borders and body text. Paper 50 to 200 for backgrounds, paper 600 to 900 for text, paper 300 to 400 for borders and dividers.

### Chartres

The brand colour. Use for the site logo or wordmark, primary navigation, all inline links, and heading accents. This is the default interactive colour whenever nothing more specific applies.

### Ochre

Reserved for anything tied to the `client-error` category, meaning 4xx status codes. Use on the error index page to badge and group client error entries, and on individual error pages where `category` is `client-error`, for the status code badge and any related visual accent.

### Uranium

Reserved for anything tied to the `server-error` category, meaning 5xx status codes, following the same pattern as ochre. Also use for the deprecated notice banner on any page where `deprecated` is true, since a deprecated error definition is functionally a warning regardless of its actual status code.

### Emerald

Reserved for success and confirmation states only. This does not correspond to any error category, since every page on the errors section is documenting a failure by definition. Use emerald for things like a successful copy to clipboard action on a code sample, a confirmation after submitting a correction, or a working example callout distinguished from a failing one.

### Yinmn

A secondary informational blue, distinct from chartres so it does not compete with brand and link colour. Use for the Problem and JSON explainer section, metadata callouts such as published and updated dates, and any note that is informational rather than a warning or an error.

## Category to colour mapping

The `category` field on the errors content collection should drive colour directly, rather than colour being hardcoded per page.

| Category value | Colour family |
| --- | --- |
| client-error | ochre |
| server-error | uranium |

This mapping should live in one place, for example a small lookup object imported wherever a category badge is rendered, so a future third category does not require hunting through every template that touches colour.

## Open questions

A few things not yet decided that are worth resolving before this palette is treated as final.

- Whether dark mode is in scope for launch, and if so whether it reuses the same scales inverted, or needs its own tuned values, since some of these hues shift perceptually when placed on a dark background rather than paper 50
- Whether the ochre and uranium accents need a higher contrast variant specifically for small text, to satisfy accessibility contrast ratios at the lighter end of each scale
- Whether yinmn is distinct enough from chartres at a glance for colour blind users, given both are blues, or whether the informational callouts should lean on paper and iconography instead of colour alone

## Branding & Logo Specifications

The site uses a custom-designed logo based on a lightning bolt path. Below are the design specifications:

### Typography
- `api`: **Paper-900** (`#31291D`)
- `guide`: **Chartres-600** (`#2852B8`)
- `.dev`: **Paper-400** (`#BBA98D`) in regular font weight (`font-normal`)

### Colors & Gradients
- **Logo Gradient background**: **Chartres-500** (`#1F3F8E`) to **Chartres-700** (`#204193`).
- **Lightning Bolt color**: **Paper-50** (`#FAF6F0`).

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

