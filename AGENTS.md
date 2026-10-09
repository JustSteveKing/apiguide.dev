# AGENTS.md

Instructions for agents working on apiguide.dev.

This file used to be Astro starter boilerplate pointing at docs.astro.build.
That was wrong twice over: the generic Astro documentation is not what you
need here, and the thing you actually need, the house style, existed only as
a pattern across 250 pages that nobody had written down. Read this instead.

## What this site is

A language-agnostic reference catalogue for HTTP API design. Errors, status
codes, headers, methods, specifications, tooling and long-form guides. It is
a reference, not a blog: pages are looked up, not read end to end, and they
are expected to still be correct in three years.

Two consequences that shape everything below:

- **Pages follow a fixed shape per collection.** A reader who has read one
  status code page knows where to look on all 63. Deviating from the shape
  costs the reader more than whatever the deviation was buying you.
- **`/errors/<name>` URLs are load-bearing.** They are designed to be used
  directly as the `type` member of an RFC 9457 problem response, by anyone,
  not just by this site. Never rename or delete one. If a page has to move,
  it needs a redirect.

## Commands

The package manager is **bun**. Do not run `npm install`; it will produce a
`package-lock.json` that does not belong here, and Cloudflare builds from
`bun.lock`.

| Command | What it does |
| :--- | :--- |
| `bun install` | Install dependencies |
| `bun run dev` | Dev server on localhost:4321 |
| `bun run build` | Production build to `./dist/` |
| `bun run preview` | Preview the build with Astro |
| `bun run pages:dev` | Preview the build under Cloudflare Pages emulation |
| `bun run check:internal-links` | Verify every internal link in the build resolves |
| `bun run check:links` | Verify external URLs in frontmatter still resolve |
| `bun run check:gaps` | Diff the content against the canonical IANA registries |
| `bun run factcheck` | Fact-check changed pages against the live web |

The three `check`/`factcheck` scripts are built on the **Tabstack CLI** and
need it installed and authenticated, or `TABSTACK_BIN` pointing at it. They
are the only automated check on whether the content is still true, so run
them when you touch content rather than treating them as optional.

`check:links` exits 1 on a dead link. `check:gaps` always exits 0, because
plenty of registry entries are omitted deliberately; read its output, do not
just check its status.

`check:internal-links` needs no network and no Tabstack, only a build. It is
the cheapest of the four and the one most likely to catch your mistake.

`bun run check:content` runs all three checks in order.

## Deployment

Cloudflare Pages, project `apiguidedev`, from `wrangler.json`. Output is
`dist`. `bun run deploy` pushes a build directly, but the normal path is
merging to `main`.

## Where content goes

Eight collections, all schema-validated by zod in `src/content.config.ts`.
The build fails on a schema violation, which is the intended safety net:
if your frontmatter is wrong you will find out from `bun run build`.

| Directory | Collection key | Files | Required frontmatter |
| :--- | :--- | ---: | :--- |
| `src/content/status-codes/` | `statusCodes` | 63 | `code`, `title`, `description`, `category` |
| `src/content/headers/` | `headers` | 46 | `name`, `description`, `category`, `standard` |
| `src/content/guides/` | `guides` | 44 | `title`, `description`, `category` |
| `src/content/tools/` | `tools` | 35 | `name`, `description`, `category`, `lifecycleStages`, `url`, `pricing` |
| `src/content/errors/` | `errors` | 25 | `title`, `statusCode`, `statusText`, `category`, `publishedDate` |
| `src/content/specifications/` | `specifications` | 21 | `title`, `description`, `currentVersion`, `officialUrl` |
| `src/content/methods/` | `methods` | 18 | `name`, `description`, `safe`, `idempotent`, `cacheable` |
| `src/content/sponsors/` | `sponsors` | 1 | `name`, `url` |

Note the directory and the collection key differ for status codes:
`status-codes` on disk, `statusCodes` in `getCollection()`.

Every file is `.md`. The loaders accept `.mdx` and nothing uses it; do not
be the first without a reason, because a component in a page is a component
that has to survive the next design pass.

### Category enums

- errors: `client-error`, `server-error`
- statusCodes: `informational`, `success`, `redirection`, `client-error`, `server-error`
- headers: `request`, `response`, `both`
- tools: `observability`, `design-documentation`, `testing-mocking`, `gateways-management`, `clients-debugging`
- guides: see below

## Page shapes

These are not suggestions. The conformance figures are current as of writing.

**Errors** (25/25 identical). Three `##` sections, in this order:

```
## When to use it
## When not to use it
## Example response
```

**Status codes** (63/63 identical):

```
## What does HTTP status code <code> mean?
## When to use it in APIs
## How it compares to other codes
```

**Headers** (46/46 identical):

```
## What is the <Name> header?
## API Usage & Best Practices
## Examples
```

**Methods** (18/18 identical):

```
## What is the <NAME> method?
## API Usage & Best Practices
## Common Response Codes
```

**Tools** (35/35 identical):

```
## What is <Name>?
## Why use it in the API Lifecycle?
## Best Practices
```

Tool pages live at `/tools/<category>/<slug>`, with the category in the path.
That is the one collection whose URL is not `/<collection>/<slug>`, and it is
easy to get wrong when linking to one.

**Guides and specifications** (44/44) are the long form and take a different
shape:

1. An opening `##` section of prose that states the problem. Named for the
   subject, not "Introduction" as such, though `## Introduction to X` is
   common and fine.
