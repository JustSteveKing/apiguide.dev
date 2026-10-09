# apiguide.dev

A language-agnostic reference for designing HTTP APIs.

[apiguide.dev](https://apiguide.dev) catalogues the things you look up while
building or integrating an API: what a status code actually means and when to
send it, what a header is for, whether a method is safe or idempotent, how a
specification format works, which tool does what, and long-form guides on the
patterns that span all of them.

It is deliberately not tied to a language or a framework. Examples are HTTP.

## The errors collection

The one part worth explaining, because it is useful from outside this site.

Every entry in `/errors/` has a stable URL, and those URLs are designed to be
used directly as the `type` member of an [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457)
problem response:

```json
{
  "type": "https://apiguide.dev/errors/insufficient-funds",
  "title": "Insufficient Funds",
  "status": 402,
  "detail": "The account balance is 4.20 GBP, and the transfer is 10.00 GBP."
}
```

RFC 9457 asks that `type` be a URI that, when dereferenced, gives human-readable
documentation. Most APIs either invent a URI that resolves to nothing or skip
the member. This is somewhere to point instead, without hosting a documentation
page per error yourself.

Which means these URLs are a contract. They do not get renamed.

## What is in it

| Section | Pages | What it covers |
| :--- | ---: | :--- |
| [Status codes](https://apiguide.dev/status-codes) | 63 | Every code, what it means, when to use it, how it compares to its neighbours |
| [Headers](https://apiguide.dev/headers) | 46 | Request and response headers, standard and otherwise |
| [Guides](https://apiguide.dev/guides) | 44 | Long-form patterns, in eight categories from resource design to agent readiness |
| [Tools](https://apiguide.dev/tools) | 35 | Gateways, linters, clients, mocks and observability, by lifecycle stage |
| [Errors](https://apiguide.dev/errors) | 25 | Resolvable problem types for RFC 9457 |
| [Specifications](https://apiguide.dev/specifications) | 21 | OpenAPI, AsyncAPI, JSON Schema, Arazzo, gRPC and the rest |
| [Methods](https://apiguide.dev/methods) | 18 | Semantics, safety, idempotency, cacheability |

Plus [`/problem-json`](https://apiguide.dev/problem-json) and an
[`/llms.txt`](https://apiguide.dev/llms.txt) index of the whole catalogue.

## Running it locally

Astro on [bun](https://bun.sh), Tailwind v4, deployed to Cloudflare Pages.
Use bun rather than npm; Cloudflare builds from `bun.lock`.

```sh
bun install
bun run dev
```

| Command | Action |
| :--- | :--- |
| `bun install` | Install dependencies |
| `bun run dev` | Dev server on localhost:4321 |
| `bun run build` | Build to `./dist/` |
| `bun run preview` | Preview the build with Astro |
| `bun run pages:dev` | Preview under Cloudflare Pages emulation |
| `bun run deploy` | Deploy to Cloudflare Pages |

### Content checks

Three scripts check whether the content is still true, rather than whether it
builds. All three need the [Tabstack](https://tabstack.ai) CLI installed and
authenticated, or `TABSTACK_BIN` pointing at it.

| Command | Action |
| :--- | :--- |
| `bun run check:links` | Confirm external URLs in frontmatter still resolve. Exits 1 on a dead link |
| `bun run check:gaps` | Diff the catalogue against the canonical IANA registries. Always exits 0; read the output |
| `bun run factcheck` | Fact-check changed pages against the live web |

`bun run factcheck` defaults to files changed against `HEAD~1`, and takes an
explicit `collection/slug` or path:

```sh
bun run factcheck -- methods/trace
FACTCHECK_BASE=origin/main bun run factcheck
```

## Contributing

Corrections are welcome, particularly to anything that has gone out of date:
a standard that moved, a tool that changed its pricing model, a header that
got registered.

Content lives in `src/content/<collection>/` as Markdown with frontmatter,
validated by zod in `src/content.config.ts`. The build fails on a schema
violation, so `bun run build` will tell you if the frontmatter is wrong.

**Read [`AGENTS.md`](AGENTS.md) before writing a page.** Each collection has a
fixed structure that every existing page follows, and it documents the shapes,
the cross-linking conventions, the voice and the spelling. It is written for
agents and is just as useful to a person. [`DESIGN.md`](DESIGN.md) covers the
palette and why it is what it is.

## Licence

Two licences, because the code and the prose want different things.

- **Code** is [MIT](LICENSE). Templates, components, styles, configuration
  and the scripts in `scripts/`.
- **Content** is [CC BY-SA 4.0](LICENSE-CONTENT). Everything under
  `src/content/`: all 254 pages. Reuse it, translate it, build on it, with
  credit and under the same terms.

Linking to a page here is not use of the content and needs no licence. Using
`https://apiguide.dev/errors/<name>` as the `type` member of an RFC 9457
problem response is what those URLs exist for.
