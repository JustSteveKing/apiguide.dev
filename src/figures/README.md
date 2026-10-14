# Figures

Interactive isometric figures for guides, drawn with the Anatomy kit
(`kit/`, MIT, vendored from https://skills.wheresryan.sh/anatomy; its
licence is `kit/LICENSE`). DESIGN.md says where they may appear and how they
may move.

## How a figure is put together

Each figure has its own directory, `idempotency-keys/` being the first:

| File | What it is |
| :--- | :--- |
| `model.ts` | The concept as a small pure module. Every motion, digit and readout comes from it. |
| `build.ts` | Builds the static art with the kit: `art.svg` (moving parts in `data-part` groups, at rest) and `layout.json` (the projection and the positions the live code moves between). Run with bun. |
| `art.svg`, `layout.json` | Generated and committed, so the site build does not need to run `build.ts`. |
| `live.ts` | `mount(root)` returns a cleanup function. It schedules the model's events, moves the parts and writes the readout. |

`figures.css` drives every kit token from the site's slate scale, keyed on
`data-theme` like the rest of the site. `names.ts` lists figure names for the
content schema, and `index.ts` holds the title, caption and controls that
`src/components/Figure.astro` renders.

## Adding one

1. Create the directory with the four files above, and add its build to the
   `figures` script in `package.json`.
2. Add the name to `names.ts`, the entry to `index.ts`, and a loader to the
   `loaders` map in `Figure.astro`.
3. Set `figure: <name>` in the guide's frontmatter.
4. `bun run figures`, then `bun run build` and `bun run check:internal-links`.

Before shipping, verify with the skill's scripts against `bun run preview`:
line ends at zero (`scripts/lines.mjs`), both themes, 390 px wide, reduced
motion, and a 4x look at every joint.