2. Then numbered sections, `## 1. Title`, `## 2. Title`, and so on.
3. A `---` rule between every top-level section.
4. `###` for subsections inside a numbered section.

Tables for anything enumerable. Fenced code blocks with a language tag;
`astro-expressive-code` renders them, on `github-light` and `github-dark`
together, so they follow the page's colour scheme.

## Guide categories

Eight, defined once in `src/config/themes.ts` as `guideCategories` and
imported by `src/content.config.ts`. Do not retype the list anywhere; the
enum, the labels and the badge styles all derive from that one export, and
they used to drift precisely because the index page kept its own copy.

`design`, `representation`, `evolution`, `reliability`, `events`,
`performance`, `security`, `agents`.

The array order is the order the guides index renders sections in, and it is
a deliberate progression rather than an alphabet: the shape of the API, how
it puts data on the wire, how it changes, how it fails, how it pushes, how
it goes fast, how it stays closed, then what a model makes of it.

**Before adding a ninth category, check the distribution.** These eight
replaced four, one of which (`core`) had silently absorbed 25 of 44 guides
and so told the reader nothing. A category that is not discriminating is
worse than no category. If you are reaching for a new one because a guide
does not fit, consider whether the guide is really two guides.

## Cross-linking

Guides earn their keep by linking into the reference collections. Link the
first mention of any status code, header or method:

```markdown
[`GET`](/methods/get), [`Idempotency-Key`](/headers/idempotency-key),
[`409 Conflict`](/status-codes/409)
```

Conventions, both universal across the existing 231 internal links:

- **No trailing slash**: `/methods/get`, never `/methods/get/`.
- **Code-formatted link text** for a code, header or method name.

Never link to a page that does not exist. `bun run build` will not catch it.
`bun run check:internal-links` will, against the build, and covers links in
templates as well as in content.

## Voice

Peer to peer, addressed to a working engineer who is mid-problem and looking
something up. Authoritative without hedging, and specific: name the RFC, give
the header, show the request.

- **Commit to a recommendation.** Where there is a genuine trade-off, name
  the conditions under which each side wins rather than listing both and
  shrugging. A page where every sentence is uncontroversial has no content.
- **Say what not to do**, and why. The errors collection has a whole section
  for it and it is usually the most useful one on the page.
- **Verify before you write.** Check claims against the RFC, the IANA
  registry, or the vendor's own source. A confident wrong claim about HTTP
  semantics costs this site more than a whole page earns it. `bun run
  factcheck` exists for exactly this.
- Do not invent benchmarks, adoption statistics or anecdotes. If a sentence
  needs a number you do not have, cut the sentence.

### Spelling

**American spelling in published page content**: behavior, serialize,
optimize, normalize. (This file and the other repo docs are written in
British English, which is fine: the rule is about what readers see.) This is deliberate and it differs from juststeveking.com, which
is British, because this is a language-agnostic international reference and
American is already what the overwhelming majority of the content uses.

Do not "correct" spelling inside a code span, a query string or an enum
value. `status=cancelled` stays as written; it is data, not prose.

## Design

`DESIGN.md` is the authority and it is genuinely worth reading before you
touch a template. The short version:

- The palette derives from **Storied Colors**, a catalogue of real pigments
  with documented provenance: Chartres Blue, Yellow Ochre, Uranium Red,
  Emerald Green, YInMn Blue, plus a warm neutral scale called Paper that
  replaces grey throughout.
- **Do not invent a colour.** There are five pigments. If you need more
  distinctions than that, reuse a hue with a different treatment, which is
  what the guide categories do: four pairs share a hue, solid against
  outline, and each pair is a real kinship rather than a workaround.
- Every scale is redefined for dark mode in `src/styles/main.css`, inverted,
  so `bg-x-100 text-x-900` works in both. Check any new pairing at both
  schemes and keep text at 4.5:1 or better.
- Badge and label styles live in `src/config/themes.ts`. Import them. A
  template that defines its own copy will drift, which is how the guides
  index ended up with a category the schema had never allowed.

## Licensing

Code is MIT (`LICENSE`), content under `src/content/` is CC BY-SA 4.0
(`LICENSE-CONTENT`). A new page inherits CC BY-SA; a new script inherits
MIT. Do not paste text from a source whose licence does not permit it, and
do not add a per-file licence header, because the split is by directory.

## Before you finish

1. `bun run build` passes. It validates every schema and catches a bad
   category or a missing required field.
2. `bun run check:internal-links` after the build. Astro does not check
   internal links, so a link to a page that does not exist builds clean and
   404s in production. It found one on the home page the day it was written,
   pointing at `/guides/security/`, which has never existed.
3. `bun run check:links` if you added or changed an external URL.
4. `bun run factcheck` if you wrote or edited content.
5. No stray characters from pasting. Four guide pages once shipped a visible
   box on the live site from a non-breaking space plus U+FFFC pasted into a
   heading, along with non-breaking hyphens and curly quotes. Grep for them.

## Things not to do

- Do not rename or delete an `/errors/<name>` URL. See the top of this file.
- Do not add a dependency to get an effect that CSS already has.
- Do not reformat a file you are not otherwise changing. A whitespace-only
  diff across 60 pages hides the one real edit in it.
- Do not add per-page one-off styles. If a page needs something the system
  does not have, the system is what needs changing.
